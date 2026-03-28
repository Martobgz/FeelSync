export type AlertType =
  | 'HIGH_HR'
  | 'LOW_HR'
  | 'ANOMALY'
  | 'LOW_MEDICATION'
  | 'DEVICE_DISCONNECTED';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  body: string;
  timestamp: number; // ms epoch
  read: boolean;
}
