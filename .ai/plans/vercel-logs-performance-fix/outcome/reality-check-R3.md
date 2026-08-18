# Reality-Check R3 — Plan Claims Verified Against Source

> **Status:** Analysis only. No codebase modifications. This document audits the plan (`specs.md`, `design.md`, `trackable-tasks.md`, `deep-analysis-R2.md`) against the actual source code and identifies material errors, overclaims, and missing server-side prerequisites that the implementer MUST know before touching any file.

## Document Information

- **Date:** 2026-08-18 (third pass — reality check)
- **Trigger:** User requested "give the plan reality check and fixes, dont dare modify the codebase"
- **Method:** Read every source file referenced by the plan; resolve every factual claim against the actual code; verify framework capabilities against installed package versions and official docs
- **Scope:** Validate that fix directions are viable, that cost models reflect production reality, and that no requirement is already implemented or impossible

---

## Summary of Findings

| # | Finding | Severity | Plan element impacted |
|---|---|---|---|
| R3-1 | **GraphQL server is Apollo Server 4 (`@apollo/server` v5.5.1), NOT Pothos/Yoga.** HTTP batching requires `allowBatchedHttpRequests: true` on the `ApolloServer` constructor, omitted by the plan. | **CRITICAL — fixes plan viability** | `deep-analysis-R2.md` §3; `specs.md` Req 3.5; `design.md` Component 3 |
| R3-2 | `scopeAuth` evaluator has an **unreachable dead-code branch** (`else if (ctx.actorUserId)` at lines 116–118 of `gqlSchemaBuilder.ts`) the plan did not mention. | LOW (hygiene) | `deep-analysis-R2.md` §2; `specs.md` Req 1.5 |
| R3-3 | `findSessionById` and `getSessionGroupSimulation` are **Redis-first** in production (cacheProvider !== "postgres"). The plan's "8 redundant DB session lookups" is actually **16 Redis reads** (~1–5ms each), not DB queries (~50–100ms). Two separate session-resolution calls per request (impersonation + group-sim), each doing 2 Redis reads, all sharing the same `rawSessionId`. | **MEDIUM — cost model inflated** | `deep-analysis-R2.md` §4, §9; `specs.md` Req 3.6 |
| R3-4 | `getUserContext`, `getPermissionGroupContext`, and `findSafeById` have **NO caching**. Plan's claim that these are the dominant real DB cost is correct. | CONFIRMED | `deep-analysis-R2.md` §2, §5, §6 |
| R3-5 | **Req 8 (Cold-Start Init Optimization) is largely already implemented.** `getGlobalSingleton` is already used in `env.ts`, `drizzleDb.ts`, and `CacheServiceFactory.ts`. Most ACs are "verify", not "fix". | **HIGH — downgrades requirement** | `specs.md` Req 8; `design.md` Component 8 |
| R3-6 | `validateSession` (called by `refreshToken`) is **more expensive than the plan claims** — 1 hash lookup + 1 TTL activate + 1 redundant `findSafeById`. The redundant `findById(effectiveUserId)` (Req 3) is the smaller half; `validateSession` cost was undercounted. | MEDIUM | `specs.md` Req 3; `deep-analysis-R2.md` §5 |
| R3-7 | `notificationAlerts` uses `authScopes: { loggedIn: true }` — scopeAuth does **not** redundantly call `getUserContext` for this resolver. The 7.9s cost is entirely from `getAlerts` calling `hasPermission` × 2 (6 DB queries). The scopeAuth fix (Req 1.5) will **not** help `notificationAlerts` — only `permissions` and `permissionGroups`. | **MEDIUM — corrects expectation** | `deep-analysis-R2.md` §8 row 4; `specs.md` Req 1.5 |
| R3-8 | **`Query.me` redundantly re-fetches the user** — `auth.query.ts` line 17 calls `UserService.findById(ctx.user.id)` even though `ctx.user` was already loaded by `createContext` at `gqlContext.ts` line 80. The plan missed this entirely. `me` fires 16× per hour (60s poll) — 16 redundant DB queries/hour. Also the `UserPothosObject` shape returned by `findById` may differ from the `ctx.user` safe-user shape, so the fix must reconcile the two types. | **MEDIUM — NEW finding** | NEW — not covered by any existing requirement |
| R3-9 | **`Query.users` uses `permission: STAFF_LIST` scope** — scopeAuth redundantly calls `getUserContext` (3 DB). Plan's R2 §8 table row for `users` shows "6 DB per request" (no scopeAuth) but should be **9 DB** (6 + 3 redundant). Undercounted by 3 DB per `users` POST. | LOW — cost model refinement | `deep-analysis-R2.md` §8, §9 |

