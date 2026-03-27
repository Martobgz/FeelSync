import { Text, View } from 'react-native';

import { IconSymbol } from '@/src/components/ui/icon-symbol';

interface Props {
  level: number | null;
}

function getBatteryConfig(level: number | null): {
  bg: string;
  text: string;
  iconColor: string;
} {
  if (level === null) return { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-400', iconColor: '#9ca3af' };
  if (level < 20) return { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-500', iconColor: '#EF4444' };
  if (level < 50) return { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-500', iconColor: '#F59E0B' };
  return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', iconColor: '#22C55E' };
}

export function BatteryCard({ level }: Props) {
  const { bg, text, iconColor } = getBatteryConfig(level);

  return (
    <View className={`flex-1 rounded-2xl p-4 shadow-sm ${bg}`}>
      <View className="mb-1 flex-row items-center gap-1.5">
        <IconSymbol name="battery.100" size={14} color={iconColor} />
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">Battery</Text>
      </View>
      <Text className={`text-5xl font-bold ${text}`}>{level ?? '--'}</Text>
      <Text className="mt-0.5 text-xs text-gray-400">{level !== null ? '%' : ''}</Text>
    </View>
  );
}
