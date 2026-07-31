import { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { LoadingItem } from './components/LoadingItem';
import { ResultCard } from './components/ResultCard';
import { FolderTreeSummary } from './components/FolderTreeSummary';
import { CategorySummary } from './components/CategorySummary';
import { ArchitectureModal } from './components/ArchitectureModal';
import { analyzeFilesApi } from './services/api';
import { AnalysisResult } from './types';
import { Plane, AlertTriangle, Layers, RotateCcw, Sparkles } from 'lucide-react';

export function App() {
  const [loadingFiles, setLoadingFiles] = useState<string[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [lastSelectedFiles, setLastSelectedFiles] = useState<File[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    setLastSelectedFiles(files);
    setErrorMsg(null);
    setLoadingFiles(files.map((f) => f.name));

    try {
      const newResults = await analyzeFilesApi(files);
      setResults((prev) => [...newResults, ...prev]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoadingFiles([]);
    }
  };

  const handleRetry = () => {
    if (lastSelectedFiles.length > 0) {
      handleFilesSelected(lastSelectedFiles);
    }
  };

  const handleClearAll = () => {
    setResults([]);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">FilePilot AI</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  AWS Challenge
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Turn messy downloads into organized files in seconds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>AWS Architecture</span>
            </button>

            {results.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-medium border border-slate-700/60 transition-colors"
              >
                Clear Results
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="text-center space-y-3 py-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/50 text-blue-400 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Powered by Amazon Bedrock Nova Models
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Stop searching through your Downloads folder
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Upload any <span className="text-slate-200 font-medium">Screenshot, PDF invoice, or TXT file</span>. Amazon Bedrock instantly suggests concise filenames, categories, and target folders.
          </p>
        </section>

        {/* Upload Drop Zone */}
        <section>
          <UploadZone
            onFilesSelected={handleFilesSelected}
            isProcessing={loadingFiles.length > 0}
          />
        </section>

        {/* Granular AWS Error Display */}
        {errorMsg && (
          <div className="p-4 md:p-5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm space-y-3 shadow-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-rose-100">Analysis Request Notice</h4>
                <p className="text-xs md:text-sm text-rose-300 leading-relaxed">{errorMsg}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between">
              <span className="text-xs text-rose-400">Ensure AWS credentials & Bedrock permissions are configured.</span>
              {lastSelectedFiles.length > 0 && (
                <button
                  onClick={handleRetry}
                  className="px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry Analysis
                </button>
              )}
            </div>
          </div>
        )}

        {/* Currently Loading Files */}
        {loadingFiles.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Processing Upload Batch ({loadingFiles.length})
            </h3>
            <div className="space-y-3">
              {loadingFiles.map((filename) => (
                <LoadingItem key={filename} filename={filename} />
              ))}
            </div>
          </section>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>AI Recommendations</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 font-mono text-xs border border-blue-800/40">
                  {results.length}
                </span>
              </h3>
              <span className="text-xs text-slate-400">Click Copy Filename to quickly rename locally</span>
            </div>

            <div className="space-y-4">
              {results.map((result, idx) => (
                <ResultCard key={`${result.original_name}-${idx}`} result={result} />
              ))}
            </div>
          </section>
        )}

        {/* Visual Folder Tree Summary */}
        {results.length > 0 && (
          <section>
            <FolderTreeSummary results={results} />
          </section>
        )}

        {/* Downloads Category Summary */}
        {results.length > 0 && (
          <section>
            <CategorySummary results={results} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 mt-12 bg-slate-950/80">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            FilePilot AI — Built for the <span className="text-amber-400 font-semibold">AWS Builder Weekend Challenge</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Amazon Bedrock</span>
            <span>•</span>
            <span>AWS Amplify</span>
            <span>•</span>
            <span>AWS Lambda</span>
          </div>
        </div>
      </footer>

      {/* AWS Architecture Diagram Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </div>
  );
}

export default App;
