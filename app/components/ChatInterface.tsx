'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import { Message } from '../types/chat';
import { AnimatePresence } from 'framer-motion';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      setFiles(Array.from(fileList));
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

    try {
      const formData = new FormData();
      formData.append('question', question);
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        text: data.text,
        isAi: true,
        citations: data.citations
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: "I'm sorry, but I encountered an error while processing your question. Please try again.",
        isAi: true
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-slate-400 bg-slate-800/30 rounded-lg p-2">
                <span>{file.name}</span>
                <span className="text-sm text-slate-500">({Math.round(file.size / 1024)}KB)</span>
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
          disabled={isProcessing || files.length === 0}
        >
          {isProcessing ? 'Processing...' : 'Send'}
        </button>
      </form>
    </>
  );
} 