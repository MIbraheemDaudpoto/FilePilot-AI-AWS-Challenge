export interface AnalysisResult {
  original_name: string;
  suggested_name: string;
  filename?: string;
  category: string;
  folder: string;
  suggested_folder?: string;
  reason: string;
  summary?: string;
  tags?: string[];
  confidence: number;
  provider_used?: 'bedrock' | 'fallback' | string;
}

export interface ProcessingFileState {
  id: string;
  filename: string;
  size: number;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  error?: string;
  result?: AnalysisResult;
}

export interface CategorySummaryItem {
  category: string;
  count: number;
}
