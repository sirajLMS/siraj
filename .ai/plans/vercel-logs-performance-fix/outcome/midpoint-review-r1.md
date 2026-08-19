# Mid-Point Review Outcome

**Plan:** `.ai/plans/vercel-logs-performance-fix/`
**Date:** 2026-08-18
**Review Scope:** Backend phases (A, A2, A3, B, C, C2, E3, F) — all complete

## Review Process

Three parallel review subagents dispatched:
1. **review-backend** — architecture, race conditions, dead code, security
2. **review-types** — type compliance, naming, import paths, security
3. **review-config** — env-config registration, cache invalidation, pre-warm safety

## Baseline Context
- Phase 0 baseline: tsgo 0 errors, biome 0 warnings, lint success, clean git tree
- All findings are NEW issues introduced by this implementation

## Files Reviewed (13 modified backend + 6 new test files)

### Modified source files:
1. `backend/db/factory.ts` — neonWsConfigured idempotency guard
2. `backend/graphql/gqlContext.ts` — safeUser on BaseContext
3. `backend/graphql/gqlContextFactory.ts` — preloadSession helper
4. `backend/graphql/gqlSchemaBuilder.ts` — scopeAuth early return
5. `backend/graphql/mutation/auth/auth.mutation.ts` — refreshToken user reuse + skipUserCheck
6. `backend/graphql/query/auth/auth.query.ts` — Query.me uses ctx.safeUser
7. `backend/services/auth/impersonation.service.ts` — preloadedSession param
8. `backend/services/auth/permission-group-simulation.service.ts` — preloadedSession param
9. `backend/services/auth/permissions.service.ts` — hasPermission/hasAnyPermission overloads
10. `backend/services/auth/session.service.ts` — skipUserCheck option
11. `backend/services/system/environment-config.service.ts` — preWarmEnvConfigCache
12. `backend/utils/auth.utils.ts` — UserReturnTypeInput type

### New test files:
1. `backend/graphql/mutation/auth/test/auth.mutation.test.ts`
2. `backend/graphql/query/auth/test/auth.query.test.ts`
3. `backend/graphql/test/gqlContext.dedup.test.ts`
4. `backend/graphql/test/gqlSchemaBuilder.scopeAuth.test.ts`
5. `backend/services/auth/test/permissions.service.test.ts`
6. `backend/services/system/test/environment-config.service.test.ts`

## Findings Summary

| Severity | Count | Key Findings |
|----------|-------|--------------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 3 | Duplicate type, DB override shadow, cross-layer import |
| LOW | 3 | neonWs idempotency, skipUserCheck orphan purge, DRY in overloads |

## MEDIUM Findings

### M1: Duplicate Type — SanitizedSafeUser / UserReturnTypeInput
- **Files:** gqlContext.ts, auth.utils.ts, auth.query.test.ts
- **Issue:** Same type `Omit<UserSelectType, "password" | "rememberTokenHash"> & Partial<Pick<UserSelectType, "password" | "rememberTokenHash">>` defined in 3 places
- **Fix:** Centralize as `SanitizedUserSelectType` in `backend/types/`
- **Status:** Fix dispatched (subagent fix-duplicate-type)

### M2: DB Override Shadow on Cold Start
- **File:** environment-config.service.ts
- **Issue:** Pre-warm populates cache with env values. DB overrides masked until TTL expires.
- **Assessment:** This is the **intended behavior** per Req 2 — env values are the fallback. DB overrides take effect after TTL. The plan explicitly designed it this way.
- **Fix:** No code fix needed. Documented as known tradeoff.

### M3: Cross-Layer Import (gqlContextFactory → SessionRepository)
- **File:** gqlContextFactory.ts:2
- **Issue:** Direct import from repository layer, bypassing service layer
- **Assessment:** Context creation is infrastructure, not a resolver. The import is pragmatic for a single call. Fixing would add a SessionService wrapper for no functional benefit.
- **Fix:** Deferred — add comment noting the exception for context-creation code.

## LOW Findings (no fix needed)

- **L1:** neonWsConfigured double-configure is idempotent — safe
- **L2:** skipUserCheck skips orphan purge — sessions expire via TTL — not a security risk
- **L3:** DRY concern in permission overloads — minor, not blocking

## Security Summary

- ✅ `password` and `rememberTokenHash` stripped from `ctx.safeUser` (R4-34)
- ✅ `safeUser` NOT leaked in GraphQL responses (UserReturnType omits both)
- ✅ `skipUserCheck` does not bypass authentication
- ✅ No `console.*` usage
- ✅ All imports use `@/` path aliases