**Net impact on the plan:** The plan is largely sound but contains one critical viability error (R3-1), one inflated cost model (R3-3), one already-implemented requirement (R3-5), two new findings the plan missed entirely (R3-8 `Query.me` redundant fetch, R3-9 `Query.users` scopeAuth), and several smaller corrections. None of these change the **overall direction** (eliminate redundant DB work + batch HTTP), but they materially change the **implementation approach**, **expected savings**, and **scope** (two new requirements needed).

---

## Detailed Findings

### R3-1: Apollo Server 4 — HTTP Batching Requires `allowBatchedHttpRequests: true`

**Claim in plan (`deep-analysis-R2.md` §3, last line):**
> "Pothos + `@graphql-yoga/me` support batched POSTs natively."

**Reality:**

File `app/api/graphql/route.ts`:
- Line 1: `import { ApolloServer } from "@apollo/server"`
- Line 7: `import { startServerAndCreateNextHandler } from "@as-integrations/next"`
- Lines 63–65: `startServerAndCreateNextHandler<NextRequest>(server, { context: createGraphQLContext })`

`package.json`: `"@apollo/server": "^5.5.1"`, `"@as-integrations/next": "^4.0.0"`.

The GraphQL **schema** is built with Pothos (code-first), but the **runtime** is Apollo Server 4 (v5.5.1). `@graphql-yoga/me` is **not installed and not used**. The plan misidentifies the framework.

**Apollo Server 4 batch support (official docs, confirmed):**

> "By default, Apollo Server **doesn't support batching HTTP requests**. To enable HTTP batching, you must explicitly pass `allowBatchedHttpRequests: true` to the `ApolloServer` constructor."
>
> "In Apollo Server 4+, you must explicitly enable this feature by passing `allowBatchedHttpRequests: true`."

If `BatchHttpLink` is adopted without this server-side change, Apollo Server will reject array bodies with `"Operation batching disabled"` (HTTP 400). The plan's Req 3.5 fix direction is **viable but incomplete** — it omits the mandatory server-side constructor option.

**Integration handler compatibility (`@as-integrations/next` v4.1.0):**

`startServerAndCreateNextHandler.js` line 92 forwards `getBody(req)` raw to `server.executeHTTPGraphQLRequest`. `getBody` (lib/getBody.js) transparently returns `req.body` (Next API route) or `req.json()` — it does not parse or reject arrays. So `allowBatchedHttpRequests: true` on the `ApolloServer` is the **only** server-side change needed; the Next.js integration is array-transparent.

**Required correction to the plan:**

1. `deep-analysis-R2.md` §3 line 152 must be replaced: remove the "Pothos + `@graphql-yoga/me`" claim and instead state: "Apollo Server 4 (`@apollo/server` v5.5.1) is the runtime. HTTP batching is **off by default** — the `ApolloServer` constructor at `app/api/graphql/route.ts` must pass `allowBatchedHttpRequests: true` for `BatchHttpLink` array bodies to be accepted. Without this option, Apollo Server rejects arrays with `'Operation batching disabled'`."
2. `specs.md` Req 3.5 must add an AC: "WHEN `BatchHttpLink` is adopted THEN the `ApolloServer` constructor at `app/api/graphql/route.ts` SHALL pass `allowBatchedHttpRequests: true`; OTHERWISE batched POSTs will be rejected with HTTP 400."
3. `design.md` Component 3 must note the server-side constructor change.
4. `trackable-tasks.md` Phase 3 must include a task for `app/api/graphql/route.ts` — add `allowBatchedHttpRequests: true` to the `ApolloServer` constructor call.
5. The cross-file dependency map in `deep-analysis-R2.md` §11 row "3.5 batching (server)" must be updated from "verify batch POST handling" to "add `allowBatchedHttpRequests: true` to `ApolloServer` constructor".

**Alternative if batching is deemed too risky:** Option (B) of the original fix direction — source-aggregation (merge 3 `useQuery` into 1 `permissionsPageData` query) — requires NO server-side change and is viable standalone. The plan should present Option (B) as the safer primary path and Option (A) `BatchHttpLink` as the higher-risk, higher-reward path that requires the constructor change.

---

### R3-2: scopeAuth Evaluator Has Unreachable Dead Code

**File:** `backend/graphql/gqlSchemaBuilder.ts` lines 109–128

The plan documented only the `if (realUserId) { getUserContext(...) }` branch. The actual code:

