import React, { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, FileCheck, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.txt'];
const MAX_SIZE_MB = 10;

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateAndFilterFiles = (fileList: FileList | File[]): File[] => {
    setErrorMsg(null);
    const validFiles: File[] = [];

    Array.from(fileList).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setErrorMsg(`File '${file.name}' has an unsupported extension. Allowed: ${ACCEPTED_EXTENSIONS.join(', ')}`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setErrorMsg(`File '${file.name}' exceeds maximum size of 10MB.`);
        return;
      }
      validFiles.push(file);
    });

    return validFiles;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    const files = validateAndFilterFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || isProcessing) return;
    const files = validateAndFilterFiles(e.target.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isProcessing) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/20 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-900'
        } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.txt"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8 text-white" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white tracking-tight">
              Drag & Drop messy downloads here
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              or <span className="text-blue-400 font-medium hover:underline">browse files</span> from your computer
            </p>
          </div>

          {/* Supported Types Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> Images (JPG, PNG)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Documents (PDF)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <FileCheck className="w-3.5 h-3.5 text-purple-400" /> Plain Text (TXT)
            </span>
            <span className="text-xs text-slate-500 ml-2">Max 10 MB per file</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
