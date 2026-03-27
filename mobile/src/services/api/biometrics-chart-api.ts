import { ChartPeriod, DailyHeartRate, NightlySleep } from '@/src/types/biometric';
import { getMockHeartRate, getMockSleep } from './mock-biometrics';

// Stub: returns mock data.
// Replace with real Axios calls once backend adds GET /api/biometrics/summary?days=N
export async function getHeartRateData(period: ChartPeriod): Promise<DailyHeartRate[]> {
  return getMockHeartRate(period);
}

export async function getSleepData(period: ChartPeriod): Promise<NightlySleep[]> {
  return getMockSleep(period);
}
