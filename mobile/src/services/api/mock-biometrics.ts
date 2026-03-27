import { ChartPeriod, DailyHeartRate, NightlySleep } from '@/src/types/biometric';

// 30 days of pre-generated mock data (index 0 = oldest, index 29 = today)
const HR_DATA: Array<{ avg: number; min: number; max: number }> = [
  { avg: 72, min: 58, max: 89 },
  { avg: 74, min: 60, max: 92 },
  { avg: 71, min: 55, max: 88 },
  { avg: 69, min: 54, max: 85 },
  { avg: 103, min: 82, max: 128 }, // anomaly — manic cluster start
  { avg: 108, min: 85, max: 135 }, // anomaly
  { avg: 76, min: 61, max: 94 },
  { avg: 73, min: 57, max: 90 },
  { avg: 70, min: 53, max: 87 },
  { avg: 68, min: 52, max: 83 },
  { avg: 75, min: 59, max: 93 },
  { avg: 77, min: 62, max: 96 },
  { avg: 72, min: 56, max: 89 },
  { avg: 74, min: 58, max: 91 },
  { avg: 71, min: 55, max: 87 },
  { avg: 69, min: 53, max: 85 },
  { avg: 73, min: 57, max: 90 },
  { avg: 70, min: 54, max: 86 },
  { avg: 68, min: 51, max: 83 },
  { avg: 72, min: 56, max: 88 },
  { avg: 75, min: 60, max: 92 },
  { avg: 105, min: 87, max: 130 }, // anomaly
  { avg: 73, min: 57, max: 90 },
  { avg: 71, min: 55, max: 87 },
  { avg: 69, min: 53, max: 84 },
  { avg: 74, min: 59, max: 91 },
  { avg: 72, min: 56, max: 88 },
  { avg: 76, min: 61, max: 94 },
  { avg: 70, min: 54, max: 86 },
  { avg: 73, min: 57, max: 90 },
];

const SLEEP_DATA: number[] = [
  7.5, 6.8, 7.2, 8.0, 4.2, 3.8, 7.0, // anomaly nights align with HR anomaly cluster
  6.5, 7.8, 7.1, 6.9, 8.2, 7.4, 6.7,
  7.3, 8.1, 6.6, 7.0, 7.5, 6.8, 7.2,
  4.5, 7.8, 7.1, 6.9, 7.4, 8.0, 6.8, // one more anomaly night
  7.2, 7.6,
];

function toDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function getMockHeartRate(days: ChartPeriod): DailyHeartRate[] {
  const slice = HR_DATA.slice(30 - days);
  return slice.map((entry, i) => ({
    date: toDateString(days - 1 - i),
    avg: entry.avg,
    min: entry.min,
    max: entry.max,
    anomaly: entry.avg > 100 || entry.avg < 50,
  }));
}

export function getMockSleep(days: ChartPeriod): NightlySleep[] {
  const slice = SLEEP_DATA.slice(30 - days);
  return slice.map((hours, i) => ({
    date: toDateString(days - 1 - i),
    hours,
    anomaly: hours < 5 || hours > 10,
  }));
}
