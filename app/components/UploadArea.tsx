import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadAreaProps {
  files: File[];
  onFileUpload: (files: FileList | null) => void;
  onFileDrop: (event: React.DragEvent) => void;
  onFileRemove: (index: number) => void;
}

export default function UploadArea({ files, onFileUpload, onFileDrop, onFileRemove }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragging(false);
    onFileDrop(e);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed border-slate-700 p-8 transition-colors",
          isDragging && "border-primary bg-primary/5",
          "hover:border-primary/50"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <motion.div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="h-6 w-6 text-primary" />
          </motion.div>
          <label htmlFor="file-upload" className="block">
            <motion.span
              className="inline-flex cursor-pointer items-center rounded-lg bg-primary px-6 py-3 font-medium text-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Choose files
            </motion.span>
            <input
              id="file-upload"
              type="file"
              className="sr-only"
              multiple
              onChange={(e) => onFileUpload(e.target.files)}
              accept=".pdf,.doc,.docx,.txt"
            />
          </label>
          <p className="mt-3 text-sm text-slate-400">or drag and drop</p>
          <p className="mt-1 text-xs text-slate-500">PDF, DOCX, or TXT up to 10MB each</p>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-2"
            >
              {files.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
                >
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-slate-300">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)}KB
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onFileRemove(index)}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 