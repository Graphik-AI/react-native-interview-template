import type { LiveAlertEvent } from '../types/incident';

export type AlertListener = (event: LiveAlertEvent) => void;

const AMBIENT_TARGETS = ['INC-001', 'INC-002', 'INC-003', 'INC-004', 'INC-009'];

class AlertFeedService {
  private readonly listeners = new Set<AlertListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private sequence = 0;

  subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getListenerCount(): number {
    return this.listeners.size;
  }

  start(intervalMs = 4000): void {
    if (this.timer != null) {
      return;
    }
    this.timer = setInterval(() => {
      this.sequence += 1;
      const incidentId = AMBIENT_TARGETS[this.sequence % AMBIENT_TARGETS.length];
      this.emit({
        eventId: `evt-${this.sequence}`,
        incidentId,
        deltaAlerts: 1,
        timestamp: Date.now(),
      });
    }, intervalMs);
  }

  stop(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  emit(event: LiveAlertEvent): void {
    for (const listener of [...this.listeners]) {
      listener(event);
    }
  }

  emitBurst(count: number, incidentIds: readonly string[] = AMBIENT_TARGETS): void {
    const now = Date.now();
    for (let i = 0; i < count; i += 1) {
      this.sequence += 1;
      const incidentId = incidentIds[i % incidentIds.length];
      this.emit({
        eventId: `burst-${this.sequence}`,
        incidentId,
        deltaAlerts: 1,
        timestamp: now + i,
      });
    }
  }

  reset(): void {
    this.stop();
    this.listeners.clear();
    this.sequence = 0;
  }
}

export const alertFeed = new AlertFeedService();
