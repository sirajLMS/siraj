# Backend Security Fixes — Implementation Plan

> **Source**: Full-repo backend security review (2026-08-24) — 7 parallel audit subagents (auth/authz, SQLi/LIKE, input validation, secrets/config, rate limiting/DoS, i18n errors, test security)
> **Status**: REFINED — 1st pass verification complete — 6 risks identified
> **Scope**: Entire repo (NOT git diff). Review-only per user request: no fixes, no commits.

## Executive Summary

| Severity | Count | Domains |
|---|---|---|
| CRITICAL | 0 | — |
| HIGH | 2 | i18n hardcoded user-facing errors |
| MEDIUM | 8 | Upload size cap, default-credential guard bypass, auth-fallback pattern, DoS pagination, test passwords |
| LOW | 8 | Defense-in-depth hardening |
| VERIFY | 1 | Public `avatars/` storage path |
| PASS | Broad | authScopes coverage (100+ fields), LIKE escaping (14 files), test-helper gating, permission env validation, IPv6 handling, webhook HMAC, OAuth state |

The codebase is in strong shape: all GraphQL fields have `authScopes`, all LIKE queries escape wildcards, all API routes authenticate, secrets are env-gated with fail-closed production validation, and auth mutations are rate-limited. Remaining work is hardening, not emergency patching.

---

## HIGH Severity

### H1 — Hardcoded English error in suggestion repo (i18n policy violation, leaks non-localized text)

- **File**: `backend/db/repo/parents/suggestion.repository.ts`
- **Line**: 263 (verified)
- **Layer**: Database repositories
- **Problem**: `throw new NotFoundError("SUGGESTION", \`Suggestion ${suggestionId} not found\`)` bypasses the compile-time i18n system. Sibling repo code uses `tErrors.suggestionNotFound`; this repo has no locale plumbing yet.
- **Fix**: Follow the `soft-delete.repository.ts:74` pattern — obtain `getServerTranslations(locale ?? "en", "errors")` (from `@/shared/locale/server`) and use the typed `tErrors` helper, or thread `locale` through the repository call and use `tErrors.suggestionNotFound(suggestionId)` if the key accepts interpolation.
- **Code change** (directional):
  ```ts
  // before (line 263)
  throw new NotFoundError("SUGGESTION", `Suggestion ${suggestionId} not found`);
  // after — add/verify key `suggestionNotFound(id)` in shared/locale/{en,ar}/errors, then:
  throw new NotFoundError("SUGGESTION", tErrors.suggestionNotFound(suggestionId));
  ```
- **i18n**: Verify `suggestionNotFound` key exists in `shared/locale/en/errors/` and `shared/locale/ar/errors/`; add interpolation signature `(id: string) => string` if missing.
- **Types**: None.
- **Tests**: Existing suggestion repo tests assert on `NotFoundError` type — message-string assertions may need updating.

### H2 — Mixed i18n/hardcoded validation error in teacher-availability repo

- **File**: `backend/db/repo/teachers/teacher-availability.repository.ts`
- **Line**: 47 (verified)
- **Layer**: Database repositories
- **Problem**: `` throw new ValidationError(`${errorsTranslations.invalidInput}; Start time must be before end time`) `` — the English clause is always appended regardless of locale.
- **Fix**: Add a dedicated translation key (e.g. `tErrors.teacher.startTimeMustBeBeforeEndTime`) implemented in both `en` and `ar`, and use it for the whole message.
- **Code change** (directional):
  ```ts
  // before (line 47)
  throw new ValidationError(`${errorsTranslations.invalidInput}; Start time must be before end time`);
  // after
  throw new ValidationError(errorsTranslations.startTimeMustBeBeforeEndTime);
  ```
- **i18n**: New key in `shared/locale/en/errors/` and `shared/locale/ar/errors/` (teacher or generic validation namespace — check existing structure first).
- **Types**: Update the errors translation type schema first (compile-time system requires the type signature before implementation).
- **Tests**: Teacher-availability repo tests asserting message content need updating.

---

## MEDIUM Severity

### M1 — Vercel Blob upload actual byte-size uncapped

- **File**: `app/api/storage/vercel-upload/route.ts`
- **Line**: 211–223 (verified: `handleUpload` called without `maximumSizeInBytes`; `allowedContentTypes: [contentType]` at 223)
- **Layer**: App Router API
- **Problem**: The 100MB check (`StorageService.validateUpload`) validates only the **client-reported** `fileSize` in `clientPayload` (attacker-controlled). Bytes actually uploaded to Vercel Blob with the generated client token are not capped — a client can send `fileSize: 1` and upload gigabytes.
- **Fix**: Return `maximumSizeInBytes` from `onBeforeGenerateToken` (also supported: `tokenPayload`, `allowedContentTypes`):
  ```ts
  return {
    allowedContentTypes: [...ALLOWED_MIME_TYPES], // see M2
    maximumSizeInBytes: 100 * 1024 * 1024,
  };
  ```
