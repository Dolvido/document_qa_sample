'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import { Message } from '../types/chat';
import { AnimatePresence } from 'framer-motion';

// Safe storage helper functions
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Local storage access denied');
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Local storage access denied');
    }
  }
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      setFiles(Array.from(fileList));
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
    setMessages(prev => [...prev, { text: question, isAi: false }]);
    inputRef.current.value = '';
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('question', question);
      files.forEach(file => formData.append('files', file));

      // Set timeout for fetch to handle possible timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45-second timeout
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);

        const data = await response.json();
        
        if (!response.ok) {
          if (data.error) {
            setError(data.error);
            setMessages(prev => [...prev, {
              text: data.error || "I'm sorry, but I encountered an error. Please try again later.",
              isAi: true
            }]);
          } else {
            throw new Error('An unexpected error occurred');
          }
        } else if (data.error) {
          // Handle case where we get a 200 response but with an error message
          setError(data.error);
          setMessages(prev => [...prev, {
            text: data.error,
            isAi: true
          }]);
        } else if (data.text) {
          // Normal success case
          setMessages(prev => [...prev, {
            text: data.text,
            isAi: true,
            citations: data.citations
          }]);
        } else {
          throw new Error('Received empty response');
        }
      } catch (fetchError: any) {
        // Type assertion for fetchError
        if (fetchError && fetchError.name === 'AbortError') {
          // Request was aborted due to timeout
          setError('Request timed out');
          setMessages(prev => [...prev, {
            text: "The server took too long to respond. PDF processing can be resource-intensive. Please try with a smaller file or a different format.",
            isAi: true
          }]);
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "I'm sorry, but I encountered an error while processing your question. Please try again.";
      
      setError(errorMessage);
      setMessages(prev => [...prev, {
        text: "I'm sorry, but I encountered an error while processing your question. This might be due to server issues or network problems. Please try again later.",
        isAi: true
      }]);
    } finally {
      setIsProcessing(false);
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
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-slate-400 bg-slate-800/30 rounded-lg p-2">
                <span>{file.name}</span>
                <span className={`text-sm ${file.size > 10 * 1024 * 1024 ? 'text-red-400' : 'text-slate-500'}`}>
                  ({Math.round(file.size / 1024)}KB)
                </span>
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
          {isProcessing ? 'Processing...' : 'Send'}
        </button>
      </form>
    </>
  );
} 