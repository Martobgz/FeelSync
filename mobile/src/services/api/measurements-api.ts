import { apiClient } from './client';

export type Movement = 'STILL' | 'WALKING' | 'RUNNING';

export interface MeasurementPayload {
  timestamp: string; // ISO8601 UTC
  pulse?: number;
  // backend may name this either "spo2" or "spO2"; keep canonical "spo2" in app
  spo2?: number;
  movement?: Movement;
  // New ESP value: GSR-derived state (see components.ino GsrState)
  gsrState?: number;
}

export async function postMeasurement(payload: MeasurementPayload): Promise<void> {
  // If backend expects different key (e.g. spO2), adapt here.
  const adapted: Record<string, unknown> = {
    timestamp: payload.timestamp,
    pulse: payload.pulse,
    spo2: payload.spo2,
    movement: payload.movement,
    gsrState: payload.gsrState,
  };

  await apiClient.post('/measurements', adapted);
}

// Guardian-only: fetch linked patient's pulse readings for the last N days.
// Response shape: ApiResponse { data: { measurements: { measurements: Float[] } } }
export async function getPulse(days: number): Promise<number[]> {
  const res = await apiClient.get('/measurements/pulse', { params: { days } });
  return res.data.data.measurements.measurements ?? [];
}

// Guardian-only: fetch linked patient's SpO2 readings for the last N days.
export async function getSpo2(days: number): Promise<number[]> {
  const res = await apiClient.get('/measurements/spo2', { params: { days } });
  return res.data.data.measurements.measurements ?? [];
}
