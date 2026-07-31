import React from 'react';
import { Loader2, FileCode } from 'lucide-react';

interface LoadingItemProps {
  filename: string;
}

export const LoadingItem: React.FC<LoadingItemProps> = ({ filename }) => {
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 flex items-center justify-between shadow-md animate-pulse-subtle">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-950 flex items-center justify-center border border-blue-800/40">
          <FileCode className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="font-mono text-sm font-medium text-slate-200">
            📄 {filename}
          </div>
          <div className="text-xs text-blue-400 flex items-center gap-1.5 mt-0.5 font-sans">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing content with Amazon Bedrock...</span>
          </div>
        </div>
      </div>
      <div className="px-3 py-1 rounded-full bg-blue-950 text-blue-300 text-xs font-mono font-medium border border-blue-800/40">
        AI Processing
      </div>
    </div>
  );
};
