# Backend Security Fixes — Implementation Plan

> **Source**: Backend security review (2026-09-17) — 13 parallel audit domains, all findings verified against source with `grep -n`/`sed`
> **Status**: **IMPLEMENTED (MEDIUM batch + M10) — 2026-09-18** — see Implementation Log at the bottom. LOW batch and VERIFY items remain open.
> **Plan-review**: validated against layer AGENTS.md rules (pass 3 corrections folded in; M10 discovered during implementation and added)
> **Scope**: Full backend — Pothos GraphQL (`backend/graphql/`), services (`backend/services/`), repos (`backend/db/repo/`), API routes (`app/api/`), edge proxy (`proxy.ts`), secrets/config, rate limiting, i18n errors, test security

---

## Result Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 (**M10** — discovered during implementation; all original audit findings were MEDIUM or lower) |
| MEDIUM | 9 (7 actionable — **all implemented**; M5 + M6 were already implemented in the working tree by a concurrent workstream) |
| LOW | 13 (open — LOW batch) |
| VERIFY | 9 (open — need manual confirmation) |

The codebase was already in strong shape per the audit: all 181 query fields and 156 mutation fields carry `authScopes`; all 49 LIKE/ILIKE sites wrap user input with `escapeLikeWildcards()`; all `sql.raw()` calls are hardcoded literals; all 11 `stringList` inputs are constraint-bounded; all 26 API routes authenticate; cron/webhook/OAuth routes verify signatures timing-safely; production env validation fails closed.

**M10 is the important discovery**: the GraphQL permission gates themselves were broken for any field combining scopes in a bare multi-key map (see below). The original M1/M2 fixes led directly to it.

---

## HIGH Severity

### M10 — Bare multi-key `authScopes` maps are evaluated as OR — `permission`/`superAdmin` gates were no-ops
- **Files** (20 files, 86 wraps applied): `backend/graphql/mutation/{billing/{billing-payments,payment-method,billing-management,currency-hedge,currency,fx-ingestion}, system/{general-settings,meeting-integrations,session-config,site-content-settings,site-appearance-settings}, shared/{test-helper,onboarding,general-user-create}, auth/admin-password, profile/user-anonymization, scheduling/schedule-deletion}`, `backend/graphql/pothos/{permissions/{permission-group-simulation,permission-management}, cron/cron}`, `backend/graphql/query/cron/cron.query`, `backend/graphql/mutation/billing/accounting.mutation.ts`
- **Layer**: GraphQL authScopes / scope-auth plugin semantics
- **Problem**: `@pothos/plugin-scope-auth@4.1.7` evaluates a bare multi-key `authScopes` map under the **`any` (OR) default strategy** (plugin README: "defaultStrategy … defaults to `any`"; `gqlSchemaBuilder.ts:160` does not set one). Every field written as `authScopes: { permission: X, notImpersonating: true }` or `{ superAdmin: true, notImpersonating: true }` was therefore satisfied by `notImpersonating` alone (true for every normal session) — **the `permission`/`superAdmin` gate never fired**. Affected surfaces include permission-group management (privilege escalation surface), cron schedule management, billing invoice status changes, currency/FX management, settings edits, schedule deletion, staff onboarding (createManager/createSupervisor), admin password reset, user anonymization, and the test-helper mutations. The project's own rule (`backend.instructions.md`: "Multi-key `authScopes` maps need `$all`") and existing comments in `payroll.mutation.ts:17` ("The `$all` wrapper is load-bearing") confirmed the semantics.
- **Fix (implemented)**: wrap every bare multi-key map in `$all: { ... }` — the established pattern from `environment-config.mutation.ts:21-23` / `whatsapp-config.mutation.ts:30-32`. 86 wraps across 20 files (16 via a parallel subagent wave, 20 by hand including M1/M2 below). Final scans confirm **0 bare multi-key maps remain** (single-line and multi-line checked).
- **Behavior change (intended)**: fields now enforce their declared scopes. Tests that relied on the broken gate were fixed (see Test Fallout below).
- **Note**: a concurrent workstream independently found the same bug on `startImpersonation` and landed its `$all` fix + a structural test (`backend/graphql/test/impersonation.auth-scopes.test.ts`, in-flight/untracked) mid-implementation; verified consistent with this sweep.

