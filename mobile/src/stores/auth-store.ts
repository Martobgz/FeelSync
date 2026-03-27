import { create } from 'zustand';

import { User, UserRole } from '@/src/types/auth';
import {
  clearAll,
  getPatientLinked,
  getRole,
  getToken,
  savePatientLinked,
  saveRole,
  saveToken,
} from '@/src/services/storage/secure-storage';

interface AuthState {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  patientLinked: boolean;
  setAuth: (token: string, role: UserRole | null, patientLinked?: boolean) => Promise<void>;
  setPatientLinked: (linked: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  role: null,
  isAuthenticated: false,
  patientLinked: false,

  setAuth: async (token, role, patientLinked = false) => {
    await saveToken(token);
    if (role) await saveRole(role);
    set({ token, role, isAuthenticated: true, patientLinked });
  },

  setPatientLinked: async (linked) => {
    await savePatientLinked(linked);
    set({ patientLinked: linked });
  },

  logout: async () => {
    await clearAll();
    set({ token: null, user: null, role: null, isAuthenticated: false, patientLinked: false });
  },

  loadStoredAuth: async () => {
    const token = await getToken();
    const role = await getRole();
    const patientLinked = await getPatientLinked();
    if (token) {
      set({ token, role, isAuthenticated: true, patientLinked });
    }
  },
}));
