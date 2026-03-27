import { useEffect, useState } from 'react';

import {
  createMedication,
  deleteMedication as apiDeleteMedication,
  getMedications,
  updateMedication as apiUpdateMedication,
} from '@/src/services/api/medications-api';
import { Medication } from '@/src/types/medication';

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setIsLoading(true);
    const meds = await getMedications();
    setMedications(meds);
    setIsLoading(false);
  }

  async function addMedication(data: Omit<Medication, 'id'>) {
    await createMedication({
      name: data.name,
      currentAmount: data.currentAmount,
      dailyDose: data.dailyDose,
      intakeTimes: data.intakeTimes,
      wristbandNotifications: data.wristbandNotifications,
    });
    await refresh();
  }

  async function editMedication(id: string, data: Omit<Medication, 'id'>) {
    await apiUpdateMedication(id, {
      name: data.name,
      currentAmount: data.currentAmount,
      dailyDose: data.dailyDose,
      intakeTimes: data.intakeTimes,
      wristbandNotifications: data.wristbandNotifications,
    });
    await refresh();
  }

  async function removeMedication(id: string) {
    await apiDeleteMedication(id);
    await refresh();
  }

  async function setIntakeTimes(id: string, times: string[]) {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    await editMedication(id, { ...med, intakeTimes: times });
  }

  async function setWristbandNotifications(id: string, enabled: boolean) {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    await editMedication(id, { ...med, wristbandNotifications: enabled });
  }

  return {
    medications,
    isLoading,
    addMedication,
    updateMedication: editMedication,
    deleteMedication: removeMedication,
    setIntakeTimes,
    setWristbandNotifications,
  };
}