---

## MEDIUM Severity (all implemented)

### M1 — Accounting mutations allow impersonated financial writes ✅ IMPLEMENTED
- **File**: `backend/graphql/mutation/billing/accounting.mutation.ts` (lines 156–224, 6 fields)
- **Fix applied**: `authScopes: { $all: { loggedIn: true, notImpersonating: true } }` on all 6 fields (permission stays enforced in `executeAccountingMutation` via `requirePermission(ACCOUNTING_PAYMENTS_MANAGE)`).
- **Tests**: `test/billing/accounting.test.ts` green in full-suite runs.

### M2 — Test-helper mutations: inconsistent authScopes ✅ IMPLEMENTED
- **File**: `backend/graphql/mutation/shared/test-helper.mutation.ts` (all 8 fields)
- **Fix applied**: all 8 aligned on `authScopes: { $all: { superAdmin: true, notImpersonating: true } }` (including `createTestSuperAdmin`, whose original bare map was itself a no-op per M10).
- **Test fallout**: tests provisioning/cleaning test entities with the `academy_admin` demo token broke — correctly. Fixed (see Test Fallout).

### M3 — Cron JSON payloads unbounded ✅ IMPLEMENTED
- **Files**: `backend/services/cron/cron.service.ts` (`MAX_CRON_PAYLOAD_BYTES = 64 * 1024` in the `CronService` namespace; guards in `createSchedule` and `updateSchedule` after the user-context check, throwing `DomainError("CRON_PAYLOAD_TOO_LARGE", t.payloadTooLarge)`), plus locale trio: `shared/locale/types/dashboard/cron.ts`, `shared/locale/en/dashboard/cron/main.ts`, `shared/locale/ar/dashboard/cron/main.ts` (new `payloadTooLarge` key in the cron dashboard errors namespace — per plan-review pass 3).
- **Tests**: 2 new cases in `backend/services/cron/test/cron.service.test.ts` (oversize rejected on create + update; repo never called) + the file's mocked translations extended with the new key. **46/46 pass.**

### M4 — Spoofable rate-limit identity fallback ✅ IMPLEMENTED
- **Files**: `backend/graphql/gqlContextFactory.ts` (`getIpAddress`), `backend/lib/ratelimit.ts` (`getClientIdentifier`)
- **Fix applied**: when no trusted IP source exists (off Vercel/Cloudflare, no `TRUSTED_PROXY`), **production** now fails conservative with the single shared bucket `anon:unknown` + `logger.warn` (the UA/Accept-Language fingerprint was fully client-rotatable — unbounded bucket rotation for brute-force). **Non-production keeps the fingerprint** so dev/test bucket separation and parallel tests are unaffected. Doc comments updated to match.
- **Deviation from plan**: the "extract one shared `resolveClientIp` helper" step was dropped — the two call sites intentionally run different header-trust chains (Vercel/CF gating vs TRUSTED_PROXY parsing), and merging them risked breaking platform paths for no security gain. The vulnerability (spoofable fallback) is fixed in both.
- **Tests**: `frontend/common/graphql/test/rate-limit/rate-limit.test.ts` green.

### M5 / M6 — Upload magic-byte validation + streamed byte cap — ALREADY IN TREE (verify-only) ✅
- A concurrent workstream's uncommitted changes already implement both: `verifyImageMagicBytes` (`backend/lib/storage/mime-allowlist.ts:58`) wired into `streamToFile`'s in-stream header capture, and a `receivedBytes` counter aborting with `UploadStreamError(413)` at `maxSizeBytes + STREAM_SIZE_SLACK_BYTES` with unlink-on-error (`app/api/storage/upload/[id]/route.ts`). No re-implementation done.

