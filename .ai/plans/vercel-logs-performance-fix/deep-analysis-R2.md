# Deep Analysis — Round 2 Addendum

> **Status:** Analysis only. No code implementation. Builds on the 8-issue plan in `specs.md` / `design.md` / `trackable-tasks.md`.

## Document Information

- **Date:** 2026-08-18 (second investigation pass)
- **Trigger:** User requested "more deeper analysis" after the first plan + plan-review-R1
- **Method:** Quantitative log analysis (AWK extraction of all resolver timings) + source-code trace of every hot path
- **Scope:** Re-examine every finding from round 1 against the actual source, and surface anything the first pass missed

---

## 1. Quantitative Timing Evidence (from the 486-line log dump)

Resolver timings, extracted by parsing every `Query.X`/`Mutation.X` log line and their accompanying `duration_ms`:

| Resolver | Count | Min(ms) | Avg(ms) | Max(ms) | Notes |
|---|---|---|---|---|---|
| `Query.notificationAlerts` | 8 | 849.8 | **2900.6** | **7936.7** | worst resolver in the log |
| `Query.permissions` | 8 | 473.9 | **2532.1** | **7542.6** | second worst |
| `Mutation.refreshToken` | 6 | 2315.7 | **2329.2** | 2352.2 | consistent ~2.3s — runs on every nav |
| `Query.permissionGroups` | 8 | 756.6 | 787.6 | 863.2 | |
| `Mutation.createPermissionGroup` | 1 | 381.7 | 381.7 | 381.7 | write op |
| `Query.users` | 8 | 98.1 | 189.6 | 282.6 | |
| `Query.impersonationStatus` | 8 | 94.4 | 118.5 | 186.9 | |
| `Query.me` | 16 | 97.2 | 102.4 | 132.1 | 60s poll × ~1 hour |
| `Query.permissionGroupSimulationStatus` | 8 | 95.2 | 96.6 | 97.2 | |

Frequency counts across the 6-minute log window:

| Log line pattern | Count | Implication |
|---|---|---|
| `POST /api/graphql` | 72 | 8 concurrent × 9 navigations |
| `Session stored in Redis` | 34 | session write on every refresh + every login check |
| `POST /api/logs` | 16 | client log flushes, avg ~23s apart |
| `RequirePermission denied` | 22 | NOTIFICATION_VIEW_ALERTS missing for this user → 22 noise logs per nav |
| `HEAD /api/graphql` | 6 | Apollo APQ hash probe, 6 misses → 6 full POSTs after |
| `RootLayout theme detection` | 22 | per-render, expected |
| `env-config cache miss → DB miss → process.env` | 8 | 4 cold starts × 2 keys (CACHE_PROVIDER, REDIS_PROVIDER) |
| `env-config cache hit` | 22 | warm lookups, good |
| `Updated session` | 6 | 1 per refreshToken mutation |
| `AuthRedirect no access_token` | 2 | cookie not set; falls back to session-only auth |
| `DEP0169 url.parse()` | 4 | cold-start only, transitive dep |
| Cold start (`Validating env`) | 4 | 4 distinct cold containers in 1 hour |

---

## 2. NEW CRITICAL FINDING — scopeAuth Redundant `getUserContext`

**File:** `backend/graphql/gqlSchemaBuilder.ts` lines 109–128

The Pothos `scopeAuth.authScopes` evaluator runs **on every resolver that declares `authScopes: { permission: ... }` or `authScopes: { superAdmin: true }`**. Its current body:

```ts
authScopes: async ctx => {
  const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;
  let actorIsSuperAdmin = ctx.isSuperAdmin;
  if (realUserId) {
    const actorContext = await PermissionsService.getUserContext(realUserId); // ← 3 DB queries
    actorIsSuperAdmin = actorContext.isSuperAdmin;
  }
  return {
    permission: (key) => ctx.isSuperAdmin || ctx.permissions.includes(key), // ← uses ctx, NOT actorContext
    superAdmin: actorIsSuperAdmin,
  };
}
```

**Why this is wasteful:**

1. Line `const actorContext = await PermissionsService.getUserContext(realUserId)` executes **3 sequential DB queries** (`users`, `userPermissionGroups+permissionGroups`, `groupPermissions+permissions`) every time the evaluator runs.
2. The `permission` callback already reads from `ctx.isSuperAdmin` and `ctx.permissions` — values that were fetched **once** in `createContext` (`gqlContext.ts` line 78). The freshly-fetched `actorContext` is never consulted by the `permission` callback. The `getUserContext` call exists solely to populate `actorIsSuperAdmin`, which feeds the `superAdmin` scope.
3. In the **non-impersonation, non-simulation** case (the log shows no impersonation/simulation activity), `realUserId === ctx.user.id`, so `getUserContext(realUserId)` is fetching the same row that `createContext` already fetched ~ms earlier. The result equals `ctx.isSuperAdmin`.
4. The evaluator runs **per resolver field**, and the /permissions page fires **8 concurrent GraphQL POSTs** (see §3). Each POST independently re-evaluates scopeAuth → up to 8 × 3 = **24 redundant DB queries per navigation**, just to recompute a boolean already on `ctx`.

