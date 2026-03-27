import { create } from 'zustand';

import { SyncStatus } from '@/src/types/biometric';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncTime: number | null;
  error: string | null;
  setSyncing: () => void;
  setSynced: (pendingCount: number) => void;
  setError: (message: string) => void;
  setPendingCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  pendingCount: 0,
  lastSyncTime: null,
  error: null,

  setSyncing: () => set({ status: 'syncing', error: null }),
  setSynced: (pendingCount) => set({ status: 'idle', lastSyncTime: Date.now(), pendingCount }),
  setError: (message) => set({ status: 'error', error: message }),
  setPendingCount: (count) => set({ pendingCount: count }),
}));
