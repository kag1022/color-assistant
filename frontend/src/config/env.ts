export type UploadMode = 'generated' | 'manual';

export const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8000';

export const DEFAULT_UPLOAD_MODE: UploadMode =
  process.env.EXPO_PUBLIC_UPLOAD_MODE === 'manual' ? 'manual' : 'generated';

