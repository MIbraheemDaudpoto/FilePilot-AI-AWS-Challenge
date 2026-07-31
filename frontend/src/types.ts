export interface AnalysisResult {
  original_name: string;
  suggested_name: string;
  category: string;
  folder: string;
  reason: string;
  confidence: number;
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