```ts
const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;  // line 111
let actorIsSuperAdmin = ctx.isSuperAdmin;                                 // line 112
if (realUserId) {                                                          // line 113
  const actorContext = await PermissionsService.getUserContext(realUserId); // line 114
  actorIsSuperAdmin = actorContext.isSuperAdmin;                           // line 115
} else if (ctx.actorUserId) {                                             // line 116 — DEAD
  const actorContext = await PermissionsService.getUserContext(ctx.actorUserId); // line 117
  actorIsSuperAdmin = actorContext.isSuperAdmin;                           // line 118
}
```

The `else if` branch at lines 116–118 is **unreachable**: if `ctx.actorUserId` is truthy, then line 111's `?? ctx.actorUserId` already made `realUserId` truthy, so the `if (realUserId)` branch at line 113 fires and the `else if` is dead. This branch only fires when `realUserId` is falsy AND `ctx.actorUserId` is truthy — a state that cannot occur for any logged-in user (because `ctx.actorUserId` would backfill `realUserId`).

**Impact:** Low. This is dead code, not a runtime bug. But the implementer touching `gqlSchemaBuilder.ts` for Req 1.5 should either delete lines 116–118 or add a comment explaining the intent (defensive code for a hypothetical future where `actorUserId` is set without `user`). The plan should acknowledge this so the implementer does not waste time reasoning about a branch that never fires.

**Required correction to the plan:** `deep-analysis-R2.md` §2 should add a note: "**Dead-code observation:** lines 116–118 (`else if (ctx.actorUserId)`) are unreachable — `ctx.actorUserId` backfills `realUserId` at line 111, so the `if (realUserId)` branch always wins. The implementer should delete or document this branch as part of the Req 1.5 edit."

---

### R3-3: Session Lookups Are Redis-First in Production — Cost Model Inflated

**File:** `backend/db/repo/shared/session.repository.ts` lines 37–39, 152–170, 640–672

```ts
// line 37-39
function redisSessionsEnabled(): boolean {
  return getEnvironmentConfig().cacheProvider !== "postgres";
}
```

```ts
// lines 155-159 (findSessionById)
if (redisSessionsEnabled()) {
  const cached = await redisService.getSession(hashedId);
  if (cached) return cached;
}
// lines 161-165 — DB fallback only on Redis miss
```

**Production evidence:** 34 `"Session stored in Redis"` log entries in the 486-line dump. `redisSessionsEnabled()` returns true. Every `findSessionById` call hits Redis first; the DB is consulted only on a miss.

**Plan's claim (`deep-analysis-R2.md` §4, §9):**
- "8 redundant DB session lookups per navigation" (Req 3.6)
- Cost model §9 table line "Context creation × 8 POSTs = 48 DB" treats all session lookups as DB queries.

**Reality:** The 8 `findSessionById` calls per navigation are **Redis reads** (sub-millisecond to ~5ms), not DB queries (~50–100ms). The "duplicate session lookup" (Req 3.6) is still valid as hygiene — 8 Redis reads can be 4 — but the cost saving is ~16–40ms (Redis), not ~400–800ms (DB).

**However**, the dedup is still worth doing because:
1. On Redis **miss** (session evicted, Redis restart, cold cache), the call falls through to DB. Misses happen in production (the log shows session writes, implying cache population events).
2. Two service calls (`resolveAuthIdentityFromToken` + `resolveGroupSimulationFromToken`) hitting Redis for the **same `rawSessionId`** is redundant network round-trips even on a hit.

**Adjusted cost model for session-related work per /permissions navigation:**

| Cost center | Warm (Redis hit) | Cold (Redis miss → DB) |
|---|---|---|
| `findSessionById` × 8 (4 dup pairs) | 8 × ~2ms = ~16ms Redis | 8 × ~80ms = ~640ms DB |
| `getSessionGroupSimulation` × 8 (4 dup pairs) | 8 × ~2ms = ~16ms Redis | 8 × ~80ms = ~640ms DB |
| After Req 3.6 dedup (4 + 4 calls) | 8 × ~2ms = ~16ms Redis | 8 × ~80ms = ~640ms DB |
| Saving | ~16ms | ~640ms |

The saving is meaningful on cold paths but modest on warm paths. The plan should revise the cost estimate from "~8 redundant DB queries" to "~8 redundant Redis reads (DB on miss)" and note the saving is primarily cold-path.

