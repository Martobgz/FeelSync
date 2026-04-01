import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys that were renamed from underscore to colon separator.
// Maps old key pattern → new key (for static keys) or migration fn (for dynamic keys).
const LEGACY_STATIC_KEYS: Record<string, string> = {
  'feelsync_measurements_pulse_7':  'feelsync:measurements_pulse_7',
  'feelsync_measurements_pulse_30': 'feelsync:measurements_pulse_30',
  'feelsync_measurements_sleep_7':  'feelsync:measurements_sleep_7',
  'feelsync_measurements_sleep_30': 'feelsync:measurements_sleep_30',
  'feelsync_measurements_gsr_7':    'feelsync:measurements_gsr_7',
  'feelsync_measurements_gsr_30':   'feelsync:measurements_gsr_30',
};

const MIGRATION_DONE_KEY = 'feelsync:storage_migration_v1';

/**
 * One-time migration: moves data from legacy underscore-separator keys
 * to the standardized colon-separator keys and removes the old entries.
 * Safe to call on every app start — exits immediately after the first run.
 */
export async function migrateStorageKeys(): Promise<void> {
  const alreadyDone = await AsyncStorage.getItem(MIGRATION_DONE_KEY);
  if (alreadyDone) return;

  const pairs = await AsyncStorage.multiGet(Object.keys(LEGACY_STATIC_KEYS));
  const toSet: [string, string][] = [];
  const toRemove: string[] = [];

  for (const [oldKey, value] of pairs) {
    if (value !== null) {
      const newKey = LEGACY_STATIC_KEYS[oldKey];
      if (newKey) {
        toSet.push([newKey, value]);
        toRemove.push(oldKey);
      }
    }
  }

  if (toSet.length > 0) await AsyncStorage.multiSet(toSet);
  if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);

  await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true');
}
