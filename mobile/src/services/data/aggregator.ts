import { AggregatedBlock, RawReading } from '@/src/types/biometric';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function aggregateReadings(readings: RawReading[], windowStart: number): AggregatedBlock {
  const heartRates = readings
    .filter((r) => r.heartRate > 0)
    .map((r) => r.heartRate);

  const movements = readings
    .filter((r) => r.accelX != null && r.accelY != null && r.accelZ != null)
    .map((r) => Math.sqrt(r.accelX! ** 2 + r.accelY! ** 2 + r.accelZ! ** 2));

  return {
    timestamp: windowStart,
    avgHr: heartRates.length > 0 ? mean(heartRates) : 0,
    minHr: heartRates.length > 0 ? Math.min(...heartRates) : 0,
    maxHr: heartRates.length > 0 ? Math.max(...heartRates) : 0,
    hrSampleCount: heartRates.length,
    avgMovement: movements.length > 0 ? mean(movements) : 0,
    synced: false,
  };
}
