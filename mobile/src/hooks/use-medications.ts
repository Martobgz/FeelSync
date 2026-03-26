import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useEffect, useState } from 'react';

import { Medication } from '@/src/types/medication';

const STORAGE_KEY = 'feelsync:medications';

async function cancelNotification(notificationId: string | undefined) {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
}

async function scheduleRefillNotification(med: Medication): Promise<string | undefined> {
  const daysLeft = Math.floor(med.currentAmount / med.dailyDose);
  if (daysLeft <= 3) return undefined;

  const daysUntilWarning = daysLeft - 3;
  const triggerDate = new Date(Date.now() + daysUntilWarning * 86_400_000);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Refill needed soon',
      body: `${med.name} has 3 days remaining. Time to order a refill.`,
      sound: true,
      data: { medicationId: med.id },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

async function persist(list: Medication[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Request provisional permissions — no dialog on iOS, auto-granted on Android
    Notifications.requestPermissionsAsync({ ios: { allowProvisional: true } });

    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed: Medication[] = JSON.parse(raw);
          // backward-compat: existing entries may not have intakeTimes
          setMedications(parsed.map((m) => ({ ...m, intakeTimes: m.intakeTimes ?? [] })));
        } catch {
          setMedications([]);
        }
      }
      setIsLoading(false);
    });
  }, []);

  async function addMedication(data: Omit<Medication, 'id' | 'notificationId'>) {
    const newMed: Medication = { ...data, id: Date.now().toString(), intakeTimes: data.intakeTimes ?? [] };
    newMed.notificationId = await scheduleRefillNotification(newMed);
    const newList = [...medications, newMed];
    await persist(newList);
    setMedications(newList);
  }

  async function updateMedication(id: string, data: Omit<Medication, 'id' | 'notificationId'>) {
    const existing = medications.find((m) => m.id === id);
    if (!existing) return;

    await cancelNotification(existing.notificationId);
    const updated: Medication = { ...data, id };
    updated.notificationId = await scheduleRefillNotification(updated);
    const newList = medications.map((m) => (m.id === id ? updated : m));
    await persist(newList);
    setMedications(newList);
  }

  async function deleteMedication(id: string) {
    const existing = medications.find((m) => m.id === id);
    if (existing) await cancelNotification(existing.notificationId);
    const newList = medications.filter((m) => m.id !== id);
    await persist(newList);
    setMedications(newList);
  }

  async function setIntakeTimes(id: string, times: string[]) {
    const newList = medications.map((m) => (m.id === id ? { ...m, intakeTimes: times } : m));
    await persist(newList);
    setMedications(newList);
  }

  return { medications, isLoading, addMedication, updateMedication, deleteMedication, setIntakeTimes };
}
