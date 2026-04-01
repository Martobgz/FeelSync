import { Movement } from '@/src/types/movement';
import { apiClient } from './client';

export type { Movement };

export interface MeasurementPayload {
  timestamp: string; // ISO8601 UTC
  pulse?: number;
  spo2?: number;
  movement?: Movement;
  gsrState?: number;
}

export interface TimestampedPulse {
  timestamp: string; // ISO8601 UTC
  pulse: number;
}

export interface GsrDistribution {
  normal: number;
  tense: number;
  stressed: number;
  calm: number;
  happy: number;
}

export async function postMeasurement(payload: MeasurementPayload): Promise<void> {
  await apiClient.post('/measurements', {
    timestamp: payload.timestamp,
    pulse: payload.pulse,
    spo2: payload.spo2,
    movement: payload.movement,
    gsrState: payload.gsrState,
  });
}

/** Guardian-only: timestamped pulse readings for the linked patient. */
export async function getPulse(days: number): Promise<TimestampedPulse[]> {
  const res = await apiClient.get('/measurements/pulse', { params: { days } });
  return res.data.data ?? [];
}

/** Guardian-only: per-night sleep data for the linked patient. */
export async function getSleep(days: number): Promise<{ date: string; hours: number; anomaly: boolean }[]> {
  const res = await apiClient.get('/measurements/sleep', { params: { days } });
  return res.data.data ?? [];
}

/** Guardian-only: GSR state distribution for the linked patient. */
export async function getGsr(days: number): Promise<GsrDistribution> {
  const res = await apiClient.get('/measurements/gsr', { params: { days } });
  return res.data.data ?? { normal: 0, tense: 0, stressed: 0, calm: 0, happy: 0 };
}
