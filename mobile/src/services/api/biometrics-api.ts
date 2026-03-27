import { apiClient } from './client';
import { AggregatedBlock } from '@/src/types/biometric';

interface BiometricsBatchItem {
  timestamp: string; // ISO8601 UTC
  avg_hr: number;
  min_hr: number;
  max_hr: number;
  hr_sample_count: number;
  avg_movement: number;
}

export async function postBiometricsBatch(blocks: AggregatedBlock[]): Promise<void> {
  const payload: BiometricsBatchItem[] = blocks.map((b) => ({
    timestamp: new Date(b.timestamp).toISOString(),
    avg_hr: b.avgHr,
    min_hr: b.minHr,
    max_hr: b.maxHr,
    hr_sample_count: b.hrSampleCount,
    avg_movement: b.avgMovement,
  }));

  await apiClient.post('/biometrics/batch', payload);
}
