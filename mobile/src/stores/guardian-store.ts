import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { StorageKeys } from '@/src/constants/storage-keys';

const STORAGE_KEY = StorageKeys.linkedPatient;

interface GuardianState {
  linkedPatientUsername: string | null;
  setLinkedPatient: (username: string) => Promise<void>;
  loadLinkedPatient: () => Promise<void>;
  clearLinkedPatient: () => Promise<void>;
}

export const useGuardianStore = create<GuardianState>((set) => ({
  linkedPatientUsername: null,

  setLinkedPatient: async (username) => {
    await AsyncStorage.setItem(STORAGE_KEY, username);
    set({ linkedPatientUsername: username });
  },

  loadLinkedPatient: async () => {
    const username = await AsyncStorage.getItem(STORAGE_KEY);
    if (username) set({ linkedPatientUsername: username });
  },

  clearLinkedPatient: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ linkedPatientUsername: null });
  },
}));
