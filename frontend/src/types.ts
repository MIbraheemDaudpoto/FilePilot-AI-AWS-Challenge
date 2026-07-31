// Core result from Lambda / Bedrock
export interface AnalysisResult {
  original_name: string;
  suggested_name: string;
  category: string;
  folder: string;
  reason: string;
  error?: string;
}

// Per-file upload state tracked in App
export interface ProcessingFile {
  id: string;
  filename: string;
  size: number;
  status: 'uploading' | 'analyzing' | 'done' | 'error';
  error?: string;
  result?: AnalysisResult;
}
