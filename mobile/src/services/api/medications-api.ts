import { apiClient } from './client';
import { Medication } from '@/src/types/medication';

interface MedicationRequest {
  name: string;
  currentAmount: number;
  dailyDose: number;
  intakeTimes: string[];
  wristbandNotifications: boolean;
}

function mapResponse(raw: any): Medication {
  return {
    id: String(raw.id),
    name: raw.name,
    currentAmount: raw.currentAmount,
    dailyDose: raw.dailyDose,
    addedDate: raw.addedDate ?? undefined,
    intakeTimes: raw.intakeTimes ?? [],
    wristbandNotifications: raw.wristbandNotifications ?? false,
  };
}

export async function getMedications(): Promise<Medication[]> {
  try {
    const { data } = await apiClient.get<{ data: any[] }>('/medications');
    return (data.data ?? []).map(mapResponse);
  } catch {
    return [];
  }
}

export async function createMedication(req: MedicationRequest): Promise<Medication> {
  const { data } = await apiClient.post<{ data: any }>('/medications', req);
  return mapResponse(data.data);
}

export async function updateMedication(id: string, req: MedicationRequest): Promise<Medication> {
  const { data } = await apiClient.put<{ data: any }>(`/medications/${id}`, req);
  return mapResponse(data.data);
}

export async function deleteMedication(id: string): Promise<void> {
  await apiClient.delete(`/medications/${id}`);
}
