import { NextRequest, NextResponse } from 'next/server';
import { extractBasicPdfText } from './extract';

// Define the export for the PDF processing route
export const dynamic = 'force-dynamic'; // No edge runtime
export const maxDuration = 60; // Extend function timeout to 60 seconds

// Interface for the request body
interface ProcessPdfRequestBody {
  data: string; // Base64 encoded PDF data
  name: string; // Filename
}

// Clean and normalize text
function cleanText(text: string): string {
  return text
    // Remove common PDF artifacts
    .replace(/%PDF-[\d.]+/g, '')
    .replace(/<<[^>]*>>/g, '')
    .replace(/\d+ \d+ obj/g, '')
    .replace(/endobj/g, '')
    .replace(/stream\b/g, '')
    .replace(/endstream\b/g, '')
    // Remove other common problematic patterns
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove replacement characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Extract text from PDF data
async function extractPdfText(data: string, name: string): Promise<{ text: string, pages: number }> {
  try {
    console.log(`Processing PDF file on server: ${name}`);
    
    // Strip the data URL prefix if present
    const base64Data = data.replace(/^data:application\/pdf;base64,/, '');
    
    try {
      // Try the basic extraction method first as it's more reliable in server environment
      const extractedText = await extractBasicPdfText(base64Data);
      
      // Estimate page count based on text length
      const estimatedPages = Math.max(1, Math.ceil(extractedText.length / 3000));
      
      return {
        text: extractedText,
        pages: estimatedPages
      };
    } catch (extractError) {
      console.error('Error in primary extraction method:', extractError);
      
      // Fallback to regex-based extraction
      return await extractTextFallback(base64Data, name);
    }
  } catch (error: any) {
    console.error('PDF processing error:', error);
    // Use the fallback method as last resort
    return await extractTextFallback(data, name);
  }
}

// Fallback method to extract text from PDF using regex patterns
async function extractTextFallback(data: string, name: string): Promise<{ text: string, pages: number }> {
  try {
    console.log(`Using fallback extraction for: ${name}`);
    const base64Data = data.replace(/^data:application\/pdf;base64,/, '');
    
    // Use a simple text extraction from base64 content
    let decodedData = '';
    try {
      // Need to handle potential encoding errors
      const buffer = Buffer.from(base64Data, 'base64');
      decodedData = buffer.toString('binary');
    } catch (decodeError) {
      console.error('Error decoding base64 data:', decodeError);
      return { 
        text: `Failed to decode PDF content from ${name}`, 
        pages: 0
      };
    }
    
    // Try to find text content using regex patterns
    const textFragments: string[] = [];
    
    // Look for text between parentheses (common PDF text encoding)
    const textRegex = /\(([^)]+)\)/g;
    let match;
    while ((match = textRegex.exec(decodedData)) !== null) {
      // If the match looks like text (not binary data)
      if (/^[\x20-\x7E\s]+$/.test(match[1]) && match[1].length > 1) {
        textFragments.push(match[1]);
      }
    }
    
    // Join fragments and clean up
    let extractedText = textFragments.join(' ');
    extractedText = cleanText(extractedText
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ')
    );
    
    // Roughly estimate pages based on text length
    const estimatedPages = Math.max(1, Math.ceil(extractedText.length / 3000));
    
    return {
      text: extractedText || `Could not extract text from ${name}`,
      pages: estimatedPages
    };
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return {
      text: `PDF extraction failed for ${name}. Please try a different file format.`,
      pages: 0
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body: ProcessPdfRequestBody = await req.json();
    
    if (!body.data) {
      return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
    }
    
    // Process the PDF
    const result = await extractPdfText(body.data, body.name || 'document.pdf');
    
    // Return the extracted text
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PDF processing route:', error);
    return NextResponse.json(
      { error: `Failed to process PDF: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 