**Affected resolvers** (those using `authScopes: { permission: AppPermission.X }`):

- `Query.permissions` — `PERMISSION_GROUPS_MANAGE` (`permission-management.pothos.ts` line 167)
- `Query.permissionGroups` — `PERMISSION_GROUPS_MANAGE` (line 174)
- `Query.users` — `STAFF_LIST` (`auth.query.ts` line 38) — **added R3-9** (was missing from R2)
- `Query.permissionGroupSimulationStatus` — `loggedIn: true` → **NOT affected** (no `permission` scope)
- `Query.me`, `Query.impersonationStatus`, `Query.notificationAlerts` — `loggedIn: true` → **NOT affected**
- `Mutation.refreshToken` — no `authScopes` declared → **NOT affected** (good)
- `Mutation.createPermissionGroup` — `PERMISSION_GROUPS_MANAGE` → affected
- `Mutation.logout`, `Mutation.changePassword` — `loggedIn: true` → **NOT affected**

So on the /permissions page the redundant call fires for `Query.permissions`, `Query.permissionGroups`, and `Query.users` — **3 of the 8 concurrent POSTs**, adding 3 × 3 = **9 redundant DB queries per navigation** (was 6 before R3-9 correction added `users`; not 24 — corrected after verifying which resolvers use `permission` scope).

> **R3-2 Dead-code note:** `gqlSchemaBuilder.ts` lines 116–118 contain an `else if (ctx.actorUserId)` branch that is **unreachable**. Line 111 already sets `realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id`, so when `realUserId` is falsy, `ctx.actorUserId` is necessarily also falsy. The implementer should delete this dead branch or document why it exists.

**Fix direction (do NOT implement now):** The `superAdmin` scope should default to `ctx.isSuperAdmin` (already correct for the common case) and only call `getUserContext` when impersonation/simulation is active (`ctx.realUserId && ctx.realUserId !== ctx.user?.id`). The `permission` callback is already correct and needs no change. This is a **gqlSchemaBuilder.ts-only edit** with no downstream API changes.

---

## 3. NEW HIGH FINDING — No HTTP Batching in Apollo Client

**File:** `frontend/common/providers/apollo/AppApolloProvider.tsx` lines 42–66

The Apollo link chain is `ApolloLink.from([errorLink, connectivityLink, authLink, PersistedQueryLink, HttpLink])`. There is **no `BatchHttpLink`**. Every `useQuery`/`useMutation` issues a separate HTTP POST to `/api/graphql`.

The /permissions page (`usePermissionManagementData.ts` + `DashboardClientBridge.tsx` + `AuthProvider.tsx`) mounts the following concurrent `useQuery`/`useMutation` hooks:

1. `useQuery(meQueryDocument, { pollInterval: 60_000 })` — `DashboardClientBridge` (poll badge count)
2. `useQuery(notificationAlertsQueryDocument)` — notifications drawer VM
3. `useQuery(impersonationStatusQueryDocument)` — impersonation banner
4. `useQuery(permissionGroupSimulationStatusQueryDocument)` — simulation banner
5. `useQuery(permissionsQueryDocument)` — permissions page data
6. `useQuery(permissionGroupsQueryDocument)` — permissions page data
7. `useQuery(usersQueryDocument, ...)` — permissions page data
8. `useMutation(refreshTokenMutationDocument)` — `AuthProvider.checkAuth` effect on mount

This matches exactly the log evidence: **8 POST /api/graphql with identical timestamps (to the hundredth of a second) per navigation**.

Each of the 8 POSTs independently:
- Decodes the JWT (`verifyToken` — no DB)
- Calls `ImpersonationService.resolveAuthIdentityFromToken` → `SessionRepository.findSessionById` (1 DB)
- Calls `PermissionGroupSimulationService.resolveGroupSimulationFromToken` → `SessionRepository.findSessionById` **again** (1 DB — **duplicate session lookup of the previous call**, same `rawSessionId`)
- Calls `PermissionsService.getUserContext(userId)` (3 DB)
- Calls `UserService.findSafeById(userId)` (1 DB)
- Runs scopeAuth (redundant getUserContext when `permission` scope is used — see §2)
- Runs the resolver body

