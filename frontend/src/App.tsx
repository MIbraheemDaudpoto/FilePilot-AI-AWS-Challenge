import { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ResultCard } from './components/ResultCard';
import { FolderTree } from './components/FolderTree';
import { analyzeFilesApi } from './services/api';
import { AnalysisResult } from './types';
import { AlertTriangle, RotateCcw, Trash2, Sparkles } from 'lucide-react';

export default function App() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFiles, setLastFiles] = useState<File[]>([]);

  async function handleFilesSelected(files: File[]) {
    setLastFiles(files);
    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      const newResults = await analyzeFilesApi(files);
      setResults((prev) => [...newResults, ...prev]);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleRetry() {
    if (lastFiles.length > 0) handleFilesSelected(lastFiles);
  }

  function handleClear() {
    setResults([]);
    setErrorMsg(null);
  }

  const successCount = results.filter((r) => !r.error).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">

        {/* Hero */}
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/40 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Powered by Amazon Bedrock · Nova Lite
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Stop searching through your<br className="hidden sm:block" /> Downloads folder
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Upload any <span className="text-slate-200 font-medium">screenshot, PDF, or text file</span> and
            get an instant AI-powered rename suggestion, category, and folder path.
          </p>
        </section>

        {/* Upload */}
        <section>
          <UploadZone onFilesSelected={handleFilesSelected} isProcessing={isAnalyzing} />
        </section>

        {/* Error banner */}
        {errorMsg && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-sm animate-pulse-once">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-rose-100">Analysis failed</p>
              <p className="text-rose-300 text-xs leading-relaxed">{errorMsg}</p>
            </div>
            {lastFiles.length > 0 && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800/60 text-rose-200 text-xs font-semibold transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Results header */}
        {results.length > 0 && (
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              AI Recommendations
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 font-mono text-xs border border-indigo-800/40">
                {results.length}
              </span>
            </h3>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-medium border border-slate-700/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
        )}

        {/* Result cards */}
        {results.length > 0 && (
          <section className="space-y-4">
            {results.map((result, idx) => (
              <ResultCard key={`${result.original_name}-${idx}`} result={result} />
            ))}
          </section>
        )}

        {/* Folder tree */}
        {successCount > 0 && (
          <section>
            <FolderTree results={results} />
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 bg-slate-950/80">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>FilePilot AI — Built for the <span className="text-amber-400 font-semibold">AWS Builder Weekend Challenge</span></span>
          <div className="flex items-center gap-3">
            <span>Amazon Bedrock</span>
            <span>·</span>
            <span>AWS Lambda</span>
            <span>·</span>
            <span>AWS Amplify</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
