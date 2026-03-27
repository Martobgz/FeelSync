import { apiClient } from './client';
import { Medication } from '@/src/types/medication';

// Stub — returns empty array until server endpoint exists
export async function getMedications(): Promise<Medication[]> {
  try {
    const { data } = await apiClient.get<{ data: Medication[] }>('/medications');
    return data.data ?? [];
  } catch {
    return [];
  }
}