**Additional precision (verified post-hoc):** Both `resolveAuthIdentityFromToken` (`impersonation.service.ts` line 256) and `resolveGroupSimulationFromToken` (`permission-group-simulation.service.ts` line 316) call `findSessionById` — Redis-first. For the **non-impersonating, non-simulating** case (the log shows neither):

- `resolveAuthIdentityFromToken`: 1 Redis read (`findSessionById`), then early return at lines 264–268 — **no `getActiveDbImpersonation` DB query**.
- `resolveGroupSimulationFromToken`: 1 Redis read (`findSessionById` line 316) + 1 Redis read (`getSessionGroupSimulation` line 325 via `getActiveGroupSimulation`) — both Redis-first. No `getPermissionGroupContext` unless simulation is active.

So the two "session lookups" per request the plan attributes 2 DB to are actually **2 Redis reads (for impersonation) + 2 Redis reads (for simulation) = 4 Redis reads**, 0 DB. The dedup (Req 3.6) saves Redis round-trips, not DB.

**Where the real DB cost is:** `getUserContext` (3 DB, no cache) + `findSafeById` (1 DB, no cache) per request — these are the queries that hit the database every time regardless of Redis. See R3-4.

**Required corrections to the plan:**
1. `deep-analysis-R2.md` §4: change "8 redundant DB session lookups/nav" to "16 redundant Redis session reads/nav (DB on miss) — 8 `findSessionById` (impersonation) + 8 `getSessionGroupSimulation` (group simulation), all Redis-first in production; the 8 pair-duplicates are the dedup target".
2. `deep-analysis-R2.md` §9 cost model: split the "48 DB" for context creation into "32 DB (getUserContext × 8 + findSafeById × 8) + 16 Redis (findSessionById × 8 pairs)". Total per nav: **~38 DB + ~16 Redis**, not ~64 DB.
3. `specs.md` Req 3.6: update the rationale from "eliminate 8 redundant DB queries" to "eliminate 8 redundant Redis reads (and DB on miss) — primary value is cold-path and network round-trip reduction, not warm-path DB saving".
4. `design.md` Component 4: note the Redis-first behavior.

---

### R3-4: `getUserContext` / `getPermissionGroupContext` / `findSafeById` Are Uncached — Plan Correct

**Files:**
- `backend/services/auth/permissions.service.ts` lines 11–58 (`getUserContext`), 60–62 (`hasPermission`), 87–110 (`getPermissionGroupContext`)
- `backend/db/repo/shared/user.repository.ts` lines 132–140 (`findSafeById` → `selectSafeUserRows`)

All three execute raw `db.select(...)` with **no caching layer**. Every call is a real DB query. `getUserContext` = 3 sequential DB queries for non-superAdmin (user row, groups join, permissions join), 2 for superAdmin (skips permission join).

**Plan's claim:** These are the dominant real DB cost. **Confirmed correct.**

This means the highest-leverage fixes are:
1. Req 1.5 (scopeAuth short-circuit) — eliminates 2 × 3 = 6 redundant `getUserContext` DB queries/nav on /permissions.
2. Req 1 (getAlerts accepts context) — eliminates 6 redundant `getUserContext` DB queries per `notificationAlerts` POST.
3. Req 3.5 (HTTP batching or source aggregation) — collapses 8 × (getUserContext + findSafeById) = 8 × 4 = 32 DB queries into 1 × 4 = 4 DB queries.

Together these cuts ~64 → ~10 DB queries/nav. This is the real saving, and the plan correctly identifies these as the targets.

**No correction needed** — this finding confirms the plan. Logged for the implementer's confidence.

---

### R3-5: Req 8 (Cold-Start Init) Is Largely Already Implemented

**Files:**
- `backend/lib/env.ts` lines 483–493: `ensureEnvironmentValidated` uses `getGlobalSingleton(ENV_KEY, ...)`. `getEnvironmentConfig` returns `cachedConfig ?? ensureEnvironmentValidated()`.
- `backend/db/drizzleDb.ts` line 38: `db = getGlobalSingleton(DB_KEY, initDatabase)`. Line 41: HTTP DB via `getGlobalSingleton`. Line 68: `getGlobalSingleton(DB_POOL_KEY, () => createPool())`.
- `backend/services/cache/CacheServiceFactory.ts` line 16: `getGlobalSingleton(CACHE_STATE_KEY, ...)`.

All three cold-start singletons (env config, DB pool, cache service) already survive warm invocations within the same container via `getGlobalSingleton`. The 3–4s cold-start times in the log are the **actual initialization work** (DB pool creation, Redis connection, env validation) that happens once per cold container and cannot be avoided in serverless without provisioned instances.

