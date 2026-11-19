import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { alertFeed } from '../services/alertFeed';
import { incidentApi } from '../services/incidentApi';
import { renderTracker } from './RenderTracker';

export function DiagnosticsHud() {
  const [rendersPerSec, setRendersPerSec] = useState(0);
  const [listeners, setListeners] = useState(() => alertFeed.getListenerCount());
  const [stalls, setStalls] = useState(0);
  const [jitterOn, setJitterOn] = useState(false);
  const [ackArmed, setAckArmed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const stallCountRef = useRef(0);

  useEffect(() => {
    let rafId = 0;
    let lastFrame = Date.now();
    const tick = () => {
      const now = Date.now();
      if (now - lastFrame > 20) {
        stallCountRef.current += 1;
      }
      lastFrame = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const sampler = setInterval(() => {
      setRendersPerSec(renderTracker.getRecentRowRenderCount(1000));
      setListeners(alertFeed.getListenerCount());
      setStalls(stallCountRef.current);
    }, 500);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(sampler);
    };
  }, []);

  const toggleJitter = () => {
    const next = !jitterOn;
    setJitterOn(next);
    if (next) {
      incidentApi.setLatencyResolver((query) =>
        query.trim().length <= 2 ? 900 : 40,
      );
    } else {
      incidentApi.setLatencyResolver((query) => {
        const trimmed = query.trim();
        if (trimmed.length === 0) return 60;
        return trimmed.length <= 2 ? 280 : 45;
      });
    }
  };

  const armAckFailure = () => {
    incidentApi.failNextAck(1);
    setAckArmed(true);
  };

  if (collapsed) {
    return (
      <Pressable
        onPress={() => setCollapsed(false)}
        style={styles.collapsedPill}
        accessibilityRole="button"
      >
        <Text style={styles.collapsedText}>
          HUD · {rendersPerSec}/s · L:{listeners}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.panel} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.heading}>Eval HUD</Text>
          <Pressable onPress={() => setCollapsed(true)} hitSlop={8}>
            <Text style={styles.hide}>Hide</Text>
          </Pressable>
        </View>
        <Text style={styles.metric}>Row renders/s: {rendersPerSec}</Text>
        <Text style={styles.metric}>JS stalls (&gt;20ms): {stalls}</Text>
        <Text style={styles.metric}>Feed listeners: {listeners}</Text>
        <View style={styles.actions}>
          <Pressable
            onPress={() => alertFeed.emitBurst(25)}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Burst 25</Text>
          </Pressable>
          <Pressable
            onPress={toggleJitter}
            style={[styles.btn, jitterOn && styles.btnActive]}
          >
            <Text style={styles.btnText}>
              {jitterOn ? 'Jitter: ON' : 'Jitter: OFF'}
            </Text>
          </Pressable>
          <Pressable
            onPress={armAckFailure}
            style={[styles.btn, ackArmed && styles.btnWarn]}
          >
            <Text style={styles.btnText}>Fail Next Ack</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedPill: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    backgroundColor: 'rgba(19, 25, 34, 0.92)',
    borderColor: '#3D5370',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  collapsedText: {
    color: '#D6E4FF',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  panel: {
    position: 'absolute',
    right: 12,
    bottom: 20,
  },
  card: {
    width: 210,
    backgroundColor: 'rgba(13, 17, 23, 0.94)',
    borderColor: '#3D5370',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  heading: {
    color: '#9FBEFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hide: {
    color: '#8D9BAA',
    fontSize: 11,
  },
  metric: {
    color: '#E5ECF4',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  btn: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2B3646',
    backgroundColor: '#17202E',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnActive: {
    borderColor: '#7AA2FF',
    backgroundColor: '#1D3252',
  },
  btnWarn: {
    borderColor: '#E07A5F',
    backgroundColor: '#3E221D',
  },
  btnText: {
    color: '#DCE4EE',
    fontSize: 10,
    fontWeight: '700',
  },
});
