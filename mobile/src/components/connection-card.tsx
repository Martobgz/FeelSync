import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { BleStatusIndicator } from '@/src/components/ble-status-indicator';
import { BleConnectionState } from '@/src/services/ble/ble-types';

interface Props {
  status: BleConnectionState;
  deviceName: string | null;
  batteryLevel: number | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionCard({ status, deviceName, batteryLevel, onConnect, onDisconnect }: Props) {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <BleStatusIndicator status={status} size={10} />
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {status === 'connected'
              ? (deviceName ?? 'Wristband')
              : status === 'connecting' || status === 'scanning'
                ? 'Connecting...'
                : 'Wristband'}
          </Text>
        </View>

        {status === 'connected' ? (
          <TouchableOpacity
            onPress={onDisconnect}
            className="rounded-xl border border-red-200 px-3 py-1.5">
            <Text className="text-xs font-semibold text-red-500">Disconnect</Text>
          </TouchableOpacity>
        ) : status === 'connecting' || status === 'scanning' ? (
          <ActivityIndicator size="small" color="#1D9E75" />
        ) : (
          <TouchableOpacity
            onPress={onConnect}
            className="rounded-xl bg-brand-primary px-3 py-1.5">
            <Text className="text-xs font-semibold text-white">Connect</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text className="mt-2 text-sm text-gray-400 dark:text-gray-500">
        {status === 'connected'
          ? batteryLevel !== null
            ? `Battery ${batteryLevel}%`
            : 'Connected'
          : status === 'connecting' || status === 'scanning'
            ? 'Establishing connection...'
            : 'Not connected — tap Connect to pair'}
      </Text>
    </View>
  );
}
