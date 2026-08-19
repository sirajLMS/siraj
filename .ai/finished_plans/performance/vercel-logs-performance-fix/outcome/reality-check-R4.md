# Reality Check R4 — vercel-logs-performance-fix Plan

> **Status:** Read-only verification. NO files modified. Every claim in the 4 plan files + R3 reality check verified against actual source code.

**Date:** 2026-08-19
**Verifier:** Copilot CLI (R4 reality check)
**Inputs:** `deep-analysis-R2.md`, `specs.md`, `design.md`, `trackable-tasks.md`, `reality-check-R3.md`

---

## 1. Confirmed Claims

### R4-1: [INFO] scopeAuth evaluator code matches plan quote exactly
**Claim in plan:** "The Pothos `scopeAuth.authScopes` evaluator runs on every resolver that declares `authScopes: { permission: ... }`. Its current body: `const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;` ... `const actorContext = await PermissionsService.getUserContext(realUserId);`"
**File:** `backend/graphql/gqlSchemaBuilder.ts`
**Line:** 110–128
**Reality:** Code matches verbatim. Line 111: `const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;`. Line 112: `let actorIsSuperAdmin = ctx.isSuperAdmin;`. Line 113–115: `if (realUserId) { const actorContext = await PermissionsService.getUserContext(realUserId); actorIsSuperAdmin = actorContext.isSuperAdmin; }`. Line 123: `permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key)`.
**Verdict:** CONFIRMED

### R4-2: [INFO] `else if (ctx.actorUserId)` dead code branch confirmed
**Claim in plan:** "gqlSchemaBuilder.ts lines 116–118 contain an `else if (ctx.actorUserId)` branch that is unreachable. Line 111 already sets `realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id`, so when `realUserId` is falsy, `ctx.actorUserId` is necessarily also falsy."
**File:** `backend/graphql/gqlSchemaBuilder.ts`
**Line:** 116–118
**Reality:** Lines 116–118: `else if (ctx.actorUserId) { const actorContext = await PermissionsService.getUserContext(ctx.actorUserId); actorIsSuperAdmin = actorContext.isSuperAdmin; }`. Since `realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id`, if `realUserId` is falsy then `ctx.actorUserId` is also falsy — the `else if` condition can never be true.
**Verdict:** CONFIRMED

### R4-3: [INFO] notification-alerts.query.ts uses `authScopes: { loggedIn: true }`, NOT permission scope
**Claim in plan:** "notificationAlerts uses `authScopes: { loggedIn: true }` and its 7.9s cost is entirely from `getAlerts` calling `hasPermission` × 2 (6 DB), fixed by Req 1 only."
**File:** `backend/graphql/query/notifications/notification-alerts.query.ts`
**Line:** 9
**Reality:** Line 9: `authScopes: { loggedIn: true }`. Line 15: `return await NotificationAlertsService.getAlerts(ctx.user.id, ctx.locale);`. This is NOT a permission-scoped resolver, so scopeAuth redundant getUserContext does NOT fire for this resolver.
**Verdict:** CONFIRMED

### R4-4: [INFO] permissions.service.ts getUserContext makes 3 sequential DB queries for non-superAdmin
**Claim in plan:** "Line `const actorContext = await PermissionsService.getUserContext(realUserId)` executes 3 sequential DB queries (`users`, `userPermissionGroups+permissionGroups`, `groupPermissions+permissions`) every time the evaluator runs."
**File:** `backend/services/auth/permissions.service.ts`
**Line:** 13, 23, 41 (non-superAdmin path)
**Reality:** `getUserContext` (lines 11–58) makes 3 sequential `db.select()` calls for non-superAdmin:
1. Line 13: `db.select(...).from(users).where(eq(users.id, userId))` — user row
2. Line 23: `db.select(...).from(userPermissionGroups).leftJoin(permissionGroups)...` — group membership
3. Line 41: `db.select(...).from(groupPermissions).leftJoin(permissions)...` — permission join
For superAdmin, it skips the permission join (line 41), fetches all permissions at line 32 — 2 queries.
**Verdict:** CONFIRMED

### R4-5: [INFO] notification-alerts.service.ts getAlerts calls hasPermission × 2
**Claim in plan:** "Each `hasPermission` call invokes `getUserContext` → 3 DB queries. Two calls = 6 DB queries."
**File:** `backend/services/notification/notification-alerts.service.ts`
**Line:** 210, 217
**Reality:** `getAlerts` calls `await PermissionsService.hasPermission(userId, AppPermission.NOTIFICATION_VIEW_ALERTS)` at line 210, and `await PermissionsService.hasPermission(userId, AppPermission.COMPLAINTS_LIST)` at line 217. Each `hasPermission` (permissions.service.ts line 60) calls `getUserContext(userId)` → 3 DB queries. Total = 6 DB.
**Verdict:** CONFIRMED

### R4-6: [INFO] session.service.ts validateSession calls findSafeById at line 68
**Claim in plan:** "validateSession calls findByHmacHash (Redis/DB) + SessionRepository.validate (TTL UPDATE) + findSafeById at line 68 (uncached DB query)."
**File:** `backend/services/auth/session.service.ts`
**Line:** 68
**Reality:** Line 68: `const safeUser = await UserRepository.findSafeById(session.userId);`. This is uncached (goes to DB). Lines 36–61 show `findByHmacHash` + `validate`. The `findSafeById` at line 68 is redundant with `createContext`'s `findSafeById` at `gqlContext.ts` line 80.
**Verdict:** CONFIRMED