### M7 — Authenticated private files served with public cache hint ✅ IMPLEMENTED
- **File**: `app/api/storage/files/[[...path]]/route.ts`
- **Fix applied**: new `PRIVATE_STORAGE_CACHE_CONTROL = "private, max-age=60"`; `resolveCacheControl` returns it for every non-`public/` path. Appearance-logo and `public/` behavior unchanged.

### M8 — Hardcoded user-facing error: "Package plan not found" ✅ IMPLEMENTED
- **Files**: `backend/graphql/query/billing/accounting.query.ts:69` (+ `const tErrors = ctx.t().errorsTranslations;`), `backend/graphql/mutation/billing/accounting.mutation.ts:188` (tErrors already in scope)
- **Fix applied**: `throw new NotFoundError("PACKAGE_PLAN", tErrors.notFound)` — the two-arg signature from `backend/lib/errors.ts:16-20`. `mapQuotaErrorToGraphQLError` passes the localized message through with `extensions.code: "NOT_FOUND"` (the mutation site previously surfaced as `INTERNAL_SERVER_ERROR` — improved).

### M9 — Appearance-conflict error rethrows raw English message ✅ IMPLEMENTED
- **Files**: `backend/graphql/pothos/system/site-appearance-settings.pothos.ts:213` — `runAppearanceMutation<T>(tErrors: ErrorsLabels, fn: () => Promise<T>)`; both call sites in `backend/graphql/mutation/system/site-appearance-settings.mutation.ts` pass their already-computed `tErrors` (from `resolveAppearanceErrors(ctx)`).
- **i18n**: new key landed as **`errors.appearance.conflict`** inside the existing `AppearanceErrors` section (better than the originally proposed top-level key): `shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts` — all three atomically. Frontend matches on `extensions.code`, so the message swap is safe.
- **Tests**: `frontend/common/graphql/test/settings/site-appearance-settings.test.ts` green.

---

## Test Fallout from M10/M2 (all fixed)

Tests that had been passing **through the broken OR gate** now enforce the declared scopes. All were provision/cleanup infrastructure using the `academy_admin` demo token (a staff admin, not a super admin) for super-admin-gated test-helper mutations:

| File | Fix |
|---|---|
| `frontend/common/graphql/test/billing/billing-management.test.ts` | `provisionTestSuperAdmin`/`cleanupTestEntities` now use `r.superAdminToken` / new `state.seedSuperAdminToken` |
| `frontend/common/graphql/test/reports/report.test.ts` | Same — new describe-scope `seedSuperAdminToken` |
| `frontend/common/graphql/test/scheduling/schedule.test.ts` | Same (4 call sites; business-op tokens untouched — the "academy admin denied" DST test still uses `adminToken` by design) |
| `frontend/common/graphql/test/resources/learning-resource-graphql.test.ts` | `provisionTestSuperAdmin(await loginSuperAdmin(), ...)` |
| `frontend/common/graphql/test/classes/class-session.test.ts` | `afterAll` cleanup uses `await loginSuperAdmin()` instead of `academy_admin` |
| `backend/services/cron/test/cron.service.test.ts` | Mocked translations extended with `payloadTooLarge` (mock-driven test) |

Denial tests (e.g., "teacher denied", "ensureDemoUsers requires authentication") continue to pass — they asserted denial before via service-layer checks and now also via the scope layer.

---

## LOW Severity (OPEN — not yet implemented)

