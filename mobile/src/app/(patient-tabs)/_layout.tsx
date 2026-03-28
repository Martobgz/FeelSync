import { useEffect } from 'react';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/src/components/haptic-tab';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Colors } from '@/src/constants/theme';
import { useBleConnection } from '@/src/hooks/use-ble-connection';
import { useMedicationReminders } from '@/src/hooks/use-medication-reminders';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useMedicationRemindersStore } from '@/src/stores/medication-reminders-store';
import { useMedicationsStore } from '@/src/stores/medications-store';

/** Mounts BLE + reminder hooks once at layout level so they run regardless of active tab. */
function BackgroundWatchers() {
  useBleConnection();
  useMedicationReminders();
  const fetchMedications = useMedicationsStore((s) => s.fetchMedications);
  useEffect(() => { void fetchMedications(); }, [fetchMedications]);
  return null;
}

export default function PatientTabsLayout() {
  const colorScheme = useColorScheme();
  const pendingCount = useMedicationRemindersStore((s) => s.pendingReminders.length);

  return (
    <>
      <BackgroundWatchers />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="medications"
          options={{
            title: 'Medications',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="pills.fill" color={color} />,
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          }}
        />
      </Tabs>
    </>
  );
}
