import { Animated, Text, View } from 'react-native';

import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Brand, Status } from '@/src/constants/theme';
import { useSpinAnimation } from '@/src/hooks/use-spin-animation';
import { SyncStatus } from '@/src/types/biometric';
import { formatRelativeTime } from '@/src/utils/format-time';

interface Props {
  status: SyncStatus;
  pendingCount: number;
  lastSyncTime: number | null;
}

export function SyncStatusCard({ status, pendingCount, lastSyncTime }: Props) {
  const spinStyle = useSpinAnimation(status === 'syncing');

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Animated.View style={status === 'syncing' ? spinStyle : undefined}>
            <IconSymbol
              name="arrow.triangle.2.circlepath"
              size={16}
              color={status === 'error' ? Status.disconnected : Brand.primary}
            />
          </Animated.View>
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sync</Text>
        </View>
        {pendingCount > 0 && (
          <View className="rounded-full bg-amber-100 px-2.5 py-0.5">
            <Text className="text-xs font-medium text-amber-600">{pendingCount} pending</Text>
          </View>
        )}
      </View>

      <Text className="mt-2 text-sm text-gray-400 dark:text-gray-500">
        {status === 'syncing'
          ? 'Syncing...'
          : status === 'error'
            ? 'Sync failed — will retry'
            : lastSyncTime
              ? `Last sync ${formatRelativeTime(lastSyncTime)}`
              : 'Not synced yet'}
      </Text>
    </View>
  );
}
