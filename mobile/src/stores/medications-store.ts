import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { create } from 'zustand';

import { getMedications } from '@/src/services/api/medications-api';
import { getCachedMedications, upsertMedications } from '@/src/services/data/medications-dao';
import { scheduleMedicationNotifications } from '@/src/services/notifications/medication-notifications';
import { Medication } from '@/src/types/medication';

const LOCAL_KEY = 'feelsync:medications';

async function loadLocal(): Promise<Medication[] | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed: Medication[] = JSON.parse(raw);
    return parsed.map((m) => ({ ...m, intakeTimes: m.intakeTimes ?? [] }));
  } catch {
    return null;
  }
}

async function saveLocal(meds: Medication[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(meds));
}

async function scheduleRefillNotification(med: Medication): Promise<string | undefined> {
  const daysLeft = Math.floor(med.currentAmount / med.dailyDose);
  if (daysLeft <= 3) return undefined;
  const daysUntilWarning = daysLeft - 3;
  const triggerDate = new Date(Date.now() + daysUntilWarning * 86_400_000);
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Refill needed soon',
        body: `${med.name} has 3 days remaining. Time to order a refill.`,
        sound: true,
        data: { medicationId: med.id },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  } catch {
    return undefined;
  }
}

async function cancelNotification(notificationId: string | undefined): Promise<void> {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch { /* ignore */ }
  }
}

interface MedicationsState {
  medications: Medication[];
  isLoading: boolean;
  error: string | null;
  fetchMedications: () => Promise<void>;
  addMedication: (data: Omit<Medication, 'id' | 'notificationId'>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  setIntakeTimes: (id: string, times: string[]) => Promise<void>;
  clearCache: () => void;
}

export const useMedicationsStore = create<MedicationsState>((set, get) => ({
  medications: [],
  isLoading: false,
  error: null,

  fetchMedications: async () => {
    set({ isLoading: true, error: null });

    // Try server first
    try {
      const serverMeds = await getMedications();
      if (serverMeds.length > 0) {
        await upsertMedications(serverMeds);
        await scheduleMedicationNotifications(serverMeds);
        set({ medications: serverMeds, isLoading: false });
        return;
      }
    } catch { /* fall through */ }

    // Server empty/failed — use local AsyncStorage (primary store for intake times)
    try {
      const local = await loadLocal();
      if (local && local.length > 0) {
        set({ medications: local, isLoading: false });
        return;
      }
    } catch { /* fall through */ }

    // Final fallback: SQLite cache
    try {
      const cached = await getCachedMedications();
      set({ medications: cached, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Failed to load medications' });
    }
  },

  addMedication: async (data) => {
    const { medications } = get();
    const newMed: Medication = {
      ...data,
      id: Date.now().toString(),
      intakeTimes: data.intakeTimes ?? [],
    };
    newMed.notificationId = await scheduleRefillNotification(newMed);
    const newList = [...medications, newMed];
    await saveLocal(newList);
    set({ medications: newList });
  },

  deleteMedication: async (id) => {
    const { medications } = get();
    const existing = medications.find((m) => m.id === id);
    if (existing) await cancelNotification(existing.notificationId);
    const newList = medications.filter((m) => m.id !== id);
    await saveLocal(newList);
    set({ medications: newList });
  },

  setIntakeTimes: async (id, times) => {
    const { medications } = get();
    const newList = medications.map((m) => (m.id === id ? { ...m, intakeTimes: times } : m));
    await saveLocal(newList);
    set({ medications: newList });
  },

  clearCache: () => set({ medications: [] }),
}));
