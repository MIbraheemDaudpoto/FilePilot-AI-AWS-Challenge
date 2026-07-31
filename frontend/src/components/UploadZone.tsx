import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface Props {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const ACCEPTED = ['.jpg', '.jpeg', '.png', '.pdf', '.txt'];
const MAX_MB = 10;

export function UploadZone({ onFilesSelected, isProcessing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate(files: File[]): File[] | null {
    setValidationError(null);
    if (files.length === 0) return null;
    if (files.length > 10) {
      setValidationError('Maximum 10 files at a time.');
      return null;
    }
    const invalid = files.filter(
      (f) => !ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (invalid.length > 0) {
      setValidationError(
        `Unsupported file${invalid.length > 1 ? 's' : ''}: ${invalid.map((f) => f.name).join(', ')}`
      );
      return null;
    }
    const tooBig = files.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig.length > 0) {
      setValidationError(
        `File${tooBig.length > 1 ? 's' : ''} exceed 10 MB: ${tooBig.map((f) => f.name).join(', ')}`
      );
      return null;
    }
    return files;
  }

  function handleFiles(raw: FileList | null) {
    if (!raw) return;
    const files = Array.from(raw);
    const valid = validate(files);
    if (valid) onFilesSelected(valid);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = '';
  }

  const busy = isProcessing;

  return (
    <div className="space-y-3">
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none',
          'flex flex-col items-center justify-center gap-4 py-14 px-6 text-center',
          busy
            ? 'border-slate-700 bg-slate-900/40 cursor-not-allowed opacity-60'
            : dragging
              ? 'border-indigo-500 bg-indigo-950/30 scale-[1.01]'
              : 'border-slate-700 bg-slate-900/30 hover:border-indigo-600/70 hover:bg-slate-900/50',
        ].join(' ')}
      >
        {/* Icon */}
        <div className={[
          'w-16 h-16 rounded-2xl flex items-center justify-center transition-all',
          dragging
            ? 'bg-indigo-600/30 ring-2 ring-indigo-500/40'
            : 'bg-slate-800/80',
        ].join(' ')}>
          <UploadCloud className={`w-8 h-8 ${dragging ? 'text-indigo-400' : 'text-slate-500'}`} />
        </div>

        <div className="space-y-1">
          <p className="text-slate-200 font-semibold text-base">
            {dragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-slate-500 text-sm">or click to browse</p>
        </div>

        {/* Accepted types */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['JPG', 'PNG', 'PDF', 'TXT'].map((t) => (
            <span
              key={t}
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700"
            >
              {t}
            </span>
          ))}
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700/50">
            Max 10 MB · Max 10 files
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={onChange}
          disabled={busy}
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          {validationError}
        </div>
      )}

      {/* Loading state */}
      {busy && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-sm">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
          Analyzing with Amazon Bedrock...
        </div>
      )}
    </div>
  );
}
