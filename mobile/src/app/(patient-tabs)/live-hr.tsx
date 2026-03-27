import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LiveHrChart } from '@/src/components/charts/live-hr-chart';
import { useBleConnection } from '@/src/hooks/use-ble-connection';
import { ScannedDevice } from '@/src/services/ble/ble-types';
import { useBiometricsStore } from '@/src/stores/biometrics-store';
import { useBleStore } from '@/src/stores/ble-store';

const MAX_READINGS = 60;

const STATUS_COLOR: Record<string, string> = {
  connected: '#1D9E75',
  connecting: '#F59E0B',
  scanning: '#F59E0B',
  disconnected: '#EF4444',
};

export default function LiveHrScreen() {
  const { startScan, connect, disconnect } = useBleConnection();
  const { connectionStatus, lastHeartRate, deviceName, isScanning } = useBleStore();
  const latestBlock = useBiometricsStore((s) => s.latestBlock);

  const [readings, setReadings] = useState<{ x: number; bpm: number }[]>([]);
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const readingCounter = useRef(0);

  // Append each new BPM to the rolling buffer
  useEffect(() => {
    if (lastHeartRate == null || lastHeartRate === 0) return;
    setReadings((prev) => {
      const next = [...prev, { x: readingCounter.current++, bpm: lastHeartRate }];
      return next.length > MAX_READINGS ? next.slice(next.length - MAX_READINGS) : next;
    });
  }, [lastHeartRate]);

  function handleScan() {
    setDevices([]);
    setShowPicker(true);
    startScan((device) => {
      if (!device.name?.toLowerCase().includes('feel')) return; // filter noise
      setDevices((prev) =>
        prev.some((d) => d.id === device.id) ? prev : [...prev, device]
      );
    });
  }

  async function handleConnect(device: ScannedDevice) {
    setShowPicker(false);
    await connect(device.id, device.name);
  }

  const dotColor = STATUS_COLOR[connectionStatus] ?? '#6B7280';
  const isConnected = connectionStatus === 'connected';
  const isIdle = connectionStatus === 'disconnected';

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-6">

        {/* Header */}
        <Text className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Live HR</Text>

        {/* Connection card */}
        <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: dotColor }} />
              <Text className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                {connectionStatus}
              </Text>
              {deviceName ? (
                <Text className="text-sm text-gray-400"> · {deviceName}</Text>
              ) : null}
            </View>
            {isScanning && <ActivityIndicator size="small" color="#1D9E75" />}
          </View>

          {isIdle ? (
            <TouchableOpacity
              className="rounded-xl bg-brand-primary px-4 py-3 active:opacity-70"
              onPress={handleScan}>
              <Text className="text-center font-semibold text-white">Scan for device</Text>
            </TouchableOpacity>
          ) : isConnected ? (
            <TouchableOpacity
              className="rounded-xl bg-red-500 px-4 py-3 active:opacity-70"
              onPress={disconnect}>
              <Text className="text-center font-semibold text-white">Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="rounded-xl bg-gray-200 px-4 py-3 active:opacity-70 dark:bg-gray-700"
              onPress={disconnect}>
              <Text className="text-center font-semibold text-gray-600 dark:text-gray-300">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

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

      {/* Device picker modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white p-4 dark:bg-gray-900">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                Select device
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text className="text-brand-primary font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
            {devices.length === 0 ? (
              <View className="items-center py-6">
                <ActivityIndicator color="#1D9E75" />
                <Text className="mt-2 text-sm text-gray-400">Scanning…</Text>
              </View>
            ) : (
              <FlatList
                data={devices}
                keyExtractor={(d) => d.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="border-b border-gray-100 py-3 dark:border-gray-800"
                    onPress={() => handleConnect(item)}>
                    <Text className="font-medium text-gray-900 dark:text-white">
                      {item.name || 'Unknown'}
                    </Text>
                    <Text className="text-xs text-gray-400">{item.id}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
