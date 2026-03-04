import * as generatedClient from '@color-assistant/api-client';
import { z } from 'zod';

import { parseApiResponse } from '@/src/api/http';
import { ColorAnalyzeResponse } from '@/src/api/types';
import { UploadMode } from '@/src/config/env';

export type UploadFileInput = {
  uri: string;
  name: string;
  type: string;
};

type AnalyzeInput = {
  baseUrl: string;
  token: string;
  uploadMode: UploadMode;
  file: UploadFileInput;
  facility_id?: string;
  worker_id?: string;
  session_id?: string;
};

const GENERATED_ANALYZE_CANDIDATES = [
  'analyzeColorApiV1ColorAnalyzePost',
  'postApiV1ColorAnalyze',
  'colorAnalyze',
  'analyzeColor',
] as const;

const colorAlternativeSchema = z.object({
  color_name_ja: z.string(),
  hex: z.string(),
  confidence: z.number(),
});

const colorAnalyzeResponseSchema = z.object({
  analysis_id: z.string(),
  dominant_hex: z.string(),
  dominant_rgb: z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
  }),
  color_name_ja: z.string(),
  confidence: z.number(),
  alternatives: z.array(colorAlternativeSchema),
  speech_text_ja: z.string(),
  processing_ms: z.number(),
});

function buildFormData(input: AnalyzeInput): FormData {
  const formData = new FormData();
  formData.append('file', {
    uri: input.file.uri,
    name: input.file.name,
    type: input.file.type,
  } as any);

  if (input.facility_id) {
    formData.append('facility_id', input.facility_id);
  }
  if (input.worker_id) {
    formData.append('worker_id', input.worker_id);
  }
  if (input.session_id) {
    formData.append('session_id', input.session_id);
  }
  return formData;
}

function pickGeneratedAnalyze(): ((payload: unknown) => Promise<unknown>) | null {
  const exportsMap = generatedClient as Record<string, unknown>;
  for (const candidate of GENERATED_ANALYZE_CANDIDATES) {
    const maybeFn = exportsMap[candidate];
    if (typeof maybeFn === 'function') {
      return maybeFn as (payload: unknown) => Promise<unknown>;
    }
  }
  return null;
}

function parseGeneratedError(errorPayload: unknown): string {
  if (errorPayload && typeof errorPayload === 'object') {
    const record = errorPayload as Record<string, unknown>;
    const message = record.message;
    const hint = record.hint;
    if (typeof message === 'string' && typeof hint === 'string' && hint.length > 0) {
      return `${message} (${hint})`;
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Analyze request failed.';
}

function normalizeAnalyzeResponse(value: unknown): ColorAnalyzeResponse {
  if (!value || typeof value !== 'object') {
    throw new Error('Analyze response is empty.');
  }

  const record = value as Record<string, unknown>;
  const normalized = {
    analysis_id: record.analysis_id ?? record.analysisId,
    dominant_hex: record.dominant_hex ?? record.dominantHex,
    dominant_rgb: record.dominant_rgb ?? record.dominantRgb,
    color_name_ja: record.color_name_ja ?? record.colorNameJa,
    confidence: record.confidence,
    alternatives: record.alternatives,
    speech_text_ja: record.speech_text_ja ?? record.speechTextJa,
    processing_ms: record.processing_ms ?? record.processingMs,
  };

  return colorAnalyzeResponseSchema.parse(normalized);
}

function unwrapGeneratedResponse(value: unknown): ColorAnalyzeResponse {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('error' in record && record.error) {
      throw new Error(parseGeneratedError(record.error));
    }
    if ('data' in record) {
      return normalizeAnalyzeResponse(record.data);
    }
  }
  return normalizeAnalyzeResponse(value);
}

async function analyzeWithGeneratedClient(input: AnalyzeInput): Promise<ColorAnalyzeResponse> {
  const analyze = pickGeneratedAnalyze();
  if (!analyze) {
    throw new Error('Generated analyze operation not found.');
  }

  const formData = buildFormData(input);
  const authorization = { Authorization: `Bearer ${input.token}` };
  const attempts: (() => Promise<unknown>)[] = [
    () => analyze({ baseUrl: input.baseUrl, body: formData, headers: authorization }),
    () => analyze({ baseUrl: input.baseUrl, formData, headers: authorization }),
    () => analyze({ baseUrl: input.baseUrl, data: formData, headers: authorization }),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const result = await attempt();
      return unwrapGeneratedResponse(result);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof TypeError && lastError.message.includes('Network request failed')) {
    throw new Error('通信に失敗しました。電波環境を確認してもう一度お試しください。');
  }

  throw lastError instanceof Error ? lastError : new Error('Generated upload failed.');
}

async function analyzeWithManualFetch(input: AnalyzeInput): Promise<ColorAnalyzeResponse> {
  try {
    const response = await fetch(`${input.baseUrl}/api/v1/color/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
      body: buildFormData(input),
    });
    return parseApiResponse<ColorAnalyzeResponse>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('通信に失敗しました。電波環境を確認してもう一度お試しください。');
    }
    throw error;
  }
}

export async function analyzeColorUpload(input: AnalyzeInput): Promise<ColorAnalyzeResponse> {
  if (input.uploadMode === 'manual') {
    return analyzeWithManualFetch(input);
  }

  try {
    return await analyzeWithGeneratedClient(input);
  } catch {
    return analyzeWithManualFetch(input);
  }
}
