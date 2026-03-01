import { ApiError } from '@/src/api/types';

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
      const apiError = data as ApiError;
      throw new Error(apiError.hint ? `${apiError.message} (${apiError.hint})` : apiError.message);
    }
    throw new Error(`HTTP ${response.status}`);
  }
  return data as T;
}

