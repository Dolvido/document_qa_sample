import { NextRequest, NextResponse } from 'next/server';
import { Document } from "@langchain/core/documents";
import { extractBasicPdfText } from '../pdf/extract';

// Configure route options
export const runtime = 'nodejs';
export const maxDuration = 60;

// Define file type for uploads
interface FileData {
  name: string;
  type: string;
  data: string; // Base64 data
  size?: number;
  text?: string; // Optional pre-extracted text from client-side processing
}

// Define message type
interface Message {
  role: string;
  content: string;
}

// Clean and normalize text
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

// Find the best sentence containing a keyword
function findBestSentence(text: string, keyword: string): string | null {
  if (!text.toLowerCase().includes(keyword.toLowerCase())) return null;
  
  // Split text into sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Score each sentence by relevance to keyword
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const keywordIndex = lowerSentence.indexOf(keyword.toLowerCase());
    
    if (keywordIndex === -1) return { sentence, score: 0 };
    
    // Higher score for shorter sentences that contain the keyword
    const score = (1 / sentence.length) * 1000 + 10;
    return { sentence, score };
  });
  
  // Sort by score and get the best sentence
  scoredSentences.sort((a, b) => b.score - a.score);
  
  return scoredSentences[0].score > 0 ? scoredSentences[0].sentence : null;
}

// Process user query and generate a response
async function processQuery(query: string, documents: Document[]): Promise<{ text: string, citations: any[] }> {
  try {
    console.log(`Processing query: ${query}`);
    
    // Implement enhanced keyword-based search
    const keywords = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      // Remove common stop words
      .filter(word => !['the', 'and', 'that', 'for', 'this', 'are', 'with'].includes(word));
    
    if (keywords.length === 0) {
      // If no meaningful keywords were found, use the whole query
      keywords.push(...query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    }
    
    console.log('Keywords:', keywords);
    
    // Extract relevant snippets from documents with improved scoring
    const relevantSnippets = [];
    
    for (const doc of documents) {
      const content = doc.pageContent.toLowerCase();
      let relevance = 0;
      let bestSnippet = null;
      
      // Check for keyword matches with enhanced scoring
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          // Higher weight for important keywords that might be the focus of the question
          const keywordImportance = query.toLowerCase().includes(keyword) ? 2 : 1;
          relevance += keywordImportance;
          
          // Try to find a good sentence containing this keyword
          const sentence = findBestSentence(doc.pageContent, keyword);
          if (sentence && (!bestSnippet || sentence.length < bestSnippet.length)) {
            bestSnippet = sentence;
          }
        }
      }
      
      if (relevance > 0) {
        // If we have a good sentence, use it, otherwise extract a context window
        let snippet = '';
        
        if (bestSnippet) {
          snippet = bestSnippet;
        } else {
          // Find the section with the highest keyword density
          let bestPosition = 0;
          let bestDensity = 0;
          
          // Scan through the document to find the best section
          for (let i = 0; i < content.length; i += 100) {
            let localDensity = 0;
            const section = content.substring(i, i + 300);
            
            for (const keyword of keywords) {
              const regex = new RegExp(keyword, 'gi');
              const matches = section.match(regex);
              if (matches) {
                localDensity += matches.length;
              }
            }
            
            if (localDensity > bestDensity) {
              bestDensity = localDensity;
              bestPosition = i;
            }
          }
          
          // Extract the snippet from the best position
          const start = Math.max(0, bestPosition);
          const end = Math.min(doc.pageContent.length, bestPosition + 300);
          snippet = doc.pageContent.substring(start, end);
        }
        
        // Add to relevant snippets with improved metadata
        relevantSnippets.push({
          text: snippet,
          source: doc.metadata.source || 'Document',
          relevance: relevance,
          sentenceBased: !!bestSnippet
        });
      }
    }
    
    // Sort by relevance
    relevantSnippets.sort((a, b) => b.relevance - a.relevance);
    
    // Generate a response
    if (relevantSnippets.length > 0) {
      // Create a response based on the most relevant snippets
      const topSnippets = relevantSnippets.slice(0, 3);
      let responseText = `Based on your documents, here's what I found about "${query}":\n\n`;
      
      // Create a more coherent answer based on the snippets
      if (topSnippets.length === 1) {
        // If only one relevant snippet, use it directly
        responseText = `Based on your document "${topSnippets[0].source}", I found this information about your question:\n\n${topSnippets[0].text}\n`;
      } else {
        // If multiple snippets, organize them by source
        const snippetsBySource: Record<string, string[]> = {};
        
        topSnippets.forEach(snippet => {
          if (!snippetsBySource[snippet.source]) {
            snippetsBySource[snippet.source] = [];
          }
          snippetsBySource[snippet.source].push(snippet.text);
        });
        
        // Combine snippets from the same source
        for (const [source, snippets] of Object.entries(snippetsBySource)) {
          responseText += `From ${source}:\n${snippets.join('\n\n')}\n\n`;
        }
      }
      
      // Add citations
      const citations = topSnippets.map((snippet) => ({
        text: snippet.text,
        source: snippet.source
      }));
      
      return {
        text: responseText,
        citations
      };
    } else {
      return {
        text: `I couldn't find specific information about "${query}" in your documents. Could you try rephrasing your question?`,
        citations: []
      };
    }
  } catch (error) {
    console.error('Error processing query:', error);
    return {
      text: 'Sorry, I encountered an error while processing your question.',
      citations: []
    };
  }
}