| # | File:Line | Finding | Fix |
|---|---|---|---|
| L1 | `backend/graphql/query/books/book.query.ts:14` | Dead `if (!ctx.user?.id)` guard under `authScopes: { loggedIn: true }` | Remove or leave (no security impact) |
| L2 | `backend/graphql/query/books/report.query.ts:18` | Same dead guard under `superAdmin` scope | Same |
| L3 | `backend/graphql/query/students/student-history.query.ts:21` | `ctx.user?.id` + manual throw under `loggedIn` scope | Use `requireAuth(ctx)` for consistency |
| L4 | `backend/graphql/mutation/parents/complaint.mutation.ts:30` (+`suggestion.mutation.ts:36`) | `checkRateLimit(ctx.ipAddress ?? "[unknown]")` shared fallback bucket | Fail closed or per-mutation sentinel |
| L5 | `backend/graphql/mutation/auth/auth.mutation.ts:243` | Login falls back to `[IP_REDACTED]` when `ctx.ipAddress` unset | Same direction as M4 |
| L6 | `backend/db/query.extensions.ts:33` | `fullTextSearch` sanitizer strips `&|!():` only; other tsquery metachars → 500 | Whitelist word chars before appending `:*` |
| L7 | `backend/graphql/pothos/billing/accounting.pothos.ts:114` (+`:137,:167,:178`) | PackagePlan `description`/`paymentNote` inputs lack maxLength | `constraint: { maxLength: 2000 }` |
| L8 | `backend/graphql/pothos/expenses/expense.pothos.ts:104` (+`:132,:145`) | Expense `note`/`reason` unbounded | `maxLength: 2000`/`500` |
| L9 | `backend/graphql/mutation/teachers/carryover.mutation.ts:140` | `unpayCarryoverBalance` note unbounded | `maxLength: 2000` |
| L10 | `backend/graphql/query/accounting/profit-loss.query.ts:22-27` | limit/offset args unclamped | `min/max` mirroring `cron.pothos.ts:135-136` (verified pattern) |
| L11 | `backend/graphql/mutation/billing/accounting.mutation.ts:69` | `requireString` throws hardcoded English | Pass `tErrors.invalidInput` (verified both locales) |
| L12 | `backend/graphql/scalars/{stringMapScalar.ts:31+, localizedStringScalar.ts:25+, ianaTimezoneScalar.ts:38}` | Scalar validation errors hardcoded English; IANA echoes raw input | Localized invalid-input message; stop reflecting raw value |
| L13 | `backend/services/leave-request/leave-request.service.ts:67` + `:222` | SESSION_LOCKED + "Request is no longer pending" hardcoded English | :67 → existing `sessionLocked` key; :222 → NEW key `leaveRequestNoLongerPending` (types+en+ar atomically) |
| L14 | `shared/demo-users.ts:18` | `DEFAULT_SEED_ADMIN_PASSWORD` literal (env-overridable); guarded by `resolveAdminPassword()` | Optional: remove env steering |
| L15 | `.github/workflows/ci.yml:103` (+`graphql.yml:64`) | `ADMIN_PASSWORD: … \|\| '12345678'` committed fallback | Fail the job if the secret is missing |
| L16 | `scripts/health/sonar/ts/config.ts:41` | Sonar admin password committed fallback | Fail loudly when env unset |
| L17 | `backend/lib/ratelimit.ts:253` | Dev env limiters log-and-allow unless `TEST_ENFORCE_RATE_LIMIT=1` | Gate non-enforcement on localhost bind |
| L18 | `backend/graphql/gqlContextFactory.ts:143` | `x-vercel-forwarded-for` returned verbatim, no `isIP()` validation | Split/trim/`isIP()` the first entry |
| L19 | `app/api/set-locale/route.ts:85` | GET sets `NEXT_LOCALE` without POST's origin check | Apply `isAllowedOrigin` to GET, or accept-as-benign |
| L20 | test files | `notification-dispatch.helpers.test.ts:77` bare `randomUUID()` password; ~6 scattered generator copies | Consolidate into `generateTestPassword()`; fix the non-conforming site |
| L21 | `backend/graphql/pothos/students/student-onboarding.pothos.ts:44` | Password input `maxLength: 128` only | Acceptable if service enforces policy — see V9 |
| L22 | `proxy.ts:27` | No auth in edge middleware (by design — layout guard is the real gate) | Optional cookie-presence pre-redirect only |
| L23 | `backend/services/auth/permission-management.service.ts:255` | Slug probe `LIKE ${baseSlug + "%"}` not wildcard-escaped (parameterized → no SQLi) | `escapeLikeWildcards(baseSlug)` |

