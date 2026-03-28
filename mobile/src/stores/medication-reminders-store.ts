import { create } from 'zustand';

export interface MedicationReminder {
  /** Same value as the AsyncStorage dedup key — unique per med+date+time. */
  id: string;
  medicationName: string;
  intakeTime: string; // "HH:MM"
  /** Set only for catch-up reminders (device was disconnected at intake time). */
  missedAt?: Date;
}

interface MedicationRemindersState {
  pendingReminders: MedicationReminder[];
  addReminder: (reminder: MedicationReminder) => void;
  dismissReminder: (id: string) => void;
  dismissAll: () => void;
}

export const useMedicationRemindersStore = create<MedicationRemindersState>((set) => ({
  pendingReminders: [],

  addReminder: (reminder) =>
    set((state) => {
      // Prevent duplicates (e.g. hook fires twice before state settles)
      if (state.pendingReminders.some((r) => r.id === reminder.id)) return state;
      return { pendingReminders: [...state.pendingReminders, reminder] };
    }),

  dismissReminder: (id) =>
    set((state) => ({
      pendingReminders: state.pendingReminders.filter((r) => r.id !== id),
    })),

  dismissAll: () => set({ pendingReminders: [] }),
}));
