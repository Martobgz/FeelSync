// ESP32 custom service/characteristic UUIDs (matches first-try-connection.ino)
export const BLE_UUIDS = {
  // FeelSync wristband (ESP32 custom service)
  FEELSYNC_SERVICE: '12345678-1234-1234-1234-1234567890ab',
  FEELSYNC_RX: 'abcdefab-1234-1234-1234-abcdefabcdef', // phone → ESP32 (WRITE-only)

  // Standard GATT — reserved for when real sensors are added to the ESP32
  HEART_RATE_SERVICE: '0000180d-0000-1000-8000-00805f9b34fb',
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  ACCELEROMETER_SERVICE: '0000fff0-0000-1000-8000-00805f9b34fb',
  ACCELEROMETER_DATA: '0000fff1-0000-1000-8000-00805f9b34fb',
} as const;
