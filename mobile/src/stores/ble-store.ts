import { create } from 'zustand';

export type BleConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected';

interface BleState {
  connectionStatus: BleConnectionStatus;
  deviceId: string | null;
  deviceName: string | null;
  batteryLevel: number | null;
  lastHeartRate: number | null;
  isScanning: boolean;
  setConnectionStatus: (status: BleConnectionStatus) => void;
  setDevice: (id: string | null, name?: string | null) => void;
  setBatteryLevel: (level: number) => void;
  setLastHeartRate: (bpm: number) => void;
  setScanning: (scanning: boolean) => void;
  reset: () => void;
}

export const useBleStore = create<BleState>((set) => ({
  connectionStatus: 'disconnected',
  deviceId: null,
  deviceName: null,
  batteryLevel: null,
  lastHeartRate: null,
  isScanning: false,

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setDevice: (id, name = null) => set({ deviceId: id, deviceName: name }),
  setBatteryLevel: (level) => set({ batteryLevel: level }),
  setLastHeartRate: (bpm) => set({ lastHeartRate: bpm }),
  setScanning: (scanning) => set({ isScanning: scanning }),
  reset: () =>
    set({
      connectionStatus: 'disconnected',
      deviceId: null,
      deviceName: null,
      batteryLevel: null,
      lastHeartRate: null,
      isScanning: false,
    }),
}));
