import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { getPulse, getSleep, getGsr, TimestampedPulse, GsrDistribution } from '@/src/services/api/measurements-api';
import { NightlySleep, ChartPeriod } from '@/src/types/biometric';

const cacheKey = (type: 'pulse' | 'sleep' | 'gsr', period: ChartPeriod) =>
  `feelsync_measurements_${type}_${period}`;

const EMPTY_GSR: GsrDistribution = { normal: 0, tense: 0, stressed: 0, calm: 0, happy: 0 };

export function usePatientMeasurements() {
  const [period, setPeriodState] = useState<ChartPeriod>(7);
  const [pulseData, setPulseData] = useState<TimestampedPulse[]>([]);
  const [sleepData, setSleepData] = useState<NightlySleep[]>([]);
  const [gsrData, setGsrData] = useState<GsrDistribution>(EMPTY_GSR);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: ChartPeriod) => {
    setLoading(true);
    setError(null);

    // Serve cached data first so charts render immediately
    try {
      const [cachedPulse, cachedSleep, cachedGsr] = await Promise.all([
        AsyncStorage.getItem(cacheKey('pulse', p)),
        AsyncStorage.getItem(cacheKey('sleep', p)),
        AsyncStorage.getItem(cacheKey('gsr', p)),
      ]);
      if (cachedPulse) setPulseData(JSON.parse(cachedPulse));
      if (cachedSleep) setSleepData(JSON.parse(cachedSleep));
      if (cachedGsr) setGsrData(JSON.parse(cachedGsr));
    } catch {
      // cache miss — no problem
    }

    try {
      const [pulse, sleep, gsr] = await Promise.all([getPulse(p), getSleep(p), getGsr(p)]);
      setPulseData(pulse);
      setSleepData(sleep);
      setGsrData(gsr);
      await Promise.all([
        AsyncStorage.setItem(cacheKey('pulse', p), JSON.stringify(pulse)),
        AsyncStorage.setItem(cacheKey('sleep', p), JSON.stringify(sleep)),
        AsyncStorage.setItem(cacheKey('gsr', p), JSON.stringify(gsr)),
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

  return { pulseData, sleepData, gsrData, period, loading, error, setPeriod, refresh };
}
