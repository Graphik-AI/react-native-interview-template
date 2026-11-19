# Interviewee Review Guide

This note comes from the live-review harness (`eval/hidden-triage-harness`). It is not on `main`.

We merge this branch into your branch during the 30-minute walkthrough. It adds render accounting, a diagnostics overlay, and the automated regression suite. It does not change your solution.

## Merge

From your working branch:

```bash
git merge eval/hidden-triage-harness
```

If fetching from a review remote:

```bash
git fetch <review-remote> eval/hidden-triage-harness
git merge FETCH_HEAD
```

These new files should merge cleanly:

- `src/eval/RenderTracker.ts`
- `src/eval/DiagnosticsHud.tsx`
- `__tests__/eval/HiddenTriageEval.test.tsx`
- `INTERVIEWEE_GUIDE.md`

If `src/components/IncidentRow.tsx` or `App.tsx` conflicts, keep your implementation and restore the two small wiring hooks below.

### 1. Row render counter

Inside the function body that renders a single incident row (inside `memo` if memoized):

```tsx
import { useTrackRender } from '../eval/RenderTracker';

useTrackRender(`row:${incident.id}`);
```

The eval suite reads `row:<id>`.

### 2. Diagnostics overlay

Mount `DiagnosticsHud` next to `IncidentQueueScreen` in `App.tsx`:

```tsx
import { DiagnosticsHud } from './src/eval/DiagnosticsHud';

<IncidentQueueScreen />
<DiagnosticsHud />
```

## Run

```bash
npm test -- --watchman=false
npx expo start
```

`npm test` runs both `IncidentQueueSmoke` and `HiddenTriageEval`. The bottom-right HUD shows row renders/sec, JS stalls (>20ms), active feed listeners, and buttons to trigger bursts, search jitter, and acknowledge failures live.
