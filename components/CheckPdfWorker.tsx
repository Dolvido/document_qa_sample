'use client';

import { useEffect, useState } from 'react';

export default function CheckPdfWorker() {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  
  useEffect(() => {
    const checkWorker = async () => {
      try {
        const response = await fetch('/pdf.worker.min.js');
        
        if (response.ok) {
          setStatus('available');
          console.log('PDF worker is available');
        } else {
          setStatus('unavailable');
          console.error('PDF worker file not found:', response.status);
        }
      } catch (error) {
        setStatus('unavailable');
        console.error('Error checking PDF worker:', error);
      }
    };
    
    checkWorker();
  }, []);
  
  if (status === 'checking') {
    return null;
  }
  
  if (status === 'unavailable') {
    return (
      <div className="p-2 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
        PDF.js worker is not available. This will cause problems with PDF rendering.
      </div>
    );
  }
  
  // Don't show anything when worker is available
  return null;
} 