**Per-request DB queries (non-impersonating, session cookie present):**

| Step | DB queries | Redis reads | Source |
|---|---|---|---|
| `resolveAuthIdentityFromToken` | — | 1 | `SessionRepository.findSessionById` (R3-3: Redis-first in prod) |
| `resolveGroupSimulationFromToken` | — | 1 | `SessionRepository.findSessionById` (duplicate; R3-3: Redis-first) |
| `resolveGroupSimulationFromToken` → `getSessionGroupSimulation` | — | 2 | `SessionRepository.getSessionGroupSimulation` (R3-3: Redis-first in prod) |
| `createContext` → `getUserContext` | 3 | — | user, groups, permissions |
| `createContext` → `findSafeById` | 1 | — | user lookup |
| scopeAuth (only for `permission`-scoped resolvers) | 0–3 | — | redundant `getUserContext` |
| **Subtotal per request** | **4 DB + 4 Redis** (no permission scope) / **7 DB + 4 Redis** (with permission scope) | | R3-3 correction applied |

**Aggregate per /permissions page navigation:**

| Resolver | Per-request | Count | Subtotal |
|---|---|---|---|
| `Query.me` | 4 DB + 4 Redis (+1 DB in resolver body — R3-8 `findById`) | 1 | 5 DB + 4 Redis |
| `Query.notificationAlerts` | 4+6 DB + 4 Redis (resolver calls `hasPermission` twice, each → `getUserContext`) | 1 | 10 DB + 4 Redis |
| `Query.impersonationStatus` | 4 DB + 4 Redis | 1 | 4 DB + 4 Redis |
| `Query.permissionGroupSimulationStatus` | 4 DB + 4 Redis | 1 | 4 DB + 4 Redis |
| `Query.permissions` | 7 DB + 4 Redis (4+3 scopeAuth redundant) | 1 | 7 DB + 4 Redis |
| `Query.permissionGroups` | 7 DB + 4 Redis (4+3 scopeAuth redundant) | 1 | 7 DB + 4 Redis |
| `Query.users` | 7 DB + 4 Redis (4+3 scopeAuth redundant — R3-9) | 1 | 7 DB + 4 Redis |
| `Mutation.refreshToken` | 5–6 DB + 5 Redis (4 context DB + 4 context Redis + 1–2 body DB + 1 body Redis; R3-6: includes redundant findSafeById in body; R3-3: Redis-first) | 1 | 5–6 DB + 5 Redis |
| **Total per navigation** | | **8 requests** | **~49–50 DB + ~33 Redis** (7×4+5=33; see §9 for revised model) |

On cold start add the env-config misses (8) and the 3–4s init latency paid by whichever container the request lands on.

**Fix direction (do NOT implement now):** Two complementary options —
- **(A) Apollo `BatchHttpLink`**: wrap the existing `HttpLink` so the 8 concurrent `useQuery` calls collapse into 1 HTTP POST carrying an array of operations. This single change cuts context-creation cost 8× (one `createContext` per batch instead of 8) and eliminates the duplicated `SessionRepository.findSessionById`.
- **(B) Aggregate at the source**: merge `permissions` + `permissionGroups` + `users` into a single `permissionsPageData` query in `usePermissionManagementData.ts`. Cuts 3 POSTs → 1.

Option A requires verifying that the GraphQL server runtime accepts batched POST bodies (array of operations). Option B does not require server-side changes.

> **R3-1 Framework correction:** The server runtime is **Apollo Server 4** (`@apollo/server` v5.5.1), NOT Pothos/Yoga — verified in `app/api/graphql/route.ts` line 1. Apollo Server 4 **disables HTTP batching by default**; it requires `allowBatchedHttpRequests: true` on the `ApolloServer` constructor to accept array request bodies. The `@as-integrations/next` v4.1.0 handler transparently forwards array bodies (its `getBody.js` does not reject arrays), so only the `ApolloServer` config flag needs to be set. If `BatchHttpLink` is adopted, the implementer MUST add `allowBatchedHttpRequests: true` to the `ApolloServer` call in `route.ts`. **Option B (source-aggregation) is the safer primary path** — it requires no server-side change at all.

---

## 4. NEW FINDING — Duplicate `SessionRepository.findSessionById` in Context Creation

**Files:** `backend/graphql/gqlContextFactory.ts` line 30 + line 45; `backend/services/auth/impersonation.service.ts` line 256; `backend/services/auth/permission-group-simulation.service.ts` line 316

