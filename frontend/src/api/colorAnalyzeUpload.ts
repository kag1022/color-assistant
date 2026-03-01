import * as generatedClient from '@color-assistant/api-client';

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

function unwrapGeneratedResponse(value: unknown): unknown {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('data' in record) {
      return record.data;
    }
  }
  return value;
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
      return unwrapGeneratedResponse(result) as ColorAnalyzeResponse;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Generated upload failed.');
}

async function analyzeWithManualFetch(input: AnalyzeInput): Promise<ColorAnalyzeResponse> {
  const response = await fetch(`${input.baseUrl}/api/v1/color/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: buildFormData(input),
  });
  return parseApiResponse<ColorAnalyzeResponse>(response);
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
