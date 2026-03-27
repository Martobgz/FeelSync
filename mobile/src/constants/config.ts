export const Config = {
  API_BASE_URL: __DEV__ ? 'http://10.0.2.2:8080/api' : 'https://api.feelsync.app/api',
  SYNC_INTERVAL_MS: 60 * 60 * 1000,
  AGGREGATION_WINDOW_MS: 5 * 60 * 1000,
  BUFFER_CAPACITY: 300,
  DATA_RETENTION_DAYS: 30,
  BLE_RECONNECT_DELAYS_MS: [5_000, 30_000, 60_000, 300_000] as const,
  BLE_MTU: 512,
  BLE_SCAN_TIMEOUT_MS: 30_000,
};
