import { apiClient } from './client';
import { ChartPeriod, DailyHeartRate, NightlySleep } from '@/src/types/biometric';

interface SummaryResponse {
  heartRate: { date: string; avg: number; min: number; max: number }[];
  sleep: { date: string; hours: number; anomaly: boolean }[];
}

async function fetchSummary(days: number): Promise<SummaryResponse> {
  const { data } = await apiClient.get<{ data: SummaryResponse }>('/biometrics/summary', {
    params: { days },
  });
  return data.data;
}

export async function getHeartRateData(period: ChartPeriod): Promise<DailyHeartRate[]> {
  const summary = await fetchSummary(period);
  return summary.heartRate.map((d) => ({
    date: d.date,
    avg: d.avg,
    min: d.min,
    max: d.max,
    anomaly: d.avg > 100 || d.avg < 50,
  }));
}

export async function getSleepData(period: ChartPeriod): Promise<NightlySleep[]> {
  const summary = await fetchSummary(period);
  return summary.sleep.map((d) => ({
    date: d.date,
    hours: d.hours,
    anomaly: d.anomaly,
  }));
}
