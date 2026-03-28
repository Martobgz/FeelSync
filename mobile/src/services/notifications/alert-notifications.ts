import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useAlertsStore } from '@/src/stores/alerts-store';
import { Alert } from '@/src/types/alert';

export async function handleIncomingAlert(alert: Alert): Promise<void> {
  await useAlertsStore.getState().addAlert(alert);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: alert.title,
      body: alert.body,
      sound: true,
      data: { type: 'episode-alert', alertId: alert.id },
      ...(Platform.OS === 'android' && { android: { channelId: 'episode-alerts' } }),
    },
    trigger: null,
  });
}
