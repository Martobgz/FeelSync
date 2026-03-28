import { apiClient } from './client';
import { RegisterPayload } from '@/src/types/auth';

interface AuthApiResponse {
  token: string;
  message: string;
}

export async function register(payload: RegisterPayload): Promise<AuthApiResponse> {
  const { data } = await apiClient.post<{ data: AuthApiResponse }>('/auth/register', {
    username: payload.username,
    email: payload.email,
    password: payload.password,
    userType: payload.role,
    deviceToken: payload.deviceToken,
    patientUsername: payload.patientUsername,
  });
  return data.data;
}
