import { Config } from '@/src/constants/config';

export class BleReconnect {
  private delayIndex = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isCancelled = false;

  start(onAttempt: () => void): void {
    this.isCancelled = false;
    this.scheduleNext(onAttempt);
  }

  private scheduleNext(onAttempt: () => void): void {
    if (this.isCancelled) return;

    const delays = Config.BLE_RECONNECT_DELAYS_MS;
    const delay = delays[Math.min(this.delayIndex, delays.length - 1)];
    this.delayIndex = Math.min(this.delayIndex + 1, delays.length - 1);

    this.timeoutId = setTimeout(() => {
      if (!this.isCancelled) {
        onAttempt();
        // Next attempt scheduled by caller if this one fails
      }
    }, delay);
  }

  scheduleNextAttempt(onAttempt: () => void): void {
    this.scheduleNext(onAttempt);
  }

  onConnected(): void {
    this.delayIndex = 0;
    this.cancel();
  }

  cancel(): void {
    this.isCancelled = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