- **i18n**: No new keys (existing oversize handling in validateUpload).
- **Types**: None.
- **Tests**: `test/ui` / storage upload tests — add a case asserting token generation includes the cap.
- **NOTE**: Verify against installed `@vercel/blob/client` version that `maximumSizeInBytes` is a supported `onBeforeGenerateToken` return field before implementing.

### M2 — `allowedContentTypes` echoes client-supplied MIME (fragile defense-in-depth)

- **File**: `app/api/storage/vercel-upload/route.ts`
- **Line**: 223 (verified)
- **Layer**: App Router API
- **Problem**: `allowedContentTypes: [contentType]` passes the client-supplied type straight through. Safe today only because `validateUpload → isAllowedMimeType` (`backend/lib/storage/mime-allowlist.ts`) gates first; any future bypass silently allows arbitrary MIME.
- **Fix**: `allowedContentTypes: [...ALLOWED_MIME_TYPES]` (import from `backend/lib/storage/mime-allowlist`).
- **Tests**: MIME allowlist tests in storage API tests.

### M3 — `DEFAULT_SEED_ADMIN_PASSWORD` consumed bypassing the guarded resolver

- **Files**:
  - `shared/demo-users.ts:17` (raw export; guard only inside `resolveAdminPassword()` lines 19–31)
  - `backend/db/seeds/users/seed-users.ts:23,25` (verified direct use)
  - `backend/services/system/test-helper.service.ts:56,326,495` (verified direct use)
- **Layer**: Seeds / services
- **Problem**: `resolveAdminPassword()` throws in production and when `IS_DEMO`/`TEST_SERVER` set without `ADMIN_PASSWORD` — but three call sites consume the raw constant directly, so a production seed/test-helper invocation silently installs the known default credential. (Test-helper mutations ARE gated by `TEST_SERVER` + `assertTestHelperAllowed`, so service reachability in prod is blocked at the GraphQL layer — seed scripts however can run anywhere.)
- **Fix**: Route all consumers through `resolveAdminPassword()` (or throw when `NODE_ENV === "production"` at seed entry). Optionally stop exporting the raw constant.
- **i18n**: None.
- **Tests**: Seed tests and test-helper flows — verify seed still works in dev/test envs; run `bun run test:db` for affected seed tests.

### M4 — Hardcoded admin password fallback in dev test server

- **File**: `test/helpers/test-server.ts:26,45`
- **Layer**: Test infrastructure
- **Problem**: Dev-mode test server sets `ADMIN_PASSWORD` from `["Test","Admin","Pass1!"].join("")` — an obfuscated hardcoded credential. Gated by `TEST_SERVER=1` and `resolveAdminPassword` prod guard, but any local dev server launched with `IS_DEMO=true` silently gets a known admin password.
- **Fix**: Prefer env-only (`TEST_ADMIN_PASSWORD` required when `IS_DEMO` set), or at minimum document the known default. Low real-world risk due to guards — severity capped at MEDIUM because the credential is visible in source.
- **Tests**: All GraphQL integration tests depend on this bootstrap; coordinate with `.env.test` (which supplies `ADMIN_PASSWORD=TestAdminPass1!` for prod-mode harness — ensure `.env.test` stays untracked).

### M5 — Bare `randomUUID()` test passwords pass complexity by accident

- **Files**: `frontend/common/graphql/test/teachers/teacher-onboarding.test.ts:31,231`, `students/student-onboarding.test.ts:20`, `parents/parent-onboarding.test.ts:30,67`
- **Layer**: Tests
- **Problem**: `` `Pwd_${randomUUID()}` `` — lowercase hex + `_`, only uppercase is the literal `P`. Passes today's complexity rules incidentally; a validator tightening breaks tests confusingly.
- **Fix**: Use `generateTestPassword()` from `backend/db/test/test-utils.ts:15` or `` `TestPass-${randomUUID().slice(0,8)}!` ``.
- **Tests**: These are the tests being fixed; run `bun run test/scripts/run-test.ts` on each file.

### M6 — `PaginationArgs.MAX_COUNT = 5000` + no query depth/complexity limiting

- **File**: `backend/types/shared/pagination.types.ts:32` (verified: MAX_COUNT at 32; perPage clamp at 66)
- **Layer**: Backend types / GraphQL
- **Problem**: A single list query can request 5,000 rows; `maxCount` is client-settable via `PaginationInput` (line 51); combined with no GraphQL depth/complexity limit anywhere in `backend/graphql`, nested lists multiply into large fan-out. `PaginationArgsDefault.maxCount = 100` exists but is not server-enforced.
- **Fix**: Lower `MAX_COUNT` to ~200; ignore/cap client `maxCount` server-side; consider adding a depth/complexity limiter to the GraphQL server setup.
- **Tests**: Repo/service tests asserting `MAX_COUNT` or large-page behavior will need adjusting.
- **Risk**: Frontend pages requesting large `perPage` may need adjustment — audit `perPage` usages before lowering.

