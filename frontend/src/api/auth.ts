import { parseApiResponse } from '@/src/api/http';
import { TokenResponse } from '@/src/api/types';

type LoginInput = {
  baseUrl: string;
  email: string;
  password: string;
};

export async function login(input: LoginInput): Promise<TokenResponse> {
  const response = await fetch(`${input.baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });
  return parseApiResponse<TokenResponse>(response);
}

