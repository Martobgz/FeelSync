import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { getHeartRateData, getSleepData } from '@/src/services/api/biometrics-chart-api';
import { ChartPeriod, DailyHeartRate, NightlySleep } from '@/src/types/biometric';

const cacheKey = (type: 'hr' | 'sleep', period: ChartPeriod) =>
  `feelsync_charts_${type}_${period}`;

export function useBiometricsChart() {
  const [period, setPeriodState] = useState<ChartPeriod>(7);
  const [hrData, setHrData] = useState<DailyHeartRate[]>([]);
  const [sleepData, setSleepData] = useState<NightlySleep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: ChartPeriod) => {
    setLoading(true);
    setError(null);

    // Serve from cache first so charts render immediately
    try {
      const [cachedHr, cachedSleep] = await Promise.all([
        AsyncStorage.getItem(cacheKey('hr', p)),
        AsyncStorage.getItem(cacheKey('sleep', p)),
      ]);
      if (cachedHr) setHrData(JSON.parse(cachedHr));
      if (cachedSleep) setSleepData(JSON.parse(cachedSleep));
    } catch {
      // Cache miss — no problem, fetch below
    }

    // Fetch fresh data
    try {
      const [hr, sleep] = await Promise.all([getHeartRateData(p), getSleepData(p)]);
      setHrData(hr);
      setSleepData(sleep);
      await Promise.all([
        AsyncStorage.setItem(cacheKey('hr', p), JSON.stringify(hr)),
        AsyncStorage.setItem(cacheKey('sleep', p), JSON.stringify(sleep)),
      ]);
    } catch (e) {
      setError('Could not load data. Showing cached data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [load, period]);

  function setPeriod(p: ChartPeriod) {
    setPeriodState(p);
  }

  function refresh() {
    load(period);
  }

  return { hrData, sleepData, period, loading, error, setPeriod, refresh };
}
