import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Config } from '@/src/constants/config';
import { Brand } from '@/src/constants/theme';
import { useSpinAnimation } from '@/src/hooks/use-spin-animation';
import { ScannedDevice } from '@/src/services/ble/ble-types';

function sortedDevices(devices: ScannedDevice[]): ScannedDevice[] {
  return [...devices].sort((a, b) => {
    const aFeel = a.name?.startsWith(Config.BLE_DEVICE_PREFIX) ?? false;
    const bFeel = b.name?.startsWith(Config.BLE_DEVICE_PREFIX) ?? false;
    return Number(bFeel) - Number(aFeel);
  });
}

interface Props {
  visible: boolean;
  devices: ScannedDevice[];
  onClose: () => void;
  onSelectDevice: (device: ScannedDevice) => void;
}

export function BleDeviceScanner({ visible, devices, onClose, onSelectDevice }: Props) {
  const spinStyle = useSpinAnimation(visible, 1200);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-gray-800">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">Connect Wristband</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text className="text-2xl text-gray-400">×</Text>
            </TouchableOpacity>
          </View>

          <Text className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Make sure your wristband is powered on and nearby.
          </Text>

          <View className="mb-4 items-center">
            <Animated.View style={spinStyle}>
              <ActivityIndicator size="large" color={Brand.primary} />
            </Animated.View>
            <Text className="mt-2 text-sm text-gray-400">Scanning for devices...</Text>
          </View>

          {devices.length > 0 ? (
            <FlatList
              data={sortedDevices(devices)}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 240 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onSelectDevice(item)}
                  className="mb-2 flex-row items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700">
                  <View>
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">
                      {item.name ?? 'Unknown Device'}
                    </Text>
                    <Text className="text-xs text-gray-400">{item.id}</Text>
                  </View>
                  {item.rssi !== null && (
                    <Text className="text-xs text-gray-400">{item.rssi} dBm</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <View className="items-center py-6">
              <Text className="text-sm text-gray-400 dark:text-gray-500">No devices found yet...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
