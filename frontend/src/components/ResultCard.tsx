import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Copy, Check, ArrowRight, Folder, Tag, Sparkles, Star } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult;
}

const CATEGORY_COLORS: Record<string, string> = {
  Bills: 'bg-amber-950/80 text-amber-300 border-amber-800/50',
  Receipts: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
  Personal: 'bg-sky-950/80 text-sky-300 border-sky-800/50',
  Photos: 'bg-purple-950/80 text-purple-300 border-purple-800/50',
  Development: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50',
  University: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800/50',
  Work: 'bg-blue-950/80 text-blue-300 border-blue-800/50',
  Finance: 'bg-teal-950/80 text-teal-300 border-teal-800/50',
  Medical: 'bg-rose-950/80 text-rose-300 border-rose-800/50',
  Certificates: 'bg-yellow-950/80 text-yellow-300 border-yellow-800/50',
  Travel: 'bg-orange-950/80 text-orange-300 border-orange-800/50',
  Miscellaneous: 'bg-slate-800 text-slate-300 border-slate-700',
};

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.suggested_name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryStyle =
    CATEGORY_COLORS[result.category] || 'bg-slate-800 text-slate-300 border-slate-700';

  const confidencePct = Math.round((result.confidence || 0.95) * 100);

  return (
    <div className="group p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl transition-all duration-300 animate-fade-in relative overflow-hidden">
      {/* Top subtle gradient highlight line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filename Transformation Section */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="truncate max-w-[200px] sm:max-w-[280px]" title={result.original_name}>
              {result.original_name}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-blue-400 font-semibold uppercase tracking-wider text-[10px]">Suggested</span>
          </div>

          <h4 className="text-lg md:text-xl font-bold text-white font-mono tracking-tight break-all flex items-center gap-2">
            <span className="text-emerald-400">✨</span>
            {result.suggested_name}
          </h4>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans pt-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 inline mr-1.5" />
            {result.reason}
          </p>
        </div>

        {/* Copy Button Action */}
        <div className="shrink-0 pt-2 md:pt-0">
          <button
            onClick={handleCopy}
            className={`w-full md:w-auto px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Filename</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Badges Footer Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${categoryStyle}`}>
            <Tag className="w-3.5 h-3.5" />
            {result.category}
          </span>

          {/* Folder Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-200 border border-slate-700/80 font-mono">
            <Folder className="w-3.5 h-3.5 text-blue-400" />
            {result.folder}
          </span>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          <span>{confidencePct}% AI Confidence</span>
        </div>
      </div>
    </div>
  );
};
