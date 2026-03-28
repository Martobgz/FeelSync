import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { getPulse, getSpo2 } from '@/src/services/api/measurements-api';
import { ChartPeriod } from '@/src/types/biometric';

const cacheKey = (type: 'pulse' | 'spo2', period: ChartPeriod) =>
  `feelsync_measurements_${type}_${period}`;

export function usePatientMeasurements() {
  const [period, setPeriodState] = useState<ChartPeriod>(7);
  const [pulseData, setPulseData] = useState<number[]>([]);
  const [spo2Data, setSpo2Data] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: ChartPeriod) => {
    setLoading(true);
    setError(null);

    // Serve from cache first so charts render immediately
    try {
      const [cachedPulse, cachedSpo2] = await Promise.all([
        AsyncStorage.getItem(cacheKey('pulse', p)),
        AsyncStorage.getItem(cacheKey('spo2', p)),
      ]);
      if (cachedPulse) setPulseData(JSON.parse(cachedPulse));
      if (cachedSpo2) setSpo2Data(JSON.parse(cachedSpo2));
    } catch {
      // Cache miss — no problem
    }

    try {
      const [pulse, spo2] = await Promise.all([getPulse(p), getSpo2(p)]);
      setPulseData(pulse);
      setSpo2Data(spo2);
      await Promise.all([
        AsyncStorage.setItem(cacheKey('pulse', p), JSON.stringify(pulse)),
        AsyncStorage.setItem(cacheKey('spo2', p), JSON.stringify(spo2)),
      ]);
    } catch {
      setError('Could not load patient data. Showing cached data.');
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

  return { pulseData, spo2Data, period, loading, error, setPeriod, refresh };
}