// Extract text from document data
async function extractTextFromDocument(file: FileData): Promise<string> {
  try {
    // If text was already extracted client-side, use that
    if (file.text) {
      console.log(`Using pre-extracted text for ${file.name}`);
      return file.text;
    }
    
    // Handle different file types
    if (file.type === 'application/pdf') {
      // Use direct extraction for PDFs
      try {
        console.log('Using direct PDF extraction');
        const base64Content = file.data.replace(/^data:application\/pdf;base64,/, '');
        const extractedText = await extractBasicPdfText(base64Content);
        return extractedText;
      } catch (error) {
        console.error('Error in direct PDF extraction:', error);
        return `[Error processing PDF: ${file.name}]`;
      }
    } else if (file.type.includes('text/')) {
      // For text files, decode the base64
      try {
        const base64Content = file.data.split(',')[1] || file.data;
        const binaryString = atob(base64Content);
        return binaryString;
      } catch (e) {
        console.error('Error decoding text file:', e);
        return `[Error decoding ${file.name}]`;
      }
    } else if (file.type.includes('application/json')) {
      try {
        const base64Content = file.data.split(',')[1] || file.data;
        const jsonString = atob(base64Content);
        // Parse and stringify to make it readable
        const jsonData = JSON.parse(jsonString);
        return JSON.stringify(jsonData, null, 2);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return `[Error parsing JSON in ${file.name}]`;
      }
    } else {
      // For other file types, just indicate we received them
      return `[Content from ${file.name} (${file.type})]`;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    return `[Error processing ${file.name}]`;
  }
}

export async function POST(req: NextRequest) {
  console.log('POST request received at /api/chat');
  
  try {
    // Parse the request body
    const data = await req.json();
    const { messages, files } = data;
    
    console.log(`Received ${files?.length || 0} files`);
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1].content;
    
    // Process documents
    const documents: Document[] = [];
    
    if (files && files.length > 0) {
      // Process files concurrently for better performance
      const processedFiles = await Promise.all(files.map(async (file: FileData) => {
        try {
          // Extract text from the file
          const text = await extractTextFromDocument(file);
          
          if (text && text.length > 10) {
            // Create a document with cleaned text
            return new Document({
              pageContent: text,
              metadata: {
                source: file.name,
                type: file.type,
                size: file.size || 0
              }
            });
          }
          return null;
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          return null;
        }
      }));

      // Filter out null results and add to documents
      for (const doc of processedFiles) {
        if (doc) documents.push(doc);
      }
      
      console.log(`Successfully processed ${documents.length} documents`);
    }
    
    if (documents.length === 0) {
      return NextResponse.json({ 
        error: 'No documents could be processed successfully' 
      }, { status: 400 });
    }
    
    // Process the query against the documents
    const response = await processQuery(lastMessage, documents);
    
    // Return the response
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ 
      error: `Error processing request: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 
