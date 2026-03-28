import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GsrChart } from '@/src/components/charts/gsr-chart';
import { PulseChart } from '@/src/components/charts/pulse-chart';
import { SleepChart } from '@/src/components/charts/sleep-chart';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { usePatientMeasurements } from '@/src/hooks/use-patient-measurements';
import { ChartPeriod } from '@/src/types/biometric';

const PERIODS: { label: string; value: ChartPeriod }[] = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
];

export default function HomeScreen() {
  const { pulseData, sleepData, gsrData, period, loading, error, setPeriod, refresh } =
    usePatientMeasurements();

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#1D9E75" />
        }>

        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Home</Text>
          {loading && <ActivityIndicator color="#1D9E75" />}
        </View>

        {/* Pair device button */}
        <TouchableOpacity
          onPress={() => router.push('/(patient-onboarding)/pair-device')}
          className="mb-5 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4 shadow-sm dark:bg-gray-800">
          <IconSymbol name="antenna.radiowaves.left.and.right" size={22} color="#1D9E75" />
          <Text className="text-base font-semibold text-brand-primary">Pair Bluetooth Device</Text>
        </TouchableOpacity>

        {/* Period switcher */}
        <View className="mb-5 flex-row gap-2">
          {PERIODS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setPeriod(value)}
              className={[
                'rounded-full px-5 py-2',
                period === value ? 'bg-brand-primary' : 'bg-white dark:bg-gray-800',
              ].join(' ')}>
              <Text
                className={[
                  'font-semibold',
                  period === value ? 'text-white' : 'text-gray-500 dark:text-gray-300',
                ].join(' ')}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error banner */}
        {error && (
          <View className="mb-4 rounded-xl bg-red-50 px-4 py-2 dark:bg-red-900/20">
            <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
          </View>
        )}

        {/* Charts */}
        <PulseChart data={pulseData} />
        <SleepChart data={sleepData} />
        <GsrChart data={gsrData} />

      </ScrollView>
    </SafeAreaView>
  );
}
