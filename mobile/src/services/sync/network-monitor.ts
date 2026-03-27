import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { getSyncManager } from './sync-manager';

let unsubscribe: (() => void) | null = null;
let wasOffline = false;

export function startNetworkMonitor(): void {
  if (unsubscribe) return;

  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isOnline = state.isConnected === true && state.isInternetReachable !== false;

    if (wasOffline && isOnline) {
      // Came back online — sync immediately
      getSyncManager().syncNow();
    }

    wasOffline = !isOnline;
  });
}

export function stopNetworkMonitor(): void {
  unsubscribe?.();
  unsubscribe = null;
}
