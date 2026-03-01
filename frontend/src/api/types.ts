export type ApiError = {
  code: string;
  message: string;
  hint?: string;
  details?: Record<string, unknown>;
  request_id?: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
};

export type ColorAnalyzeResponse = {
  analysis_id: string;
  dominant_hex: string;
  dominant_rgb: { r: number; g: number; b: number };
  color_name_ja: string;
  confidence: number;
  alternatives: { color_name_ja: string; hex: string; confidence: number }[];
  speech_text_ja: string;
  processing_ms: number;
};
