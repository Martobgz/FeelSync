export interface Medication {
  id: string;
  name: string;
  currentAmount: number;
  dailyDose: number;
  addedDate?: string; // ISO date string from server e.g. "2024-01-01"
  intakeTimes: string[]; // "HH:MM" 24h strings, e.g. ["08:00", "20:00"]
  wristbandNotifications: boolean;
}
