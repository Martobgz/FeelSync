// All AsyncStorage keys used across the app.
// SecureStore keys live in services/storage/secure-storage.ts (separate storage system).
export const StorageKeys = {
  alerts:           'feelsync:alerts',
  linkedPatient:    'feelsync:linked_patient',
  medications:      'feelsync:medications',
  bleDeviceId:      'feelsync:ble_device_id',
  bleDeviceName:    'feelsync:ble_device_name',
  measurementsCache: (type: 'pulse' | 'sleep' | 'gsr', period: number) =>
    `feelsync:measurements_${type}_${period}`,
  medReminder: (date: string, medId: string, hhmm: string) =>
    `feelsync:med_remind:${date}:${medId}:${hhmm}`,
} as const;
