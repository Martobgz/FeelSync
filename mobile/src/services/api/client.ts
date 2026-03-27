import axios from 'axios';

import { Config } from '@/src/constants/config';
import { useAuthStore } from '@/src/stores/auth-store';

export const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  console.log('[api-client] →', config.method?.toUpperCase(), config.url, token ? '(auth)' : '(no token)');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('[api-client] ←', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('[api-client] ← error', error.response?.status, error.response?.config?.url, error.message);
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