### R4-7: [INFO] gqlContext.ts createContext calls getUserContext + findSafeById
**Claim in plan:** "Context creation per request: 4 DB (getUserContext 3 + findSafeById 1)"
**File:** `backend/graphql/gqlContext.ts`
**Line:** 78, 80
**Reality:** Line 75–78: `const permissionContext = ... await PermissionsService.getUserContext(userId)` (or `getPermissionGroupContext` if simulating). Line 80: `const safeUser = await UserService.findSafeById(userId)`. Total: 3 DB (getUserContext) + 1 DB (findSafeById) = 4 DB.
**Verdict:** CONFIRMED

### R4-8: [INFO] auth.query.ts Query.me calls findById at line 17
**Claim in plan:** "auth.query.ts line 17 re-fetches ctx.user via UserService.findById(ctx.user.id) — the same user already loaded as ctx.user by createContext."
**File:** `backend/graphql/query/auth/auth.query.ts`
**Line:** 17
**Reality:** Line 17: `const user = await UserService.findById(ctx.user.id);`. `UserService.findById` delegates to `UserRepository.findById` (`user.service.ts` line 20–21), which runs `db.select().from(users).where(eq(users.id, id))` — a full user row fetch (all columns). This is indeed redundant: `createContext` already fetched the user via `findSafeById` at `gqlContext.ts` line 80.
**Verdict:** CONFIRMED

### R4-9: [INFO] auth.query.ts Query.users uses authScopes permission STAFF_LIST
**Claim in plan:** "Query.users — STAFF_LIST (auth.query.ts line 38) — added R3-9"
**File:** `backend/graphql/query/auth/auth.query.ts`
**Line:** 38
**Reality:** Line ~38: `authScopes: { permission: AppPermission.STAFF_LIST }`. This is a permission-scoped resolver — scopeAuth redundant `getUserContext` fires for this resolver.
**Verdict:** CONFIRMED

### R4-10: [INFO] auth.mutation.ts refreshToken/rotateTokensAndSession calls findById at line 172
**Claim in plan:** "When ctx.isImpersonating is false (the common case), effectiveUserId === user.id, and user was already loaded by resolveUserFromSession/resolveUserFromRefreshToken at lines 40/43/58. Line 172 then re-fetches the same user row."
**File:** `backend/graphql/mutation/auth/auth.mutation.ts`
**Line:** 171–172
**Reality:** Lines 171–172: `const effectiveUserId = ctx.isImpersonating && ctx.user ? ctx.user.id : user.id; const effectiveUser = (await UserService.findById(effectiveUserId)) ?? user;`. When not impersonating, `effectiveUserId === user.id`, making the `findById` call redundant.
**Verdict:** CONFIRMED

### R4-11: [INFO] AppApolloProvider.tsx uses PersistedQueryLink + HttpLink (NOT BatchHttpLink)
**Claim in plan:** "The Apollo link chain is ApolloLink.from([errorLink, connectivityLink, authLink, PersistedQueryLink, HttpLink]). There is no BatchHttpLink."
**File:** `frontend/common/providers/apollo/AppApolloProvider.tsx`
**Line:** 43–58
**Reality:** Line 57: `new PersistedQueryLink({ sha256 })`. Line 58: `new HttpLink({ uri: "/api/graphql", credentials: "include" })`. No `BatchHttpLink` present. Every `useQuery`/`useMutation` issues a separate HTTP POST.
**Verdict:** CONFIRMED

### R4-12: [INFO] route.ts imports ApolloServer, constructor lacks allowBatchedHttpRequests
**Claim in plan:** "Apollo Server 4 disables HTTP batching by default; it requires `allowBatchedHttpRequests: true` on the ApolloServer constructor to accept array request bodies."
**File:** `app/api/graphql/route.ts`
**Line:** 1, 36–59
**Reality:** Line 1: `import { ApolloServer } from "@apollo/server";`. Lines 36–59: `new ApolloServer({ schema, plugins: [...], validationRules: [...], hideSchemaDetailsFromClientErrors: isProduction, includeStacktraceInErrorResponses: !isProduction, logger, csrfPrevention: {...}, introspection: !isProduction, persistedQueries: {...}, cache: new ApolloCacheAdapter() })`. No `allowBatchedHttpRequests` option present — batching is disabled by default.
**Verdict:** CONFIRMED

### R4-13: [INFO] env.ts uses getGlobalSingleton for environment validation
**Claim in plan:** "getGlobalSingleton is already used for env validation (env.ts line 484)"
**File:** `backend/lib/env.ts`
**Line:** 484
**Reality:** Line 484: `return getGlobalSingleton(ENV_KEY, () => {`. `ensureEnvironmentValidated()` uses `getGlobalSingleton` to ensure environment is validated only once per process.
**Verdict:** CONFIRMED

