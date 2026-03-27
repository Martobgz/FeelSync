import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { Alert } from '@/src/types/alert';

const STORAGE_KEY = 'feelsync:alerts';

interface AlertsState {
  alerts: Alert[];
  unreadCount: number;
  addAlert: (alert: Alert) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  loadStoredAlerts: () => Promise<void>;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  unreadCount: 0,

  addAlert: async (alert) => {
    const existing = get().alerts;
    if (existing.some((a) => a.id === alert.id)) return;
    const alerts = [alert, ...existing];
    const unreadCount = alerts.filter((a) => !a.read).length;
    set({ alerts, unreadCount });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  },

  markRead: async (id) => {
    const alerts = get().alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
    const unreadCount = alerts.filter((a) => !a.read).length;
    set({ alerts, unreadCount });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  },

  markAllRead: async () => {
    const alerts = get().alerts.map((a) => ({ ...a, read: true }));
    set({ alerts, unreadCount: 0 });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  },

  clearAll: async () => {
    set({ alerts: [], unreadCount: 0 });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },

  loadStoredAlerts: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const alerts: Alert[] = JSON.parse(raw);
        set({ alerts, unreadCount: alerts.filter((a) => !a.read).length });
      }
    } catch {
      // ignore corrupt data
    }
  },
}));
