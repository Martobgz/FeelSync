import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';

import { Config } from '@/src/constants/config';
import { StorageKeys } from '@/src/constants/storage-keys';
import { getDataPipeline } from '@/src/services/data/data-pipeline';
import { getBleService } from '@/src/services/ble';
import { requestBlePermissions } from '@/src/services/ble/ble-permissions';
import { ScannedDevice } from '@/src/services/ble/ble-types';
import { useBleStore } from '@/src/stores/ble-store';

const DEVICE_ID_KEY = StorageKeys.bleDeviceId;
const DEVICE_NAME_KEY = StorageKeys.bleDeviceName;

export function useBleConnection() {
  const setConnectionStatus = useBleStore((s) => s.setConnectionStatus);
  const setDevice = useBleStore((s) => s.setDevice);
  const setBatteryLevel = useBleStore((s) => s.setBatteryLevel);
  const setLastHeartRate = useBleStore((s) => s.setLastHeartRate);
  const setScanning = useBleStore((s) => s.setScanning);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const ble = getBleService();
    const pipeline = getDataPipeline();

    // Auto-reconnect to last paired device (best-effort).
    // Uses a short pre-scan to confirm the device is in range.
    (async () => {
      try {
        const savedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        const savedName = await AsyncStorage.getItem(DEVICE_NAME_KEY);
        if (!isMounted.current) return;
        if (savedId) {
          setDevice(savedId, savedName);

          const hasPermission = await requestBlePermissions();
          if (!hasPermission) return;

          const found = await new Promise<boolean>((resolve) => {
            let done = false;
            const timeout = setTimeout(() => {
              if (done) return;
              done = true;
              ble.stopScan();
              resolve(false);
            }, Config.BLE_SCAN_TIMEOUT_MS);

            void ble.startScan((d) => {
              if (done) return;
              if (d.id === savedId) {
                done = true;
                clearTimeout(timeout);
                ble.stopScan();
                resolve(true);
              }
            });
          });

          if (found) {
            await ble.connect(savedId);
          }
        }
      } catch {
        // Ignore on startup; user can connect manually.
      }
    })();

    const unsubState = ble.onConnectionStateChange((state) => {
      if (!isMounted.current) return;
      setConnectionStatus(state);
      setScanning(state === 'scanning');
    });

    const unsubHr = ble.onHeartRate((reading) => {
      if (!isMounted.current) return;
      setLastHeartRate(reading.bpm);
      pipeline.onReading({
        timestamp: reading.timestamp,
        heartRate: reading.bpm,
      });
    });

    const unsubAccel = ble.onAccelerometer((reading) => {
      if (!isMounted.current) return;
      pipeline.onReading({
        timestamp: reading.timestamp,
        heartRate: 0, // accel-only reading
        accelX: reading.x,
        accelY: reading.y,
        accelZ: reading.z,
      });
    });

    const unsubBattery = ble.onBattery((level) => {
      if (!isMounted.current) return;
      setBatteryLevel(level);
    });

    // Auto-connect disabled — connect manually via the Live HR tab

    return () => {
      isMounted.current = false;
      unsubState();
      unsubHr();
      unsubAccel();
      unsubBattery();
    };
  }, [setConnectionStatus, setDevice, setBatteryLevel, setLastHeartRate, setScanning]);

  async function startScan(onDeviceFound: (device: ScannedDevice) => void): Promise<void> {
    const hasPermission = await requestBlePermissions();
    if (!hasPermission) return;
    await getBleService().startScan(onDeviceFound);
  }

  function stopScan(): void {
    getBleService().stopScan();
  }

  async function connect(deviceId: string, deviceName?: string | null): Promise<void> {
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    if (deviceName) await AsyncStorage.setItem(DEVICE_NAME_KEY, deviceName);
    setDevice(deviceId, deviceName);
    await getBleService().connect(deviceId);
  }

  async function disconnect(): Promise<void> {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    await AsyncStorage.removeItem(DEVICE_NAME_KEY);
    setDevice(null);
    await getBleService().disconnect();
  }

  async function sendMessage(message: string): Promise<void> {
    await getBleService().writeToDevice(message);
  }

  return { startScan, stopScan, connect, disconnect, sendMessage };
}
