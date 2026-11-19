import type { Incident, IncidentStatus, Severity } from '../types/incident';

export const SEED_TIMESTAMP = 1_763_500_000_000;

interface SeedSpec {
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  alertCount: number;
  summary: string;
}

const FEATURED_SEEDS: readonly SeedSpec[] = [
  {
    title: 'Payment webhook timeouts',
    service: 'payments-api',
    severity: 'P1',
    status: 'OPEN',
    alertCount: 14,
    summary: 'Outbound webhook workers are hitting 15s read timeouts on eu-west-1.',
  },
  {
    title: 'Auth token refresh latency',
    service: 'auth-gateway',
    severity: 'P2',
    status: 'OPEN',
    alertCount: 6,
    summary: 'OAuth refresh p99 rose from 120ms to 1.8s after signing key rotation.',
  },
  {
    title: 'Auth login 502 spike',
    service: 'auth-gateway',
    severity: 'P1',
    status: 'OPEN',
    alertCount: 23,
    summary: 'Upstream identity cluster resetting idle keep-alive sockets under load.',
  },
  {
    title: 'Payment settlement batch lag',
    service: 'payments-api',
    severity: 'P1',
    status: 'OPEN',
    alertCount: 9,
    summary: 'Ledger reconciliation queue fell 14 minutes behind the primary stream.',
  },
  {
    title: 'Search shard rebalance stalled',
    service: 'search-indexer',
    severity: 'P3',
    status: 'ACK',
    alertCount: 3,
    summary: 'Replica allocation paused on node-04 after disk watermark warning.',
  },
  {
    title: 'Checkout cart lock contention',
    service: 'checkout-worker',
    severity: 'P2',
    status: 'OPEN',
    alertCount: 11,
    summary: 'Row lock waits spiking on inventory_reservations during flash sale.',
  },
  {
    title: 'Push notification relay backoff',
    service: 'push-relay',
    severity: 'P2',
    status: 'ACK',
    alertCount: 5,
    summary: 'APNs HTTP/2 pool throttling retries across two worker pods.',
  },
  {
    title: 'Billing invoice PDF queue growth',
    service: 'billing-ledger',
    severity: 'P3',
    status: 'OPEN',
    alertCount: 4,
    summary: 'Headless renderer pool saturated by end-of-month invoice burst.',
  },
  {
    title: 'Session store failover flapping',
    service: 'session-store',
    severity: 'P1',
    status: 'OPEN',
    alertCount: 19,
    summary: 'Redis sentinel triggered two leader elections in the past ten minutes.',
  },
  {
    title: 'Media transcode worker OOM',
    service: 'media-pipeline',
    severity: 'P2',
    status: 'RESOLVED',
    alertCount: 7,
    summary: '4K HEVC uploads exceeded container memory limit on spot nodes.',
  },
];

const SERVICES = [
  'checkout-worker',
  'billing-ledger',
  'push-relay',
  'media-pipeline',
  'session-store',
  'edge-cache',
  'order-router',
  'notifications-api',
  'inventory-sync',
  'fraud-scorer',
] as const;

const ISSUE_TEMPLATES = [
  'Elevated p99 latency on read path',
  'Dead-letter queue depth rising',
  'Upstream TLS handshake retries',
  'Connection pool saturation alert',
  'Consumer lag above SLA threshold',
  'Pod restart loop after config push',
  'Circuit breaker open on downstream call',
  'Cache miss ratio jumped above 40%',
  'Rate limiter rejecting burst traffic',
  'Health check flapping in us-east-1',
] as const;

const SEVERITIES: readonly Severity[] = ['P1', 'P2', 'P3'];
const STATUSES: readonly IncidentStatus[] = ['OPEN', 'OPEN', 'ACK', 'RESOLVED'];

export function createSeedIncidents(count = 60): Incident[] {
  const items: Incident[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = `INC-${String(i + 1).padStart(3, '0')}`;
    const updatedAt = SEED_TIMESTAMP - i * 45_000;
    if (i < FEATURED_SEEDS.length) {
      const seed = FEATURED_SEEDS[i];
      items.push({
        id,
        title: seed.title,
        service: seed.service,
        severity: seed.severity,
        status: seed.status,
        alertCount: seed.alertCount,
        updatedAt,
        summary: seed.summary,
      });
    } else {
      const service = SERVICES[i % SERVICES.length];
      const issue = ISSUE_TEMPLATES[i % ISSUE_TEMPLATES.length];
      items.push({
        id,
        title: `${issue} (#${i + 1})`,
        service,
        severity: SEVERITIES[i % SEVERITIES.length],
        status: STATUSES[i % STATUSES.length],
        alertCount: 2 + (i % 15),
        updatedAt,
        summary: `Automated alert from ${service}: ${issue.toLowerCase()} across 3 instances.`,
      });
    }
  }
  return items;
}
