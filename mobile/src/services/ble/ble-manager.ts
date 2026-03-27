import { BleManager as RNBleManager, Device, Subscription } from 'react-native-ble-plx';

import { Config } from '@/src/constants/config';
import { BLE_UUIDS } from '@/src/constants/ble-uuids';
import {
  BleConnectionState,
  BleServiceInterface,
  ParsedAccelerometer,
  ParsedHeartRate,
  ScannedDevice,
} from './ble-types';
import { BleReconnect } from './ble-reconnect';

type HrCallback = (r: ParsedHeartRate) => void;
type AccelCallback = (r: ParsedAccelerometer) => void;
type BatteryCallback = (level: number) => void;
type StateCallback = (s: BleConnectionState) => void;

function base64ToBytes(b64: string): number[] {
  const binary = atob(b64);
  const bytes: number[] = [];
  for (let i = 0; i < binary.length; i++) bytes.push(binary.charCodeAt(i));
  return bytes;
}

function parseHeartRate(bytes: number[]): number {
  // Byte 0 = flags. Bit 0 = HR format: 0 = uint8, 1 = uint16LE
  const flags = bytes[0];
  if (flags & 0x01) return bytes[1] | (bytes[2] << 8);
  return bytes[1];
}

function parseAccelerometer(bytes: number[]): { x: number; y: number; z: number } {
  // 6 bytes: 3 × int16LE (X, Y, Z) in milli-g
  const view = new DataView(new Uint8Array(bytes).buffer);
  return {
    x: view.getInt16(0, true),
    y: view.getInt16(2, true),
    z: view.getInt16(4, true),
  };
}

export class RealBleManager implements BleServiceInterface {
  private manager: RNBleManager;
  private connectedDevice: Device | null = null;
  private connectionState: BleConnectionState = 'disconnected';
  private reconnect = new BleReconnect();
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  private hrCallbacks: Set<HrCallback> = new Set();
  private accelCallbacks: Set<AccelCallback> = new Set();
  private batteryCallbacks: Set<BatteryCallback> = new Set();
  private stateCallbacks: Set<StateCallback> = new Set();
  private subscriptions: Subscription[] = [];

  constructor() {
    this.manager = new RNBleManager();
  }

  // ─── Connection state ───────────────────────────────────────────────────────

  private setState(state: BleConnectionState) {
    this.connectionState = state;
    this.stateCallbacks.forEach((cb) => cb(state));
  }

  getConnectionState(): BleConnectionState {
    return this.connectionState;
  }

  // ─── Scan ───────────────────────────────────────────────────────────────────