`resolveAuthFromRequest` calls `ImpersonationService.resolveAuthIdentityFromToken` then `PermissionGroupSimulationService.resolveGroupSimulationFromToken`. Both methods call `SessionRepository.findSessionById(rawSessionId)` with the **same `rawSessionId`** — a row that was just fetched ~µs earlier by the impersonation call.

> **R3-3 Redis-first correction:** In production the session store is **Redis-first** (`redisSessionsEnabled()` returns `true` when `cacheProvider !== "postgres"` — `session.repository.ts` lines 37-39). `findSessionById` (lines 155-159) checks Redis first; DB is only hit on miss. `getSessionGroupSimulation` (lines 644-653) is also Redis-first. The log shows 34 "Session stored in Redis" entries confirming this. So the "8 redundant DB session lookups" claimed in R2 are actually **16 redundant Redis reads** (~1-5ms each, not DB ~50-100ms each): per request there are 4 Redis reads (2 `findSessionById` + 2 `getSessionGroupSimulation`), × 8 POSTs = 32 Redis. The plan's cost model must split DB vs Redis — see the §9 revised table. The dedup fix is still worthwhile (halves the Redis reads from ~33 → ~7 per nav) but the latency saving is smaller than the R2 estimate assumed.

**Fix direction:** Fetch the session once in `resolveAuthFromRequest` and pass the `session` object into both resolvers. Or, cache the result on the request scope for the duration of `createGraphQLContext`. This is a `gqlContextFactory.ts`-only refactor with the two downstream service methods gaining an overload that accepts a preloaded `SessionSelectType`.

---

## 5. NEW FINDING — Redundant `UserService.findById(effectiveUserId)` in `refreshToken`

**File:** `backend/graphql/mutation/auth/auth.mutation.ts` line 172 (`rotateTokensAndSession`)

```ts
const effectiveUserId = ctx.isImpersonating && ctx.user ? ctx.user.id : user.id;
const effectiveUser = (await UserService.findById(effectiveUserId)) ?? user;
```

When `ctx.isImpersonating` is false (the common case), `effectiveUserId === user.id`, and `user` was **already loaded** by `resolveUserFromSession`/`resolveUserFromRefreshToken` at lines 40/43/58. Line 172 then re-fetches the same user row — a redundant DB query that contributes to the 2.3s refreshToken cost.

**Fix direction:** Skip the `findById` when `effectiveUserId === user.id`; reuse the `user` parameter. Only fetch when impersonation changes the effective user. This is already covered by `specs.md` Requirement 3 AC#1 — confirm against this exact line.

> **R3-6 `validateSession` redundancy note:** The `refreshToken` path goes through `SessionService.validateSession` (`session.service.ts` lines 32-70) before reaching `rotateTokensAndSession`. `validateSession` calls `findByHmacHash` (Redis/DB) + `SessionRepository.validate` (TTL UPDATE) + `findSafeById` at line 68 (**uncached DB** query). That `findSafeById` is **redundant** with `createContext`'s `findSafeById` at `gqlContext.ts` line 80 — the same user row is fetched twice per `refreshToken` request. So the R2 estimate of "4 DB" for the refreshToken body is actually **5-6 DB** (validateSession `findSafeById` + findByHmacHash-DB-fallback + validate UPDATE + findById(effective) + createSession `findSafeById` overlap). Req 3 AC#1 should be expanded to cover this `validateSession` internal redundancy, and Phase C should add a task to coalesce or cache the user lookup shared between `validateSession` and `createContext`.

---

## 6. NEW FINDING — `NotificationAlertsService.getAlerts` Re-Fetches Permission Context

**File:** `backend/services/notification/notification-alerts.service.ts` line 210 + line 217

```ts
const canViewAlerts = await PermissionsService.hasPermission(userId, AppPermission.NOTIFICATION_VIEW_ALERTS);
...
const canListComplaints = await PermissionsService.hasPermission(userId, AppPermission.COMPLAINTS_LIST);
```

Each `hasPermission` call invokes `getUserContext` → **3 DB queries**. Two calls = **6 DB queries**. The `notificationAlerts` resolver (`notification-alerts.query.ts` line 15) calls `getAlerts(ctx.user.id, ctx.locale)` — passing only `userId` and `locale`, **not** the permission context that is already sitting on `ctx` (fetched during `createContext`).

This is the dominant cost of the 7.9s `notificationAlerts` resolver time. The GraphQL context already has `ctx.permissions: AppPermission[]` and `ctx.isSuperAdmin: boolean`; the service should accept a `UserPermissionContext` and consult it directly.

**This is already Requirement 1 in `specs.md`** — the round-2 analysis confirms the cost model (6 DB queries from `hasPermission` × 2, not 3 as round 1 estimated) and the exact lines (`210`, `217`).

