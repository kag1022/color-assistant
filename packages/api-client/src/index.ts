export type AnalyzeInput = {
  file: File | Blob;
  facility_id?: string;
  worker_id?: string;
  session_id?: string;
};

export type AnalyzeResponse = {
  analysis_id: string;
  dominant_hex: string;
  dominant_rgb: { r: number; g: number; b: number };
  color_name_ja: string;
  confidence: number;
  alternatives: Array<{ color_name_ja: string; hex: string; confidence: number }>;
  speech_text_ja: string;
  processing_ms: number;
};

export * from './generated';