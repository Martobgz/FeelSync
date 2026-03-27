import { Animated, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { SyncStatus } from '@/src/types/biometric';

interface Props {
  status: SyncStatus;
  pendingCount: number;
  lastSyncTime: number | null;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function SyncStatusCard({ status, pendingCount, lastSyncTime }: Props) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'syncing') {
      const spin = Animated.loop(
        Animated.timing(spinValue, { toValue: 1, duration: 1000, useNativeDriver: true })
      );
      spin.start();
      return () => spin.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [status, spinValue]);

  const spinStyle = {
    transform: [
      {
        rotate: spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
      },
    ],
  };

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Animated.View style={status === 'syncing' ? spinStyle : undefined}>
            <IconSymbol
              name="arrow.triangle.2.circlepath"
              size={16}
              color={status === 'error' ? '#EF4444' : '#1D9E75'}
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
