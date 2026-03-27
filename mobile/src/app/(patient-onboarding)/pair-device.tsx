import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BleDeviceScanner } from '@/src/components/ble-device-scanner';
import { useBleConnection } from '@/src/hooks/use-ble-connection';
import { ScannedDevice } from '@/src/services/ble/ble-types';

export default function PairDeviceScreen() {
  const { startScan, connect } = useBleConnection();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [foundDevices, setFoundDevices] = useState<ScannedDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  async function handleStartScan() {
    setFoundDevices([]);
    setError('');
    setScannerVisible(true);
    await startScan((device) => {
      setFoundDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device]));
    });
  }

  async function handleSelectDevice(device: ScannedDevice) {
    setScannerVisible(false);
    setIsConnecting(true);
    setError('');
    try {
      await connect(device.id, device.name);
      // Root layout will re-render and navigate to (patient-tabs) when deviceId is set
      router.replace('/(patient-tabs)/' as never);
    } catch {
      setError('Failed to connect. Make sure the device is on and in range.');
      setIsConnecting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-2 text-4xl">⌚</Text>
        <Text className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
          Connect Your Wristband
        </Text>
        <Text className="mb-10 text-center text-base text-gray-500 dark:text-gray-400">
          FeelSync needs to pair with your wristband to monitor your health data. This is a one-time
          setup.
        </Text>

        {error ? (
          <View className="mb-6 w-full rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-center text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {isConnecting ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#1D9E75" />
            <Text className="mt-3 text-sm text-gray-400">Connecting...</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleStartScan}
            className="w-full items-center rounded-2xl bg-brand-primary py-4">
            <Text className="text-base font-semibold text-white">Start Scanning</Text>
          </TouchableOpacity>
        )}
      </View>

      <BleDeviceScanner
        visible={scannerVisible}
        devices={foundDevices}
        onClose={() => setScannerVisible(false)}
        onSelectDevice={handleSelectDevice}
      />
    </SafeAreaView>
  );
}
