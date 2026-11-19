import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { IncidentQueueScreen } from '../src/screens/IncidentQueueScreen';
import { alertFeed } from '../src/services/alertFeed';
import { incidentApi } from '../src/services/incidentApi';

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  incidentApi.reset();
  alertFeed.reset();
});

afterEach(async () => {
  await cleanup();
  alertFeed.reset();
  incidentApi.reset();
  jest.useRealTimers();
});

describe('IncidentQueueScreen', () => {
  test('renders the seeded incident queue and search input', async () => {
    await render(<IncidentQueueScreen />);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByTestId('search-input')).toBeOnTheScreen();
    expect(screen.getByTestId('incident-row-INC-001')).toBeOnTheScreen();
    expect(screen.getByText('Payment webhook timeouts')).toBeOnTheScreen();
    expect(screen.getByTestId('severity-filter-P1')).toBeOnTheScreen();
  });

  test('filters incidents by search query and severity', async () => {
    await render(<IncidentQueueScreen />);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(100);
    });

    await fireEvent.changeText(screen.getByTestId('search-input'), 'payment');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByTestId('incident-row-INC-001')).toBeOnTheScreen();
    expect(screen.queryByTestId('incident-row-INC-002')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('search-input'), 'does-not-match');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByText('No matching incidents')).toBeOnTheScreen();
  });
});
