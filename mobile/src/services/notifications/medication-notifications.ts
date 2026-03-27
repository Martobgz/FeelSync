import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import { Medication } from '@/src/types/medication';

export async function scheduleIntakeReminders(medications: Medication[]): Promise<void> {
  // Cancel all previously scheduled intake reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as { type?: string })?.type === 'medication-reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  for (const med of medications) {
    if (!med.wristbandNotifications || med.intakeTimes.length === 0) continue;

    for (const time of med.intakeTimes) {
      const [hourStr, minuteStr] = time.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      if (isNaN(hour) || isNaN(minute)) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication time',
          body: `Time to take ${med.name}.`,
          sound: true,
          data: { type: 'medication-reminder', medicationId: med.id, medicationName: med.name },
          channelId: 'medications',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }
  }
}

export function calculateRemainingDays(med: Medication): number {
  if (med.addedDate) {
    const daysSinceAdded = Math.floor(
      (Date.now() - new Date(med.addedDate).getTime()) / 86_400_000
    );
    const consumed = daysSinceAdded * med.dailyDose;
    return Math.max(0, Math.floor((med.currentAmount - consumed) / med.dailyDose));
  }
  return Math.floor(med.currentAmount / med.dailyDose);
}

export async function scheduleMedicationNotifications(medications: Medication[]): Promise<void> {
  // Cancel all existing medication low-stock notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as { type?: string })?.type === 'medication-low-stock') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  for (const med of medications) {
    const daysLeft = calculateRemainingDays(med);

    if (daysLeft <= 2) {
      // Already critical — schedule for tomorrow
      await scheduleNotification(med, 1, 'urgent');
    } else if (daysLeft <= 5) {
      const daysUntilFiveDay = daysLeft - 5;
      if (daysUntilFiveDay <= 0) {
        await scheduleNotification(med, 0, 'warning');
      } else {
        await scheduleNotification(med, daysUntilFiveDay, 'warning');
      }
    } else {
      // Schedule warning at 5 days remaining
      await scheduleNotification(med, daysLeft - 5, 'warning');
      // Schedule urgent at 2 days remaining
      await scheduleNotification(med, daysLeft - 2, 'urgent');
    }
  }
}

async function scheduleNotification(
  med: Medication,
  daysFromNow: number,
  type: 'warning' | 'urgent'
): Promise<void> {
  const triggerDate = new Date(Date.now() + daysFromNow * 86_400_000);

  const title = type === 'urgent'
    ? `${med.name} will run out soon!`
    : `${med.name} is running low`;

  const body = type === 'urgent'
    ? `You have about 2 days of ${med.name} left. Please inform your guardian.`
    : `You have about 5 days of ${med.name} left.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { type: 'medication-low-stock', medicationId: med.id, level: type },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}
