import * as SecureStore from 'expo-secure-store';

import { UserRole } from '@/src/types/auth';

const KEYS = {
  TOKEN: 'feelsync_token',
  ROLE: 'feelsync_role',
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

export async function clearAll(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.TOKEN);
  await SecureStore.deleteItemAsync(KEYS.ROLE);
}