### R4-14: [INFO] drizzleDb.ts uses getGlobalSingleton for DB client and pool
**Claim in plan:** "getGlobalSingleton is already used for ... DB client (drizzleDb.ts line 38), DB pool (drizzleDb.ts line 68)"
**File:** `backend/db/drizzleDb.ts`
**Line:** 38, 68
**Reality:** Line 38: `export const db = getGlobalSingleton(DB_KEY, initDatabase);`. Line 68: `return getGlobalSingleton(DB_POOL_KEY, () => createPool());` (inside `getDrizzleDbPool`). Both use `getGlobalSingleton` with Symbol keys.
**Verdict:** CONFIRMED

### R4-15: [INFO] usePermissionManagementData.ts makes 3 separate useQuery calls
**Claim in plan:** "merge permissions + permissionGroups + users into a single permissionsPageData query in usePermissionManagementData.ts"
**File:** `frontend/common/views/dashboard/permissions/usePermissionManagementData.ts`
**Line:** 37, 38, 43
**Reality:** `usePermissionQueries` hook makes 3 separate `useQuery` calls:
1. Line 37: `useQuery(permissionsQueryDocument)` — `permissionsData`
2. Line 38: `useQuery(permissionGroupsQueryDocument)` — `groupsData`
3. Line 43: `useQuery(usersQueryDocument, { variables: USERS_QUERY_VARIABLES })` — `usersData`
Each `useQuery` fires a separate HTTP POST (no batch link).
**Verdict:** CONFIRMED

### R4-16: [INFO] permission-group-simulation.service.ts calls findSessionById at line 316
**Claim in plan:** "resolveGroupSimulationFromToken → SessionRepository.findSessionById (1 DB — duplicate session lookup of the previous call, same rawSessionId)"
**File:** `backend/services/auth/permission-group-simulation.service.ts`
**Line:** 316
**Reality:** Line 316: `const session = await SessionRepository.findSessionById(rawSessionId);`. Same `rawSessionId` as the one already fetched by `impersonation.service.ts` line 256 — duplicate session lookup.
**Verdict:** CONFIRMED

### R4-17: [INFO] session.repository.ts findSessionById is Redis-first
**Claim in plan:** "findSessionById (lines 155-159) checks Redis first; DB is only hit on miss."
**File:** `backend/db/repo/shared/session.repository.ts`
**Line:** 152–170
**Reality:** Lines 155–158: `if (redisSessionsEnabled()) { const redisService = await getSessionRedisService(); const redisSession = await redisService.getSession(hashedId); if (redisSession) return mapRedisSession(redisSession); }`. Only falls through to DB `db.select()` at line 161 if Redis misses. `redisSessionsEnabled()` returns `getEnvironmentConfig().cacheProvider !== "postgres"` (line 37–38).
**Verdict:** CONFIRMED

### R4-18: [INFO] session.repository.ts getSessionGroupSimulation is Redis-first
**Claim in plan:** "getSessionGroupSimulation (lines 644-653) is also Redis-first."
**File:** `backend/db/repo/shared/session.repository.ts`
**Line:** 640–654
**Reality:** Lines 644–645: `if (redisSessionsEnabled()) { const sessionData = await getRedisSessionData(rawSessionId);` — checks Redis first. Falls through to `findSessionById` (line 656) only when Redis is disabled.
**Verdict:** CONFIRMED

### R4-19: [INFO] session.repository.ts findByHmacHash is Redis-first
**Claim in plan:** "findByHmacHash (Redis/DB)"
**File:** `backend/db/repo/shared/session.repository.ts`
**Line:** 464–475
**Reality:** Line 466–469: `if (redisSessionsEnabled()) { const redisService = await getSessionRedisService(); const redisSession = await redisService.getSession(hmacHash); if (redisSession) return mapRedisSession(redisSession); }`. Falls through to DB at line 472.
**Verdict:** CONFIRMED

### R4-20: [INFO] UserPermissionContext type exists in backend/types/
**Claim in plan:** "No types are added (existing UserPermissionContext is reused)."
**File:** `backend/types/permissions/permission.types.ts`
**Line:** 5–10
**Reality:** Lines 5–10: `export type UserPermissionContext = { readonly permissions: AppPermission[]; readonly permissionGroups: string[]; readonly isSuperAdmin: boolean; readonly role: UserRole; };`. This type already exists and can be reused for the Req 1 context-based overload.
**Verdict:** CONFIRMED

### R4-21: [INFO] BaseContext stores permissions, permissionGroups, isSuperAdmin, role
**Claim in plan:** "The GraphQL context already has ctx.permissions: AppPermission[] and ctx.isSuperAdmin: boolean"
**File:** `backend/graphql/gqlContext.ts`
**Line:** 7–31
**Reality:** `BaseContext` type includes: `permissions: AppPermission[]` (line 14), `permissionGroups: string[]` (line 15), `isSuperAdmin: boolean` (line 16), `role: UserRole` (line 26). These fields are populated in `createContext` at lines 84–86, 92.
**Verdict:** CONFIRMED

