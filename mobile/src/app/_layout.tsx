import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import '@/global.css';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { initDatabase } from '@/src/services/storage/database';
import { useAuthStore } from '@/src/stores/auth-store';
import { useBleStore } from '@/src/stores/ble-store';

// Register background sync task at module level (required by expo-task-manager)
import '@/src/services/sync/background-sync';

export const unstable_settings = {
  anchor: '(tabs)',
};

async function initializeApp() {
  await initDatabase();
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
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const deviceId = useBleStore((s) => s.deviceId);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([initializeApp(), loadStoredAuth()]).finally(() => setIsReady(true));
  }, [loadStoredAuth]);

  useEffect(() => {
    if (!isReady) return;
    // DEV BYPASS: remove this block to re-enable auth
    if (__DEV__) {
      router.replace('/(patient-tabs)/' as never);
      return;
    }
    if (!isAuthenticated) {
      router.replace('/(auth)/login' as never);
    } else if (role === 'PATIENT' && !deviceId) {
      router.replace('/(patient-onboarding)/pair-device' as never);
    } else if (role === 'PATIENT') {
      router.replace('/(patient-tabs)/' as never);
    } else {
      router.replace('/(tabs)/' as never);
    }
  }, [isReady, isAuthenticated, role, deviceId]);

  if (!isReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient-onboarding)" />
        <Stack.Screen name="(patient-tabs)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