**Plan's Req 8 ACs (sample):**
- "AC#2: DB pool SHALL be created once per container via `getGlobalSingleton`" — **already done** (drizzleDb.ts line 68).
- "AC#3: Cache service SHALL be a singleton per container" — **already done** (CacheServiceFactory.ts line 16).
- "AC#5: Env validation SHALL use `getGlobalSingleton`" — **already done** (env.ts line 484).

**Required correction to the plan:**
1. `specs.md` Req 8: downgrade most ACs from "SHALL implement" to "SHALL verify existing implementation" or "SHALL confirm `getGlobalSingleton` is in place". The requirement becomes a **verification task**, not an implementation task.
2. The remaining real work in Req 8 is:
   - Verify `getGlobalSingleton` correctly handles the edge case where the container is reused but the singleton was never set (e.g., after a crash) — this is a defensive test, not a code change.
   - Consider whether `initDatabase` (the function passed to `getGlobalSingleton`) does any avoidable work on warm paths (it should not, since `getGlobalSingleton` short-circuits).
   - The 3–4s cold-start is **irreducible** for serverless without provisioned concurrency — the plan should explicitly state this so the implementer does not chase a phantom optimization.
3. `trackable-tasks.md` Phase 8: retitle from "Implement cold-start init optimization" to "Verify existing cold-start singleton optimization and document irreducible cold-start cost".

---

### R3-6: `validateSession` Is More Expensive Than the Plan Claims

**File:** `backend/services/auth/session.service.ts` lines 32–70

`validateSession(rawSessionId)`:
1. Line 36: `findByHmacHash(hmacHash)` — 1 query (Redis or DB)
2. Line 39/60: `SessionRepository.validate(rawSessionId)` — TTL check + activity touch (likely 1 DB UPDATE)
3. Line 68: `UserRepository.findSafeById(session.userId)` — 1 DB query (uncached)

**The plan's `refreshToken` cost estimate** (`deep-analysis-R2.md` §9): "4 DB queries: validateSession + findById + updateSession + findById-effective(redundant)".

**Reality:** `validateSession` alone is 2–3 queries (hash lookup + validate + findSafeById), so the refreshToken path is **5–6 DB queries**, not 4. The line-68 `findSafeById` inside `validateSession` is **redundant with `createContext`'s `findSafeById`** — the same user row is fetched twice for the same request (once in `createContext`, once inside `validateSession` via `session.service.ts`).

Additionally, the redundant `findById(effectiveUserId)` at `auth.mutation.ts` line 172 is the **smaller** half of the refreshToken cost. The `validateSession` chain (hash + validate + findSafeById) is the larger half and was undercounted.

**Required corrections to the plan:**
1. `deep-analysis-R2.md` §5: add a note that `validateSession` internal `findSafeById` (session.service.ts line 68) is a **second redundant user lookup** in addition to the `findById(effectiveUserId)` at auth.mutation.ts line 172. Both fetch the same user row.
2. `specs.md` Req 3 AC#1: expand scope — the fix is not just "skip `findById` when `effectiveUserId === user.id`" but also "pass the already-loaded `user` into `validateSession` to avoid its internal `findSafeById`", OR "have `validateSession` accept a preloaded user and skip the line-68 lookup".
3. `trackable-tasks.md` Phase 3: add a task to address the `validateSession` internal `findSafeById` redundancy.

---

### R3-7: `notificationAlerts` Does NOT Benefit from the scopeAuth Fix

**File:** `backend/graphql/query/notifications/notification-alerts.query.ts` line 9

```ts
notificationAlerts: t.field({
  type: NotificationAlertsResultPothosObject,
  authScopes: { loggedIn: true },  // ← NOT permission/superAdmin
  ...
})
```

`notificationAlerts` uses `authScopes: { loggedIn: true }`, which does **not** trigger the `getUserContext` branch in the scopeAuth evaluator (only `permission` and `superAdmin` scopes do). The plan's `deep-analysis-R2.md` §2 correctly lists `notificationAlerts` as "NOT affected" by the scopeAuth issue, but §8 (issue hierarchy) row 4 implies the scopeAuth fix (Req 1.5) is part of the `notificationAlerts` story.

**The 7.9s `notificationAlerts` cost is entirely** from `getAlerts` calling `hasPermission` twice (6 DB queries), not from scopeAuth. The scopeAuth fix (Req 1.5) helps **only** `Query.permissions` and `Query.permissionGroups` (and `Mutation.createPermissionGroup`).

