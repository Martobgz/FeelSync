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

  // Discovered at runtime after connecting — not hardcoded
  private rxServiceUUID: string | null = null;
  private rxCharUUID: string | null = null;

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

    // No UUID filter — ESP32 doesn't advertise service UUID in ad packets.
    // Name prefix filter is applied in the callback so only FeelSync devices are surfaced.
    this.manager.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.warn('[BLE] Scan error:', error.message);
          this.setState('disconnected');
          return;
        }
        if (!device) return;
        const name = device.name ?? device.localName ?? null;
        onDeviceFound({ id: device.id, name, rssi: device.rssi });
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

    // Walk all discovered services/characteristics dynamically
    await this.discoverAndSubscribe(device);

    // Handle unexpected disconnect
    device.onDisconnected((_error, _d) => {
      this.connectedDevice = null;
      this.rxServiceUUID = null;
      this.rxCharUUID = null;
      this.setState('disconnected');
      this.clearSubscriptions();
      this.reconnect.scheduleNextAttempt(() => this.connect(deviceId));
    });
  }

  // ─── Dynamic service discovery ──────────────────────────────────────────────

  private async discoverAndSubscribe(device: Device): Promise<void> {
    const services = await device.services();

    for (const service of services) {
      const chars = await service.characteristics();
      const svcUUID = service.uuid.toLowerCase();

      for (const char of chars) {
        const charUUID = char.uuid.toLowerCase();

        // First writable characteristic found → RX channel (commands phone → device)
        if (char.isWritableWithResponse && !this.rxCharUUID) {
          this.rxServiceUUID = svcUUID;
          this.rxCharUUID = charUUID;
        }

        // Readable battery characteristic → do an initial read
        if (char.isReadable && charUUID === BLE_UUIDS.BATTERY_LEVEL) {
          try {
            const c = await device.readCharacteristicForService(svcUUID, charUUID);
            if (c.value) {
              const level = base64ToBytes(c.value)[0];
              this.batteryCallbacks.forEach((cb) => cb(level));
            }
          } catch {
            // Battery read failed — not critical
          }
        }

        // Notifiable / indicatable → subscribe; data routed by characteristic UUID
        if (char.isNotifiable || char.isIndicatable) {
          const sub = device.monitorCharacteristicForService(
            svcUUID,
            charUUID,
            (error, c) => {
              if (error || !c?.value) return;
              this.handleCharacteristicUpdate(charUUID, base64ToBytes(c.value));
            }
          );
          this.subscriptions.push(sub);
        }
      }
    }
  }

  private handleCharacteristicUpdate(charUUID: string, bytes: number[]): void {
    switch (charUUID) {
      case BLE_UUIDS.HEART_RATE_MEASUREMENT: {
        const bpm = parseHeartRate(bytes);
        this.hrCallbacks.forEach((cb) => cb({ bpm, timestamp: Date.now() }));
        break;
      }
      case BLE_UUIDS.BATTERY_LEVEL: {
        this.batteryCallbacks.forEach((cb) => cb(bytes[0]));
        break;
      }
      case BLE_UUIDS.ACCELEROMETER_DATA: {
        if (bytes.length < 6) return;
        const { x, y, z } = parseAccelerometer(bytes);
        this.accelCallbacks.forEach((cb) => cb({ x, y, z, timestamp: Date.now() }));
        break;
      }
      // Unknown characteristics silently ignored
    }
  }

  // ─── Write ──────────────────────────────────────────────────────────────────

  async writeToDevice(message: string): Promise<void> {
    if (!this.connectedDevice) throw new Error('Not connected');
    if (!this.rxServiceUUID || !this.rxCharUUID) {
      throw new Error('No writable characteristic discovered on this device');
    }
    const b64 = btoa(message);
    await this.connectedDevice.writeCharacteristicWithResponseForService(
      this.rxServiceUUID,
      this.rxCharUUID,
      b64
    );
  }

  async disconnect(): Promise<void> {
    this.reconnect.cancel();
    this.clearSubscriptions();
    this.rxServiceUUID = null;
    this.rxCharUUID = null;
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
    this.setState('disconnected');
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
