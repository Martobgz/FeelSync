import { useEffect } from 'react';

import { registerBackgroundSync } from '@/src/services/sync/background-sync';
import { startNetworkMonitor, stopNetworkMonitor } from '@/src/services/sync/network-monitor';
import { getSyncManager } from '@/src/services/sync/sync-manager';
import { useSyncStore } from '@/src/stores/sync-store';

export function useSync() {
  const status = useSyncStore((s) => s.status);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const lastSyncTime = useSyncStore((s) => s.lastSyncTime);

  useEffect(() => {
    registerBackgroundSync();
    startNetworkMonitor();
    getSyncManager().startScheduled();

    return () => {
      stopNetworkMonitor();
      getSyncManager().stop();
    };
  }, []);

  return { status, pendingCount, lastSyncTime };
}