**Required correction to the plan:**
1. `deep-analysis-R2.md` §8 row 4 (`getAlerts` re-fetches permission context): clarify that this is fixed by **Req 1** (getAlerts accepts context), NOT Req 1.5 (scopeAuth). Req 1.5 does not touch `notificationAlerts`.
2. The implementer should not expect the scopeAuth fix to improve `notificationAlerts` latency — only `permissions` and `permissionGroups`.

---

### R3-8: `Query.me` Redundantly Re-Fetches the User — Missing from Plan Entirely

**File:** `backend/graphql/query/auth/auth.query.ts` lines 8–20

```ts
me: t.field({
  type: UserPothosObject,
  nullable: true,
  authScopes: { loggedIn: true },
  resolve: async (_parent, _args, ctx) => {
    if (!ctx.user) return null;

    const user = await UserService.findById(ctx.user.id);  // ← REDUNDANT
    return user ? AuthUtils.toUserReturnType(user) : null;
  },
}),
```

`ctx.user` is already populated by `createContext` at `gqlContext.ts` line 80 (`findSafeById(userId)` — 1 DB query). The `me` resolver then calls `UserService.findById(ctx.user.id)` — a **second DB query** for the same user row.

**Cost:** `me` fires on every page navigation and on a 60s poll. The log shows 16 `me` invocations per hour. That's 16 redundant DB queries/hour (plus the `findSafeById` cost in context creation, which the plan already counts). The plan missed this entirely — it lists `me` as "6 DB per request" (4 context + 0 scopeAuth + 0 resolver body), but the `me` resolver adds 1 more DB query → **7 DB per request, not 6**.

**Type compatibility caveat:** `ctx.user` (from `findSafeById`) returns a "safe user" shape (no password hash, no email verification token, etc.). `UserService.findById` may return a fuller `UserReturnType`. The `me` resolver calls `AuthUtils.toUserReturnType(user)` — suggesting the `UserPothosObject` schema expects a specific shape. The fix direction:
- Either (a) change `UserPothosObject` to accept the safe-user shape and return `ctx.user` directly (zero DB queries), or
- (b) cache `UserService.findById(ctx.user.id)` in `createContext` so `ctx` carries the full user object already.

Option (b) is safer for the implementer because it preserves the existing `UserPothosObject` shape without a schema audit. Option (a) is the higher-leverage fix but requires verifying the GraphQL object type's field-level nullability matches the safe-user shape.

**Required corrections to the plan:**
1. Add a **new Requirement (Req 1.6, MEDIUM): Eliminate `Query.me` redundant `UserService.findById`**. Fix direction: return `ctx.user` (or a cached full-user object on `ctx`) instead of re-fetching.
2. `deep-analysis-R2.md` §9 cost model: update `Query.me` row from "6 DB" to "7 DB" (1 for resolver body).
3. `trackable-tasks.md`: add a phase for this fix.

---

### R3-9: `Query.users` Undercounted — `STAFF_LIST` Permission Scope Triggers scopeAuth

**File:** `backend/graphql/query/auth/auth.query.ts` line 38

```ts
users: t.field({
  authScopes: { permission: AppPermission.STAFF_LIST },  // ← permission scope!
  ...
})
```

`Query.users` uses `authScopes: { permission: AppPermission.STAFF_LIST }` — this **does** trigger the scopeAuth redundant `getUserContext` call (3 DB queries). The plan's R2 §8 table lists `users` as "6 DB per request" (no scopeAuth redundant), but it should be **9 DB** (6 context + 3 scopeAuth redundant). Undercounted by 3 DB per `users` POST.

**This means the scopeAuth fix (Req 1.5) helps `users` too** — not just `permissions` and `permissionGroups`. After Req 1.5 is applied, `users` drops from 9 → 6 DB per request.

**Required corrections to the plan:**
1. `deep-analysis-R2.md` §2: Add `Query.users` to the "Affected resolvers" list (currently only lists `permissions`, `permissionGroups`, `createPermissionGroup`).
2. `deep-analysis-R2.md` §8 issue hierarchy row `Query.users`: update per-request DB from "6" to "9".
3. `deep-analysis-R2.md` §9 cost model: update `users` row from "6" to "9" and total from ~64 to ~67 DB/nav.
4. Also check whether `Query.me` should be listed as "NOT affected" (it uses `loggedIn: true`, not `permission` — confirmed not affected), and `Query.user` (singular) uses `STAFF_EDIT` scope — also affected if hit, but not in the log.

---

## Revised Aggregate Cost Model (Warm, Non-Impersonating, per /permissions Navigation)

