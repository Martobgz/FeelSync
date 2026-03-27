import { apiClient } from './client';
import { RegisterPayload, UserRole } from '@/src/types/auth';

interface AuthApiResponse {
  token: string;
  message: string;
  role: UserRole | null;
}

export async function register(payload: RegisterPayload): Promise<AuthApiResponse> {
  const { data } = await apiClient.post<{ data: AuthApiResponse }>('/auth/register', {
    username: payload.username,
    email: payload.email,
    password: payload.password,
    expoPushToken: payload.expoPushToken ?? null,
  });
  return data.data;
}

export async function updateRole(role: UserRole): Promise<AuthApiResponse> {
  const { data } = await apiClient.patch<{ data: AuthApiResponse }>('/users/me/role', { role });
  return data.data;
}

export async function linkPatient(patientEmail: string): Promise<void> {
  await apiClient.post('/guardian/link', { patientEmail });
}
