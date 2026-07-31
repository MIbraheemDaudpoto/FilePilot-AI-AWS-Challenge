import React from 'react';
import { X, Cpu, Cloud, Server, ShieldCheck } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              AWS
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">AWS System Architecture</h3>
              <p className="text-xs text-slate-400">FilePilot AI — AWS Builder Challenge Stack</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagram Flow */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 overflow-x-auto">
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-blue-400 font-bold">User</span>
            <span className="text-slate-500">→ Uploads files (.jpg, .pdf, .txt)</span>
          </div>
          <div className="text-center text-slate-600">│</div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-400" />
              <span className="font-bold">AWS Amplify</span>
            </div>
            <span className="text-[11px] text-blue-400 font-sans">React + Vite + Tailwind CSS Frontend</span>
          </div>
          <div className="text-center text-slate-600">│</div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-300">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <span className="font-bold">Amazon API Gateway</span>
            </div>
            <span className="text-[11px] text-purple-400 font-sans">POST /api/v1/analyze</span>
          </div>
          <div className="text-center text-slate-600">│</div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="font-bold">AWS Lambda</span>
            </div>
            <span className="text-[11px] text-indigo-400 font-sans">FastAPI + Mangum (Python 3.12)</span>
          </div>
          <div className="text-center text-slate-600">│</div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="font-bold">Amazon Bedrock</span>
            </div>
            <span className="text-[11px] text-amber-400 font-sans">Amazon Nova Lite (Multimodal & Text)</span>
          </div>
          <div className="text-center text-slate-600">│</div>

          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-center font-bold">
            Structured JSON Output (Filename, Category, Folder, Reason, Confidence)
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
