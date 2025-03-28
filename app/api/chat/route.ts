import { NextRequest, NextResponse } from 'next/server';
import { Document } from "@langchain/core/documents";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import type { PDFData } from 'pdf-parse';

if (!process.env.HUGGINGFACEHUB_API_KEY) {
  throw new Error('Missing HuggingFace API Key');
}

const TEMPLATE = `You are a helpful assistant analyzing document content. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Keep your answer concise and focused on the question.

Context: {context}

Question: {question}

Answer:`;

// Initialize models
const embeddingModel = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2"
});

const llm = new HuggingFaceInference({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  model: "mistralai/Mistral-7B-Instruct-v0.1",
  temperature: 0.5
});

// Clean and normalize text
function cleanText(text: string): string {
  return text
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove replacement characters
    .replace(/[^\x20-\x7E\n\t]/g, ' ') // Replace non-ASCII chars with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Simple text splitter function
function splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  // Clean the text first
  const cleanedText = cleanText(text);
  
  // Split on natural boundaries first
  const sections = cleanedText.split(/\n{2,}/);
  const chunks: string[] = [];
  
  for (const section of sections) {
    if (section.length <= chunkSize) {
      if (section.trim()) {
        chunks.push(section.trim());
      }
      continue;
    }
    
    let index = 0;
    while (index < section.length) {
      // Find the end of the last complete word within chunkSize
      let end = index + chunkSize;
      if (end < section.length) {
        const nextSpace = section.indexOf(' ', end);
        end = nextSpace > -1 ? nextSpace : end;
      }
      
      const chunk = section.slice(index, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      index += (chunkSize - overlap);
    }
  }
  
  return chunks;
}

// Cosine similarity helper function
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (normA * normB);
}

// Find most similar documents
async function findSimilarDocuments(
  docs: Document[], 
  query: string, 
  embeddingModel: HuggingFaceInferenceEmbeddings, 
  k: number
): Promise<Document[]> {
  try {
    // Clean the query
    const cleanedQuery = cleanText(query);
    
    // Get embeddings for all documents
    const docEmbeddings = await embeddingModel.embedDocuments(
      docs.map(doc => doc.pageContent)
    );
    
    // Get embedding for query
    const queryEmbedding = await embeddingModel.embedQuery(cleanedQuery);
    
    // Calculate similarities
    const similarities = docEmbeddings.map(embedding => 
      cosineSimilarity(queryEmbedding, embedding)
    );
    
    // Get top k documents
    return similarities
      .map((score, idx) => ({ score, doc: docs[idx] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(item => item.doc);
  } catch (error) {
    console.error('Error in findSimilarDocuments:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const question = formData.get('question') as string || "What is this document about?";

    if (!files.length) {
      return NextResponse.json(
        { error: 'Please upload a document to analyze' },
        { status: 400 }
      );
    }

    console.log('Processing files:', files.map(f => f.name));

    // Load and process documents
    const docs: Document[] = [];
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        let text = '';
        
        if (file.name.toLowerCase().endsWith('.pdf')) {
          try {
            // Import pdf-parse dynamically and handle the module default export
            const pdfParseModule = await import('pdf-parse');
            const pdfParse = pdfParseModule.default || pdfParseModule;
            
            // Convert ArrayBuffer to Buffer for pdf-parse
            const pdfBuffer = Buffer.from(arrayBuffer);
            
            // Parse PDF with error handling
            const pdfData = await new Promise<PDFData>((resolve, reject) => {
              pdfParse(pdfBuffer).then(resolve).catch(reject);
            });
            
            text = pdfData.text;
            console.log('Successfully parsed PDF, extracted text length:', text.length);
          } catch (error) {
            console.error('Error parsing PDF:', error);
            return NextResponse.json(
              { error: 'Failed to parse PDF file. Please make sure it is a valid PDF.' },
              { status: 400 }
            );
          }
        } else {
          // For non-PDF files, use direct text extraction
          text = await new Blob([arrayBuffer]).text();
        }
        
        if (!text.trim()) {
          console.warn(`No text content extracted from ${file.name}`);
          return NextResponse.json(
            { error: 'No text content could be extracted from the file.' },
            { status: 400 }
          );
        }

        // Clean the text before splitting into chunks
        text = cleanText(text);
        console.log('Cleaned text length:', text.length);
        
        // Split text into smaller chunks to stay within token limits
        const chunks = splitTextIntoChunks(text, 150, 20);
        console.log('Created chunks:', chunks.length);
        
        chunks.forEach((chunk, index) => {
          if (chunk.trim()) {  // Only add non-empty chunks
            docs.push(new Document({ 
              pageContent: chunk,
              metadata: { 
                source: file.name, 
                page: Math.floor(index / 2) + 1 
              }
            }));
          }
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return NextResponse.json(
          { error: `Failed to process file ${file.name}. Please try again.` },
          { status: 500 }
        );
      }
    }

    if (!docs.length) {
      return NextResponse.json(
        { error: 'No valid text content was extracted from the documents' },
        { status: 400 }
      );
    }

    console.log('Total documents created:', docs.length);
    console.log('Finding relevant documents for question:', question);

    // Find relevant documents using similarity search
    const relevantDocs = await findSimilarDocuments(docs, question, embeddingModel, 2);

    // Format context and question - keeping context more concise
    const context = relevantDocs.map((doc: Document) => doc.pageContent).join('\n\n');
    const prompt = `<s>[INST] ${TEMPLATE}\n\nContext: ${context}\n\nQuestion: ${question}\n\nAnswer: [/INST]`;
    
    console.log('Generating response with context length:', context.length);

    // Generate answer with error handling
    let response;
    try {
      response = await llm.predict(prompt);
      console.log('Generated response:', response);
    } catch (error) {
      console.error('Error generating response:', error);
      response = "I apologize, but I encountered an error while processing your question. Please try asking in a different way or with a simpler question.";
    }

    return NextResponse.json({
      text: response,
      citations: relevantDocs.map((doc: Document) => ({
        text: cleanText(doc.pageContent).substring(0, 150) + "...",
        source: doc.metadata.source || "document",
        page: doc.metadata.page || 1
      }))
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process documents or generate response' },
      { status: 500 }
    );
  }
} 