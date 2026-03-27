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
export interface DailyHeartRate {
  date: string;      // "YYYY-MM-DD"
  avg: number;       // average BPM for the day
  min: number;       // minimum BPM
  max: number;       // maximum BPM
  anomaly: boolean;  // avg > 100 or avg < 50
}

export interface NightlySleep {
  date: string;      // "YYYY-MM-DD" (night starting on this date)
  hours: number;     // hours of sleep
  anomaly: boolean;  // hours < 5 or hours > 10
}

export type ChartPeriod = 7 | 30;