Replacing `deep-analysis-R2.md` §9:

| Cost center | DB queries | Redis reads | Source |
|---|---|---|---|
| Context creation × 8 POSTs | 8 × 4 = 32 | 8 × 4 = 32 | getUserContext (3 DB) + findSafeById (1 DB) + 4 Redis reads (2 findSessionById + 2 session-group-sim) per request |
| scopeAuth redundant (permissions + permissionGroups + users) | 3 × 3 = 9 | 0 | redundant getUserContext for permission-scoped resolvers — now includes `users` (R3-9) |
| `notificationAlerts` resolver `hasPermission` × 2 | 6 | 0 | re-fetches ctx.permissions via getUserContext |
| `Query.me` resolver body — redundant `findById` (R3-8) | 1 | 0 | re-fetches `ctx.user` via `UserService.findById` |
| `refreshToken` resolver body | 5–6 | 1 | validateSession (hash + validate + findSafeById) + findById(effective) + updateSession |
| **Total per navigation** | **~53–54 DB** | **~33 Redis** | |

**After all proposed fixes:**

| Cost center | DB queries | Redis reads | Fix |
|---|---|---|---|
| Context creation × 1 batched POST | 1 × 4 = 4 | 1 × 4 = 4 | Req 3.5 (BatchHttpLink + allowBatchedHttpRequests) OR source aggregation |
| scopeAuth (short-circuited) | 0 | 0 | Req 1.5 |
| `notificationAlerts` (accepts ctx) | 0 (notification rows only) | 0 | Req 1 |
| `Query.me` (return ctx.user or cached full user) | 0 | 0 | Req 1.6 NEW (R3-8) |
| `refreshToken` (skip redundant lookups) | 2–3 | 1 | Req 3 (expanded per R3-6) |
| `SessionRepository.findSessionById` dedup | 0 | 2 (was 4) | Req 3.6 |
| **Total after fixes** | **~6–7 DB** | **~7 Redis** | |

**Saving:** ~53–54 DB → ~6–7 DB (87% reduction), ~33 Redis → ~7 Redis (79% reduction). The plan's original "~64 DB → ~10 DB" estimate was directionally correct but treated Redis as DB (inflating warm-path DB), undercounted `validateSession`, missed `Query.me` redundant fetch (R3-8), and missed `Query.users` scopeAuth redundant call (R3-9).

---

## Required Corrections to Plan Documents (Implementation Guide for the Eventual Implementer)

These corrections are **plan-document edits** (no codebase changes). They should be applied to the plan files when the user authorizes implementation.

### `deep-analysis-R2.md`
- **§2**: Add dead-code note about lines 116–118 (R3-2). Add `Query.users` to the affected-resolvers list (R3-9).
- **§3 line 152**: Replace "Pothos + `@graphql-yoga/me` support batched POSTs natively" with the Apollo Server 4 + `allowBatchedHttpRequests: true` requirement (R3-1).
- **§4**: Change "8 redundant DB session lookups" to "16 redundant Redis session reads (DB on miss) — 8 `findSessionById` + 8 `getSessionGroupSimulation`, all Redis-first in production" (R3-3).
- **§5**: Add `validateSession` internal `findSafeById` redundancy note (R3-6).
- **§8 row 4**: Clarify that scopeAuth fix (Req 1.5) does NOT help `notificationAlerts` — only Req 1 does (R3-7).
- **§8 row `Query.users`**: Update per-request DB from "6" to "9" (3 scopeAuth redundant added, R3-9).
- **§8 row `Query.me`**: Update per-request DB from "6" to "7" (1 redundant `findById` in resolver body, R3-8).
- **§9**: Replace cost model with the revised table above (R3-3, R3-6, R3-8, R3-9).

### `specs.md`
- **Req 1.5**: No change to the requirement itself, but add a note that it does not affect `notificationAlerts` (R3-7). Add a note that it DOES affect `Query.users` (R3-9).
- **Req 1.6 (NEW, MEDIUM)**: Add a new requirement to eliminate `Query.me` redundant `UserService.findById` — return `ctx.user` or cache the full user object in `createContext` (R3-8).
- **Req 3 AC#1**: Expand to cover `validateSession` internal `findSafeById` redundancy (R3-6).
- **Req 3.5**: Add AC requiring `allowBatchedHttpRequests: true` on the `ApolloServer` constructor if `BatchHttpLink` is adopted (R3-1). Present source-aggregation (Option B) as the safer primary path.
- **Req 3.6**: Update rationale — Redis reads, not DB queries, are the primary cost on warm paths (R3-3).
- **Req 8**: Downgrade most ACs from "implement" to "verify existing `getGlobalSingleton` usage". Explicitly state the 3–4s cold-start is irreducible without provisioned concurrency (R3-5).

