import { create } from 'zustand';

import { AggregatedBlock } from '@/src/types/biometric';

interface BiometricsState {
  latestBlock: AggregatedBlock | null;
  pendingCount: number;
  setLatestBlock: (block: AggregatedBlock) => void;
  setPendingCount: (count: number) => void;
}

export const useBiometricsStore = create<BiometricsState>((set) => ({
  latestBlock: null,
  pendingCount: 0,
  setLatestBlock: (block) => set({ latestBlock: block }),
  setPendingCount: (count) => set({ pendingCount: count }),
}));
