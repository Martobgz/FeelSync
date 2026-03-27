import { Switch, Text, TouchableOpacity, View } from 'react-native';

import { calculateRemainingDays } from '@/src/services/notifications/medication-notifications';
import { Medication } from '@/src/types/medication';

interface MedicationCardProps {
  item: Medication;
  showActions?: boolean;
  onEdit?: (med: Medication) => void;
  onDelete?: (id: string) => void;
  onSetTimes?: (med: Medication) => void;
  onToggleWristband?: (id: string, enabled: boolean) => void;
}

export function MedicationCard({
  item,
  showActions = false,
  onEdit,
  onDelete,
  onSetTimes,
  onToggleWristband,
}: MedicationCardProps) {
  const days = calculateRemainingDays(item);
  const isLow = days <= 3;

  return (
    <View className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
      {/* Colored top bar */}
      <View className={`h-2 w-full ${isLow ? 'bg-orange-400' : 'bg-brand-primary'}`} />

      <View className="p-4">
        {/* Name + badge row */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</Text>
          <View className={`rounded-full px-3 py-1 ${isLow ? 'bg-orange-100' : 'bg-brand-light'}`}>
            <Text
              className={`text-xs font-semibold ${isLow ? 'text-orange-600' : 'text-brand-primary'}`}>
              {isLow ? '⚠ Low stock' : `${days} days left`}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View className="mb-3 flex-row gap-3">
          <View className="flex-1 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-700">
            <Text className="text-xs text-gray-400">Remaining</Text>
            <Text className="text-base font-semibold text-gray-800 dark:text-white">
              {item.currentAmount} pills
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-700">
            <Text className="text-xs text-gray-400">Daily dose</Text>
            <Text className="text-base font-semibold text-gray-800 dark:text-white">
              {item.dailyDose} pill{item.dailyDose !== 1 ? 's' : ''}/day
            </Text>
          </View>
        </View>

        {/* Intake times row */}
        {item.intakeTimes.length > 0 && (
          <View className={`flex-row flex-wrap gap-1.5 ${showActions ? 'mb-3' : ''}`}>
            {item.intakeTimes.map((t) => (
              <View key={t} className="rounded-full bg-brand-light px-2.5 py-1">
                <Text className="text-xs font-medium text-brand-primary">{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions row — only shown for Guardian */}
        {showActions && (
          <>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => onSetTimes?.(item)}
                className="flex-1 items-center rounded-xl bg-brand-light py-2">
                <Text className="text-sm font-semibold text-brand-primary">
                  {item.intakeTimes.length > 0 ? '⏰ Times' : '⏰ Set Times'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onEdit?.(item)}
                className="flex-1 items-center rounded-xl border border-brand-mid py-2">
                <Text className="text-sm font-semibold text-brand-primary">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete?.(item.id)}
                className="flex-1 items-center rounded-xl border border-red-200 py-2">
                <Text className="text-sm font-semibold text-red-500">Delete</Text>
              </TouchableOpacity>
            </View>
            {onToggleWristband && (
              <View className="mt-3 flex-row items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-700">
                <Text className="text-sm text-gray-600 dark:text-gray-300">Wristband reminders</Text>
                <Switch
                  value={item.wristbandNotifications}
                  onValueChange={(v) => onToggleWristband(item.id, v)}
                  trackColor={{ false: '#d1d5db', true: '#1D9E75' }}
                  thumbColor="#fff"
                />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
