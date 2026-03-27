import { getDatabase } from '@/src/services/storage/database';
import { Medication } from '@/src/types/medication';

export function upsertMedications(medications: Medication[]): void {
  const db = getDatabase();
  for (const med of medications) {
    db.runSync(
      `INSERT OR REPLACE INTO medications
         (server_id, name, current_amount, daily_dose, added_date, intake_times, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      med.serverId ?? null,
      med.name,
      med.currentAmount,
      med.dailyDose,
      med.addedDate ?? null,
      JSON.stringify(med.intakeTimes ?? []),
      Date.now()
    );
  }
}

export function getCachedMedications(): Medication[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: number;
    server_id: number | null;
    name: string;
    current_amount: number;
    daily_dose: number;
    added_date: string | null;
    intake_times: string;
  }>(`SELECT * FROM medications ORDER BY name ASC`);

  return rows.map((r) => ({
    id: String(r.id),
    serverId: r.server_id ?? undefined,
    name: r.name,
    currentAmount: r.current_amount,
    dailyDose: r.daily_dose,
    addedDate: r.added_date ?? undefined,
    intakeTimes: JSON.parse(r.intake_times) as string[],
  }));
}

export function clearMedications(): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM medications`);
}
