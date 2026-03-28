import { useEffect, useRef } from 'react';

import { getBleService } from '@/src/services/ble';
import {
  buildReminderKey,
  getMissedIntakes,
  getUpcomingIntakes,
  markReminded,
  wasReminded,
} from '@/src/services/medications/medication-reminder';
import { useBleStore } from '@/src/stores/ble-store';
import { useMedicationRemindersStore } from '@/src/stores/medication-reminders-store';
import { useMedicationsStore } from '@/src/stores/medications-store';

const POLL_INTERVAL_MS = 30_000;

export function useMedicationReminders(): void {
  const medications = useMedicationsStore((s) => s.medications);
  const connectionStatus = useBleStore((s) => s.connectionStatus);
  const addReminder = useMedicationRemindersStore((s) => s.addReminder);

  const prevConnectionStatus = useRef(connectionStatus);

  async function fireReminder(
    key: string,
    medicationName: string,
    intakeTime: string,
    missedAt?: Date
  ): Promise<void> {
    if (await wasReminded(key)) return;
    await markReminded(key);
    addReminder({ id: key, medicationName, intakeTime, missedAt });

    // Attempt to vibrate — fire-and-forget, ignore errors
    try {
      await getBleService().writeToDevice('VIBRATE');
    } catch {
      // BLE may not be available; reminder popup still shows
    }
  }

  // Upcoming intake check — runs on every poll tick
  async function checkUpcoming(): Promise<void> {
    const now = new Date();
    const slots = getUpcomingIntakes(medications, now);
    for (const slot of slots) {
      const key = buildReminderKey(slot.medicationId, now, slot.intakeTime);
      await fireReminder(key, slot.medicationName, slot.intakeTime);
    }
  }

  // Missed intake check — runs once when BLE reconnects
  async function checkMissed(): Promise<void> {
    const now = new Date();
    const slots = getMissedIntakes(medications, now);
    for (const slot of slots) {
      const key = buildReminderKey(slot.medicationId, now, slot.intakeTime);
      await fireReminder(key, slot.medicationName, slot.intakeTime, slot.scheduledAt);
    }
  }

  // Poll every 30 s for upcoming intakes
  useEffect(() => {
    // Run immediately on mount in case we're already inside a window
    void checkUpcoming();
    const id = setInterval(() => { void checkUpcoming(); }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medications]);

  // Catch-up check when BLE transitions to connected
  useEffect(() => {
    if (
      connectionStatus === 'connected' &&
      prevConnectionStatus.current !== 'connected'
    ) {
      void checkMissed();
    }
    prevConnectionStatus.current = connectionStatus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus, medications]);
}