---

## 7. NEW LOW FINDING — `AuthRedirect no access_token` Cookie

**Log evidence:** 2 occurrences of `"[AuthRedirect] no access_token cookie — using session-only auth"`.

**Source:** `frontend/common/providers/apollo/AuthProvider.tsx` — `checkAuth` runs on mount (line 128–130) and calls `refreshToken`. When `refreshToken` succeeds it calls `updateAuthToken(data.refreshToken.token)` (line 42), storing the new access token **in React memory only** (the comment at line 99–102 is explicit: "Access token is stored in React context state only (memory)").
The `access_token` httpOnly cookie is set by the server via `setAuthCookies` (`auth.mutation.ts` line 168) inside `rotateTokensAndSession` — but only when `rawSessionId` is truthy and the cookie refresh branch runs. On the next navigation, the in-memory token is gone (new page = new React tree), and the `access_token` cookie may or may not have been written depending on the branch taken.

This is **not** a crash — `refreshToken` recovers via the `session_id` cookie path. But the 2 log entries indicate the access-token cookie path is unreliably set, forcing the slower session-resolution path on every navigation. Worth tracking but not a primary performance issue.

**Fix direction (do NOT implement now):** Audit `rotateTokensAndSession` to confirm `setAuthCookies` always writes the `access_token` cookie when `rawSessionId` is provided, including the `resolvedViaSessionId === true` branch (currently only writes when `rawSessionId` is provided — check whether the session-cookie path sets the access_token cookie).

---

## 8. Revised Issue Hierarchy (Priority Order)

Re-ordered after the round-2 quantitative analysis. Numbers in brackets are the original `specs.md` requirement numbers; **NEW** marks findings not in the original plan.

| # | Issue | Severity | DB waste / log noise | Original Coverage |
|---|---|---|---|---|
| 1 | **scopeAuth redundant `getUserContext`** | CRITICAL | **9** redundant DB queries/nav (3 permission-scoped POSTs × 3 — `permissions` + `permissionGroups` + `users`) | **NEW** — R3-9 added `users` |
| 2 | **No HTTP batching — 8 concurrent POSTs/nav** | HIGH | 8 × full context creation instead of 1 | **NEW** |
| 3 | **Duplicate `SessionRepository.findSessionById`** | HIGH | **16 redundant Redis reads/nav** (not DB — Redis-first in prod; R3-3) | **NEW** — R3-3 corrected DB→Redis |
| 4 | **`getAlerts` re-fetches permission context** | CRITICAL | 6 redundant DB queries/nav (2 `hasPermission` × 3) — **scopeAuth fix (Req 1.5) does NOT help this**; only Req 1 does (R3-7: `notificationAlerts` uses `loggedIn: true`, not `permission` scope) | Req 1 (confirmed) |
| 5 | **`refreshToken` redundant `findById(effectiveUserId)`** | HIGH | 6 redundant user lookups/nav (1 per refreshToken) — **+1 redundant `findSafeById` inside `validateSession`** (R3-6) | Req 3 (confirmed) |
| 6 | **`refreshToken` always-rotate** | HIGH | 6 updateSession writes/nav + JWT ops | Req 3 AC#3 (confirmed) |
| 7 | **Cold-start full re-init (~3–4s × 4)** | HIGH | env validation + DB pool + Redis init — **mostly irreducible; `getGlobalSingleton` already in place** (R3-5) | Req 8 (confirmed) |
| 8 | **env-config DB cache miss on cold start** | MEDIUM | 8 DB misses (4 cold × 2 keys) | Req 2 (confirmed) |
| 9 | **`Query.me` 60s poll** | LOW | 16 invocations/hour | Req 4 (confirmed) |
| 9a | **`Query.me` redundant `UserService.findById`** (R3-8) | MEDIUM | **16 redundant DB/hour** — resolver re-fetches `ctx.user`; **NEW, plan missed** | **NEW** — Req 1.6 |
| 10 | **`/api/logs` POST every ~23s** | MEDIUM | 16 POSTs/hour | Req 6 (confirmed) |
| 11 | **`RequirePermission` DEBUG noise** | MEDIUM | 22 noise logs/nav | Req 5 (confirmed) |
| 12 | **`DEP0169 url.parse()`** | LOW | 4 warnings | Req 7 (confirmed) |
| 13 | **`AuthRedirect no access_token` cookie** | LOW | 2 occurrences, slow session path | **NEW** |

---

## 9. Aggregate Cost Model (Revised — R3)

