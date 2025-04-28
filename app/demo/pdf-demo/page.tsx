'use client';

import { useState, useEffect } from 'react';
import { Upload, FileCheck, Trash, AlertCircle } from 'lucide-react';
import FilePreview from '../../../components/FilePreview';
import { extractTextFromPdf } from '../../../lib/pdfUtils';

export default function PdfDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(true);

  // Check if PDF.js is properly loaded
  useEffect(() => {
    try {
      // Check if PDF.js global objects are available
      const pdfjsCheck = typeof window !== 'undefined' && 
        'pdfjs-dist/build/pdf' in window;
      
      setPdfJsLoaded(!!pdfjsCheck);
    } catch (err) {
      console.error('Error checking PDF.js:', err);
      setPdfJsLoaded(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setExtractedText('');
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile && droppedFile.type !== 'application/pdf') {
      setError('Please drop a PDF file');
      return;
    }
    
    setFile(droppedFile);
    setExtractedText('');
    setError(null);
  };

  const processFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await extractTextFromPdf(file);
      setExtractedText(result.text);
      console.log(`Processed PDF with ${result.pages} pages`);
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError('Failed to process PDF file. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setExtractedText('');
    setError(null);
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-white">Client-side PDF Processing</h1>
      <p className="text-slate-400 mb-8">
        This demo uses PDF.js to process PDF files directly in your browser, without sending data to the server.
      </p>
      
      {!pdfJsLoaded && (
        <div className="p-4 mb-6 bg-amber-500/20 border border-amber-500 rounded-lg text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">PDF.js may not be properly loaded</p>
            <p className="text-sm mt-1">This could affect PDF processing functionality. Try refreshing the page.</p>
          </div>
        </div>
      )}
      
      <div 
        className="border-2 border-dashed border-slate-700 rounded-xl p-8 mb-8 text-center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {!file ? (
          <>
            <div className="mb-4 mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <span className="bg-primary text-white font-medium px-6 py-3 rounded-lg inline-block">
                Select PDF file
              </span>
              <input
                id="pdf-upload"
                type="file"
                className="sr-only"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </label>
            <p className="mt-3 text-sm text-slate-400">or drag and drop</p>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <FileCheck className="w-5 h-5 text-green-400" />
              <span>{file.name}</span>
              <button 
                onClick={clearFile}
                className="ml-4 p-1 rounded-full hover:bg-slate-700"
              >
                <Trash className="w-4 h-4 text-red-400" />
              </button>
            </div>
            
            <div className="my-4">
              <FilePreview file={file} />
            </div>
            
            <button
              onClick={processFile}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/80 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Extract Text from PDF'}
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 mb-8">
          {error}
        </div>
      )}
      
      {extractedText && (
        <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/20">
          <h2 className="text-xl font-semibold mb-4 text-white">Extracted Text</h2>
          <div className="bg-slate-800/50 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-slate-300">
            {extractedText}
          </div>
        </div>
      )}
    </div>
  );
} 