### M7 — `ctx.user?.id ?? ""` silent anonymous fallback across 7 Pothos files

- **Files** (all verified via grep):
  - `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts:77`
  - `backend/graphql/pothos/scheduling/schedule.pothos.ts:196`
  - `backend/graphql/pothos/storage/learning-resource.pothos.ts:44,63`
  - `backend/graphql/pothos/parents/parent-profile.pothos.ts:119,132,149,164,177,194`
  - `backend/graphql/pothos/parents/parent-document.pothos.ts:26,42`
  - `backend/graphql/pothos/parents/parent-lifecycle.pothos.ts:27`
  - `backend/graphql/pothos/students/student-lifecycle.pothos.ts:46,68`
- **Layer**: Backend GraphQL/Pothos
- **Problem**: Every site is behind `authScopes` (`loggedIn` or permission scope), so anonymous calls are rejected before the fallback executes — this is dead-code footgun, not a live bypass. But if scopes are ever weakened, the fallback silently operates with empty userId instead of throwing.
- **Fix**: Drop the fallbacks (`ctx.user!.id` after loggedIn guard), or centralize an `assertUser(ctx)` helper that throws.
- **Tests**: GraphQL integration tests for parent/student/scheduling domains — no behavior change expected when authed.

### M8 — GraphQL custom scalars use hardcoded English `GraphQLError` messages

- **Files**: `backend/graphql/scalars/stringMapScalar.ts:17-104`, `localizedStringScalar.ts:13-65`, `ianaTimezoneScalar.ts:50` (11+ messages, e.g. `"StringMap must be an object"`)
- **Layer**: Backend GraphQL
- **Problem**: Scalar validation errors surface to API consumers as plain English; violates typed-translation policy. Scalars lack `ctx`, complicating locale binding.
- **Fix**: Either thread locale via GraphQL context in scalar `parseValue` (`parseValue(value, variables, ctx)`), or emit locale-neutral error codes mapped client-side. Choose based on how Pothos wires scalars — verify context availability first.
- **i18n**: New keys needed in `shared/locale/{en,ar}` per scalar error.
- **Tests**: Scalar unit tests asserting messages.

---

## LOW Severity

### L1 — `sql.raw` enum interpolation without internal validation
- **File**: `backend/services/auth/permission-management.service.ts:503` (verified)
- **Problem**: `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS '${key}'` — safe today because callers pre-validate via `parseAppPermission()` (:519), but the function itself trusts input. (Lines 132/134 are hardcoded boolean-derived strings — safe.)
- **Fix**: Validate inside the function against `Object.values(AppPermission)` before building the query.

### L2 — WhatsApp webhook responses in plain English
- **File**: `app/api/webhooks/whatsapp/route.ts:59,73,79,87,98,121,199,216`
- **Problem**: `"Forbidden"`, `"Too Many Requests"`, etc. — machine consumers, low impact.
- **Fix**: `new NextResponse(null, { status })` or `tErrors.*` for consistency.

### L3–L4 — Read queries gated `loggedIn`-only while writes use permission scopes
- **Files**: `backend/graphql/pothos/system/general-settings.pothos.ts:75,90`; `session-config.pothos.ts:110,122`
- **Problem**: Resolver-level guards exist (`assertCanViewGeneralSettings`), so this is declaration/runtime mismatch only.
- **Fix**: Mirror read permission in `authScopes` or document intent.

### L5 — Two unbounded string args (`expectedUpdatedAt`)
- **File**: `backend/graphql/pothos/system/site-appearance-settings.pothos.ts:309,337` (verified)
- **Fix**: `directives: { constraint: { maxLength: 64 } }`.

### L6 — Fail-open login rate limiter (documented trade-off)
- **File**: `backend/graphql/mutation/auth/auth.mutation.ts:235-309`
- **Problem**: `failOpen` wrapper overrides fail-closed `authRateLimiter` during cache outages — matches `docs/backend/login-cold-start-resilience.md` but brute-force protection is silently disabled in outages.
- **Fix**: None required — add alerting on the fail-open `logger.error` path and document override explicitly.

### L7 — `cron-auth.test.ts` env fallback as stand-in credential
- **File**: `backend/lib/cron-auth.test.ts:34`
- **Problem**: `process.env.PATH ?? ... ?? USER` used as `adminPassword` — env values can leak into logs/artifacts.
- **Fix**: Fixed dummy string.

