import { AnalysisResult } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export async function analyzeFilesApi(files: File[]): Promise<AnalysisResult[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const endpoint = `${API_BASE_URL}/api/v1/analyze`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.detail ||
        errorData.error ||
        `Server returned status ${response.status}: Analysis failed`;
      throw new Error(errorMessage);
    }

    const data: AnalysisResult[] = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      throw new Error(
        'Unable to connect to FilePilot AI backend service. Please check your network connection.'
      );
    }
    throw error;
  }
}
