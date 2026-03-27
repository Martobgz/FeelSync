import { getDatabase } from '@/src/services/storage/database';
import { AggregatedBlock } from '@/src/types/biometric';

export function insertBlock(block: AggregatedBlock): number {
  const db = getDatabase();
  const result = db.runSync(
    `INSERT INTO raw_blocks (timestamp, avg_hr, min_hr, max_hr, hr_sample_count, avg_movement, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    block.timestamp,
    block.avgHr,
    block.minHr,
    block.maxHr,
    block.hrSampleCount,
    block.avgMovement
  );
  return result.lastInsertRowId;
}

export function getUnsyncedBlocks(limit = 100): AggregatedBlock[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: number;
    timestamp: number;
    avg_hr: number;
    min_hr: number;
    max_hr: number;
    hr_sample_count: number;
    avg_movement: number;
    synced: number;
  }>(`SELECT * FROM raw_blocks WHERE synced = 0 ORDER BY timestamp ASC LIMIT ?`, limit);

  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    avgHr: r.avg_hr,
    minHr: r.min_hr,
    maxHr: r.max_hr,
    hrSampleCount: r.hr_sample_count,
    avgMovement: r.avg_movement,
    synced: r.synced === 1,
  }));
}

export function markAsSynced(ids: number[]): void {
  if (ids.length === 0) return;
  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  db.runSync(`UPDATE raw_blocks SET synced = 1 WHERE id IN (${placeholders})`, ...ids);
}

export function deleteOlderThan(days: number): void {
  const db = getDatabase();
  const cutoff = Date.now() - days * 86_400_000;
  db.runSync(`DELETE FROM raw_blocks WHERE synced = 1 AND timestamp < ?`, cutoff);
}

export function getPendingCount(): number {
  const db = getDatabase();
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM raw_blocks WHERE synced = 0`
  );
  return row?.count ?? 0;
}
