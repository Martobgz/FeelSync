function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  // Our Spring controllers are mounted under /api/*.
  // If the env var is set to just http(s)://host:port, append /api.
  if (/\/api(\/|$)/.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
}

export const Config = {
  API_BASE_URL: normalizeApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://home-server.tailbcaeb8.ts.net/api'
  ),
  SYNC_INTERVAL_MS: 60 * 60 * 1000,
  AGGREGATION_WINDOW_MS: 5 * 60 * 1000,
  BUFFER_CAPACITY: 300,
  DATA_RETENTION_DAYS: 30,
  BLE_RECONNECT_DELAYS_MS: [5_000, 30_000, 60_000, 300_000] as const,
  BLE_MTU: 512,
  BLE_SCAN_TIMEOUT_MS: 30_000,
  BLE_DEVICE_PREFIX: 'FeelSync-',
};
