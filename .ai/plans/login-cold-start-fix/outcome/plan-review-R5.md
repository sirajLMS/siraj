# Plan Review R5: Backend-First Cold-Start Resolution

## Review Date
2026-08-19

## Reviewer
Copilot (user-guided refinement)

## Trigger
User asked: "is the plan resolution good, will the login/query/mutations return errors during cold start? or will it handle it on the backend to reduce round trips, and vercel function invocations?"

## Finding: Plan Was Frontend-Retry-Biased

The previous plan had a bias toward "return errors and retry on the frontend" rather than "handle on the backend transparently". Specifically:

1. **Retry utility had only 2 retries** (300ms → 700ms = 1s total) — not enough time for Vercel cold-start recovery
2. **`createAuthSession` was not covered** — the final DB write in the login flow had no retry, meaning credentials could be verified but session creation fails, forcing a frontend retry that re-verifies everything
3. **Frontend retry timing was too aggressive** (1s, 2s) — doesn't give Vercel time to spawn a new function instance
4. **No explicit "backend-first" principle** — the design didn't articulate why backend retry is preferred over frontend retry

## Changes Applied

### `specs.md`
- **REQ-2 (Retry Utility)**: Increased from 2 retries (300ms → 700ms) to 3 retries (200ms → 500ms → 1000ms, ~1.7s total). Added requirement to log recovery at `info` level. Added rationale: "3 retries gives the Vercel function ~1.7s to recover within a single invocation, reducing the need for frontend retries and extra Vercel function invocations."
- **REQ-4 (Frontend Retry)**: Renamed to "Frontend Auto-Retry on SERVICE_UNAVAILABLE (Last Resort)". Updated timing from 1s/2s to 1.5s/3s. Added requirement to reuse same email/password (no re-entry). Added note: "Frontend retry is a last resort — the backend's internal retryTransient (3 retries, ~1.7s) should handle most cold-start recovery within a single Vercel invocation."
- **REQ-4.5 (New)**: "Full Login Flow Cold-Start Resilience (Backend-First)" — covers `createAuthSession` retry, fail-open for non-critical writes, and indistinguishable-from-warm-path success response.

### `tasks.md`
- **Task 1.1**: Updated to 3 retries, 200ms base delay, added `info`-level recovery logging
- **Task 2.5.5 (New)**: Apply `retryTransient` to `createAuthSession` — the critical DB write that creates the session record. Without this, a cold-start DB failure during the final step would force a frontend retry costing a second Vercel invocation.
- **Task 2.6**: Added REQ-4.5 to requirements
- **Task 4.2**: Updated timing to 1.5s/3s, added "same email/password" reuse, added backend-first rationale note
- **Task 5.5.7**: Added test case 4 (backend retry within 1 invocation), updated test case 5 (frontend retry as last resort), added test case 8 (createAuthSession retry)

### `design.md`
- Added **"Cold-Start Resolution Strategy (Backend-First)"** section with:
  - Full resolution flow diagram showing how each step is handled internally
  - "Worst Case: Full DB Cold Start" diagram (2 invocations, 1 frontend retry)
  - "What the User Sees" table (4 scenarios → user experience → Vercel invocation count)
  - "Why Backend-First?" section explaining cost, latency, consistency, and simplicity advantages

## Resolution Quality Assessment

### Before R5
- Backend retries: 2 (1s total)
- `createAuthSession`: uncovered
- Frontend retry: 2 (1s, 2s = 3s)
- Worst case: 4 Vercel invocations (backend fails → frontend retry → new backend fails → frontend retry again)

### After R5
- Backend retries: 3 (1.7s total)
- `createAuthSession`: covered with retryTransient
- Frontend retry: 2 (1.5s, 3s = 4.5s) — last resort only
- Worst case: 2 Vercel invocations (backend retries ~1.7s, fails → frontend retry → new warm invocation succeeds)
- Best case: 1 Vercel invocation (backend recovers during internal retries)

### Answer to User's Question

**Will login/mutations return errors during cold start?** 
- **No**, in most cases. The backend handles transient failures internally via fail-open (rate limiter, isLocked, recordAttempt, resetAttempts) and retryTransient (findByEmail, createAuthSession). The user sees a clean login with at most ~1.7s of internal delay.
- **Only if the DB pool doesn't warm within 1.7s** will the user see `SERVICE_UNAVAILABLE` → frontend auto-retry → new Vercel instance → login succeeds. The user sees "Retrying..." for ~1.5s.

**Does it handle backend to reduce round trips and Vercel invocations?**
- **Yes.** Backend-first design minimizes invocations:
  - Most cold starts: 1 invocation (backend recovers internally)
  - Worst case: 2 invocations (backend fails → frontend retry)
  - **Never** returns `INVALID_CREDENTIALS` during cold start — that error is only for genuine auth failures.

## Plan Health

- [x] All cold-start failure points have backend handling (fail-open or retry)
- [x] `createAuthSession` is now covered (was the critical gap)
- [x] Frontend retry is explicitly a last resort
- [x] Retry timing is aligned with Vercel serverless cold-start windows
- [x] Design clearly articulates backend-first principle
- [x] Test cases verify backend-first behavior (test 4: "retry then succeed within 1 invocation")