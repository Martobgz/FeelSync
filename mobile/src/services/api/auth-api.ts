import { apiClient } from './client';
import { LoginPayload, RegisterPayload } from '@/src/types/auth';

interface AuthApiResponse {
  token: string;
  message: string;
}

export async function login(payload: LoginPayload): Promise<AuthApiResponse> {
  const { data } = await apiClient.post<{ data: AuthApiResponse }>('/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<AuthApiResponse> {
  // NOTE: Backend doesn't support role yet. The role is stored locally.
  // When backend adds role support, pass it here: { ...payload, role: payload.role }
  const { data } = await apiClient.post<{ data: AuthApiResponse }>('/auth/register', {
    username: payload.username,
    email: payload.email,
    password: payload.password,
  });
  return data.data;
}
