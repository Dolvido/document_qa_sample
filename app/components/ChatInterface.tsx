'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import { Message } from '../types/chat';
import { AnimatePresence } from 'framer-motion';
import FilePreview from '../../components/FilePreview';
import { extractTextFromPdf } from '../../lib/pdfUtils';
import CheckPdfWorker from '../../components/CheckPdfWorker';

// Safe storage helper functions with improved error handling
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      // First check if localStorage is actually available
      if (window.localStorage === undefined) return null;
      
      // Attempt to read directly without testing first (reduces operations)
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn('Local storage access denied:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      // First check if localStorage is actually available
      if (window.localStorage === undefined) return false;
      
      // Attempt to write directly
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Local storage access denied:', e);
      return false;
    }
  },
  isAvailable: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      // Use a simpler test that doesn't try to write
      return !!window.localStorage;
    } catch (e) {
      return false;
    }
  }
};

// Add this function to process files client-side
async function processFilesClientSide(files: File[]): Promise<{name: string, type: string, data: string, size: number, text?: string}[]> {
  return Promise.all(
    files.map(async (file) => {
      // First create the basic file data
      const fileData = await new Promise<{name: string, type: string, data: string, size: number}>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type,
            data: reader.result as string,
            size: file.size
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // For PDFs, extract text client-side
      if (file.type === 'application/pdf') {
        try {
          console.log(`Processing PDF client-side: ${file.name}`);
          const result = await extractTextFromPdf(file);
          return {
            ...fileData,
            text: result.text // Add extracted text
          };
        } catch (error) {
          console.error('Error processing PDF client-side:', error);
          return fileData; // Fall back to just the file data
        }
      }
      
      return fileData;
    })
  );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [processingStage, setProcessingStage] = useState<string>('');

  // Check if storage is available
  useEffect(() => {
    const checkStorage = () => {
      const available = safeLocalStorage.isAvailable();
      setStorageAvailable(available);
      if (!available) {
        console.warn('Browser storage is not available - some features may be limited');
      }
    };
    
    // Check once on mount
    checkStorage();
  }, []);

  // Load saved messages and files from storage on component mount
  useEffect(() => {
    if (!storageAvailable) {
      console.log('Browser storage is not available - skipping state restoration');
      return;
    }
    
    // Wrap in a try/catch to be extra safe
    try {
      // Try to load saved messages
      const savedMessages = safeLocalStorage.getItem('chat_messages');
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          if (Array.isArray(parsedMessages)) {
            setMessages(parsedMessages);
          }
        } catch (parseError) {
          console.warn('Failed to parse saved messages:', parseError);
          // Clear potentially corrupted state
          safeLocalStorage.setItem('chat_messages', '');
        }
      }
    } catch (e) {
      console.warn('Failed to load saved chat state:', e);
      // Don't try to clear anything, just fail silently
    }
  }, [storageAvailable]);

  // Save messages to storage when they change
  useEffect(() => {
    if (!storageAvailable || messages.length === 0) return;
    
    // Use a debounced save to avoid excessive writes
    const timeoutId = setTimeout(() => {
      try {
        safeLocalStorage.setItem('chat_messages', JSON.stringify(messages));
      } catch (e) {
        console.warn('Failed to save chat state:', e);
        // Just log and continue, don't try to fix
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [messages, storageAvailable]);

  // Clear saved data when clearing chat
  const clearChat = () => {
    setMessages([]);
    setFiles([]);
    
    if (storageAvailable) {
      safeLocalStorage.setItem('chat_messages', '');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      console.log('Files selected:', fileList.length);
      
      const filesArray = Array.from(fileList);
      console.log('File details:', filesArray.map(f => `${f.name} (${f.size} bytes)`));
      
      setFiles(filesArray);
      setError(null);
      if (messages.length === 0) {
        setMessages([{
          text: "Hello! I'll help you find information in your documents. Ask me any questions about their contents.",
          isAi: true
        }]);
      }
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const fileList = event.dataTransfer.files;
    setFiles(Array.from(fileList));
    setError(null);
    if (messages.length === 0) {
      setMessages([{
        text: "Hello! I'll help you find information in your documents. Ask me any questions about their contents.",
        isAi: true
      }]);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!inputRef.current?.value.trim() || !files.length) return;

    const question = inputRef.current.value;
    console.log('Submitting question:', question);
    console.log('With files:', files.map(f => f.name));
    
    // Add user message to chat
    setMessages(prev => [...prev, { text: question, isAi: false }]);
    inputRef.current.value = '';
    setIsProcessing(true);
    setError(null);
    
    // Show processing stages
    setProcessingStage('Processing documents...');
    
    try {
      // Process files client-side when possible
      const processedFiles = await processFilesClientSide(files);
      console.log(`Processed ${processedFiles.length} files client-side`);
      
      // Set timeout for fetch to handle possible timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120-second timeout

      // Update processing stage
      setProcessingStage('Generating answer...');

      // Add some random delay to prevent Next.js edge functions timing out
      // This helps when multiple requests are being processed
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

      try {
        console.log('Sending request to chat API');
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ content: question, role: 'user' }],
            files: processedFiles
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        // Add response to messages
        if (data.text) {
          setMessages(prev => [...prev, {
            text: data.text,
            isAi: true,
            citations: data.citations || []
          }]);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error: any) {
        console.error('Error calling chat API:', error);
        setError(error.message || 'Failed to generate a response. Please try again.');
        setMessages(prev => [...prev, {
          text: 'Sorry, I encountered an error while processing your question. Please try again.',
          isAi: true
        }]);
      }
    } catch (error: any) {
      console.error('Error processing files:', error);
      setError(error.message || 'Failed to process files. Please try again with different files.');
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error while processing your documents. Please try again with different files.',
        isAi: true
      }]);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
      
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to check file sizes
  useEffect(() => {
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
    }
  }, [files]);

  return (
    <>
      <div 
        className="glass-card p-8 mb-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* PDF Worker status check */}
        <div className="mb-4">
          <CheckPdfWorker />
        </div>
        
        <div className="text-center">
          <label htmlFor="file-upload" className="inline-block">
            <span className="bg-primary hover:bg-primary/80 text-white font-medium px-6 py-3 rounded-xl transition-colors cursor-pointer">
              Upload files
            </span>
            <input
              id="file-upload"
              type="file"
              className="sr-only"
              multiple
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt"
            />
          </label>
          <p className="text-slate-400 mt-3">or drag and drop</p>
          <p className="text-sm text-slate-500 mt-1">PDF, DOCX, or TXT up to 10MB each</p>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {files.length > 0 && (
          <div className="mt-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-300">Uploaded Files</h3>
            {files.map((file, index) => (
              <div key={index} className="border border-slate-700/50 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between bg-slate-800/30 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{file.name}</span>
                    <span className={`text-xs ${file.size > 10 * 1024 * 1024 ? 'text-red-400' : 'text-slate-500'}`}>
                      ({Math.round(file.size / 1024)}KB)
                    </span>
                  </div>
                  <button 
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    className="text-slate-400 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <FilePreview file={file} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chat-container rounded-2xl border border-slate-700/50 backdrop-blur-sm p-6 mb-6">
        <div className="space-y-6">
          {files.length === 0 ? (
            <ChatMessage
              message={{
                text: "Welcome! Please upload your documents and I'll help you analyze them. I can answer questions and provide citations from your documents.",
                isAi: true
              }}
            />
          ) : (
            <>
              {messages.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={clearChat}
                    className="text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Clear Chat
                  </button>
                </div>
              )}
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              <AnimatePresence>
                {isProcessing && <LoadingSpinner />}
              </AnimatePresence>
            </>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      
      {!storageAvailable && messages.length > 0 && (
        <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-amber-200 text-sm">Browser storage is not available. Your chat won't be saved if you close this page.</p>
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask a question about your documents..."
          className="flex-1 bg-transparent border-0 focus:outline-none text-slate-300 placeholder-slate-500"
          disabled={isProcessing || files.length === 0}
        />
        <button 
          type="submit"
          className="bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-primary font-medium"
          disabled={isProcessing || files.length === 0 || !!error}
        >
          {isProcessing 
            ? processingStage || 'Processing...' 
            : 'Send'}
        </button>
      </form>
    </>
  );
} 