### L8 — `.env.test` credential hygiene
- **Observation**: `.env.test:81` contains `ADMIN_PASSWORD=TestAdminPass1!`; verify it stays untracked (`.gitignore` covers `.env*` per audit — confirm `.env.test` included).

---

## VERIFY

### V1 — Public unauthenticated access to `avatars/` storage path
- **File**: `app/api/storage/files/[[...path]]/route.ts:231` (verified: `relativePath.startsWith("public/") || relativePath.startsWith("avatars/")`)
- **Problem**: Non-`public/` paths under `avatars/` are served without auth. Only demo/test avatars under `public/avatars` confirmed to exist; path traversal is guarded via `resolveLocalStoragePath`. If real user avatars ever land at `storage/avatars/`, they become publicly enumerable.
- **Action**: Confirm no production avatar files under `storage/avatars/`; if any exist, require auth like other non-public paths.

---

## Risks

### R1 — ⚠️ Seed/test-helper guard change breaks CI bootstrap (M3, M4)
Routing seeds through `resolveAdminPassword()` requires `ADMIN_PASSWORD` (or unset `IS_DEMO`/`TEST_SERVER`) everywhere seeds run — CI, local dev, prod-mode test harness (`.env.test`). Implement env config BEFORE the guard change.

### R2 — ⚠️ Repo-layer i18n changes need locale plumbing (H1, H2)
Repos currently have no `locale` parameter. Options: (a) thread locale from service layer, (b) use `getServerTranslations(locale ?? "en")` per `soft-delete.repository.ts` pattern. Option (a) touches many callers — batch H1/H2 and check all suggestion/teacher-availability callers.

### R3 — ⚠️ `MAX_COUNT` reduction may break existing frontends/tests (M6)
Grep all `perPage:` / `maxCount:` usages and repo tests asserting 5000 before lowering.

### R4 — ℹ️ i18n key additions require type schema first
Compile-time system: add signature in the locale type schema, then `en`, then `ar` — or `tsgo` fails. Applies to H1, H2, M8.

### R5 — ℹ️ Scalar error i18n (M8) needs context plumbing design
Decide between ctx-in-scalar vs error-code-mapping before writing keys; wrong choice wastes the locale work.

### R6 — ℹ️ No fix implemented or verified
Per request, this is plan-only. Nothing was run/built/tested; all line numbers were verified by grep at plan time but code moves — re-verify before implementation.

---

## Testing Map

| Fix | Affected tests | Action |
|---|---|---|
| H1 | suggestion repo tests | Update message asserts; run `bun run test/scripts/run-test.ts backend/db/test/repo/parents/...` |
| H2 | teacher-availability repo tests | Same |
| M1/M2 | storage upload tests | Add token-cap assertion |
| M3 | seed tests, test:db suite | Verify dev/test still boots |
| M5 | onboarding integration tests | Run via run-test.ts with log capture |
| M6 | repo/service pagination tests | Update MAX_COUNT expectations |
| M7 | parent/student/scheduling GraphQL tests | Should pass unchanged |

---

## Files Changed Summary (if implemented)

| Fix | File | Severity | Description |
|---|---|---|---|
| H1 | `backend/db/repo/parents/suggestion.repository.ts` | HIGH | i18n NotFoundError message |
| H2 | `backend/db/repo/teachers/teacher-availability.repository.ts` | HIGH | i18n validation message |
| M1 | `app/api/storage/vercel-upload/route.ts` | MEDIUM | maximumSizeInBytes cap |
| M2 | same | MEDIUM | server-side MIME allowlist |
| M3 | `shared/demo-users.ts`, `backend/db/seeds/users/seed-users.ts`, `backend/services/system/test-helper.service.ts` | MEDIUM | guarded credential resolver |
| M4 | `test/helpers/test-server.ts` | MEDIUM | env-only admin password |
| M5 | 3 onboarding test files | MEDIUM | generateTestPassword() |
| M6 | `backend/types/shared/pagination.types.ts` | MEDIUM | MAX_COUNT 5000 → ~200 |
| M7 | 7 pothos files | MEDIUM | drop `?? ""` fallbacks |
| M8 | 3 scalar files | MEDIUM | i18n scalar errors |
| L1–L8 | various | LOW | hardening |
| V1 | `app/api/storage/files/[[...path]]/route.ts` | VERIFY | avatars public access |

---

## Recommendations (priority order)

1. **H1 + H2** — i18n policy compliance; small, self-contained.
2. **M1 + M2** — one file, real exploit path (uncapped blob uploads).
3. **M3 + M4** — default-credential hygiene; coordinate env config first (R1).
4. **M6** — cheap DoS hardening after usage audit (R3).
5. **M7** — mechanical footgun removal.
6. L-items and M8 as batch cleanup.
