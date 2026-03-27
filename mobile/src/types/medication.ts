export interface Medication {
  id: string;
  serverId?: number;
  name: string;
  currentAmount: number;
  dailyDose: number;
  addedDate?: string; // ISO date string from server e.g. "2024-01-01"
  notificationId?: string;
  intakeTimes: string[]; // "HH:MM" 24h strings, e.g. ["08:00", "20:00"]
}
