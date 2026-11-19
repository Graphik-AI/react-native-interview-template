# Decisions

Answer these before the review. A short paragraph each is enough. We will walk through them live.

## 1. Root causes found

List all the bugs you found in the starter screen (both the reported tickets and any additional issues you uncovered while auditing the code) and briefly note how you reproduced or verified each one.

## 2. State architecture and render isolation

How did you restructure state, context/store subscriptions, and list rows to eliminate unnecessary re-renders and FlashList cell state leaks?

## 3. Async safety and optimistic updates

How did you make async operations and the new optimistic Acknowledge flow safe under rapid taps, slow networks, or failures?

## 4. AI usage note

Where did an assistant accelerate your triage, and where did it miss an interaction or suggest a flawed fix that you had to override?
