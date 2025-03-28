'use client';

import { useState, useRef } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';

interface Document {
  id: string;
  name: string;
  uploadedAt: string;
  status: 'active' | 'processing' | 'error';
}

export default function DocumentQAPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    console.log('Upload button clicked'); // Debug log
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file?.name); // Debug log
    
    if (file) {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        uploadedAt: new Date().toISOString(),
        status: 'active'
      };
      
      setDocuments(prev => [...prev, newDoc]);
      setActiveDocument(newDoc);
      console.log('Document added:', newDoc); // Debug log
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Document Q&A Chatbot</h1>
        <p className="text-gray-400 mb-8">
          Upload a document and ask questions about its contents. The chatbot will provide answers based on the document's content.
        </p>

        <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.txt,.doc,.docx"
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium mb-4"
          >
            Upload Document
          </button>
          <p className="text-sm text-gray-500">
            Upload a PDF or text file to start chatting about it
          </p>
        </div>

        {documents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDocument(doc)}
                  className={`p-4 rounded-lg border cursor-pointer ${
                    doc.id === activeDocument?.id
                      ? 'border-blue-500 bg-gray-800'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-900 text-green-300">
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          {activeDocument ? (
            <div className="p-4 bg-gray-800 rounded-lg">
              <ChatInterface documentId={activeDocument.id} />
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-800 rounded-lg">
              <p className="text-gray-400">
                {documents.length > 0 
                  ? "Select a document to start chatting"
                  : "Please upload a document to start chatting"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 