## VERIFY Items (OPEN)

| # | File:Line | Suspicion | How to confirm |
|---|---|---|---|
| V1 | `app/api/invoices/[id]/download/route.ts:32` | Invoice PDF `filePath` under `public/` would bypass `verifyInvoiceAccess` at the storage route | Confirm no invoice_pdf is stored under `public/`; add `!filePath.startsWith("public/")` guard regardless |
| V2 | `proxy.ts:36` | `x-pathname`/`x-search` header reflection — CR/LF injection | Confirm Next 16 `Headers.set` rejects CR/LF; else encode |
| V3 | `backend/graphql/mutation/auth/auth.mutation.ts:364-406` | `demoLogin` self-hosted non-Vercel exposure with `IS_DEMO` + `NODE_ENV≠production` | Confirm deployment posture; optionally explicit allowlist env |
| V4 | `app/api/storage/vercel-upload/route.ts:197` | pathname extension vs declared contentType mismatch | Re-check current working-tree version (file has in-flight changes) |
| V5 | GraphQL execution stack | No query cost/complexity analysis (depth 7 + 256KB + batch ≤10 exist) | Consider complexity scoring |
| V6 | `backend/graphql/pothos/*` | N+1 in nested list resolvers (only ~5 modules use DataLoader) | Targeted audit; add Loaders |
| V7 | `backend/graphql/mutation/billing/payment-method.mutation.ts:59` | `assertShape` literal English, likely unreachable | Prefer `tErrors.invalidInput` anyway |
| V8 | `backend/graphql/mutation/profile/profile.mutation.ts:24` | Same pattern | Same |
| V9 | `backend/graphql/pothos/students/student-onboarding.pothos.ts:44` | Service-level password policy on onboarding path | Verify `validatePasswordStrength` runs there |

---

## Verified Clean (audited, no action)

- **Pothos coverage**: 181/181 query fields and 156/156 mutation fields carry `authScopes` (now with correct AND semantics everywhere). No `ctx.user?.id ?? ""` silent fallbacks.
- **SQL/LIKE injection**: 49 `escapeLikeWildcards()` sites verified line-by-line; all `sql.raw()` calls are hardcoded literals; dynamic table name is `KNOWN_TABLES`-allowlisted + `sql.identifier()`.
- **Input bounds**: all 11 `stringList` inputs constrained; constraint directives runtime-enforced; all value-scalars except JSON validate (JSON now capped at the service layer for cron — M3).
- **API routes**: all 26 authenticate; cron routes timing-safe `CRON_SECRET` fail-closed; WhatsApp webhook HMAC-SHA256; OAuth state bound to session; CSV exports formula-injection-safe, 10k row cap.
- **Storage guards**: MIME allowlist excludes svg/html/js; path containment; uploader binding; default-deny file access; super-admin cleanup gate. (Magic bytes + stream cap landed via concurrent work — M5/M6.)
- **Secrets**: `resolveAdminPassword()` and `backend/lib/env.ts` fail closed in production; no secrets in `shared/`.
- **Rate limiting**: login/demoLogin/refreshToken/changePassword/adminResetPassword rate-limited; `authRateLimiter` fail-closed; pagination clamps at 200; GraphQL depth 7 + 256KB + batch ≤10. (Fallback now production-safe — M4.)
- **Test infra**: test-helper mutations super-admin-gated (M2) and registered only when `isTestHelperEnabled()`; hard-disabled on Vercel.

