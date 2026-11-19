import AsyncStorage from '@react-native-async-storage/async-storage';
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { renderTracker } from '../../src/eval/RenderTracker';
import { IncidentQueueScreen } from '../../src/screens/IncidentQueueScreen';
import { alertFeed } from '../../src/services/alertFeed';
import { incidentApi } from '../../src/services/incidentApi';

let appStateListeners: Set<(state: AppStateStatus) => void>;

function emitAppState(next: AppStateStatus): void {
  for (const listener of [...appStateListeners]) {
    listener(next);
  }
}

async function flush(ms = 120): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  incidentApi.reset();
  alertFeed.reset();
  renderTracker.reset();

  appStateListeners = new Set();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((type, listener) => {
    if (type === 'change') {
      appStateListeners.add(listener);
    }
    return {
      remove: () => {
        appStateListeners.delete(listener);
      },
    };
  });
});

afterEach(async () => {
  await cleanup();
  alertFeed.reset();
  incidentApi.reset();
  renderTracker.reset();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('HiddenTriageEval', () => {
  test('1. stale search response does not overwrite newer query results', async () => {
    incidentApi.setLatencyResolver((q) => (q.trim() === 'a' ? 800 : 30));

    await render(<IncidentQueueScreen />);
    await flush(150);

    await fireEvent.changeText(screen.getByTestId('search-input'), 'a');
    await flush(400);

    await fireEvent.changeText(screen.getByTestId('search-input'), 'auth');
    await flush(1000);

    expect(screen.getByTestId('incident-row-INC-002')).toBeOnTheScreen();
    expect(screen.getByTestId('incident-row-INC-003')).toBeOnTheScreen();
    expect(screen.queryByTestId('incident-row-INC-001')).toBeNull();
  });

  test('2. recycled list row does not leak expanded state or draft note to another incident', async () => {
    await render(<IncidentQueueScreen />);
    await flush(150);

    await fireEvent.press(screen.getByTestId('expand-button-INC-001'));
    const noteInput = screen.getByTestId('note-input-INC-001');
    await fireEvent.changeText(noteInput, 'db connection pool exhausted');

    // INC-001 is P1; filtering to P2 puts INC-002 into recycled cell slot 0.
    await fireEvent.press(screen.getByTestId('severity-filter-P2'));
    await flush(100);

    expect(screen.getByTestId('incident-row-INC-002')).toBeOnTheScreen();
    expect(screen.queryByTestId('note-input-INC-002')).toBeNull();

    // Expanding INC-002 must start with an empty note, not INC-001's draft.
    await fireEvent.press(screen.getByTestId('expand-button-INC-002'));
    expect(screen.getByTestId('note-input-INC-002').props.value).toBe('');
  });

  test('3. clock ticks, bookmarking, and live alerts do not re-render unrelated rows', async () => {
    await render(<IncidentQueueScreen />);
    await flush(150);
    renderTracker.reset();

    // 3 ticks of the 1-second relative timestamp clock
    await flush(3000);

    await fireEvent.press(screen.getByTestId('bookmark-button-INC-001'));
    await flush(100);

    await act(async () => {
      alertFeed.emit({
        eventId: 'eval-evt-1',
        incidentId: 'INC-001',
        deltaAlerts: 2,
        timestamp: Date.now(),
      });
    });
    await flush(100);

    expect(renderTracker.getCount('row:INC-001')).toBeGreaterThan(0);
    for (const id of ['INC-002', 'INC-003', 'INC-004', 'INC-005', 'INC-006']) {
      expect(renderTracker.getCount(`row:${id}`)).toBe(0);
    }
  });

  test('4. cleans up feed and AppState listeners on unmount and avoids stacking on foreground', async () => {
    const view = await render(<IncidentQueueScreen />);
    await flush(150);

    expect(alertFeed.getListenerCount()).toBe(1);

    for (let i = 0; i < 3; i += 1) {
      await act(async () => {
        emitAppState('background');
        emitAppState('active');
      });
      await flush(150);
    }

    expect(alertFeed.getListenerCount()).toBe(1);

    const beforeCount = Number(screen.getByTestId('live-alert-count').props.children);
    await act(async () => {
      alertFeed.emit({
        eventId: 'eval-evt-single',
        incidentId: 'INC-001',
        deltaAlerts: 1,
        timestamp: Date.now(),
      });
    });
    const afterCount = Number(screen.getByTestId('live-alert-count').props.children);
    expect(afterCount - beforeCount).toBe(1);

    await view.unmount();
    expect(alertFeed.getListenerCount()).toBe(0);
    expect(appStateListeners.size).toBe(0);
  });

  test('5. rapid bookmark taps persist all toggles safely under out-of-order AsyncStorage latency', async () => {
    const backingStore = new Map<string, string>();
    const writeDelays = [70, 20, 5];
    let writeIndex = 0;

    jest.spyOn(AsyncStorage, 'getItem').mockImplementation(
      (key: string) =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(backingStore.get(key) ?? null);
          }, 40);
        }),
    );

    jest.spyOn(AsyncStorage, 'setItem').mockImplementation(
      (key: string, value: string) =>
        new Promise((resolve) => {
          const delay = writeDelays[writeIndex] ?? 10;
          writeIndex += 1;
          setTimeout(() => {
            backingStore.set(key, value);
            resolve();
          }, delay);
        }),
    );

    const firstRender = await render(<IncidentQueueScreen />);
    await flush(150);

    // Fire 3 bookmark toggles back-to-back without waiting for disk I/O
    await act(async () => {
      fireEvent.press(screen.getByTestId('bookmark-button-INC-001'));
      fireEvent.press(screen.getByTestId('bookmark-button-INC-002'));
      fireEvent.press(screen.getByTestId('bookmark-button-INC-003'));
    });
    await flush(300);

    await fireEvent.press(screen.getByTestId('bookmarked-only-toggle'));
    expect(screen.getByTestId('incident-row-INC-001')).toBeOnTheScreen();
    expect(screen.getByTestId('incident-row-INC-002')).toBeOnTheScreen();
    expect(screen.getByTestId('incident-row-INC-003')).toBeOnTheScreen();

    // Remount to verify persistence survived out-of-order storage writes
    await firstRender.unmount();
    await render(<IncidentQueueScreen />);
    await flush(250);

    await fireEvent.press(screen.getByTestId('bookmarked-only-toggle'));
    expect(screen.getByTestId('incident-row-INC-001')).toBeOnTheScreen();
    expect(screen.getByTestId('incident-row-INC-002')).toBeOnTheScreen();
    expect(screen.getByTestId('incident-row-INC-003')).toBeOnTheScreen();
  });

  test('6. foreground refresh preserves active search query and severity filter', async () => {
    await render(<IncidentQueueScreen />);
    await flush(150);

    await fireEvent.changeText(screen.getByTestId('search-input'), 'payment');
    await fireEvent.press(screen.getByTestId('severity-filter-P1'));
    await flush(200);

    expect(screen.getByTestId('incident-row-INC-001')).toBeOnTheScreen();
    expect(screen.queryByTestId('incident-row-INC-003')).toBeNull();

    // Simulate switching away and returning to foreground
    await act(async () => {
      emitAppState('background');
      emitAppState('active');
    });
    await flush(400);

    expect(screen.getByTestId('incident-row-INC-001')).toBeOnTheScreen();
    expect(screen.queryByTestId('incident-row-INC-003')).toBeNull();
    expect(screen.queryByTestId('incident-row-INC-002')).toBeNull();
  });

  test('7. optimistic Acknowledge updates immediately and rolls back on failure without clobbering others', async () => {
    incidentApi.setAckLatencyMs(150);

    await render(<IncidentQueueScreen />);
    await flush(150);

    // Succeeding acknowledge on INC-001
    await fireEvent.press(screen.getByTestId('ack-button-INC-001'));
    // Optimistic update before 150ms response
    expect(screen.getByTestId('status-badge-INC-001')).toHaveTextContent('ACK');

    // Failing acknowledge on INC-002 while INC-001 is still in flight
    incidentApi.failNextAck(1);
    await fireEvent.press(screen.getByTestId('ack-button-INC-002'));
    expect(screen.getByTestId('status-badge-INC-002')).toHaveTextContent('ACK');

    await flush(250);

    expect(screen.getByTestId('status-badge-INC-001')).toHaveTextContent('ACK');
    expect(screen.getByTestId('status-badge-INC-002')).toHaveTextContent('OPEN');
    expect(screen.getByTestId('action-error-banner')).toBeOnTheScreen();
  });
});
