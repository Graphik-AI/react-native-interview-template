import { FlashList } from '@shopify/flash-list';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IncidentRow } from '../components/IncidentRow';
import { QueueProvider, useQueue } from '../context/QueueContext';
import { formatElapsed } from '../format/time';
import type { Incident, SeverityFilter } from '../types/incident';

const SEVERITY_FILTERS: readonly SeverityFilter[] = ['ALL', 'P1', 'P2', 'P3'];

function IncidentQueueContent() {
  const {
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
  } = useQueue();

  const visibleIncidents = incidents.filter((item) => {
    if (severity !== 'ALL' && item.severity !== severity) {
      return false;
    }
    if (bookmarkedOnly && !bookmarkedIds.includes(item.id)) {
      return false;
    }
    return true;
  });

  const renderItem = ({ item }: { item: Incident }) => <IncidentRow incident={item} />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>On-Call Queue</Text>
          <Text style={styles.subtitle}>
            Synced {formatElapsed(lastSyncedAt, now)} · {visibleIncidents.length} shown
          </Text>
        </View>
        <View style={styles.livePill}>
          <Text style={styles.liveLabel}>Live alerts</Text>
          <Text testID="live-alert-count" style={styles.liveValue}>
            {liveAlertCount}
          </Text>
        </View>
      </View>

      <TextInput
        testID="search-input"
        value={query}
        onChangeText={setQuery}
        placeholder="Search id, title, or service"
        placeholderTextColor="#6B7785"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search incidents"
        style={styles.search}
      />

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          keyboardShouldPersistTaps="handled"
        >
          {SEVERITY_FILTERS.map((option) => {
            const active = option === severity;
            return (
              <Pressable
                key={option}
                testID={`severity-filter-${option}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSeverity(option)}
                style={[styles.chip, active && styles.chipSelected]}
              >
                <Text style={[styles.chipText, active && styles.chipTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
          <Pressable
            testID="bookmarked-only-toggle"
            accessibilityRole="button"
            accessibilityState={{ selected: bookmarkedOnly }}
            onPress={() => setBookmarkedOnly(!bookmarkedOnly)}
            style={[styles.chip, bookmarkedOnly && styles.chipSelected]}
          >
            <Text style={[styles.chipText, bookmarkedOnly && styles.chipTextSelected]}>
              Saved ({bookmarkedIds.length})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {isLoading ? <Text style={styles.syncing}>Searching...</Text> : null}

      <View style={styles.listWrap}>
        <FlashList
          testID="incident-list"
          data={visibleIncidents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.empty}>No matching incidents</Text>}
        />
      </View>
    </View>
  );
}

export function IncidentQueueScreen() {
  return (
    <QueueProvider>
      <IncidentQueueContent />
    </QueueProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  title: {
    color: '#F3F6FA',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8D9BAA',
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#253040',
    backgroundColor: '#131922',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveLabel: {
    color: '#8D9BAA',
    fontSize: 11,
    fontWeight: '600',
  },
  liveValue: {
    color: '#7AA2FF',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  search: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#253040',
    backgroundColor: '#131922',
    color: '#F3F6FA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  filterContainer: {
    height: 48,
    justifyContent: 'center',
  },
  filters: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#253040',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#131922',
  },
  chipSelected: {
    backgroundColor: '#1A2740',
    borderColor: '#7AA2FF',
  },
  chipText: {
    color: '#8D9BAA',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#D6E4FF',
  },
  syncing: {
    color: '#8D9BAA',
    fontSize: 11,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  listWrap: {
    flex: 1,
  },
  empty: {
    color: '#8D9BAA',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 15,
  },
});
