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
