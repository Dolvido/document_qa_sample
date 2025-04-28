import { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { loadPdfForPreview } from '../lib/pdfUtils';

interface PdfPreviewProps {
  file: File;
  maxPages?: number;
}

export default function PdfPreview({ file, maxPages = 3 }: PdfPreviewProps) {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderAttempts, setRenderAttempts] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ promise: Promise<any>; cancel: () => void } | null>(null);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load PDF document
        console.log(`Attempting to load PDF: ${file.name} (${file.size} bytes)`);
        const doc = await loadPdfForPreview(file);
        console.log('PDF document loaded successfully');
        setPdfDocument(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    if (file) {
      loadPdf();
    }

    // Cleanup
    return () => {
      // Cancel any pending render operation
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        } catch (e) {
          console.warn('Error canceling render task:', e);
        }
      }
      
      // Destroy PDF document when component unmounts
      if (pdfDocument) {
        pdfDocument.destroy().catch(console.error);
      }
    };
  }, [file]);

  // Render PDF page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;

      try {
        // Cancel any pending render operation
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
            renderTaskRef.current = null;
          } catch (e) {
            console.warn('Error canceling render task:', e);
          }
        }

        // Get the page
        console.log(`Rendering page ${currentPage}/${totalPages}`);
        const page = await pdfDocument.getPage(currentPage);
        
        // Get the canvas element
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) {
          console.error('Could not get canvas context');
          setError('Failed to get canvas context');
          return;
        }

        // Clear the canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scale to fit the canvas width (adjust as needed)
        const viewport = page.getViewport({ scale: 1.0 });
        const containerWidth = canvas.parentElement?.clientWidth || 600;
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        console.log(`Rendering at scale ${scale}`);
        // Render the page and store the task reference
        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: scaledViewport,
        });
        
        // Wait for rendering to complete
        await renderTaskRef.current.promise;
        console.log('Page rendered successfully');
        renderTaskRef.current = null;
        // Reset render attempts on success
        setRenderAttempts(0);
      } catch (err) {
        // Only show error if it's not a cancellation
        if (err instanceof Error && err.message !== 'Rendering cancelled') {
          console.error('Error rendering PDF page:', err);
          
          // If we have less than 3 render attempts, try again
          if (renderAttempts < 3) {
            console.log(`Render attempt ${renderAttempts + 1}/3 failed, retrying...`);
            setRenderAttempts(prev => prev + 1);
            // Try again after a short delay
            setTimeout(() => {
              renderPage();
            }, 500);
          } else {
            setError(`Failed to render PDF page: ${err.message}`);
          }
        }
      }
    };

    renderPage();
    
    // Cleanup function to cancel rendering when changing pages
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        } catch (e) {
          console.warn('Error canceling render task:', e);
        }
      }
    };
  }, [pdfDocument, currentPage, renderAttempts, totalPages]);

  // Handle next/previous page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRetry = () => {
    setRenderAttempts(0);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
        <span className="text-slate-300">Loading PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 space-y-2">
        <p>{error}</p>
        <button 
          onClick={handleRetry}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-white text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="pdf-preview">
      <div className="flex flex-col items-center">
        <div className="w-full overflow-auto border rounded-lg bg-slate-800/50 border-slate-700">
          <canvas ref={canvasRef} className="mx-auto" />
        </div>
        
        {/* Page navigation */}
        {totalPages > 1 && (
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-sm font-medium border rounded disabled:opacity-50 bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
            >
              Previous
            </button>
            
            <span className="text-sm text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages || currentPage >= maxPages}
              className="px-3 py-1 text-sm font-medium border rounded disabled:opacity-50 bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
            >
              Next
            </button>
          </div>
        )}
        
        {totalPages > maxPages && (
          <p className="mt-2 text-xs text-slate-500">
            Preview limited to {maxPages} pages. The document has {totalPages} total pages.
          </p>
        )}
      </div>
    </div>
  );
} 