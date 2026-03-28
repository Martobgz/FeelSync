import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fireRandomAlert } from '@/src/services/notifications/alert-simulator';
import { useAlertsStore } from '@/src/stores/alerts-store';
import { Alert, AlertSeverity } from '@/src/types/alert';

// ─── helpers ─────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TYPE_LABEL: Record<Alert['type'], string> = {
  HIGH_HR: 'High HR',
  LOW_HR: 'Low HR',
  ANOMALY: 'Anomaly',
  LOW_MEDICATION: 'Medication',
  DEVICE_DISCONNECTED: 'Device',
};

const SEVERITY: Record<AlertSeverity, {
  border: string;
  unreadBg: string;
  readBg: string;
  pillBg: string;
  pillText: string;
}> = {
  critical: {
    border: 'border-l-red-500',
    unreadBg: 'bg-red-50 dark:bg-red-900/20',
    readBg: 'bg-white dark:bg-gray-800',
    pillBg: 'bg-red-100 dark:bg-red-900/40',
    pillText: 'text-red-700 dark:text-red-400',
  },
  warning: {
    border: 'border-l-amber-500',
    unreadBg: 'bg-amber-50 dark:bg-amber-900/20',
    readBg: 'bg-white dark:bg-gray-800',
    pillBg: 'bg-amber-100 dark:bg-amber-900/40',
    pillText: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    border: 'border-l-blue-500',
    unreadBg: 'bg-blue-50 dark:bg-blue-900/20',
    readBg: 'bg-white dark:bg-gray-800',
    pillBg: 'bg-blue-100 dark:bg-blue-900/40',
    pillText: 'text-blue-700 dark:text-blue-400',
  },
};

// ─── AlertCard ───────────────────────────────────────────────────────────────

function AlertCard({ alert, onPress, onRemove }: { alert: Alert; onPress: () => void; onRemove: () => void }) {
  const s = SEVERITY[alert.severity];
  return (
    <View className={`mb-3 rounded-xl border-l-4 ${s.border} ${alert.read ? s.readBg : s.unreadBg}`}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        className="px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {!alert.read && (
              <View className="h-2 w-2 rounded-full bg-brand-primary" />
            )}
            <View className={`rounded-full px-2 py-0.5 ${s.pillBg}`}>
              <Text className={`text-xs font-semibold ${s.pillText}`}>
                {TYPE_LABEL[alert.type]}
              </Text>
            </View>
            <Text
              className="flex-1 text-sm font-semibold text-gray-900 dark:text-white"
              numberOfLines={1}>
              {alert.title}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
              {relativeTime(alert.timestamp)}
            </Text>
            <TouchableOpacity onPress={onRemove} hitSlop={8}>
              <Text className="text-xs font-semibold text-red-400">Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text className="mt-1.5 text-sm leading-5 text-gray-600 dark:text-gray-300">
          {alert.body}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── AlertsScreen ─────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const alerts = useAlertsStore((s) => s.alerts);
  const unreadCount = useAlertsStore((s) => s.unreadCount);
  const markRead = useAlertsStore((s) => s.markRead);
  const markAllRead = useAlertsStore((s) => s.markAllRead);
  const removeAlert = useAlertsStore((s) => s.removeAlert);

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-6">
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Alerts</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text className="text-sm font-semibold text-brand-primary">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onPress={() => markRead(item.id)}
              onRemove={() => removeAlert(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center pt-20">
              <Text className="text-base text-gray-400 dark:text-gray-500">No alerts yet.</Text>
            </View>
          }
        />
      </View>

      {__DEV__ && (
        <View className="px-4 pb-8 pt-2">
          <TouchableOpacity
            onPress={fireRandomAlert}
            className="items-center rounded-2xl bg-gray-700 py-4 dark:bg-gray-600">
            <Text className="text-base font-semibold text-white">Simulate Alert</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
