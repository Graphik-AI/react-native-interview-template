const ROW_PREFIX = 'row:';

interface RenderTrackerApi {
  track(componentKey: string): void;
  reset(): void;
  getCount(componentKey: string): number;
  getTotalRowRenders(): number;
  getRecentRowRenderCount(windowMs?: number, now?: number): number;
}

class RenderTrackerImpl implements RenderTrackerApi {
  private readonly counts = new Map<string, number>();
  private rowTimestamps: number[] = [];

  track(componentKey: string): void {
    this.counts.set(componentKey, (this.counts.get(componentKey) ?? 0) + 1);
    if (componentKey.startsWith(ROW_PREFIX)) {
      this.rowTimestamps.push(Date.now());
    }
  }

  reset(): void {
    this.counts.clear();
    this.rowTimestamps = [];
  }

  getCount(componentKey: string): number {
    return this.counts.get(componentKey) ?? 0;
  }

  getTotalRowRenders(): number {
    let total = 0;
    for (const [key, count] of this.counts) {
      if (key.startsWith(ROW_PREFIX)) {
        total += count;
      }
    }
    return total;
  }

  getRecentRowRenderCount(windowMs = 1000, now = Date.now()): number {
    const cutoff = now - windowMs;
    let start = 0;
    while (start < this.rowTimestamps.length && this.rowTimestamps[start] < cutoff) {
      start += 1;
    }
    if (start > 0) {
      this.rowTimestamps.splice(0, start);
    }
    return this.rowTimestamps.length;
  }
}

export const renderTracker: RenderTrackerApi = new RenderTrackerImpl();

/**
 * Count one render of `componentKey`.
 * Call inside the body of the component being measured (e.g. `row:${incident.id}`).
 * A memoized skip must not invoke this hook.
 */
export function useTrackRender(componentKey: string): void {
  renderTracker.track(componentKey);
}
