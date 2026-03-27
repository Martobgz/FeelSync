import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';

import { getDataPipeline } from '@/src/services/data/data-pipeline';
import { getBleService } from '@/src/services/ble';
import { requestBlePermissions } from '@/src/services/ble/ble-permissions';
import { ScannedDevice } from '@/src/services/ble/ble-types';
import { useBleStore } from '@/src/stores/ble-store';

const DEVICE_ID_KEY = 'feelsync:ble_device_id';
const DEVICE_NAME_KEY = 'feelsync:ble_device_name';

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

    // Auto-connect to saved device
    AsyncStorage.getItem(DEVICE_ID_KEY).then(async (savedId) => {
      if (savedId && isMounted.current) {
        const savedName = await AsyncStorage.getItem(DEVICE_NAME_KEY);
        setDevice(savedId, savedName);
        try {
          await ble.connect(savedId);
        } catch {
          // Reconnect will be handled by BleManager internally
        }
      }
    });

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

  return { startScan, connect, disconnect, sendMessage };
}
