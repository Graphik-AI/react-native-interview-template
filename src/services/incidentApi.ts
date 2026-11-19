import { createSeedIncidents } from '../data/seedIncidents';
import type { Incident, IncidentStatus } from '../types/incident';

export type LatencyResolver = (query: string) => number;

function defaultLatency(query: string): number {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return 60;
  }
  return trimmed.length <= 2 ? 280 : 45;
}

function createAbortError(): Error {
  const error = new Error('The request was aborted.');
  error.name = 'AbortError';
  return error;
}

class IncidentApiClient {
  private incidents: Incident[] = createSeedIncidents();
  private latencyResolver: LatencyResolver = defaultLatency;
  private ackLatencyMs = 120;
  private remainingAckFailures = 0;

  getSeedIncidents(): Incident[] {
    return this.incidents.map((item) => ({ ...item }));
  }

  searchIncidents(
    query: string,
    options?: { signal?: AbortSignal },
  ): Promise<Incident[]> {
    const signal = options?.signal;
    const normalized = query.trim().toLowerCase();
    const delayMs = this.latencyResolver(query);

    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(createAbortError());
        return;
      }

      const onAbort = () => {
        clearTimeout(timer);
        reject(createAbortError());
      };

      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        const matches = this.incidents
          .filter((item) => {
            if (normalized.length === 0) {
              return true;
            }
            return (
              item.id.toLowerCase().includes(normalized) ||
              item.title.toLowerCase().includes(normalized) ||
              item.service.toLowerCase().includes(normalized)
            );
          })
          .map((item) => ({ ...item }));
        resolve(matches);
      }, delayMs);

      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  acknowledgeIncident(id: string): Promise<Incident> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.remainingAckFailures > 0) {
          this.remainingAckFailures -= 1;
          reject(new Error(`Unable to acknowledge ${id}. Please retry.`));
          return;
        }
        const existing = this.incidents.find((item) => item.id === id);
        if (!existing) {
          reject(new Error(`Incident ${id} not found.`));
          return;
        }
        existing.status = 'ACK';
        existing.updatedAt = Date.now();
        resolve({ ...existing });
      }, this.ackLatencyMs);
    });
  }

  patchServerIncident(
    id: string,
    patch: Partial<Pick<Incident, 'status' | 'alertCount' | 'summary' | 'updatedAt'>>,
  ): void {
    const existing = this.incidents.find((item) => item.id === id);
    if (!existing) {
      return;
    }
    Object.assign(existing, patch);
  }

  setLatencyResolver(resolver: LatencyResolver): void {
    this.latencyResolver = resolver;
  }

  setAckLatencyMs(ms: number): void {
    this.ackLatencyMs = ms;
  }

  failNextAck(count = 1): void {
    this.remainingAckFailures = count;
  }

  setIncidentStatusForTest(id: string, status: IncidentStatus): void {
    this.patchServerIncident(id, { status });
  }

  reset(): void {
    this.incidents = createSeedIncidents();
    this.latencyResolver = defaultLatency;
    this.ackLatencyMs = 120;
    this.remainingAckFailures = 0;
  }
}

export const incidentApi = new IncidentApiClient();
