import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import '@/global.css';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { migrateStorageKeys } from '@/src/services/storage/storage-migration';
import { initDatabase } from '@/src/services/storage/database';
import { useAlertsStore } from '@/src/stores/alerts-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { useBleStore } from '@/src/stores/ble-store';
import { useGuardianStore } from '@/src/stores/guardian-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register background sync task at module level (required by expo-task-manager)
import '@/src/services/sync/background-sync';

export const unstable_settings = {
  anchor: '(tabs)',
};

async function initializeApp() {
  await migrateStorageKeys();
  await initDatabase();
  await useAlertsStore.getState().loadStoredAlerts();
  await Notifications.setNotificationChannelAsync('medications', {
    name: 'Medication reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('ble-service', {
    name: 'Wristband connection',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
  });
  await Notifications.setNotificationChannelAsync('episode-alerts', {
    name: 'Episode alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const deviceId = useBleStore((s) => s.deviceId);
  const loadLinkedPatient = useGuardianStore((s) => s.loadLinkedPatient);
  const linkedPatientUsername = useGuardianStore((s) => s.linkedPatientUsername);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([initializeApp(), loadStoredAuth(), loadLinkedPatient()]).finally(() => setIsReady(true));
  }, [loadStoredAuth, loadLinkedPatient]);

  useEffect(() => {
    const sub1 = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (data?.type === 'episode-alert' && data.alert) {
        useAlertsStore.getState().addAlert({ ...(data.alert as any), read: false });
      }
    });
    const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.type === 'episode-alert') {
        router.push('/(tabs)/alerts' as never);
      }
    });
    return () => { sub1.remove(); sub2.remove(); };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/register' as never);
    } else if (role === 'PATIENT' && !deviceId) {
      router.replace('/(patient-onboarding)/pair-device' as never);
    } else if (role === 'PATIENT') {
      router.replace('/(patient-tabs)/' as never);
    } else if (role === 'GUARDIAN' && !linkedPatientUsername) {
      router.replace('/(guardian-onboarding)/connect-patient' as never);
    } else {
      router.replace('/(tabs)/' as never);
    }
  }, [isReady, isAuthenticated, role, deviceId, linkedPatientUsername]);

  if (!isReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient-onboarding)" />
        <Stack.Screen name="(guardian-onboarding)" />
        <Stack.Screen name="(patient-tabs)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}


