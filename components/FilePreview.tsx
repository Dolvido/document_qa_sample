import { useState, useEffect } from 'react';
import { File } from 'lucide-react';
import PdfPreview from './PdfPreview';

interface FilePreviewProps {
  file: File;
}

export default function FilePreview({ file }: FilePreviewProps) {
  // Function to get file icon based on file type
  const getFileIcon = () => {
    return <File className="h-5 w-5 text-primary" />;
  };

  // Determine file preview based on type
  const renderPreview = () => {
    // For PDF files, use our PDF.js preview
    if (file.type === 'application/pdf') {
      return <PdfPreview file={file} />;
    }

    // For text files, render simple text preview
    if (file.type.includes('text/')) {
      return (
        <div className="p-4 border rounded-lg bg-slate-800/30 text-slate-300 text-sm font-mono max-h-48 overflow-auto">
          <TextPreview file={file} />
        </div>
      );
    }

    // Default preview (file info)
    return (
      <div className="flex items-center space-x-3 p-4 border rounded-lg bg-slate-800/30">
        {getFileIcon()}
        <div>
          <p className="text-sm text-slate-300">{file.name}</p>
          <p className="text-xs text-slate-500">
            {(file.size / 1024).toFixed(1)}KB • {file.type || 'Unknown type'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="file-preview">
      {renderPreview()}
    </div>
  );
}

// Simple text file preview component
function TextPreview({ file }: { file: File }) {
  const [text, setText] = useState<string>('Loading text content...');

  useEffect(() => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content || 'No text content found');
    };
    
    reader.onerror = () => {
      setText('Error loading text content');
    };
    
    reader.readAsText(file);
  }, [file]);

  return <div>{text}</div>;
} 