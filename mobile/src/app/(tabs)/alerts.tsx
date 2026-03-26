import { Text, View } from 'react-native';

export default function AlertsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">Alerts</Text>
      <Text className="mt-2 text-gray-500 dark:text-gray-400">Episode notifications coming soon</Text>
    </View>
  );
}
