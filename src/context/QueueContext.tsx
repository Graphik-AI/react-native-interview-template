import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { alertFeed } from '../services/alertFeed';
import { incidentApi } from '../services/incidentApi';
import type { Incident, LiveAlertEvent, SeverityFilter } from '../types/incident';

export const BOOKMARKS_STORAGE_KEY = 'incident_queue:bookmarks';

interface QueueContextValue {
  incidents: Incident[];
  bookmarkedIds: string[];
  query: string;
  setQuery: (next: string) => void;
  severity: SeverityFilter;
  setSeverity: (next: SeverityFilter) => void;
  bookmarkedOnly: boolean;
  setBookmarkedOnly: (next: boolean) => void;
  isLoading: boolean;
  liveAlertCount: number;
  now: number;
  lastSyncedAt: number;
  toggleBookmark: (id: string) => Promise<void>;
  refresh: () => void;
}

const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(() => incidentApi.getSeedIncidents());
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<SeverityFilter>('ALL');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveAlertCount, setLiveAlertCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [lastSyncedAt, setLastSyncedAt] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setBookmarkedIds(parsed);
          }
        } catch {
          setBookmarkedIds([]);
        }
      }
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    incidentApi.searchIncidents(query).then((results) => {
      setIncidents(results);
      setLastSyncedAt(Date.now());
      setIsLoading(false);
    });
  }, [query]);

  const handleIncomingAlert = (event: LiveAlertEvent) => {
    setLiveAlertCount((count) => count + 1);
    setIncidents((current) =>
      current.map((item) =>
        item.id === event.incidentId
          ? {
              ...item,
              alertCount: item.alertCount + (event.deltaAlerts ?? 1),
              status: event.status ?? item.status,
              summary: event.summary ?? item.summary,
              updatedAt: event.timestamp,
            }
          : item,
      ),
    );
  };

  const refresh = () => {
    incidentApi.searchIncidents(query).then((results) => {
      setIncidents(results);
      setLastSyncedAt(Date.now());
    });
  };

  useEffect(() => {
    const connectFeed = () => {
      alertFeed.subscribe((event) => handleIncomingAlert(event));
      alertFeed.start();
    };

    connectFeed();

    AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        connectFeed();
        refresh();
      }
    });
  }, []);

  const toggleBookmark = async (id: string) => {
    const raw = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
    const stored: string[] = raw ? JSON.parse(raw) : [];
    const next = stored.includes(id)
      ? stored.filter((existing) => existing !== id)
      : [...stored, id];
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
    setBookmarkedIds(next);
  };

  return (
    <QueueContext.Provider
      value={{
        incidents,
        bookmarkedIds,
        query,
        setQuery,
        severity,
        setSeverity,
        bookmarkedOnly,
        setBookmarkedOnly,
        isLoading,
        liveAlertCount,
        now,
        lastSyncedAt,
        toggleBookmark,
        refresh,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue(): QueueContextValue {
  const ctx = useContext(QueueContext);
  if (!ctx) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return ctx;
}