> **R3 corrections applied:** R3-3 (Redis-first session), R3-6 (`validateSession` `findSafeById`), R3-8 (`Query.me` redundant fetch), R3-9 (`Query.users` scopeAuth). Previous R2 table treated Redis reads as DB queries and undercounted `users` (6→9), `me` (6→7), and `refreshToken` (4→5-6).

**Per /permissions page navigation (warm, non-impersonating):**

| Cost center | DB queries | Redis reads | Source |
|---|---|---|---|
| Context creation × 8 POSTs | 8 × 4 = 32 | 8 × 4 = 32 | getUserContext (3 DB) + findSafeById (1 DB) + 4 Redis reads (2 findSessionById + 2 session-group-sim) per request |
| scopeAuth redundant (permissions + permissionGroups + **users** R3-9) | 3 × 3 = 9 | 0 | redundant getUserContext for permission-scoped resolvers — now includes `users` |
| `notificationAlerts` resolver `hasPermission` × 2 | 6 | 0 | re-fetches ctx.permissions via getUserContext |
| `Query.me` resolver body — redundant `findById` (R3-8) | 1 | 0 | re-fetches `ctx.user` via `UserService.findById` |
| `refreshToken` resolver body | 1–2 | 1 | validateSession redundant `findSafeById` (1 DB — R3-6) + findById(effective) + updateSession; excluding the 4 DB/4 Redis context creation already counted above |
| **Total per navigation** | **~49–50 DB** | **~33 Redis** | |

**Previous R2 estimate** was "~64 DB queries/nav" — this treated Redis reads as DB (inflating warm-path DB), undercounted `validateSession`, missed `Query.me` redundant fetch (R3-8), missed `Query.users` scopeAuth redundant call (R3-9), and double-counted refreshToken context creation in the resolver body cost.

**Per cold start (added):** +8 env-config DB misses + 3–4s init latency on whichever container the request lands on (R3-5: mostly irreducible — `getGlobalSingleton` already used for env, DB, pool, cache).

**After all proposed fixes:**

