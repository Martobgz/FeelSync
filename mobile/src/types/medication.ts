export interface Medication {
  id: string;
  name: string;
  currentAmount: number;
  dailyDose: number;
  notificationId?: string;
  intakeTimes: string[]; // "HH:MM" 24h strings, e.g. ["08:00", "20:00"]
}