### `design.md`
- **Component 3**: Note the Apollo Server 4 `allowBatchedHttpRequests: true` server-side requirement (R3-1).
- **Component 4**: Note Redis-first session behavior (R3-3).
- **Component 8**: Reframe as verification, not implementation (R3-5).
- **Add Component 9 (NEW)**: `Query.me` user-fetch elimination (R3-8).

### `trackable-tasks.md`
- **Phase 3**: Add task for `app/api/graphql/route.ts` — `allowBatchedHttpRequests: true` (R3-1). Add task for `validateSession` findSafeById redundancy (R3-6).
- **Phase 8**: Retitle to "Verify existing cold-start singleton optimization" (R3-5).
- **Add Phase 9 (NEW)**: Eliminate `Query.me` redundant `UserService.findById` (R3-8).

### `deep-analysis-R2.md` §11 (Cross-File Dependency Map)
- **Row "3.5 batching (server)"**: Change "verify batch POST handling" to "add `allowBatchedHttpRequests: true` to `ApolloServer` constructor" (R3-1).
- **Add row "1.6 Query.me"**: Files to edit: `backend/graphql/query/auth/auth.query.ts`, potentially `backend/graphql/gqlContext.ts` (if caching full user). Layer: `backend/graphql/AGENTS.md`.

---

## Framework Facts (Authoritative Reference for the Implementer)

- **Schema builder:** Pothos (code-first) — `backend/graphql/gqlSchemaBuilder.ts`
- **Runtime:** Apollo Server 4 (`@apollo/server` v5.5.1) — `app/api/graphql/route.ts` line 1
- **Next.js integration:** `@as-integrations/next` v4.1.0 — `startServerAndCreateNextHandler` (transparently forwards array bodies)
- **Apollo client:** `@apollo/client` v4.2.12 — `PersistedQueryLink` + `HttpLink` (no `BatchHttpLink`)
- **APQ on server:** enabled via `persistedQueries: { cache: new ApolloCacheAdapter(), ttl: null }` at route.ts lines 54–58
- **HTTP batching on server:** OFF by default — requires `allowBatchedHttpRequests: true` on `ApolloServer` constructor
- **Session cache:** Redis-first when `cacheProvider !== "postgres"` — production uses Redis (34 "Session stored in Redis" log entries)
- **`getGlobalSingleton`:** already used for env, DB pool, DB client, and cache service — cold-start singletons are in place

---

## Conclusion

The plan is **directionally correct** — the identified issues (redundant `getUserContext`, no HTTP batching, `getAlerts` re-fetch, `refreshToken` redundancy) are all real and the fix directions are sound. However, the reality check uncovered **9 material issues** (7 corrections + 2 new findings the plan missed entirely):

1. **One critical viability fix** (R3-1): the BatchHttpLink approach will fail silently without the server-side `allowBatchedHttpRequests: true`. The plan must document this.
2. **One dead-code note** (R3-2): scopeAuth evaluator has an unreachable `else if` branch.
3. **One cost-model correction** (R3-3): session lookups are Redis (16 reads), not DB. The savings are real but smaller on warm paths than the plan claims.
4. **One confirmed claim** (R3-4): `getUserContext`/`findSafeById` are uncached — the dominant real DB cost.
5. **One requirement downgrade** (R3-5): Req 8 is mostly already implemented. The implementer should verify, not re-implement.
6. **One undercounted cost** (R3-6): `validateSession` has a second redundant `findSafeById` the plan missed.
7. **One expectation correction** (R3-7): the scopeAuth fix does not help `notificationAlerts`.
8. **NEW finding missed by plan** (R3-8): `Query.me` redundantly re-fetches the user (16 times/hour). Needs a new Req 1.6.
9. **NEW finding missed by plan** (R3-9): `Query.users` uses `STAFF_LIST` permission scope — scopeAuth redundantly calls `getUserContext` here too. The plan's affected-resolvers list omitted `users`.

With these corrections applied to the plan documents (not the codebase), the implementer will have an accurate, viable, and correctly-scoped plan to execute when authorized. The revised cost model shows **~53–54 DB → ~6–7 DB** (87% reduction) and **~33 Redis → ~7 Redis** (79% reduction) per /permissions navigation when all fixes (including the two new findings) are applied.
