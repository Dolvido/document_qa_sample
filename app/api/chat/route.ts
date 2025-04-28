import { NextRequest, NextResponse } from 'next/server';
import { Document } from "@langchain/core/documents";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import type { PDFData } from 'pdf-parse';

// Safer check for API key
const HUGGINGFACEHUB_API_KEY = process.env.HUGGINGFACEHUB_API_KEY;
if (!HUGGINGFACEHUB_API_KEY) {
  console.error('Missing HuggingFace API Key - this will cause failures in production');
  // We don't throw here to allow the app to still initialize
}

const TEMPLATE = `You are a helpful assistant analyzing document content. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Keep your answer concise and focused on the question.

Context: {context}

Question: {question}

Answer:`;

// Initialize models with safer error handling
let embeddingModel: HuggingFaceInferenceEmbeddings | null = null;
let llm: HuggingFaceInference | null = null;

try {
  if (HUGGINGFACEHUB_API_KEY) {
    embeddingModel = new HuggingFaceInferenceEmbeddings({
      apiKey: HUGGINGFACEHUB_API_KEY,
      model: "sentence-transformers/all-MiniLM-L6-v2"
    });

    // Create LLM with custom fetch options to improve timeout handling
    llm = new HuggingFaceInference({
      apiKey: HUGGINGFACEHUB_API_KEY,
      model: "mistralai/Mistral-7B-Instruct-v0.1",
      temperature: 0.5
    });
  }
} catch (error) {
  console.error('Error initializing HuggingFace models:', error);
}

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

// Configure route options to increase timeout
export const runtime = 'edge'; // Enable edge runtime for better performance
export const maxDuration = 60; // Extend function timeout to 60 seconds (Vercel Edge functions support this)

export async function POST(req: NextRequest) {
  try {
    // Check if HuggingFace API key is available
    if (!HUGGINGFACEHUB_API_KEY || !embeddingModel || !llm) {
      console.error('HuggingFace API key or models not available');
      return NextResponse.json(
        { text: 'The document analysis service is currently unavailable. Please try again later.' },
        { status: 200 }
      );
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 55000) // 55 seconds
    );

    // Create the main request processing promise
    const processingPromise = (async () => {
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];
      const question = formData.get('question') as string || "What is this document about?";

      if (!files.length) {
        return NextResponse.json(
          { text: 'Please upload a document to analyze' },
          { status: 200 }
        );
      }

      console.log('Processing files:', files.map(f => f.name));

      // Load and process documents - use smaller chunk size in production
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
              
              // Parse PDF with error handling and timeout
              const pdfData = await Promise.race([
                new Promise<PDFData>((resolve, reject) => {
                  pdfParse(pdfBuffer)
                    .then(resolve)
                    .catch((err) => {
                      console.error('PDF parsing error details:', err);
                      reject(err);
                    });
                }),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('PDF parsing timed out')), 20000)
                )
              ]);
              
              text = pdfData.text;
              console.log('Successfully parsed PDF, extracted text length:', text.length);
            } catch (error) {
              console.error('Error parsing PDF:', error);
              // Try to still provide a response - fallback to simple extraction
              try {
                text = await new Blob([arrayBuffer]).text();
                if (!text.trim()) {
                  return NextResponse.json(
                    { text: "I encountered difficulties reading the PDF file. It might be scanned, protected, or corrupted. Please try another file or format." },
                    { status: 200 }
                  );
                }
              } catch (e) {
                return NextResponse.json(
                  { text: "I couldn't process the PDF file. It might be scanned, protected, or corrupted. Please try another file or format." },
                  { status: 200 }
                );
              }
            }
          } else {
            // For non-PDF files, use direct text extraction
            text = await new Blob([arrayBuffer]).text();
          }
          
          if (!text.trim()) {
            console.warn(`No text content extracted from ${file.name}`);
            return NextResponse.json(
              { text: "I couldn't extract any text content from the file. It might be a scanned document, an image, or contain only non-textual content." },
              { status: 200 }
            );
          }

          // Clean the text before splitting into chunks
          text = cleanText(text);
          console.log('Cleaned text length:', text.length);
          
          // Split text into smaller chunks to stay within token limits - use smaller chunks in production
          const chunks = splitTextIntoChunks(text, 120, 15);
          console.log('Created chunks:', chunks.length);
          
          // Limit the number of chunks to process in production
          const maxChunks = 50;
          const limitedChunks = chunks.slice(0, maxChunks);
          
          if (chunks.length > maxChunks) {
            console.log(`Processing only ${maxChunks} of ${chunks.length} chunks to avoid timeout`);
          }
          
          limitedChunks.forEach((chunk, index) => {
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
            { text: `I encountered an error processing the file ${file.name}. Please try again with a smaller or different file.` },
            { status: 200 }
          );
        }
      }

      if (!docs.length) {
        return NextResponse.json(
          { text: "I couldn't extract useful content from the documents. Please try with different files." },
          { status: 200 }
        );
      }

      console.log('Total documents created:', docs.length);
      console.log('Finding relevant documents for question:', question);

      // Find relevant documents using similarity search
      let relevantDocs;
      try {
        // Limit to just 2 most relevant docs to speed up processing
        relevantDocs = await findSimilarDocuments(docs, question, embeddingModel, 2);
      } catch (error) {
        console.error('Error finding similar documents:', error);
        return NextResponse.json(
          { text: "I encountered an error while analyzing the documents. This might be due to a temporary issue with the analysis service. Please try again later with smaller files." },
          { status: 200 }
        );
      }

      // Format context and question - keeping context more concise
      const context = relevantDocs.map((doc: Document) => doc.pageContent).join('\n\n');
      const prompt = `<s>[INST] ${TEMPLATE}\n\nContext: ${context}\n\nQuestion: ${question}\n\nAnswer: [/INST]`;
      
      console.log('Generating response with context length:', context.length);

      // Generate answer with error handling and timeout
      let response;
      try {
        if (llm) {
          // Add timeout to LLM prediction
          response = await Promise.race([
            llm.predict(prompt),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), 25000))
          ]);
          console.log('Generated response:', response);
        } else {
          throw new Error('LLM not initialized');
        }
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
    })();

    // Race the processing against the timeout
    return await Promise.race([processingPromise, timeoutPromise]);
    
  } catch (error) {
    console.error('Error processing request:', error);
    if (error instanceof Error && error.message === 'Request timed out') {
      return NextResponse.json(
        { text: 'The request took too long to process. Please try with smaller documents or a simpler question.' },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { text: 'Something went wrong while processing your request. Please try again later with smaller documents.' },
      { status: 200 }
    );
  }
} 