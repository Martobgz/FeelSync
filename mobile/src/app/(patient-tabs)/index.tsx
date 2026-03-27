import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BatteryCard } from '@/src/components/battery-card';
import { BleDeviceScanner } from '@/src/components/ble-device-scanner';
import { BleStatusIndicator } from '@/src/components/ble-status-indicator';
import { ConnectionCard } from '@/src/components/connection-card';
import { HeartRateCard } from '@/src/components/heart-rate-card';
import { MedicationCard } from '@/src/components/medication-card';
import { SyncStatusCard } from '@/src/components/sync-status-card';
import { useBleConnection } from '@/src/hooks/use-ble-connection';
import { useSync } from '@/src/hooks/use-sync';
import { ScannedDevice } from '@/src/services/ble/ble-types';
import { useBleStore } from '@/src/stores/ble-store';
import { useMedicationsStore } from '@/src/stores/medications-store';

export default function PatientHomeScreen() {
  const { startScan, connect, disconnect, sendMessage } = useBleConnection();
  const { status: syncStatus, pendingCount, lastSyncTime } = useSync();

  const connectionStatus = useBleStore((s) => s.connectionStatus);
  const deviceName = useBleStore((s) => s.deviceName);
  const batteryLevel = useBleStore((s) => s.batteryLevel);
  const lastHeartRate = useBleStore((s) => s.lastHeartRate);

  const medications = useMedicationsStore((s) => s.medications);
  const fetchMedications = useMedicationsStore((s) => s.fetchMedications);

  const [scannerVisible, setScannerVisible] = useState(false);
  const [foundDevices, setFoundDevices] = useState<ScannedDevice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  async function handleConnect() {
    setFoundDevices([]);
    setScannerVisible(true);
    await startScan((device) => {
      setFoundDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device]));
    });
  }

  async function handleSelectDevice(device: ScannedDevice) {
    setScannerVisible(false);
    await connect(device.id, device.name);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchMedications();
    setIsRefreshing(false);
  }

  const previewMeds = medications.slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#1D9E75" />
        }>

        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Home</Text>
          <BleStatusIndicator status={connectionStatus} size={14} />
        </View>

        {/* Connection card */}
        <View className="mb-4">
          <ConnectionCard
            status={connectionStatus}
            deviceName={deviceName}
            batteryLevel={batteryLevel}
            onConnect={handleConnect}
            onDisconnect={disconnect}
          />
        </View>

        {/* Heart Rate + Battery row */}
        <View className="mb-4 flex-row gap-3">
          <HeartRateCard bpm={lastHeartRate} />
          <BatteryCard level={batteryLevel} />
        </View>

        {/* Sync status */}
        <View className="mb-4">
          <SyncStatusCard
            status={syncStatus}
            pendingCount={pendingCount}
            lastSyncTime={lastSyncTime}
          />
        </View>

        {/* BLE test button */}
        {connectionStatus === 'connected' && (
          <View className="mb-4">
            <TouchableOpacity
              className="rounded-xl bg-indigo-500 px-4 py-3 active:opacity-70"
              onPress={() =>
                sendMessage('Hello from FeelSync!').catch((e) =>
                  Alert.alert('Write failed', String(e))
                )
              }>
              <Text className="text-center font-semibold text-white">Send test message to ESP32</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Medication summary */}
        {previewMeds.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-gray-700 dark:text-gray-200">
              Medications
            </Text>
            {previewMeds.map((med) => (
              <MedicationCard key={med.id} item={med} showActions={false} />
            ))}
            {medications.length > 3 && (
              <Text className="text-center text-sm text-gray-400">
                +{medications.length - 3} more in Medications tab
              </Text>
            )}
          </View>
        )}

      </ScrollView>

      <BleDeviceScanner
        visible={scannerVisible}
        devices={foundDevices}
        onClose={() => setScannerVisible(false)}
        onSelectDevice={handleSelectDevice}
      />
    </SafeAreaView>
  );
}
