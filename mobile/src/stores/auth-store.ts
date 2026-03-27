import { create } from 'zustand';

import { User, UserRole } from '@/src/types/auth';
import { clearAll, getRole, getToken, saveRole, saveToken } from '@/src/services/storage/secure-storage';

interface AuthState {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  setAuth: (token: string, role: UserRole, user?: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  role: null,
  isAuthenticated: false,

  setAuth: async (token, role, user) => {
    await saveToken(token);
    await saveRole(role);
    set({ token, role, isAuthenticated: true, user: user as User ?? null });
  },

  logout: async () => {
    await clearAll();
    set({ token: null, user: null, role: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    const token = await getToken();
    const role = await getRole();
    if (token && role) {
      set({ token, role, isAuthenticated: true });
    }
  },
}));
