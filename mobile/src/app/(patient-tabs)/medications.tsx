import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MedicationCard } from '@/src/components/medication-card';
import { MedicationReminder, useMedicationRemindersStore } from '@/src/stores/medication-reminders-store';
import { useMedicationsStore } from '@/src/stores/medications-store';

function formatTime(hhmm: string): string {
  const [hh, mm] = hhmm.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const hour = hh % 12 || 12;
  return `${hour}:${String(mm).padStart(2, '0')} ${period}`;
}

function ReminderBanner({ reminder, onDismiss }: { reminder: MedicationReminder; onDismiss: () => void }) {
  const isMissed = reminder.missedAt != null;
  return (
    <View
      className="mb-2 flex-row items-center justify-between rounded-xl px-4 py-3"
      style={{
        backgroundColor: isMissed ? '#FFF7ED' : '#F0FDF4',
        borderLeftWidth: 4,
        borderLeftColor: isMissed ? '#F97316' : '#1D9E75',
      }}>
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold" style={{ color: isMissed ? '#C2410C' : '#15803D' }}>
          {isMissed ? 'Missed dose' : 'Time for your dose'}
        </Text>
        <Text className="mt-0.5 text-base text-gray-800 dark:text-gray-100">
          <Text className="font-bold">{reminder.medicationName}</Text>
          {'  •  '}
          {formatTime(reminder.intakeTime)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDismiss}
        className="rounded-lg px-3 py-1.5 active:opacity-70"
        style={{ backgroundColor: isMissed ? '#F97316' : '#1D9E75' }}>
        <Text className="text-sm font-semibold text-white">OK</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PatientMedicationsScreen() {
  const medications = useMedicationsStore((s) => s.medications);
  const isLoading = useMedicationsStore((s) => s.isLoading);
  const fetchMedications = useMedicationsStore((s) => s.fetchMedications);

  const pendingReminders = useMedicationRemindersStore((s) => s.pendingReminders);
  const dismissReminder = useMedicationRemindersStore((s) => s.dismissReminder);

  const listHeader =
    pendingReminders.length > 0 ? (
      <View className="mb-2">
        {pendingReminders.map((r) => (
          <ReminderBanner key={r.id} reminder={r} onDismiss={() => dismissReminder(r.id)} />
        ))}
      </View>
    ) : null;

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-6">
        <Text className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Medications</Text>

        {isLoading && medications.length === 0 ? (
          <ActivityIndicator size="large" color="#1D9E75" />
        ) : (
          <FlatList
            data={medications}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={fetchMedications} tintColor="#1D9E75" />
            }
            ListHeaderComponent={listHeader}
            renderItem={({ item }) => (
              <MedicationCard item={item} />
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              pendingReminders.length === 0 ? (
                <View className="items-center pt-20">
                  <Text className="text-base text-gray-400 dark:text-gray-500">
                    No medications assigned.
                  </Text>
                  <Text className="mt-1 text-center text-sm text-gray-400 dark:text-gray-500">
                    Your guardian can add medications from their app.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
