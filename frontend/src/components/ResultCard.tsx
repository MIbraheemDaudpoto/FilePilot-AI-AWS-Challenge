import { useState } from 'react';
import { Check, Copy, AlertCircle, ArrowRight, FolderOpen, Tag } from 'lucide-react';
import { AnalysisResult } from '../types';

interface Props {
  result: AnalysisResult;
}

const CATEGORY_COLORS: Record<string, string> = {
  Bills:         'bg-orange-950/60 text-orange-300 border-orange-800/50',
  Receipts:      'bg-amber-950/60  text-amber-300  border-amber-800/50',
  Finance:       'bg-yellow-950/60 text-yellow-300 border-yellow-800/50',
  Personal:      'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  Photos:        'bg-sky-950/60    text-sky-300    border-sky-800/50',
  Development:   'bg-violet-950/60 text-violet-300 border-violet-800/50',
  University:    'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
  Work:          'bg-blue-950/60   text-blue-300   border-blue-800/50',
  Medical:       'bg-red-950/60    text-red-300    border-red-800/50',
  Travel:        'bg-teal-950/60   text-teal-300   border-teal-800/50',
  Miscellaneous: 'bg-slate-800/60  text-slate-300  border-slate-700/50',
};

function categoryClass(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Miscellaneous'];
}

export function ResultCard({ result }: Props) {
  const [copied, setCopied] = useState(false);

  if (result.error) {
    return (
      <div className="rounded-2xl bg-rose-950/40 border border-rose-800/50 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-rose-200">{result.original_name}</p>
          <p className="text-xs text-rose-400 mt-0.5">{result.error}</p>
        </div>
      </div>
    );
  }

  function copyFilename() {
    navigator.clipboard.writeText(result.suggested_name).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-lg shadow-black/20 hover:border-slate-700/80 transition-colors">
      {/* Top bar — filename transformation */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-800/60">
        {/* Original */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Original</p>
          <p className="text-sm text-slate-400 truncate font-mono">{result.original_name}</p>
        </div>

        <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0 self-center hidden sm:block" />

        {/* Suggested */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-0.5">Suggested</p>
          <p className="text-sm text-white font-semibold truncate font-mono">{result.suggested_name}</p>
        </div>

        {/* Copy button */}
        <button
          onClick={copyFilename}
          className={[
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0',
            copied
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
              : 'bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-300 border border-indigo-700/50',
          ].join(' ')}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Filename'}
        </button>
      </div>

      {/* Bottom row — category + folder + reason */}
      <div className="px-5 py-3.5 flex flex-wrap items-start gap-3">
        {/* Category badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryClass(result.category)}`}>
          <Tag className="w-3 h-3" />
          {result.category}
        </span>

        {/* Folder badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/70 text-slate-300 border border-slate-700/50">
          <FolderOpen className="w-3 h-3 text-amber-400" />
          {result.folder}
        </span>

        {/* Reason */}
        {result.reason && (
          <p className="w-full text-xs text-slate-400 leading-relaxed mt-0.5">
            {result.reason}
          </p>
        )}
      </div>
    </div>
  );
}
