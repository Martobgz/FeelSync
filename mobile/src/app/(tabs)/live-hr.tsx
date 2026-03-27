import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LiveHrChart } from '@/src/components/charts/live-hr-chart';
import { useBiometricsStore } from '@/src/stores/biometrics-store';
import { useBleStore } from '@/src/stores/ble-store';

const MAX_READINGS = 60;

export default function LiveHrScreen() {
  const { connectionStatus, lastHeartRate } = useBleStore();
  const latestBlock = useBiometricsStore((s) => s.latestBlock);

  const [readings, setReadings] = useState<{ x: number; bpm: number }[]>([]);
  const readingCounter = useRef(0);

  // Append each new BPM to the rolling buffer
  useEffect(() => {
    if (lastHeartRate == null || lastHeartRate === 0) return;
    setReadings((prev) => {
      const next = [...prev, { x: readingCounter.current++, bpm: lastHeartRate }];
      return next.length > MAX_READINGS ? next.slice(next.length - MAX_READINGS) : next;
    });
  }, [lastHeartRate]);

  const isConnected = connectionStatus === 'connected';

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-6">

        {/* Header */}
        <Text className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Live HR</Text>

        {/* Big BPM display */}
        <View className="mb-4 items-center rounded-2xl bg-white py-6 shadow-sm dark:bg-gray-800">
          <Text className="text-6xl font-bold text-brand-primary">
            {lastHeartRate ?? '—'}
          </Text>
          <Text className="mt-1 text-sm text-gray-400">BPM</Text>
        </View>

        {/* Live chart */}
        <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <Text className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            Live Stream
          </Text>
          <Text className="mb-3 text-xs text-gray-400">last {MAX_READINGS} readings from device</Text>
          {readings.length >= 2 ? (
            <LiveHrChart readings={readings} />
          ) : (
            <View className="h-40 items-center justify-center">
              <Text className="text-sm text-gray-400">
                {isConnected ? 'Waiting for data…' : 'Connect to see chart'}
              </Text>
            </View>
          )}
        </View>

        {/* Latest aggregated block */}
        {latestBlock && (
          <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <Text className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
              Latest 5-min Block
            </Text>
            <View className="flex-row justify-around">
              <Stat label="Avg" value={Math.round(latestBlock.avgHr)} />
              <Stat label="Min" value={Math.round(latestBlock.minHr)} />
              <Stat label="Max" value={Math.round(latestBlock.maxHr)} />
              <Stat label="Samples" value={latestBlock.hrSampleCount} />
            </View>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-xl font-bold text-brand-primary">{value}</Text>
      <Text className="text-xs text-gray-400">{label}</Text>
    </View>
  );
}
