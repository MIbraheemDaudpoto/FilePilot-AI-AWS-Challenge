import React from 'react';
import { AnalysisResult } from '../types';
import { FolderCheck } from 'lucide-react';

interface CategorySummaryProps {
  results: AnalysisResult[];
}

export const CategorySummary: React.FC<CategorySummaryProps> = ({ results }) => {
  if (results.length === 0) return null;

  // Calculate category counts
  const categoryCounts: Record<string, number> = {};
  results.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  const categories = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }));

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-xl space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
        <FolderCheck className="w-4 h-4 text-emerald-400" />
        <span>Downloads Summary</span>
        <span className="text-xs text-slate-500 font-normal">({results.length} total organized)</span>
      </div>

      <div className="flex flex-wrap gap-2.5 pt-1">
        {categories.map(({ category, count }) => (
          <div
            key={category}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 shadow-sm hover:border-slate-700 transition-colors"
          >
            <span className="text-amber-400">📂</span>
            <span>{category}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-950 text-blue-400 font-mono font-bold text-[11px] border border-blue-800/40">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
