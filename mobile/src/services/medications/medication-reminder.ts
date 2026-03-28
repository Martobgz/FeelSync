import AsyncStorage from '@react-native-async-storage/async-storage';

import { Medication } from '@/src/types/medication';

export interface IntakeSlot {
  medicationId: string;
  medicationName: string;
  intakeTime: string; // "HH:MM"
  scheduledAt: Date;  // absolute Date for today
}

/** Combines a calendar date with an "HH:MM" string into an absolute Date. */
export function getIntakeDatetime(date: Date, hhmm: string): Date {
  const [hh, mm] = hhmm.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hh, mm, 0, 0);
  return result;
}

/** Returns intake slots scheduled in the next `windowMs` milliseconds (default 5 min). */
export function getUpcomingIntakes(
  medications: Medication[],
  now: Date,
  windowMs = 5 * 60 * 1000
): IntakeSlot[] {
  const slots: IntakeSlot[] = [];
  const windowEnd = new Date(now.getTime() + windowMs);

  for (const med of medications) {
    for (const hhmm of med.intakeTimes) {
      const scheduledAt = getIntakeDatetime(now, hhmm);
      if (scheduledAt >= now && scheduledAt <= windowEnd) {
        slots.push({ medicationId: med.id, medicationName: med.name, intakeTime: hhmm, scheduledAt });
      }
    }
  }

  return slots;
}

/** Returns intake slots that passed within `windowMs` ms before `now` (default 30 min). */
export function getMissedIntakes(
  medications: Medication[],
  now: Date,
  windowMs = 30 * 60 * 1000
): IntakeSlot[] {
  const slots: IntakeSlot[] = [];
  const windowStart = new Date(now.getTime() - windowMs);

  for (const med of medications) {
    for (const hhmm of med.intakeTimes) {
      const scheduledAt = getIntakeDatetime(now, hhmm);
      if (scheduledAt >= windowStart && scheduledAt < now) {
        slots.push({ medicationId: med.id, medicationName: med.name, intakeTime: hhmm, scheduledAt });
      }
    }
  }

  return slots;
}

/** Builds a deterministic daily key for a given intake slot. */
export function buildReminderKey(medId: string, date: Date, hhmm: string): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `feelsync:med_remind:${yyyy}-${mm}-${dd}:${medId}:${hhmm}`;
}

/** Returns true if this intake slot has already been reminded today. */
export async function wasReminded(key: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(key);
  return value === 'true';
}

/** Marks an intake slot as reminded so it won't fire again today. */
export async function markReminded(key: string): Promise<void> {
  await AsyncStorage.setItem(key, 'true');
}
