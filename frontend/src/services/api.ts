import { AnalysisResult } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export async function analyzeFilesApi(files: File[]): Promise<AnalysisResult[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file, file.name));

  const endpoint = `${API_BASE_URL}/analyze`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.error ||
      errorData.detail ||
      `Server error ${response.status}`;
    throw new Error(message);
  }

  // Lambda returns { results: [...] }
  const data = await response.json();
  const results: AnalysisResult[] = Array.isArray(data)
    ? data
    : data.results ?? [];

  return results;
}
