import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';

import '@/global.css';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
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
      <SignupButton />
      {__DEV__ && <DevRoleSwitch />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function SignupButton() {
  const logout = useAuthStore((s) => s.logout);
  const clearLinkedPatient = useGuardianStore((s) => s.clearLinkedPatient);

  async function handlePress() {
    await logout();
    await clearLinkedPatient();
    router.replace('/(auth)/register' as never);
  }

  return (
    <View style={{ position: 'absolute', top: 52, left: 12, zIndex: 999 }}>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          backgroundColor: '#1D9E75',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
          opacity: 0.85,
        }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>+ Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

function DevRoleSwitch() {
  const segments = useSegments();
  const isPatient = segments[0] === '(patient-tabs)';

  return (
    <View style={{ position: 'absolute', top: 52, right: 12, zIndex: 999 }}>
      <TouchableOpacity
        onPress={() =>
          router.replace((isPatient ? '/(tabs)/' : '/(patient-tabs)/') as never)
        }
        style={{
          backgroundColor: isPatient ? '#6366f1' : '#1D9E75',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
          opacity: 0.85,
        }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
          {isPatient ? '→ Guardian' : '→ Patient'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
