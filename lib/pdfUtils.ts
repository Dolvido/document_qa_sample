import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

// Keep track of worker initialization
let workerInitialized = false;

// Initialize PDF.js worker
const loadPdfJsWorker = () => {
  // Only load worker in browser environment and if not already initialized
  if (typeof window !== 'undefined' && !workerInitialized) {
    try {
      console.log('Initializing PDF.js worker');
      
      // Import worker directly from node_modules instead of using CDN
      GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      workerInitialized = true;
      console.log('PDF.js worker initialized successfully');
    } catch (err) {
      console.error('Failed to initialize PDF.js worker:', err);
      throw new Error('PDF.js worker initialization failed');
    }
  }
};

// Process PDF file and return text content
export async function extractTextFromPdf(file: File): Promise<{ text: string; pages: number }> {
  try {
    // Make sure worker is loaded
    loadPdfJsWorker();
    
    console.log(`Processing PDF file: ${file.name} (${file.size} bytes)`);
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document with explicit options for better compatibility
    const loadingTask = getDocument({
      data: new Uint8Array(arrayBuffer),
      disableAutoFetch: true, // Disable streaming for better stability
      disableStream: true,    // Disable streaming for better stability
      cMapUrl: '/cmaps/',
      cMapPacked: true
    });
    
    const pdfDocument = await loadingTask.promise;
    
    const totalPages = pdfDocument.numPages;
    console.log(`PDF has ${totalPages} pages`);
    
    // Extract text with a reasonable page limit
    let fullText = '';
    const maxPages = Math.min(totalPages, 50); // Safety limit for large PDFs
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        console.log(`Processing page ${i}/${maxPages}`);
        const page = await pdfDocument.getPage(i);
        const content = await page.getTextContent();
        
        // Extract text from the page
        const pageText = content.items
          .map((item: any) => 'str' in item ? item.str : '')
          .join(' ');
        
        fullText += pageText + '\n\n';
        
        // Release page resources for better memory management
        page.cleanup && await page.cleanup();
      } catch (err) {
        console.error(`Error extracting text from page ${i}:`, err);
      }
    }
    
    // Add note if pages were skipped
    if (totalPages > maxPages) {
      fullText += `\n[Note: Only processed first ${maxPages} of ${totalPages} pages due to size limits]`;
    }
    
    // Clean up resources
    pdfDocument.destroy && await pdfDocument.destroy();
    
    const cleanedText = cleanText(fullText);
    console.log(`Extracted ${cleanedText.length} characters from PDF`);
    
    return { 
      text: cleanedText || 'No extractable text found in document', 
      pages: totalPages
    };
  } catch (error: any) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF document: ${error.message || 'Unknown error'}`);
  }
}

// Helper function to clean extracted text
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

// Load PDF for preview
export async function loadPdfForPreview(file: File): Promise<PDFDocumentProxy> {
  try {
    // Make sure worker is loaded
    loadPdfJsWorker();
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document with explicit options for better compatibility
    const loadingTask = getDocument({
      data: new Uint8Array(arrayBuffer),
      disableAutoFetch: true, // Disable streaming for better stability
      disableStream: true,    // Disable streaming for better stability
      cMapUrl: '/cmaps/',
      cMapPacked: true
    });
    
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error loading PDF for preview:', error);
    throw new Error('Failed to load PDF for preview');
  }
} 