export type Severity = 'P1' | 'P2' | 'P3';

export type SeverityFilter = 'ALL' | Severity;

export type IncidentStatus = 'OPEN' | 'ACK' | 'RESOLVED';

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  alertCount: number;
  updatedAt: number;
  summary: string;
}

export interface LiveAlertEvent {
  eventId: string;
  incidentId: string;
  status?: IncidentStatus;
  deltaAlerts?: number;
  summary?: string;
  timestamp: number;
}