---

## Risks

| # | Severity | Risk | Status |
|---|---|---|---|
| R1 | Med | M2 test churn if suites called helper mutations without super tokens | **Materialized and fixed** — 5 test files migrated to super tokens (see Test Fallout) |
| R2 | Med | M4 single anonymous bucket causes cross-user lockout on misconfigured self-hosted prod | Accepted posture (plan-endorsed); `logger.warn` + `TRUSTED_PROXY` are the operator remedy |
| R3 | Low | M7 `private` caching reduces proxy caching for internal assets | Intentional |
| R4 | Low | Atomic locale additions (M3 `payloadTooLarge`, M9 `appearance.conflict`) | Both landed atomically; tsgo green |
| R5 | Low | M3 64KB cap vs existing seed/test payloads | Cron tests green; no seed payload exceeded it |
| R6 | Med | **Stale-plan race on storage/schema**: concurrent workstream has in-flight changes — `parents.ts`/`teachers.ts` PII-encryption schema (`encryptedText` on address/whatsapp/national_id/phone), storage upload/vercel-upload routes, profit-loss + user-anonymization fields | Confirmed: `test:graphql` files `parents/parent-onboarding` and `teachers/teacher-onboarding` fail on raw `insert into "parents"/"teachers"` with ciphertext params — **in-flight workstream's mid-implementation state, not these fixes**. Do not touch their files; re-run those two files after their work lands. |
| R7 | — | M10 enforcement ripple: any untested caller (scripts, workflows, seeds) invoking newly-AND-gated mutations with under-privileged tokens | `test:graphql` + `test:workflows` should be re-run when the in-flight workstream lands; scripts use server-side service calls, not GraphQL |

---

## Implementation Log (2026-09-18)

- **M1–M4, M7–M9, M10 applied** (M5/M6 verified in-tree). All changed files passed `scripts/lint-service.ts` + `biome check`; repo-wide `bun tsgo` green.
- **Schema regen**: `bun run generate:gqlSchema` — `authScopes`/message changes produce **no SDL delta of our own**; the +165-line `schema.graphql` diff is the concurrent workstream's in-flight new types (FxWarning, ACCOUNTING_PROFITS_VIEW, anonymizeUser) surfacing in a regen; generated artifacts now match the tree.
- **Cron service tests**: 46/46 pass (2 new payload-cap cases).
- **GraphQL suite (final full `--no-bail` run)**: **50 of 51 files green, 512 tests passed**. The single red file (`teachers/teacher-onboarding.test.ts`, 22 failures) fails on raw `insert into "teachers"` with ciphertext params — the concurrent PII-encryption workstream's in-flight schema state (git-confirmed `backend/db/schema/teachers/teachers.ts` modified), **not** these fixes. (`parents/parent-onboarding.test.ts` passed once their parents-path fix landed mid-run.) Re-run that file after their work lands.
- **M10 blast radius closed**: final scans show 0 bare multi-key `authScopes` maps (single-line and multi-line) across `backend/graphql/`.

## Remaining Work

1. **LOW batch** (L1–L23) — mechanical constraint caps, localized scalar/service messages, CI fallback removal, test-password consolidation.
2. **VERIFY items** (V1–V9) — confirm before fixing; V4 must re-check the current in-flight file state.
3. **Re-run the two blocked test files** after the concurrent PII-encryption workstream lands; then a clean full `bun run test:graphql`.
4. **Quality gate**: tsgo ✓, oxlint ✓ (0 warnings / 0 errors on 6,112 files), biome ✓ (1 pre-existing broken-symlink warning in `.claude/skills`, unrelated). `lint:type-aware` is red with exactly **1 error, in the concurrent workstream's in-flight `scripts/encrypt-env-config-secrets.ts:46`** (their PII-encryption script) — every error in files changed by this effort is resolved. Re-run `bun quality-gate` after their workstream lands.