  async startScan(onDeviceFound: (device: ScannedDevice) => void): Promise<void> {
    this.setState('scanning');

    // null = no service UUID filter (ESP32 doesn't advertise service UUID in packets)
    this.manager.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.warn('[BLE] Scan error:', error.message);
          this.setState('disconnected');
          return;
        }
        if (device) {
          onDeviceFound({
            id: device.id,
            name: device.name ?? device.localName ?? 'Unknown',
            rssi: device.rssi,
          });
        }
      }
    );

    this.scanTimeout = setTimeout(() => {
      this.stopScan();
    }, Config.BLE_SCAN_TIMEOUT_MS);
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    if (this.connectionState === 'scanning') {
      this.setState('disconnected');
    }
  }

  // ─── Connect ────────────────────────────────────────────────────────────────

  async connect(deviceId: string): Promise<void> {
    this.stopScan();
    this.setState('connecting');

    const device = await this.manager.connectToDevice(deviceId, {
      requestMTU: Config.BLE_MTU,
    });

    await device.discoverAllServicesAndCharacteristics();
    this.connectedDevice = device;
    this.setState('connected');
    this.reconnect.onConnected();

    // Standard GATT services — optional, only available when real sensors are added
    this.trySubscribeToHeartRate(device);
    this.tryReadBattery(device);
    this.trySubscribeToBattery(device);
    this.trySubscribeToAccelerometer(device);

    // Handle unexpected disconnect
    device.onDisconnected((_error, _d) => {
      this.connectedDevice = null;
      this.setState('disconnected');
      this.clearSubscriptions();
      this.reconnect.scheduleNextAttempt(() => this.connect(deviceId));
    });
  }

  async writeToDevice(message: string): Promise<void> {
    if (!this.connectedDevice) throw new Error('Not connected');
    const b64 = btoa(message);
    await this.connectedDevice.writeCharacteristicWithResponseForService(
      BLE_UUIDS.FEELSYNC_SERVICE,
      BLE_UUIDS.FEELSYNC_RX,
      b64
    );
  }

  async disconnect(): Promise<void> {
    this.reconnect.cancel();
    this.clearSubscriptions();
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
    this.setState('disconnected');
  }


  // ─── Standard GATT (optional — will silently skip if service not present) ───

  private trySubscribeToHeartRate(device: Device): void {
    try {
      const sub = device.monitorCharacteristicForService(
        BLE_UUIDS.HEART_RATE_SERVICE,
        BLE_UUIDS.HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const bytes = base64ToBytes(characteristic.value);
          const bpm = parseHeartRate(bytes);
          this.hrCallbacks.forEach((cb) => cb({ bpm, timestamp: Date.now() }));
        }
      );
      this.subscriptions.push(sub);
    } catch {
      // Heart rate service not present on this firmware
    }
  }

  private trySubscribeToAccelerometer(device: Device): void {
    try {
      const sub = device.monitorCharacteristicForService(
        BLE_UUIDS.ACCELEROMETER_SERVICE,
        BLE_UUIDS.ACCELEROMETER_DATA,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const bytes = base64ToBytes(characteristic.value);
          if (bytes.length < 6) return;
          const { x, y, z } = parseAccelerometer(bytes);
          this.accelCallbacks.forEach((cb) => cb({ x, y, z, timestamp: Date.now() }));
        }
      );
      this.subscriptions.push(sub);
    } catch {
      // Accelerometer service not present on this firmware
    }
  }

  private async tryReadBattery(device: Device): Promise<void> {
    try {
      const characteristic = await device.readCharacteristicForService(
        BLE_UUIDS.BATTERY_SERVICE,
        BLE_UUIDS.BATTERY_LEVEL
      );
      if (characteristic.value) {
        const level = base64ToBytes(characteristic.value)[0];
        this.batteryCallbacks.forEach((cb) => cb(level));
      }
    } catch {
      // Battery service not present on this firmware
    }
  }

  private trySubscribeToBattery(device: Device): void {
    try {
      const sub = device.monitorCharacteristicForService(
        BLE_UUIDS.BATTERY_SERVICE,
        BLE_UUIDS.BATTERY_LEVEL,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const level = base64ToBytes(characteristic.value)[0];
          this.batteryCallbacks.forEach((cb) => cb(level));
        }
      );
      this.subscriptions.push(sub);
    } catch {
      // Battery notifications not supported on this firmware
    }
  }

  private clearSubscriptions(): void {
    this.subscriptions.forEach((sub) => sub.remove());
    this.subscriptions = [];
  }

  // ─── Callback registration ──────────────────────────────────────────────────

  onHeartRate(callback: HrCallback): () => void {
    this.hrCallbacks.add(callback);
    return () => this.hrCallbacks.delete(callback);
  }

  onAccelerometer(callback: AccelCallback): () => void {
    this.accelCallbacks.add(callback);
    return () => this.accelCallbacks.delete(callback);
  }

  onBattery(callback: BatteryCallback): () => void {
    this.batteryCallbacks.add(callback);
    return () => this.batteryCallbacks.delete(callback);
  }

  onConnectionStateChange(callback: StateCallback): () => void {
    this.stateCallbacks.add(callback);
    return () => this.stateCallbacks.delete(callback);
  }

  destroy(): void {
    this.reconnect.cancel();
    this.clearSubscriptions();
    this.manager.destroy();
  }
}