| Cost center | DB queries | Redis reads | Fix |
|---|---|---|---|
| Context creation × 1 batched POST | 1 × 4 = 4 | 1 × 4 = 4 | Req 3.5 (Option A: BatchHttpLink + `allowBatchedHttpRequests`). Option B (source-aggregation) → 6 × 4 = 24 DB + 24 Redis — see note below |
| scopeAuth (short-circuited) | 0 | 0 | Req 1.5 |
| `notificationAlerts` (accepts ctx) | 1 (notification rows only) | 0 | Req 1 |
| `Query.me` (return ctx.user or cached full user) | 0 | 0 | Req 1.6 NEW (R3-8) |
| `refreshToken` (skip redundant lookups) | 0–1 | 1 | Req 3 (expanded per R3-6): skip redundant `findSafeById` (AC#3) + skip redundant `findById(effective)` (AC#1) + skip rotation when token valid (AC#4); remaining 0–1 DB read is `findById(effective)` only when impersonating with effective ≠ user; `updateSession` write not counted (column = reads); excluding the 4 DB/4 Redis context creation already counted above |
| `SessionRepository.findSessionById` dedup | 0 | 2 (was 4) | Req 3.6 |
| **Total after fixes (Option A — BatchHttpLink)** | **~5–6 DB** | **~7 Redis** | |
| **Total after fixes (Option B — source-aggregation)** | **~25–26 DB** | **~26 Redis** | 6 context creations instead of 1; all other optimizations identical |

**Saving (Option A — BatchHttpLink):** ~49–50 DB → ~5–6 DB (**~88-89% reduction**), ~33 Redis → ~7 Redis (**79% reduction**). **Saving (Option B — source-aggregation):** ~49–50 DB → ~25–26 DB (**~48-49% reduction**), ~33 Redis → ~26 Redis (**~21% reduction**). Plan's original "~64 DB → ~10 DB" estimate was directionally correct but treated Redis as DB (inflating warm-path DB), undercounted `validateSession`, missed `Query.me` redundant fetch (R3-8), missed `Query.users` scopeAuth redundant call (R3-9), and double-counted refreshToken context creation in the resolver body cost.

---

## 10. Recommendations for the Plan (Do NOT Implement Now)

The existing `specs.md` Requirements 1, 3, and 8 cover the highest-leverage fixes already. The round-2 findings add three new requirements and refine the cost model:

**New requirements to add to `specs.md`:**

- **Requirement 1.5 (NEW, CRITICAL): Eliminate `scopeAuth` redundant `getUserContext`.** gqlSchemaBuilder.ts scopeAuth evaluator should short-circuit to `ctx.isSuperAdmin` for the `superAdmin` scope when `ctx.realUserId` is absent or equals `ctx.user.id`. Only call `getUserContext` when impersonation/simulation is actually active. Estimated saving: **9 DB queries/nav** (3 permission-scoped POSTs × 3 — `permissions`, `permissionGroups`, **`users`** per R3-9), more on permission-management mutations. **R4-32 note:** The redundancy fires for ALL 83+ permission-scoped fields across 27 files in `backend/graphql/`, not just the 3 on /permissions. The 9 DB/nav figure is /permissions-page-specific; other pages with permission-scoped resolvers (billing, complaints, students, etc.) also incur the 3 DB scopeAuth cost per field. **R4-30 note:** The scopeAuth `getUserContext` runs 3 DB queries but only `isSuperAdmin` is used from the result — the `permissions` and `permissionGroups` are discarded.

- **Requirement 1.6 (NEW, MEDIUM — R3-8, R4-31 corrected): Eliminate `Query.me` redundant `UserService.findById`.** `auth.query.ts` line 17 re-fetches via `UserService.findById(ctx.user.id)` — the same user already loaded by `createContext` at `gqlContext.ts` line 80 (`findSafeById`). Fires 16×/hour (60s poll) — 16 redundant DB queries/hour. **R4-31 critical correction:** `ctx.user` is typed as `{ id: string; displayCurrency: CurrencyCode | null }` — a 2-field minimal object (gqlContext.ts lines 8–13). It does NOT have `name`, `email`, `role`, `status`, `timezone`, etc. Therefore "return `ctx.user`" is NOT viable. The fix must either: (a) **Add `safeUser: UserSelectType | null` to `BaseContext`** and populate it in `createContext` (line 80 already calls `findSafeById` — just store the result on context), then use `AuthUtils.toUserReturnType(ctx.safeUser, { role: ctx.role })` in the resolver — adds zero DB queries; OR (b) Keep calling `findSafeById` in the resolver (replacing `findById` — same DB cost but narrower column subset). **R4-28 note:** "SafeUser" is NOT a named TypeScript type — `findSafeById` returns `UserSelectType` (same type as `findById`, different column subset). `AuthUtils.toUserReturnType` accepts `UserSelectType` (auth.utils.ts line 14). **R4-34 security note:** `SAFE_USER_SELECT` includes `password` and `rememberTokenHash` — if option (a) stores `safeUser` on context, ensure these are stripped or excluded from the stored object.

- **Requirement 3.5 (NEW, HIGH): Batch concurrent GraphQL POSTs.** Two options: (A) adopt `BatchHttpLink` to collapse all 8 concurrent POSTs into 1 — estimated saving: 7 × context-creation cost per /permissions nav → 1, cutting ~28 DB + ~28 Redis queries/nav (7 fewer context creations × 4 DB/4 Redis each). (B) merge the 3 permissions-page `useQuery` calls into a single `permissionsPageData` query — reduces 3 POSTs to 1, saving 2 × context-creation cost (~8 DB + ~8 Redis), without requiring server-side changes. **AC (plan-review-R2):** WHEN `BatchHttpLink` is adopted THEN system SHALL verify `PersistedQueryLink` does not un-batch the APQ hash probes (Apollo notes APQ + batch can interact: the hash probe is per-operation, not per-batch), or SHALL disable APQ if the composition is incompatible. **AC (R3-1):** WHEN `BatchHttpLink` is adopted THEN system SHALL add `allowBatchedHttpRequests: true` to the `ApolloServer` constructor in `app/api/graphql/route.ts` (Apollo Server 4 disables HTTP batching by default; `@as-integrations/next` v4.1.0 forwards arrays transparently). **R4-27 note:** `package.json` specifies `^4.0.0` but installed version is 4.1.0 — the `allowBatchedHttpRequests` behavior was verified in 4.1.0. **R4-35 note:** The `@as-integrations/next` v4.1.0 `getBody.js` array forwarding was verified in R3 but not re-verified in R4 — before implementing Option A, confirm array forwarding works. **R3-1 recommendation:** Option B (source-aggregation, no server change) is the safer primary path.

- **Requirement 3.6 (NEW, HIGH): Deduplicate `SessionRepository.findSessionById` in context creation.** Fetch the session row once in `resolveAuthFromRequest` and pass it to both `resolveAuthIdentityFromToken` and `resolveGroupSimulationFromToken`. **R3-3 correction:** Estimated saving is **16 Redis reads/nav → 8** (not "8 DB" — Redis-first in production), plus DB reads only on cache miss. **R4-37 note:** `resolveGroupSimulationFromToken` has early-exit paths before `findSessionById` (lines 309–314: returns early if `!rawSessionId` or no active simulation) — the "16 → 8" saving is an upper bound; in practice, both calls fire when the access token has no `groupSimulation` flag but `rawSessionId` is present (the common non-simulating case). **R4-33 note:** When group simulation IS active, `createContext` calls `getPermissionGroupContext` instead of `getUserContext` (gqlContext.ts lines 75–78) — the DB query count for this path was not verified in R4 and may differ from the 3 DB count used in the cost model.

**Refinements to existing requirements:**

- **Requirement 1** (`getAlerts` context): the cost model is 6 redundant DB queries (2 × `hasPermission` × 3 per `getUserContext`), not 3 as round 1 assumed. AC#7 should target "at most 1 DB query (notification rows) instead of 10" for the `notificationAlerts` POST. **Clarification (plan-review-R2):** the `userId`-based overload of `NotificationAlertsService.getAlerts` MUST remain for non-GraphQL callers (`getServerUserContext`, scripts); the context-based overload is **additive, not a replacement** — the implementer must not delete the original signature. **R3-7 note:** The scopeAuth fix (Req 1.5) does NOT help `notificationAlerts` — `notificationAlerts` uses `authScopes: { loggedIn: true }` and its 7.9s cost is entirely from `getAlerts` calling `hasPermission` × 2 (6 DB), fixed by Req 1 only.
- **Requirement 3** (`refreshToken` redundant `findById`): confirmed at `auth.mutation.ts` line 172. The always-rotate behavior (AC#3) is the dominant cost of the 2.3s — every refreshToken call issues `updateSession` + 2 JWT generate + 2 JWT verify even when the access token is still valid. **R3-6 note:** `validateSession` (`session.service.ts` line 68) also calls `findSafeById` uncached — redundant with `createContext`'s `findSafeById` at `gqlContext.ts` line 80. AC#1 should be expanded to cover this `validateSession` redundancy; Phase C should add a task for it.
- **Requirement 8** (cold-start): **R3-5 correction** — `getGlobalSingleton` is **already used** for env validation (`env.ts` line 484), DB client (`drizzleDb.ts` line 38), DB pool (`drizzleDb.ts` line 68), and cache service (`CacheServiceFactory.ts` line 16). The 3-4s cold-start is **irreducible** serverless init work without Vercel provisioned concurrency. ACs should be downgraded from "implement singletons" to "verify existing `getGlobalSingleton` usage and document the irreducible baseline."

**Non-plan outcome:**
- Add a **Requirement 9 (LOW): Audit `access_token` cookie write paths** in `rotateTokensAndSession` to explain the 2 "no access_token cookie" log entries. Not a performance fix — reliability investigation.

---

## 11. Cross-File Dependency Map (for the eventual implementer)

When implementation is authorized, these are the files each new requirement touches (for plan-review compliance):

| Requirement | Files to edit | Layer AGENTS.md |
|---|---|---|
| 1.5 scopeAuth | `backend/graphql/gqlSchemaBuilder.ts` | `backend/graphql/AGENTS.md` |
| 3.5 batching (frontend) | `frontend/common/providers/apollo/AppApolloProvider.tsx`, `frontend/common/views/dashboard/permissions/usePermissionManagementData.ts` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| 3.5 batching (server) | `app/api/graphql/route.ts` (**add `allowBatchedHttpRequests: true` to `ApolloServer` constructor** — Apollo Server 4 disables batching by default; R3-1) | `app/AGENTS.md` |
| 3.6 session dedup | `backend/graphql/gqlContextFactory.ts`, `backend/services/auth/impersonation.service.ts`, `backend/services/auth/permission-group-simulation.service.ts` | `backend/graphql/AGENTS.md`, `backend/services/AGENTS.md` |
| 1 (getAlerts) | `backend/services/notification/notification-alerts.service.ts`, `backend/graphql/query/notifications/notification-alerts.query.ts`, `backend/services/auth/permissions.service.ts` (overload) | `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md` |
| 3 (refreshToken) | `backend/graphql/mutation/auth/auth.mutation.ts` line 172 + `backend/services/auth/session.service.ts` line 68 (validateSession `findSafeById` redundancy, R3-6) | `backend/graphql/AGENTS.md`, `backend/services/AGENTS.md` |
| **1.6 Query.me** (NEW, R3-8, R4-31 corrected) | `backend/graphql/query/auth/auth.query.ts` (eliminate redundant `UserService.findById` at line 17), `backend/graphql/gqlContext.ts` (add `safeUser` field to `BaseContext` + populate at line 80 — option a only) | `backend/graphql/AGENTS.md` |

No types are added (existing `UserPermissionContext` is reused). No i18n changes (no user-facing text). No MUI changes. No DB migrations.
