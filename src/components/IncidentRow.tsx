import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueue } from '../context/QueueContext';
import { useTrackRender } from '../eval/RenderTracker';
import type { Incident } from '../types/incident';

interface IncidentRowProps {
  incident: Incident;
}

export function IncidentRow({ incident }: IncidentRowProps) {
  useTrackRender(`row:${incident.id}`);
  const { bookmarkedIds, toggleBookmark } = useQueue();
  const [expanded, setExpanded] = useState(false);
  const [draftNote, setDraftNote] = useState('');

  const bookmarked = bookmarkedIds.includes(incident.id);

  return (
    <View style={styles.card} testID={`incident-row-${incident.id}`}>
      <View style={styles.topLine}>
        <View style={styles.badges}>
          <View
            style={[
              styles.severityBadge,
              incident.severity === 'P1'
                ? styles.p1Badge
                : incident.severity === 'P2'
                  ? styles.p2Badge
                  : styles.p3Badge,
            ]}
          >
            <Text style={styles.severityText}>{incident.severity}</Text>
          </View>
          <Text style={styles.idText}>{incident.id}</Text>
          <View
            testID={`status-badge-${incident.id}`}
            style={[
              styles.statusBadge,
              incident.status === 'OPEN'
                ? styles.statusOpen
                : incident.status === 'ACK'
                  ? styles.statusAck
                  : styles.statusResolved,
            ]}
          >
            <Text style={styles.statusText}>{incident.status}</Text>
          </View>
        </View>
        <Pressable
          testID={`bookmark-button-${incident.id}`}
          accessibilityRole="button"
          accessibilityState={{ selected: bookmarked }}
          accessibilityLabel={bookmarked ? `Remove bookmark ${incident.id}` : `Bookmark ${incident.id}`}
          onPress={() => {
            void toggleBookmark(incident.id);
          }}
          style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
          hitSlop={8}
        >
          <Text style={[styles.bookmarkText, bookmarked && styles.bookmarkTextActive]}>
            {bookmarked ? 'Saved' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {incident.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.service}>{incident.service}</Text>
        <Text style={styles.alerts}>{incident.alertCount} alerts</Text>
        <Pressable
          testID={`expand-button-${incident.id}`}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((prev) => !prev)}
          hitSlop={8}
        >
          <Text style={styles.expandText}>{expanded ? 'Hide details' : 'Details & note'}</Text>
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.details} testID={`incident-details-${incident.id}`}>
          <Text style={styles.summary}>{incident.summary}</Text>
          <TextInput
            testID={`note-input-${incident.id}`}
            value={draftNote}
            onChangeText={setDraftNote}
            placeholder="Add a quick triage note..."
            placeholderTextColor="#6B7785"
            style={styles.noteInput}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131922',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#253040',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  severityBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  p1Badge: {
    backgroundColor: '#4A1D24',
  },
  p2Badge: {
    backgroundColor: '#433019',
  },
  p3Badge: {
    backgroundColor: '#1E2D40',
  },
  severityText: {
    color: '#F3F6FA',
    fontSize: 11,
    fontWeight: '700',
  },
  idText: {
    color: '#8D9BAA',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusOpen: {
    backgroundColor: '#3A1D24',
  },
  statusAck: {
    backgroundColor: '#1B3447',
  },
  statusResolved: {
    backgroundColor: '#163527',
  },
  statusText: {
    color: '#DCE4EE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  bookmarkBtn: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2B3646',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bookmarkBtnActive: {
    borderColor: '#7AA2FF',
    backgroundColor: '#1A2740',
  },
  bookmarkText: {
    color: '#8D9BAA',
    fontSize: 12,
    fontWeight: '600',
  },
  bookmarkTextActive: {
    color: '#9FBEFF',
  },
  title: {
    color: '#F3F6FA',
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  service: {
    color: '#8D9BAA',
    fontSize: 12,
    flexShrink: 1,
  },
  alerts: {
    color: '#A7B4C2',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  expandText: {
    color: '#7AA2FF',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#253040',
    gap: 8,
  },
  summary: {
    color: '#C2CDD9',
    fontSize: 13,
    lineHeight: 18,
  },
  noteInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2B3646',
    backgroundColor: '#0E131B',
    color: '#F3F6FA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
});