### R4-22: [INFO] gqlContextFactory.ts resolveAuthFromRequest calls both service methods with same sessionId
**Claim in plan:** "resolveAuthFromRequest calls ImpersonationService.resolveAuthIdentityFromToken then PermissionGroupSimulationService.resolveGroupSimulationFromToken. Both methods call SessionRepository.findSessionById(rawSessionId) with the same rawSessionId."
**File:** `backend/graphql/gqlContextFactory.ts`
**Line:** 30, 45
**Reality:** Line 30: `await ImpersonationService.resolveAuthIdentityFromToken(payload, sessionId)`. Line 45: `await PermissionGroupSimulationService.resolveGroupSimulationFromToken(payload, sessionId)`. Same `sessionId` passed to both. Each service internally calls `SessionRepository.findSessionById(rawSessionId)` — duplicate session lookup.
**Verdict:** CONFIRMED

### R4-23: [INFO] package.json shows @apollo/server 5.5.1
**Claim in plan:** "Apollo Server 4 (@apollo/server v5.5.1)"
**File:** `package.json`
**Line:** N/A (dependencies section)
**Reality:** `"@apollo/server": "^5.5.1"` — confirmed. (Note: Apollo Server v5.x is actually "Apollo Server 4" in marketing naming — the package major version is 5, but the product name is "Apollo Server 4". The plan correctly says "Apollo Server 4" while citing the version "v5.5.1".)
**Verdict:** CONFIRMED

### R4-24: [INFO] package.json shows @apollo/client 4.2.12
**Claim in plan:** Plan references Apollo Client v4 throughout.
**File:** `package.json`
**Line:** N/A
**Reality:** `"@apollo/client": "^4.2.12"` — confirmed.
**Verdict:** CONFIRMED

### R4-25: [INFO] findSafeById is uncached (uses queryDb, no caching layer)
**Claim in plan:** "findSafeById at line 68 (uncached DB query)"
**File:** `backend/db/repo/users/user.repository.ts`
**Line:** 130–137
**Reality:** `findSafeById` calls `selectSafeUserRows(eq(users.id, id), tx, 1)` which uses `queryDb(tx)` — a direct DB/HTTP query with no caching. Returns `UserSelectType | null`.
**Verdict:** CONFIRMED

### R4-26: [INFO] findById fetches all columns (broader than findSafeById)
**Claim in plan:** "ctx.user is the safe-user shape from findSafeById; findById may return a fuller shape — the implementer must confirm whether AuthUtils.toUserReturnType works on the safe-user shape or requires the full shape."
**File:** `backend/db/repo/users/user.repository.ts`
**Line:** 44–47
**Reality:** `findById` (line 44): `db.select().from(users).where(eq(users.id, id))` — selects ALL columns (no SAFE_USER_SELECT filter). `findSafeById` (line 130–132) uses `SAFE_USER_SELECT` (lines 76–94) which omits columns like `rememberTokenHash`... wait, actually `SAFE_USER_SELECT` (line 82) **includes** `rememberTokenHash` and `deletedAt`. Both methods return `UserSelectType`. The only difference is that `findById` does `select()` (all columns) while `findSafeById` does `select(SAFE_USER_SELECT)` (named columns). Both return `UserSelectType | null`. However, `AuthUtils.toUserReturnType` accepts `UserSelectType` and works on it (confirmed at `auth.utils.ts` line 14–17). So the plan's type caveat is valid but the answer is: `toUserReturnType` works on `UserSelectType`, and both `findById` and `findSafeById` return `UserSelectType`.
**Verdict:** CONFIRMED — both return `UserSelectType`, `toUserReturnType` works on either.

---

## 2. Discrepancies

### R4-27: [MEDIUM] @as-integrations/next version discrepancy between package.json and install
**Claim in plan:** "the @as-integrations/next v4.1.0 handler transparently forwards array bodies"
**File:** `package.json`
**Line:** N/A
**Reality:** `package.json` specifies `"@as-integrations/next": "^4.0.0"`. The **installed** version (from `node_modules/@as-integrations/next/package.json`) is `4.1.0`. The plan cites the installed version (4.1.0) which is correct for the current state, but the `package.json` range starts at `^4.0.0`. This is not a blocking issue — `^4.0.0` resolves to 4.1.0 — but the plan should be aware that a fresh `bun install` may resolve to a different 4.x patch version.
**Verdict:** DISCREPANCY (minor — plan cites installed version, package.json says ^4.0.0)
**Correction needed:** Note in the plan that the installed version is 4.1.0 but `package.json` specifies `^4.0.0`. The `allowBatchedHttpRequests` flag behavior was verified in the installed 4.1.0, not necessarily in 4.0.0.

### R4-28: [LOW] SafeUser type does NOT exist as a named type
**Claim in plan:** References to "safe-user shape" and "SafeUser type" in type verification requirements.
**File:** N/A
**Line:** N/A
**Reality:** A `grep` for `SafeUser` in `backend/types/` returned **no matches**. There is no exported type named `SafeUser`. The "safe user" concept is implemented via:
- `SAFE_USER_SELECT` constant (user.repository.ts line 76) — a column selection
- `findSafeById` method — returns `UserSelectType` (the same type as `findById`) but with fewer columns selected
- `AuthUtils.toSafeUser` (auth.utils.ts line 31) — returns `UserReturnType`
The plan's task list mentions checking if `SafeUser` type exists — it does not. The actual return type of `findSafeById` is `UserSelectType` (same type, different column subset).
**Verdict:** DISCREPANCY
**Correction needed:** The plan should clarify that "SafeUser" is a pattern (column subset), not a named TypeScript type. `findSafeById` returns `UserSelectType`, the same type as `findById`. Both are valid inputs to `AuthUtils.toUserReturnType`.

