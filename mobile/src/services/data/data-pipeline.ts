import { Config } from '@/src/constants/config';
import { useBiometricsStore } from '@/src/stores/biometrics-store';
import { useSyncStore } from '@/src/stores/sync-store';
import { RawReading } from '@/src/types/biometric';
import { aggregateReadings } from './aggregator';
import { insertBlock, getPendingCount } from './biometrics-dao';
import { ReadingBuffer } from './reading-buffer';
import { isPlausibleChange, isValidHeartRate, isValidTimestamp } from './reading-validator';

class DataPipeline {
  private buffer = new ReadingBuffer();
  private windowStart: number = this.alignedWindowStart(Date.now());
  private lastHr: number | null = null;
  private lastHrTimestamp: number | null = null;

  private alignedWindowStart(now: number): number {
    const windowMs = Config.AGGREGATION_WINDOW_MS;
    return Math.floor(now / windowMs) * windowMs;
  }

  onReading(reading: RawReading): void {
    if (!isValidTimestamp(reading.timestamp)) return;

    // Validate heart rate
    if (reading.heartRate > 0) {
      if (!isValidHeartRate(reading.heartRate)) return;

      if (
        this.lastHr !== null &&
        this.lastHrTimestamp !== null &&
        !isPlausibleChange(this.lastHr, reading.heartRate, reading.timestamp - this.lastHrTimestamp)
      ) {
        return;
      }

      this.lastHr = reading.heartRate;
      this.lastHrTimestamp = reading.timestamp;
    }

    this.buffer.push(reading);
    this.checkWindowBoundary(reading.timestamp);
  }

  private checkWindowBoundary(now: number): void {
    const windowEnd = this.windowStart + Config.AGGREGATION_WINDOW_MS;
    if (now >= windowEnd) {
      this.flushWindow();
    }
  }

  private flushWindow(): void {
    const windowEnd = this.windowStart + Config.AGGREGATION_WINDOW_MS;
    const readings = this.buffer.getRange(this.windowStart, windowEnd);

    if (readings.length > 0) {
      const block = aggregateReadings(readings, this.windowStart);
      const id = insertBlock(block);
      block.id = id;

      useBiometricsStore.getState().setLatestBlock(block);

      const pendingCount = getPendingCount();
      useBiometricsStore.getState().setPendingCount(pendingCount);
      useSyncStore.getState().setPendingCount(pendingCount);
    }

    this.windowStart = this.alignedWindowStart(Date.now());
    this.buffer.clear();
  }
}

let pipeline: DataPipeline | null = null;

export function getDataPipeline(): DataPipeline {
  if (!pipeline) {
    pipeline = new DataPipeline();
  }
  return pipeline;
}
