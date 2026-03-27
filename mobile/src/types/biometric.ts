export interface RawReading {
  timestamp: number;
  heartRate: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
}

export interface AggregatedBlock {
  id?: number;
  timestamp: number;
  avgHr: number;
  minHr: number;
  maxHr: number;
  hrSampleCount: number;
  avgMovement: number;
  synced: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';
