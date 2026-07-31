import { Plane, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">FilePilot AI</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                AWS Challenge
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-tight">
              Turn messy downloads into organized files.
            </p>
          </div>
        </div>

        {/* Powered-by badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Amazon Bedrock Nova Lite
        </div>
      </div>
    </header>
  );
}
