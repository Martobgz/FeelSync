import NetInfo from '@react-native-community/netinfo';

import { postBiometricsBatch } from '@/src/services/api/biometrics-api';
import { deleteOlderThan, getUnsyncedBlocks, markAsSynced } from '@/src/services/data/biometrics-dao';
import { useSyncStore } from '@/src/stores/sync-store';
import { Config } from '@/src/constants/config';

interface SyncResult {
  success: boolean;
  syncedCount: number;
}

class SyncManager {
  private isSyncing = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  async syncNow(): Promise<SyncResult> {
    if (this.isSyncing) return { success: false, syncedCount: 0 };

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return { success: false, syncedCount: 0 };

    this.isSyncing = true;
    const syncStore = useSyncStore.getState();
    syncStore.setSyncing();

    try {
      const blocks = getUnsyncedBlocks(100);
      if (blocks.length === 0) {
        syncStore.setSynced(0);
        return { success: true, syncedCount: 0 };
      }

      await postBiometricsBatch(blocks);

      const ids = blocks.map((b) => b.id!).filter(Boolean);
      markAsSynced(ids);
      deleteOlderThan(Config.DATA_RETENTION_DAYS);

      const remaining = getUnsyncedBlocks(1).length > 0 ? 1 : 0;
      syncStore.setSynced(remaining);

      return { success: true, syncedCount: blocks.length };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) {
        // 4xx — bad request, skip these blocks
        const blocks = getUnsyncedBlocks(100);
        const ids = blocks.map((b) => b.id!).filter(Boolean);
        markAsSynced(ids);
        syncStore.setSynced(0);
      } else {
        // 5xx or network error — retry next cycle
        syncStore.setError('Sync failed, will retry next cycle');
      }
      return { success: false, syncedCount: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  startScheduled(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.syncNow();
    }, Config.SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

let manager: SyncManager | null = null;

export function getSyncManager(): SyncManager {
  if (!manager) manager = new SyncManager();
  return manager;
}
