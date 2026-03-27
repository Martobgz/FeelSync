import { useEffect } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BatteryCard } from '@/src/components/battery-card';
import { BleStatusIndicator } from '@/src/components/ble-status-indicator';
import { HeartRateCard } from '@/src/components/heart-rate-card';
import { useBleStore } from '@/src/stores/ble-store';
import { useMedicationsStore } from '@/src/stores/medications-store';
import { useState } from 'react';

export default function PatientHomeScreen() {
  const connectionStatus = useBleStore((s) => s.connectionStatus);
  const batteryLevel = useBleStore((s) => s.batteryLevel);
  const lastHeartRate = useBleStore((s) => s.lastHeartRate);

  const fetchMedications = useMedicationsStore((s) => s.fetchMedications);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchMedications();
    setIsRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#1D9E75" />
        }>

        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Home</Text>
          <BleStatusIndicator status={connectionStatus} size={14} />
        </View>

        <View className="flex-row gap-3">
          <HeartRateCard bpm={lastHeartRate} />
          <BatteryCard level={batteryLevel} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
