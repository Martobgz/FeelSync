export type Esp32BiodataType =
  | 'pulse'
  | 'spo2'
  | 'movement'
  | 'gsr';

export type Movement = 'STILL' | 'WALKING' | 'RUNNING';

export interface Esp32BiodataReading {
  type: Esp32BiodataType;
  value: number;
  timestamp: number;
}

// Matches ESP32 enum DataType : uint16_t
const TYPE_AVG_HEART_BEATS = 1;
const TYPE_SPO2 = 2;
const TYPE_MOVEMENT = 3;
const TYPE_GSR_STATE = 4;

function readUint16LE(bytes: number[], offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

export function parseEsp32BlePacket(bytes: number[]): Esp32BiodataReading | null {
  // BlePacket is packed: uint16 type + uint16 value = 4 bytes
  if (bytes.length < 4) return null;

  const type = readUint16LE(bytes, 0);
  const value = readUint16LE(bytes, 2);
  const timestamp = Date.now();

  switch (type) {
    case TYPE_AVG_HEART_BEATS:
      return { type: 'pulse', value, timestamp };
    case TYPE_SPO2:
      return { type: 'spo2', value, timestamp };
    case TYPE_MOVEMENT:
      return { type: 'movement', value, timestamp };
    case TYPE_GSR_STATE:
      return { type: 'gsr', value, timestamp };
    default:
      return null;
  }
}

export function movementFromEspValue(value: number): Movement {
  // New firmware sends MotionState: 1=STILL, 2=WALKING, 3=RUNNING
  if (value <= 1) return 'STILL';
  if (value === 2) return 'WALKING';
  return 'RUNNING';
}
