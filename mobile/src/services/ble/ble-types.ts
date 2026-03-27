export type BleConnectionState = 'disconnected' | 'scanning' | 'connecting' | 'connected';

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

export interface ParsedHeartRate {
  bpm: number;
  timestamp: number;
}

export interface ParsedAccelerometer {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface BleServiceInterface {
  startScan(onDeviceFound: (device: ScannedDevice) => void): Promise<void>;
  stopScan(): void;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  onHeartRate(callback: (reading: ParsedHeartRate) => void): () => void;
  onAccelerometer(callback: (reading: ParsedAccelerometer) => void): () => void;
  onBattery(callback: (level: number) => void): () => void;
  onConnectionStateChange(callback: (state: BleConnectionState) => void): () => void;
  writeToDevice(message: string): Promise<void>;
  getConnectionState(): BleConnectionState;
  destroy(): void;
}
