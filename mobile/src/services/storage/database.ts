import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('feelsync.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = getDatabase();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS raw_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      avg_hr REAL NOT NULL,
      min_hr REAL NOT NULL,
      max_hr REAL NOT NULL,
      hr_sample_count INTEGER NOT NULL,
      avg_movement REAL NOT NULL DEFAULT 0,
      synced INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      current_amount INTEGER NOT NULL,
      daily_dose INTEGER NOT NULL,
      added_date TEXT,
      intake_times TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
  `);
}
