import { BleServiceInterface } from './ble-types';
import { RealBleManager } from './ble-manager';

let instance: BleServiceInterface | null = null;

export function getBleService(): BleServiceInterface {
  if (!instance) {
    instance = new RealBleManager();
  }
  return instance;
}

export function destroyBleService(): void {
  instance?.destroy();
  instance = null;
}
