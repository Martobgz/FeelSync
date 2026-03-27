const HR_MIN = 40;
const HR_MAX = 200;
const HR_MAX_JUMP = 40;
const TIMESTAMP_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export function isValidHeartRate(bpm: number): boolean {
  return bpm >= HR_MIN && bpm <= HR_MAX;
}

export function isPlausibleChange(
  prevBpm: number,
  currentBpm: number,
  deltaMs: number
): boolean {
  if (deltaMs < 2000) {
    return Math.abs(currentBpm - prevBpm) <= HR_MAX_JUMP;
  }
  return true;
}

export function isValidTimestamp(timestamp: number): boolean {
  const now = Date.now();
  return timestamp <= now + 5_000 && timestamp >= now - TIMESTAMP_MAX_AGE_MS;
}
