import { create } from 'zustand';

import { getMedications } from '@/src/services/api/medications-api';
import { getCachedMedications, upsertMedications } from '@/src/services/data/medications-dao';
import {
  scheduleMedicationNotifications,
  scheduleIntakeReminders,
} from '@/src/services/notifications/medication-notifications';
import { Medication } from '@/src/types/medication';

interface MedicationsState {
  medications: Medication[];
  isLoading: boolean;
  error: string | null;
  fetchMedications: () => Promise<void>;
  clearCache: () => void;
}

export const useMedicationsStore = create<MedicationsState>((set) => ({
  medications: [],
  isLoading: false,
  error: null,

  fetchMedications: async () => {
    set({ isLoading: true, error: null });
    try {
      const meds = await getMedications();
      await upsertMedications(meds);
      await scheduleMedicationNotifications(meds);
      await scheduleIntakeReminders(meds);
      set({ medications: meds, isLoading: false });
    } catch {
      // Fallback to SQLite cache when offline
      try {
        const cached = await getCachedMedications();
        set({ medications: cached, isLoading: false });
      } catch {
        set({ isLoading: false, error: 'Failed to load medications' });
      }
    }
  },

  clearCache: () => set({ medications: [] }),
}));
