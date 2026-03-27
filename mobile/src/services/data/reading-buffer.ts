import { Config } from '@/src/constants/config';
import { RawReading } from '@/src/types/biometric';

export class ReadingBuffer {
  private buffer: RawReading[] = [];
  private readonly capacity: number;

  constructor(capacity = Config.BUFFER_CAPACITY) {
    this.capacity = capacity;
  }

  push(reading: RawReading): void {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(reading);
  }

  getRange(fromMs: number, toMs: number): RawReading[] {
    return this.buffer.filter((r) => r.timestamp >= fromMs && r.timestamp <= toMs);
  }

  getAll(): RawReading[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }

  get size(): number {
    return this.buffer.length;
  }
}
