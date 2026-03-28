import * as SecureStore from 'expo-secure-store';

import { UserRole } from '@/src/types/auth';

const KEYS = {
  TOKEN: 'feelsync_token',
  ROLE: 'feelsync_role',
  DEVICE_TOKEN: 'feelsync_device_token',
} as const;

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.TOKEN, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.TOKEN);
}

export async function saveRole(role: UserRole): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ROLE, role);
}

export async function getRole(): Promise<UserRole | null> {
  const value = await SecureStore.getItemAsync(KEYS.ROLE);
  if (value === 'PATIENT' || value === 'GUARDIAN') return value;
  return null;
}

export async function getOrCreateDeviceToken(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEYS.DEVICE_TOKEN);
  if (existing) return existing;
  const token = generateUUID();
  await SecureStore.setItemAsync(KEYS.DEVICE_TOKEN, token);
  return token;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function clearAll(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.TOKEN);
  await SecureStore.deleteItemAsync(KEYS.ROLE);
}
