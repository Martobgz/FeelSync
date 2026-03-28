import { Alert } from '@/src/types/alert';
import { handleIncomingAlert } from './alert-notifications';

const SAMPLE_ALERTS: Array<Omit<Alert, 'id' | 'timestamp' | 'read'>> = [
  {
    type: 'HIGH_HR',
    severity: 'critical',
    title: 'High Heart Rate Detected',
    body: 'Patient sustained 138 bpm for over 10 minutes. Possible manic episode in progress.',
  },
  {
    type: 'LOW_HR',
    severity: 'warning',
    title: 'Low Heart Rate Detected',
    body: "Patient's resting heart rate fell to 42 bpm. Possible depressive episode indicator.",
  },
  {
    type: 'ANOMALY',
    severity: 'warning',
    title: 'Biometric Anomaly Detected',
    body: 'Unusual heart rate variability pattern over the last 3 hours. Review recent data.',
  },
  {
    type: 'LOW_MEDICATION',
    severity: 'info',
    title: 'Medication Running Low',
    body: 'Patient has approximately 3 days of Lithium remaining. Please arrange a refill.',
  },
  {
    type: 'DEVICE_DISCONNECTED',
    severity: 'info',
    title: 'Wristband Disconnected',
    body: "Patient's wristband has been disconnected for over 2 hours. Data collection paused.",
  },
];

export async function fireRandomAlert(): Promise<void> {
  const template = SAMPLE_ALERTS[Math.floor(Math.random() * SAMPLE_ALERTS.length)];
  const alert: Alert = {
    ...template,
    id: Date.now().toString(),
    timestamp: Date.now(),
    read: false,
  };
  await handleIncomingAlert(alert);
}

export async function fireAlert(index: number): Promise<void> {
  const template = SAMPLE_ALERTS[index % SAMPLE_ALERTS.length];
  const alert: Alert = {
    ...template,
    id: Date.now().toString(),
    timestamp: Date.now(),
    read: false,
  };
  await handleIncomingAlert(alert);
}
