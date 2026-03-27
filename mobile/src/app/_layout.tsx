import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import '@/global.css';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { getBleService } from '@/src/services/ble';
import { initDatabase } from '@/src/services/storage/database';
import { useAlertsStore } from '@/src/stores/alerts-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { useBleStore } from '@/src/stores/ble-store';
import { Alert, AlertType } from '@/src/types/alert';

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

function buildEpisodeAlert(riskType: string): Alert {
  const id = `episode-${riskType}-${Date.now()}`;
  const typeMap: Record<string, { type: AlertType; title: string; body: string; severity: Alert['severity'] }> = {
    HIGH_HR: {
      type: 'HIGH_HR',
      title: 'High Heart Rate',
      body: "Patient's heart rate exceeded 110 bpm.",
      severity: 'critical',
    },
    LOW_HR: {
      type: 'LOW_HR',
      title: 'Low Heart Rate',
      body: "Patient's heart rate dropped below 45 bpm.",
      severity: 'critical',
    },
  };
  const mapped = typeMap[riskType] ?? {
    type: 'ANOMALY' as AlertType,
    title: 'Biometric Anomaly',
    body: 'An unusual biometric reading was detected.',
    severity: 'warning' as Alert['severity'],
  };
  return { id, ...mapped, timestamp: Date.now(), read: false };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const patientLinked = useAuthStore((s) => s.patientLinked);
  const deviceId = useBleStore((s) => s.deviceId);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([initializeApp(), loadStoredAuth()]).finally(() => setIsReady(true));
  }, [loadStoredAuth]);

  useEffect(() => {
    const sub1 = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;

      if (data?.type === 'episode-alert') {
        const riskType = (data.riskType as string) ?? 'ANOMALY';
        useAlertsStore.getState().addAlert(buildEpisodeAlert(riskType));
      }

      if (data?.type === 'medication-reminder') {
        getBleService().writeToDevice('VIBRATE').catch(() => {});
        useAlertsStore.getState().addAlert({
          id: `med-reminder-${Date.now()}`,
          type: 'LOW_MEDICATION',
          severity: 'info',
          title: 'Medication Reminder',
          body: (data.medicationName as string) ? `Time to take ${data.medicationName}.` : 'Time to take your medication.',
          timestamp: Date.now(),
          read: false,
        });
      }
    });

    const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.type === 'episode-alert') {
        router.push('/(tabs)/alerts' as never);
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/register' as never);
    } else if (role === null) {
      router.replace('/(auth)/role-select' as never);
    } else if (role === 'GUARDIAN' && !patientLinked) {
      router.replace('/(auth)/link-patient' as never);
    } else if (role === 'PATIENT' && !deviceId) {
      router.replace('/(patient-onboarding)/pair-device' as never);
    } else if (role === 'PATIENT') {
      router.replace('/(patient-tabs)/' as never);
    } else {
      router.replace('/(tabs)/' as never);
    }
  }, [isReady, isAuthenticated, role, patientLinked, deviceId]);

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
