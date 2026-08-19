# Login Cold-Start Resilience

## Problem
On Vercel serverless + Neon PostgreSQL, the login flow produces false errors ("invalid credentials", "too many attempts") during cold starts. When Neon's serverless HTTP endpoint and/or the connection pool are cold, the first login attempt after idle time fails because rate limiter operations, DB reads, and session creation throw transient connection errors.

## Solution: Backend-First Layered Strategy

### Layer 1: Fail-Open (rate limiter operations)
Rate limiter operations (`checkRateLimit`, `isLocked`, `recordAttempt`, `resetAttempts`) are wrapped in `try/catch`. If they throw transient errors, the catch block logs and proceeds — the login flow continues without rate limiting rather than blocking the user.

**Rationale:** Rate limiting is a secondary concern during cold start. A false "too many attempts" error is worse than temporarily skipping rate limiting.

**Pattern:**
```typescript
let rateLimitResult: RateLimitResult = { success: true, /* defaults */ };
try {
  rateLimitResult = await checkRateLimit(/* ... */);
} catch (error) {
  logger.warn(`Rate limit check failed (cold start?), proceeding without rate limiting: ${error}`);
}

// Proceed with rateLimitResult — if it failed, defaults allow login to continue
```

### Layer 2: retryTransient (critical DB reads/writes)
Critical DB operations (`findByEmail`, `createAuthSession`) are wrapped with `retryTransient()` from `backend/lib/retry.ts`. This retries on transient errors (ECONNRESET, ETIMEDOUT, ENOTFOUND, EAI_AGAIN, ECONNREFUSED, or messages containing "timeout", "connection", "websocket", "pool", "termination", "shutting down").

**Retry schedule:** 3 retries with delays of 200ms → 500ms → 1000ms (~1.7s total).

**Pattern:**
```typescript
const user = await retryTransient(() => UserRepository.findByEmail(email));
```

If retries are exhausted, the resolver returns `SERVICE_UNAVAILABLE` (NOT `INVALID_CREDENTIALS`).

### Layer 3: Frontend Retry (last resort)
The frontend ViewModel retries on `SERVICE_UNAVAILABLE` using a `useRef` pattern for recursive calls. Max 2 retries with 1.5s and 3s delays.

**Pattern:**
```typescript
const performLoginRef = useRef<() => Promise<void>>(undefined);
useEffect(() => { performLoginRef.current = performLogin; }, [performLogin]);

// In error handler:
if (code === "SERVICE_UNAVAILABLE" && retryCount < MAX_RETRIES) {
  await delay(retryCount === 0 ? 1500 : 3000);
  retryCountRef.current += 1;
  await performLoginRef.current(); // recursive via ref
}
```

### Layer 4: Environment Config Short TTL
During cold start, `resolveEnvConfig()` DB lookups may fail transiently. The cache entry is tagged with `source: "env"` and `transientError: true`, and gets a short TTL (30s) to throttle re-queries against the failing DB. After the short TTL expires, the DB is re-queried — if recovered, the DB override is picked up.

**Cache entry behavior:**
| Source | TransientError | TTL | Cache hit? |
|--------|---------------|-----|------------|
| `"db"` | N/A | 5min | ✅ Short-circuit |
| `"env"` | `true` | 30s | ✅ Short-circuit (throttle) |
| `"env"` | `false` | 5min | ❌ Fall through to DB |

## Key Files

| File | Role |
|------|------|
| `backend/lib/retry.ts` | `retryTransient()` + `isTransientError()` utilities |
| `backend/graphql/mutation/auth/auth.mutation.ts` | Login resolver with fail-open + retry |
| `backend/services/system/environment-config.service.ts` | Env-config with transient short TTL |
| `frontend/views/auth/login/useLoginViewModel.ts` | Frontend retry on SERVICE_UNAVAILABLE |

## Testing
- **Tier 1 (unit, mocked):** `backend/lib/test/retry.test.ts`, `backend/services/system/test/environment-config-cold-start.test.ts`, `backend/graphql/mutation/auth/test/auth-mutation-cold-start.test.ts`
- **Tier 2 (GraphQL integration):** `test/simulate/login-rate-limit-cold-start.test.ts`, `test/simulate/login-env-config-cold-start.test.ts`, `test/simulate/login-full-flow-cold-start.test.ts`
- Run: `bun run test:simulate`

## Vercel Configuration
`vercel.json` has `"fluid": true` — Fluid Compute is enabled, which keeps serverless functions warm longer and reduces cold starts.

## Gotchas
- `retryTransient` with 3 retries = **4 total calls** (initial + 3 retries). Tests must expect `toHaveBeenCalledTimes(4)`.
- Non-transient errors are **not retried** — they re-throw immediately.
- The frontend ViewModel must use `useMutation(loginMutationDocument)` directly (not `useAuth().login()`) because `AuthProvider.login()` discards `extensions.code`.
- The `performLoginRef` pattern is required because recursive `useCallback` triggers `react-hooks/immutability` lint rule.
- Cache `transientError` flag must be propagated through all `commitDbResolvedValue` / `recordResolvedKey` call sites.
