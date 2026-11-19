# On-Call Incident Queue — Production Triage Exercise

**Timebox:** 2 hours · **Follow-up:** 30-minute pairing and walkthrough

You have inherited a single-screen React Native on-call incident triage app (`IncidentQueueScreen`). It runs and passes its smoke tests, but on-call engineers have filed a cluster of production bug reports.

Your goal is to **reproduce, diagnose, and fix the underlying root causes**, add regression tests for the bugs you fix, and then ship **one small feature** on top of the stabilized screen.

> **AI tools:** Coding assistants (Cursor, Copilot, Claude, etc.) are allowed. Treat this like a real production incident: reproduce issues, verify root causes, and keep your code clean enough to explain and extend live in our 30-minute review.

---

## Getting Started

```bash
npm install
npx expo start
npm test
npx tsc --noEmit
```

- `npx expo start` runs in Expo Go, iOS Simulator, or Android Emulator—no native build or `ios/` / `android/` folder is required.
- Keep the single-screen entry (`App.tsx` → `IncidentQueueScreen`). Do not migrate to Expo Router; tests mount `IncidentQueueScreen` directly.
- `npm test` runs `__tests__/IncidentQueueSmoke.test.tsx` (plus any tests you add) and must stay green.

---

## Part 1: Production Bug Reports *(Core Focus)*

Engineers using the screen have reported the following issues so far:

1. **Search snaps back to wrong results**
   Typing quickly in the search box sometimes shows the matching incidents briefly and then reverts to unrelated results from an earlier keystroke.
2. **Expanded notes show up on the wrong incident**
   Expanding an incident and typing a triage note, then filtering or scrolling through the list, causes a different incident to appear expanded with the first incident's draft note.
3. **Constant stutter and jank**
   Even when idle or bookmarking a single incident, the list feels sluggish—frames drop every second and tapping Save on one row appears to re-render the entire screen.
4. **Bookmarks disappear on rapid taps**
   Quickly tapping Save on two or three incidents in a row (or right after launch) silently loses some bookmarks, and reloading the app does not restore all of them.
5. **Returning from another app wipes active search results**
   If you search for a service and filter by severity, switch to another app, and return, the list resets to unfiltered results even though your search query is still in the input.

**Keep digging:** These are only the tickets filed so far—while auditing the codebase, look out for any other lifecycle, memory, or concurrency bugs you can find and fix those too.

Add focused Jest regression tests covering the bugs you fix.

---

## Part 2: Small Feature — Optimistic Acknowledge

Once the screen is stable, add a one-tap **Acknowledge** action for `OPEN` incidents:

- Render an `Acknowledge` button (`testID="ack-button-<id>"`) on rows whose status is `'OPEN'`.
- Tapping it calls `incidentApi.acknowledgeIncident(id)` and **optimistically updates** that row's status from `'OPEN'` to `'ACK'` immediately (without re-rendering unrelated rows).
- Prevent duplicate in-flight requests for the same incident while its acknowledge call is pending.
- If `incidentApi.acknowledgeIncident(id)` rejects:
  - Roll back that incident's status to `'OPEN'` (without reverting other successful acknowledges).
  - Show a visible error banner with `testID="action-error-banner"` describing the failure.

---

## Where to Spend Your Time

- **What we evaluate:** Root-cause diagnosis, React Native performance & render isolation, async/concurrency correctness, FlashList cell lifecycle handling, clean modular TypeScript, and focused regression tests.
- **Out of scope:** Visual redesigns, navigation refactors, modifying the mock services' core contracts (`incidentApi`, `alertFeed`), or adding heavy dependencies.
- **Pre-installed libraries:** `@shopify/flash-list`, `@react-native-async-storage/async-storage`, `zustand`, `react-native-reanimated`, and `react-native-gesture-handler` (initialized in `index.ts`). Use `zustand` or plain React state/split contexts—whichever gives you the cleanest render isolation.

---

## Contracts to Preserve

### Required `testID`s

Automated tests query these directly—keep them intact:

| `testID` | Element |
| --- | --- |
| `search-input` | Search input |
| `severity-filter-<ALL\|P1\|P2\|P3>` | Severity filter pills |
| `bookmarked-only-toggle` | Saved-only filter toggle |
| `live-alert-count` | Live alert counter text in header |
| `incident-list` | `FlashList` container |
| `incident-row-<id>` | Row container (e.g., `incident-row-INC-001`) |
| `status-badge-<id>` | Status badge showing `OPEN`, `ACK`, or `RESOLVED` |
| `bookmark-button-<id>` | Save/Saved bookmark button |
| `expand-button-<id>` | Toggle details & draft note |
| `note-input-<id>` | Triage note `TextInput` inside expanded row |
| `ack-button-<id>` | Acknowledge button on `OPEN` rows *(Part 2)* |
| `action-error-banner` | Error banner shown when Acknowledge fails *(Part 2)* |

### Services (`src/services/`)

Keep consuming `incidentApi` and `alertFeed` rather than bypassing them with static local data:

- `incidentApi` (`src/services/incidentApi.ts`): `getSeedIncidents()`, `searchIncidents(query, { signal })`, `acknowledgeIncident(id)`.
- `alertFeed` (`src/services/alertFeed.ts`): `subscribe(listener)`, `getListenerCount()`, `start()`, `stop()`, `emit(event)`.
- Bookmark persistence uses `@react-native-async-storage/async-storage` (keep key `incident_queue:bookmarks` if you refactor storage helpers).

---

## Project Layout

```text
App.tsx                              Root wrapper
jest.setup.js                        Jest mocks for AsyncStorage & FlashList
src/
  types/incident.ts                  Incident, Severity, LiveAlertEvent
  data/seedIncidents.ts              60 seeded on-call incidents
  services/incidentApi.ts            In-memory mock API (supports AbortSignal)
  services/alertFeed.ts              In-process live alert pub/sub
  format/time.ts                     Relative timestamp formatter
  context/QueueContext.tsx           Current state & side effects
  components/IncidentRow.tsx         List row component
  screens/IncidentQueueScreen.tsx    Main triage screen
__tests__/IncidentQueueSmoke.test.tsx
DECISIONS.md                         Short write-up for the review session
```

---

## Before You Submit

1. Verify `npx tsc --noEmit` and `npm test` both pass cleanly.
2. Answer the four short prompts in `DECISIONS.md`—we will use them to guide the 30-minute live review and pairing session.