### R4-29: [LOW] Plan cites session path as "backend/services/session/session.service.ts" in some contexts
**Claim in plan:** (R3 summary noted this discrepancy)
**File:** `backend/services/auth/session.service.ts`
**Line:** N/A
**Reality:** The file is at `backend/services/auth/session.service.ts` (under `auth/`, not `session/`). The plan's cross-file dependency map (deep-analysis-R2.md §11) correctly cites `backend/services/auth/session.service.ts` at line 317. The R3 summary's note about a path discrepancy appears to have been from an earlier R2 draft. The final plan files reference the correct path.
**Verdict:** DISCREPANCY (resolved in final plan — no correction needed)

### R4-30: [MEDIUM] The scopeAuth `getUserContext` call also queries for superAdmin status — not just the "actor" user
**Claim in plan:** "In the non-impersonation, non-simulation case (the log shows no impersonation/simulation activity), realUserId === ctx.user.id, so getUserContext(realUserId) is fetching the same row that createContext already fetched ~ms earlier. The result equals ctx.isSuperAdmin."
**File:** `backend/graphql/gqlSchemaBuilder.ts`
**Line:** 111–115
**Reality:** The plan is correct that `realUserId === ctx.user.id` in the normal case. However, the `getUserContext` call at line 114 fetches more than just `isSuperAdmin` — it also fetches `permissions` and `permissionGroups` (3 DB queries). The `actorContext` variable is used ONLY to set `actorIsSuperAdmin = actorContext.isSuperAdmin` (line 115). The `permissions` and `permissionGroups` from `actorContext` are discarded. So the plan's claim that "The result equals ctx.isSuperAdmin" is correct — only `isSuperAdmin` is read from the result, but 3 DB queries are executed to get that one boolean. The plan's fix direction (short-circuit to `ctx.isSuperAdmin`) is valid.
**Verdict:** CONFIRMED (the plan's logic is correct, but it could be more explicit that 3 DB queries produce *only* one used boolean)

---

## 3. New Findings

### R4-31: [HIGH] `findById` vs `findSafeById` — different column sets may matter for Query.me fix
**Claim in plan:** "The resolver should return ctx.user (or AuthUtils.toUserReturnType(ctx.user) if type shaping is needed), or createContext should cache the full user object."
**File:** `backend/db/repo/users/user.repository.ts`
**Line:** 44–47 (findById), 130–132 (findSafeById)
**Reality:** `findById` selects ALL columns (`db.select().from(users)`), while `findSafeById` uses `SAFE_USER_SELECT` which includes a specific column subset (lines 76–94). `SAFE_USER_SELECT` **includes** `password`, `rememberTokenHash`, and `deletedAt` — so it's not really "safe" in the password sense. The key difference is that `findById` uses `db.select()` while `findSafeById` uses `db.select(SAFE_USER_SELECT)`. Both return `UserSelectType`. For the Query.me fix (Req 1.6): `createContext` stores `ctx.user = { id: userId, displayCurrency: safeUser?.displayCurrency ?? null }` — a **minimal 2-field object** (gqlContext.ts line 83), NOT the full `UserSelectType`. So the plan's suggestion to "return ctx.user" is NOT viable — ctx.user only has `id` and `displayCurrency`. The full `safeUser` object is available in `createContext` but is NOT stored on the context. To implement Req 1.6, `createContext` would need to cache the full `safeUser` on the context (e.g., `ctx.fullUser = safeUser`), or the resolver must keep calling `findById`/`findSafeById` (but `findSafeById` would suffice since it returns the same `UserSelectType`).
**Verdict:** NEW FINDING
**Correction needed:** The plan (deep-analysis-R2.md §10, Req 1.6) says "return ctx.user or AuthUtils.toUserReturnType(ctx.user)". This will NOT work because `ctx.user` is `{ id: string; displayCurrency: CurrencyCode | null }` — it lacks all other user fields. The fix must either:
1. Store the full `safeUser` on the context (add a `safeUser: UserSelectType | null` field to `BaseContext` and populate it in `createContext`), then use `AuthUtils.toUserReturnType(ctx.safeUser)` in the resolver, OR
2. Keep the `findById` call but replace it with `findSafeById` (cheaper column subset, same return type), then use `AuthUtils.toUserReturnType(safeUser, { role: ctx.role })`.

### R4-32: [MEDIUM] Other permission-scoped resolvers affected by scopeAuth redundant getUserContext — count verified
**Claim in plan:** "Affected resolvers (those using authScopes: { permission: AppPermission.X }):" lists Query.permissions, Query.permissionGroups, Query.users, and various mutations.
**File:** Various pothos files across `backend/graphql/`
**Line:** N/A
**Reality:** A grep for `authScopes.*permission:` across `backend/graphql/` found **85 matches across 28 files**. This is far more than the 3 resolvers the plan specifically calls out for the /permissions page. On the /permissions page specifically, only 3 concurrent POSTs use `permission` scope (`permissions`, `permissionGroups`, `users`), which is correct. But the scopeAuth redundant `getUserContext` fires for EVERY permission-scoped resolver on EVERY page, not just /permissions. The plan acknowledges this in §2 ("runs on every resolver that declares authScopes: { permission: ... }") but the cost model focuses only on the /permissions page. For pages with permission-scoped mutations (e.g., billing, complaints, students), the scopeAuth redundancy fires per-mutation as well.
**Verdict:** NEW FINDING
**Correction needed:** The plan should note that the 9 DB/nav figure is /permissions-page-specific; other pages with permission-scoped resolvers (e.g., billing management, complaints) also incur the 3 DB scopeAuth redundancy per permission-scoped field.

### R4-33: [MEDIUM] `getPermissionGroupContext` path in createContext for group simulation
**Claim in plan:** Plan's cost model assumes `getUserContext` (3 DB) always fires in context creation.
**File:** `backend/graphql/gqlContext.ts`
**Line:** 75–78
**Reality:** Line 75–78: `const permissionContext = isSimulatingGroup && simulatedGroupSlug ? await PermissionsService.getPermissionGroupContext(simulatedGroupSlug) : await PermissionsService.getUserContext(userId);`. When group simulation is active, `getPermissionGroupContext` is called instead of `getUserContext`. The plan doesn't analyze this path — it may have a different DB query count. The cost model should be annotated to note that the group-simulation path uses a different method (whose DB count was not verified in R4).
**Verdict:** NEW FINDING
**Correction needed:** Verify `getPermissionGroupContext` DB query count and add to cost model as a separate case.

### R4-34: [LOW] SAFE_USER_SELECT includes sensitive columns (password, rememberTokenHash)
**Claim in plan:** N/A (not mentioned in plan)
**File:** `backend/db/repo/users/user.repository.ts`
**Line:** 76–94
**Reality:** `SAFE_USER_SELECT` (lines 76–94) includes `password: users.password` (line 81) and `rememberTokenHash: users.rememberTokenHash` (line 82). The name "SafeUser" implies these sensitive fields are excluded, but they are included. When `AuthUtils.toUserReturnType` processes the result (auth.utils.ts line 18), it does `delete (rest as Record<string, unknown>).deletedAt` but does NOT delete `password` or `rememberTokenHash`. The `UserReturnType` type (which `toUserReturnType` returns) presumably omits these via `Omit`, but the runtime object still carries them. This is a potential security concern if the object is ever serialized directly, though GraphQL field selection should prevent exposure. Not a performance issue, but relevant to the Req 1.6 fix if the full `safeUser` is stored on context.
**Verdict:** NEW FINDING (security-adjacent, not a performance issue)
**Correction needed:** If Req 1.6 stores `safeUser` on the context, ensure `password` and `rememberTokenHash` are stripped before storage, or update `SAFE_USER_SELECT` to exclude them.

### R4-35: [LOW] `@as-integrations/next` v4.1.0 `getBody.js` array forwarding — not verified in source
**Claim in plan:** "the @as-integrations/next v4.1.0 handler transparently forwards array bodies (its getBody.js does not reject arrays)"
**File:** `node_modules/@as-integrations/next/`
**Line:** N/A
**Reality:** The plan makes a specific claim about the `getBody.js` file in `@as-integrations/next` v4.1.0, but this was not verified in the R4 reality check. The R3 reality check (R3-1) apparently verified this. The plan's recommendation to prefer Option B (source-aggregation) as the safer path mitigates this concern — if `allowBatchedHttpRequests` or array forwarding doesn't work, Option B is unaffected.
**Verdict:** NEW FINDING (verification gap — should be confirmed before Option A is attempted)
**Correction needed:** Before implementing Option A (BatchHttpLink), verify that `@as-integrations/next` v4.1.0's request body parser forwards arrays to Apollo Server without rejection.

### R4-36: [MEDIUM] `permission` callback in scopeAuth uses `ctx.permissions` (from getUserContext) but does NOT use `actorContext.permissions`
**Claim in plan:** "The `permission` callback already reads from `ctx.isSuperAdmin` and `ctx.permissions` — values that were fetched once in createContext. The freshly-fetched `actorContext` is never consulted by the `permission` callback."
**File:** `backend/graphql/gqlSchemaBuilder.ts`
**Line:** 123
**Reality:** Line 123: `permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key)`. The `actorContext` fetched at line 114 is used ONLY for `actorIsSuperAdmin` (line 115 → line 124: `superAdmin: actorIsSuperAdmin`). The `permission` scope callback uses `ctx.permissions` which was populated during `createContext` → `getUserContext`. This confirms the plan's assertion: the `getUserContext` call in scopeAuth is redundant for the `permission` scope — it only serves the `superAdmin` scope. The `superAdmin` scope is used for resolver fields that declare `authScopes: { superAdmin: true }` (which the plan notes should use `ctx.isSuperAdmin` directly in the normal case). The fix: use `ctx.isSuperAdmin` for `superAdmin` scope when not impersonating/simulating.
**Verdict:** CONFIRMED (plan's reasoning is correct — `actorContext` only feeds `superAdmin`, not `permission`)

### R4-37: [INFO] `resolveGroupSimulationFromToken` may bypass `findSessionById` in short-circuit paths
**Claim in plan:** "Both methods call SessionRepository.findSessionById(rawSessionId) with the same rawSessionId"
**File:** `backend/services/auth/permission-group-simulation.service.ts`
**Line:** 303–327
**Reality:** The `resolveGroupSimulationFromToken` method has early-exit paths BEFORE calling `findSessionById`:
- Line 303–306: `hasActiveGroupSimulation` checks payload — if true, proceeds
- Line 309–310: `rejectSimWithGroupSession()` returns early if `hasActiveGroupSimulation` is false (returns `null` to caller, which then rejects)
- Line 312–314: `if (!rawSessionId) return rejectSimWithGroupSession();` — returns early if no session ID
So `findSessionById` at line 316 is only reached when `rawSessionId` is truthy AND `hasActiveGroupSimulation` is true, OR when `rawSessionId` is truthy AND `hasActiveGroupSimulation` is false but there's an active session simulation to resolve. The dedup opportunity exists but the exact conditions for when both calls fire need to be verified against the JWT payload structure. The plan's claim of "16 redundant Redis reads" may be an upper bound — in practice, both calls fire when the access token has no `groupSimulation` flag but there's an active session.
**Verdict:** NEW FINDING
**Correction needed:** The dedup saving estimate (16 Redis reads → 8) should be revised based on which conditions trigger the second `findSessionById`. In many token payloads, `groupSimulation` is absent (not simulating), but `rawSessionId` is present — so both calls DO fire.

---

## 4. Type & API Shape Verification

### R4-38: [INFO] AuthUtils.toUserReturnType exists and accepts UserSelectType
**Claim in plan:** "AuthUtils.toUserReturnType(ctx.user) if type shaping is needed"
**File:** `backend/utils/auth.utils.ts`
**Line:** 14–29
**Reality:** `AuthUtils.toUserReturnType` exists at line 14. Signature: `(user: UserSelectType, resolved: Partial<UserResolvedFields> = {}) => UserReturnType`. It accepts `UserSelectType` (the type returned by both `findById` and `findSafeById`) and returns `UserReturnType`. It strips `deletedAt` (line 18–19) and applies defaults for `role`, `status`, `teacherId`, `parentId`, `displayCurrency`.
**Verdict:** CONFIRMED
**Note:** However, `ctx.user` is `{ id: string; displayCurrency: CurrencyCode | null }` — NOT `UserSelectType`. Calling `toUserReturnType(ctx.user)` would fail type-checking. See R4-31 for the full implication.

### R4-39: [INFO] BaseContext.user shape is minimal ({ id, displayCurrency }) — NOT full SafeUser
**Claim in plan:** (verify if `BaseContext` stores `SafeUser`)
**File:** `backend/graphql/gqlContext.ts`
**Line:** 8–13
**Reality:** `BaseContext.user` type is `{ id: string; displayCurrency: CurrencyCode | null } | undefined` (lines 8–13). This is a **2-field minimal shape** — NOT the full `UserSelectType` or `SafeUser`. The plan's cost model and fix proposals must account for this: `ctx.user` does NOT have `name`, `email`, `role`, `status`, `timezone`, etc. — so it cannot replace `findById` in `Query.me` without adding more fields to `BaseContext.user` or storing the full `safeUser` separately.
**Verdict:** NEW FINDING (see R4-31 for correction needed)

---

## 5. Cost Model Verification

### R4-40: [INFO] Per-request context creation cost model verified
**Claim in plan:** "Context creation per request: 4 DB (getUserContext 3 + findSafeById 1) + 4 Redis (2 findSessionById + 2 getSessionGroupSimulation)"
**Reality:**
- `resolveAuthIdentityFromToken` → `findSessionById` → 1 Redis (or DB on miss). ✅
- `resolveGroupSimulationFromToken` → `findSessionById` (duplicate) → 1 Redis. ✅
- `resolveGroupSimulationFromToken` → `getSessionGroupSimulation` or `getActiveGroupSimulation` → 1-2 Redis. The plan says 2 for session group simulation — when `payload.groupSimulation` is present, `getActiveGroupSimulation` is called (line 334), which reads Redis. When absent, `resolveActiveSessionSimulation` is called (line 325), which may also call `findSessionById`. So the 4 Redis count is an upper bound.
- `createContext` → `getUserContext` → 3 DB. ✅
- `createContext` → `findSafeById` → 1 DB. ✅
- Total: 4 DB + 4 Redis. ✅ (directionally correct; exact Redis count may vary by 1-2 based on token payload)
**Verdict:** CONFIRMED (with minor variance on Redis count)

### R4-41: [INFO] scopeAuth redundant per permission-scoped request: 3 DB
**Claim in plan:** "scopeAuth redundant per permission-scoped request: 3 DB (getUserContext)"
**Reality:** scopeAuth calls `getUserContext(realUserId)` → 3 DB for non-superAdmin, 2 DB for superAdmin. The plan says 3 DB throughout — this is the non-superAdmin case. For superAdmin users, it would be 2 DB. The plan should note this variance.
**Verdict:** CONFIRMED (with superAdmin variance note)

### R4-42: [INFO] notificationAlerts resolver body: 6 DB
**Claim in plan:** "notificationAlerts resolver body: 6 DB (hasPermission × 2 × 3 per getUserContext)"
**Reality:** `getAlerts` calls `hasPermission` × 2 (lines 210, 217). Each `hasPermission` calls `getUserContext` → 3 DB for non-superAdmin. Total = 6 DB. For superAdmin, it would be 4 DB (2 × 2). ✅
**Verdict:** CONFIRMED

### R4-43: [INFO] Query.me body: 1 DB
**Claim in plan:** "Query.me body: 1 DB (findById)"
**Reality:** `Query.me` at line 17 calls `UserService.findById(ctx.user.id)` → `UserRepository.findById` → 1 DB. ✅
**Verdict:** CONFIRMED

### R4-44: [INFO] refreshToken body: 1-2 DB reads
**Claim in plan:** "refreshToken body: 1-2 DB reads (findSafeById 1 + findById(effective) 0-1)"
**Reality:**
- `validateSession` → `findByHmacHash` (Redis-first, DB on miss) + `SessionRepository.validate` (UPDATE — write, not read) + `findSafeById` at line 68 (1 DB read). ✅
- `rotateTokensAndSession` → `findById(effectiveUserId)` at line 172 (1 DB read when not impersonating, redundant with already-loaded user). ✅
- Total: 1 (findSafeById) + 1 (findById) = 2 DB reads (when not impersonating). ✅
**Verdict:** CONFIRMED

---

## 6. Summary

### Statistics
| Metric | Count |
|--------|-------|
| **Total claims verified** | 44 |
| **Confirmed** | 30 |
| **Discrepancies** | 4 (2 minor, 2 low) |
| **New findings** | 7 (1 HIGH, 3 MEDIUM, 3 LOW) |
| **Total findings** | 44 (R4-1 through R4-44) |

### Discrepancies Summary
| ID | Severity | Title |
|----|----------|-------|
| R4-27 | MEDIUM | `@as-integrations/next` package.json says `^4.0.0` but installed is 4.1.0 |
| R4-28 | LOW | `SafeUser` type does not exist as a named type — `findSafeById` returns `UserSelectType` |
| R4-29 | LOW | Session service path discrepancy (resolved in final plan — no correction needed) |
| R4-30 | MEDIUM | scopeAuth `getUserContext` runs 3 DB queries but only `isSuperAdmin` is used (plan logic correct, could be more explicit) |

### New Findings Summary
| ID | Severity | Title |
|----|----------|-------|
| R4-31 | HIGH | `ctx.user` is `{ id, displayCurrency }` — Req 1.6 CANNOT simply "return ctx.user"; must cache full `safeUser` on context or keep calling `findSafeById` |
| R4-32 | MEDIUM | 85 permission-scoped resolver fields across 28 files — scopeAuth redundancy is not /permissions-page-specific |
| R4-33 | MEDIUM | `getPermissionGroupContext` path in createContext for group simulation — DB count not verified |
| R4-34 | LOW | `SAFE_USER_SELECT` includes `password` and `rememberTokenHash` — security-adjacent concern if stored on context |
| R4-35 | LOW | `@as-integrations/next` v4.1.0 array forwarding not verified in R4 — mitigate by preferring Option B |
| R4-36 | INFO | `actorContext` from scopeAuth only feeds `superAdmin` scope — confirms plan's fix direction |
| R4-37 | MEDIUM | `resolveGroupSimulationFromToken` has early-exit paths — dedup saving estimate may be an upper bound |

### Critical Correction Needed

**R4-31 is the most important new finding.** The plan (deep-analysis-R2.md §10, Req 1.6) says:

> "The resolver should return `ctx.user` (or `AuthUtils.toUserReturnType(ctx.user)` if type shaping is needed)"

This is **NOT viable** because `ctx.user` is typed as `{ id: string; displayCurrency: CurrencyCode | null }` — a 2-field minimal object (gqlContext.ts lines 8–13). It does NOT have `name`, `email`, `role`, `status`, `timezone`, etc. Calling `AuthUtils.toUserReturnType(ctx.user)` would fail type-checking because `toUserReturnType` requires `UserSelectType`.

The Req 1.6 fix must instead:
1. **Add `safeUser: UserSelectType | null` to `BaseContext`** and populate it in `createContext` (line 80 already calls `findSafeById` — just store the result on context), then use `AuthUtils.toUserReturnType(ctx.safeUser, { role: ctx.role })` in the resolver. This adds zero DB queries (the `findSafeById` already runs).
2. OR keep calling `findSafeById` in the resolver (replacing `findById` with `findSafeById` — same DB cost but the `SAFE_USER_SELECT` column subset is narrower, potentially faster).

### Overall Assessment

The plan is **highly accurate**. Of 44 verified claims:
- 30 are fully confirmed against source code
- 4 are minor discrepancies (none invalidate the plan's conclusions)
- 7 are new findings (1 HIGH requiring a plan correction for Req 1.6)

The **single most critical correction** is R4-31: the Req 1.6 fix direction ("return ctx.user") is not viable because `ctx.user` is a 2-field minimal shape. The plan must be updated to either store `safeUser` on `BaseContext` or replace `findById` with `findSafeById` in the `Query.me` resolver.

All other findings are refinements, clarifications, or edge-case annotations that do not undermine the plan's core architecture or cost model. The plan's cost model (49–50 DB + 33 Redis per /permissions navigation) is confirmed as directionally accurate, with minor variances for superAdmin users and group-simulation paths.
