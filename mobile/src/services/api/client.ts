import axios from 'axios';

import { Config } from '@/src/constants/config';
import { useAuthStore } from '@/src/stores/auth-store';

export const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

if (__DEV__) {
  // Helps debug common 404s caused by wrong EXPO_PUBLIC_API_BASE_URL.
  console.log('[API] baseURL =', apiClient.defaults.baseURL);
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
