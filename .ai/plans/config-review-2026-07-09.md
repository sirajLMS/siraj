# Config Review Plan

**Date**: 2026-07-09
**Scope**: All config — app/, scripts/, .github/, package.json, tsconfig, next.config
**Focus**: Comprehensive (App Router conventions + Security + Build & CI)
**Files Reviewed**: app/ directory, package.json, bunfig.toml, tsconfig.json, next.config.ts, .github/workflows/, scripts/, env handling across backend/

## Summary

Comprehensive config review across 7 investigation tracks. The `app/` directory is overwhelmingly clean (proper Server Components, no `"use client"` leakage, services-not-DB access pattern, `await params` everywhere, locale-aware redirects). Major gaps: (1) **no CI workflow** — only a migration workflow runs on push to master, no build/test/quality-gate enforcement on PRs; (2) **`package.json` scripts invoke eslint directly** (`lint`, `lint:perf`) — violating AGENTS.md lint-queue mandate; (3) **`scripts/safe-dev.ts` missing** despite being documented and referenced in `package.json`; (4) **widespread `process.env` access bypassing `env.ts` validation** for many secrets (TWILIO, RESEND, FIREBASE, GCP, ADMIN_PASSWORD, DATABASE_ENCRYPTION_KEY, etc.); (5) **root `middleware.ts` missing** despite next-intl App Router i18n routing requiring it. Minor inconsistencies: 2 app pages use raw `next/navigation` redirect instead of the i18n-aware helper; tsconfig missing `noUncheckedIndexedAccess`.

## Findings

### CRITICAL (5)

- [ ] [CRITICAL] CI/CD: .github/workflows/migrate-production.yml:0 — No CI workflow exists for build/test/quality-gate; only a migration workflow runs on push to master. Add a CI workflow running `bun install --frozen-lockfile`, `bun tsgo`, `bun biome:check`, `bun run test`, and `bun run build` on PR/push (e.g. `.github/workflows/ci.yml`).
  → Fix: TBD

- [ ] [CRITICAL] Build: package.json:13 — `"lint"` script invokes eslint directly; AGENTS.md mandates lint queue client (`scripts/lint-queue-server.ts`), never `bun run lint` directly.
  → Fix: TBD

- [ ] [CRITICAL] Build: package.json:14 — `"lint:perf"` script invokes eslint directly; same lint-queue violation.
  → Fix: TBD

- [ ] [CRITICAL] Scripts: scripts/safe-dev.ts:1 — Documented in AGENTS.md ("bun run dev:safe via scripts/safe-dev.ts") and referenced in package.json:8 but file missing.
  → Fix: TBD

- [ ] [CRITICAL] Env: backend/db/drizzleDb.ts:31 — Logs DATABASE_URL substring (may expose credentials if URL contains them before position 20).
  → Fix: TBD

- [ ] [CRITICAL] Env: .env.local:1 — `.env.local` contains real Vercel OIDC token (JWT) on disk; gitignored (not committed) but plaintext secret present in workspace.
  → Fix: TBD (review-only — this is a local workspace hygiene issue, not a code change)

### WARNING (32)

*App Router / i18n (2)*
- [ ] [WARNING] App Router: app/[locale]/(dashboard)/students/new/page.tsx:22 — Uses raw `react()` from `next/navigation` without locale context; use `redirect()` from `@/shared/i18n/routing` with `{ href, locale }` pattern for consistency.
  → Fix: TBD
- [ ] [WARNING] App Router: app/[locale]/(dashboard)/students/[id]/page.tsx:5 — Uses raw `redirect()` from `next/navigation` with `/${locale}/...` template; should use i18n-aware `redirect({ href, locale })` from `@/shared/i18n/routing`.
  → Fix: TBD

*Build (3)*
- [ ] [WARNING] Build: package.json:44 — `"postinstall"` uses `node -e "..."` directly; Bun runtime should be used: replace `node -e` with `bun -e`.
  → Fix: TBD

*CI/CD (1)*
- [ ] [WARNING] CI/CD: .github/workflows/migrate-production.yml:0 — No PR CI workflow gates merges; quality gate (`bun quality-gate`) and tests are never enforced by CI. Add a `pull_request` trigger workflow that runs `bun quality-gate`.
  → Fix: TBD

*Env — process.env bypassing env.ts (25)*
- [ ] [WARNING] Env: backend/lib/auth/jwt.ts:4 — JWT_SECRET accessed via process.env at module load, bypassing env.ts validateJwtSecret.
  → Fix: TBD
- [ ] [WARNING] Env: backend/lib/auth/session-hash.ts:8 — JWT_SECRET accessed via process.env directly, bypassing env.ts validation.
  → Fix: TBD
- [ ] [WARNING] Env: backend/db/schema/custom-types.ts:5 — DATABASE_ENCRYPTION_KEY accessed via process.env at module load, bypassing env.ts validation.
  → Fix: TBD
- [ ] [WARNING] Env: backend/storage/disk/gcp-auth.ts:6 — GCP_PROJECT_ID/SECRET_ID/VERSION/CREDENTIALS_JSON read via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/services/communication/channels/sms/twilio/TwilioSmsAdapter.ts:16 — TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/services/communication/channels/email/resend/ResendEmailAdapter.ts:13 — RESEND_API_KEY/FROM_EMAIL accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/services/communication/channels/push/fcm/FcmPushAdapter.ts:18 — FIREBASE_PROJECT_ID/PRIVATE_KEY/CLIENT_EMAIL accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/storage/disk/vercel/adapter.ts:9 — BLOB_READ_WRITE_TOKEN accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: shared/demo-users.ts:17 — ADMIN_EMAIL/ADMIN_PASSWORD accessed via process.env directly; ADMIN_PASSWORD is security-critical.
  → Fix: TBD
- [ ] [WARNING] Env: app/api/storage/cleanup/route.ts:24 — ADMIN_EMAIL accessed via process.env directly in route handler, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/db/seeds/lib/admin-user.ts:4 — ADMIN_EMAIL accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/db/connection-strategy.ts:13 — DB_CONNECTION_MODE and DB_PROVIDER read via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/db/factory.ts:67 — DB_CONNECTION_MODE, DB_PROVIDER, DATABASE_URL accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/db/drizzleDb.ts:20 — DATABASE_URL and DB_PROVIDER accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/db/schema/custom-types.ts:31 — drizzleDb.ts logs DATABASE_URL substring to console — potential credential leak in logs.
  → Fix: TBD
- [ ] [WARNING] Env: app/api/storage/cleanup/route.ts:24 — (duplicate of above ADMIN_EMAIL finding — see Env track above)
- [ ] [WARNING] Env: backend/db/repo/session.repository.ts:28 — CACHE_PROVIDER accessed via process.env directly (env.ts validates it centrally).
  → Fix: TBD
- [ ] [WARNING] Env: backend/services/cache/CacheServiceFactory.ts:24 — CACHE_PROVIDER accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/services/redis/RedisServiceFactory.ts:14 — REDIS_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/services/communication/channels/sms/SmsChannelFactory.ts:8 — SMS_PROVIDER accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/services/communication/channels/email/EmailChannelFactory.ts:8 — EMAIL_PROVIDER accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/services/communication/channels/push/PushChannelFactory.ts:8 — PUSH_PROVIDER accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/storage/storage.service.ts:20 — STORAGE_PROVIDER accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/storage/disk/shared/upload-operations.helper.ts:27 — SIGNED_URL_CLEANUP_STRATEGY accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: app/api/logs/route.ts:32 — CLEANUP_ENABLED accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/lib/storage/local-storage-path.ts:6 — LOCAL_STORAGE_PATH accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/lib/server.ts:36 — NEXT_PUBLIC_BASE_URL accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/lib/ratelimit.ts:206 — DISABLE_RATE_LIMITING accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: backend/lib/auth/cookies.ts:12 — ALLOWED_ORIGIN accessed via process.env directly (env.ts validates it centrally).
  → Fix: TBD
- [ ] [WARNING] Env: backend/graphql/mutation/auth.mutation.ts:236 — IS_DEMO accessed via process.env directly, bypassing env.ts.
  → Fix: TBD
- [ ] [WARNING] Env: app/[locale]/(auth)/login/page.tsx:8 — IS_DEMO/NEXT_PUBLIC_IS_DEMO accessed via process.env directly in Server Component, bypassing env.ts.
  → Fix: TBD

*TS Config & Build Config (2)*
- [ ] [WARNING] TS Config: tsconfig.json:22 — Missing `"noUncheckedIndexedAccess": true`; AGENTS.md recommends it for safer index access typing.
  → Fix: TBD
- [ ] [WARNING] TS Config: next.config.ts:74 — next-intl App Router i18n configured but root `middleware.ts` is missing — required for locale routing with `app/[locale]/`.
  → Fix: TBD

### SUGGESTION (11)

- [ ] [SUGGESTION] App Router: app/[locale]/(dashboard)/complaints/page.tsx:21 — `redirect({href:"/",locale})` inside catch block has no `return` after it; project convention adds explicit `return` after redirects.
  → Fix: TBD
- [ ] [SUGGESTION] App Router: app/[locale]/(dashboard)/students/[id]/page.tsx:5 — Redirects with raw `/${locale}/students/${id}/status` while `localePrefix:"never"` means no prefix needed — should use path-only form.
  → Fix: TBD
- [ ] [SUGGESTION] i18n: app/api/invoices/[id]/download/route.ts:28 — Internal API redirect `/api/storage/files/...` doesn't include locale; acceptable since API routes are excluded from locale routing.
- [ ] [SUGGESTION] Build: package.json:19 — Duplicate `"typecheck"` script mirrors `"tsgo"` (line 20); AGENTS.md documents only `bun run tsgo`. Consider removing redundant alias.
  → Fix: TBD
- [ ] [SUGGESTION] Build: package.json:9 — `"dev:full"` uses `bash ../scripts/dev.sh` referencing external script outside project root; not documented in AGENTS.md.
  → Fix: TBD
- [ ] [SUGGESTION] Build: package.json:247 — `lint-staged` config invokes `eslint --fix` directly (pre-commit); consider routing via lint queue client for consistency with AGENTS.md lint policy.
  → Fix: TBD
- [ ] [SUGGESTION] CI/CD: .github/workflows/migrate-production.yml:24 — `oven-sh/setup-bun@v2` is used but no explicit Bun cache config; consider pinning a Bun version for reproducible migrations.
  → Fix: TBD
- [ ] [SUGGESTION] CI/CD: .github/workflows/migrate-production.yml:0 — Migration workflow runs on every push to master with no pre-migration gate; consider requiring CI/quality-gate to pass before migration job (via `needs:` or branch protection).
  → Fix: TBD
- [ ] [SUGGESTION] Env: .gitignore:65 — Duplicate `.env*` and `.eslintcache`/`.scannerwork` entries (lines 34-35 and 65-66, 46 and 73) — redundant; consolidate for clarity.
  → Fix: TBD
- [ ] [SUGGESTION] Env: backend/lib/env.ts:163 — `validateNoPlaceholderSecrets` checks only 5 vars; missing RESEND_API_KEY, FIREBASE_PRIVATE_KEY, TWILIO_AUTH_TOKEN, GCP_CREDENTIALS_JSON, BLOB_READ_WRITE_TOKEN.
  → Fix: TBD
- [ ] [SUGGESTION] Env: backend/lib/env.ts:11 — `EnvironmentConfig` interface omits many env vars used app-wide (DATABASE_ENCRYPTION_KEY, ADMIN_PASSWORD, STORAGE_PROVIDER, GCP_*, TWILIO_*, RESEND_*, FIREBASE_*, IS_DEMO); env.ts not central source of truth for all secrets.
  → Fix: TBD
- [ ] [SUGGESTION] Env: next.config.ts:18 — `allowedDevOrigins` contains hardcoded private IP (NoSonar annotated); consider env-driven config for development origins.
  → Fix: TBD
- [ ] [SUGGESTION] Env: shared/demo-users.ts:15 — Hardcoded dev/seed password `"Seed_Pass1!"` as fallback for ADMIN_PASSWORD; ensure never used in production (no production guard on fallback).
  → Fix: TBD
- [ ] [SUGGESTION] Env: backend/db/seeds/seed-users.ts:26 — Hardcoded dev/seed password `"Seed_Pass1!"` repeated (also in shared/demo-users.ts:15) — centralize to avoid divergence.
  → Fix: TBD
- [ ] [SUGGESTION] TS Config: tsconfig.json:49 — `exclude` drops `"draft"` and `"**/unRefactored_tests"` dirs — tests won't be type-checked by tsgo.
  → Fix: TBD
- [ ] [SUGGESTION] TS Config: bunfig.toml:3 — `happydom-preload.ts` loaded for ALL tests including backend DB tests — adds unnecessary DOM env to non-DOM test runs.
  → Fix: TBD
- [ ] [SUGGESTION] Scripts: scripts/run-test/run-test.ts:56 — Supports undocumented `--feedback`/`--context`/`--list-feedback` flags not mentioned in AGENTS.md run-test section.
  → Fix: TBD
- [ ] [SUGGESTION] Scripts: package.json:9 — `"dev:full"` references `../scripts/dev.sh` which does not exist outside project root. *(duplicate of Build track finding)*

## Recommended Actions

**Priority 1 — CI/CD (highest impact):**
1. Create `.github/workflows/ci.yml` running build, tsgo, biome:check, and tests on PR + push.
2. Make the migration workflow depend on CI passing (or rely on branch protection).

**Priority 2 — Build/Scripts correctness:**
3. Fix `package.json` `lint`/`lint:perf` scripts to route through lint queue client (or remove if unused in dev — but they must not invoke eslint directly per AGENTS.md).
4. Replace `node -e` in `postinstall` with `bun -e`.
5. Create the missing `scripts/safe-dev.ts` referenced by `dev:safe`.

**Priority 3 — Security/Env hygiene:**
6. Fix the `drizzleDb.ts` DATABASE_URL log leak (remove the substring log entirely).
7. (Workspace hygiene) Rotate the Vercel OIDC token in `.env.local` if it's been exposed — not a code change.
8. Route all `process.env` access through `env.ts` — this is a large refactor; consider scoping to the most sensitive secrets first (ADMIN_PASSWORD, DATABASE_ENCRYPTION_KEY) and adding them to `env.ts` validation + `EnvironmentConfig` interface.
9. Expand `validateNoPlaceholderSecrets` to cover all production secrets.

**Priority 4 — App Router/i18n consistency:**
10. Switch the 2 raw `redirect()` calls in `students/new/page.tsx` and `students/[id]/page.tsx` to the i18n-aware `redirect({ href, locale })` helper from `@/shared/i18n/routing`.
11. Investigate the missing root `middleware.ts` — if intentionally absent (custom handler elsewhere), document; otherwise create it.

**Priority 5 — Config polish:**
12. Enable `noUncheckedIndexedAccess` in `tsconfig.json`.
13. Review tsconfig `exclude` to allow type-checking of draft/unRefactored tests (or confirm intentional).
14. Consolidate duplicated `.gitignore` entries.
15. Centralize the hardcoded `"Seed_Pass1!"` fallback.
16. (Optional) Move happydom preload to UI-only tests in `bunfig.toml`.

## Layer Compliance Notes

Validated against root `AGENTS.md`, `app/AGENTS.md`, `backend/AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/db/seeds/AGENTS.md`, `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`. The plan is **CONDITIONAL** — broad soundness, with these corrections required before implementation:

### Severity Escalations (8)
1. **`localePrefix:"never"` redirect signature inconsistency** — WARNING `students/new/page.tsx:22` + `students/[id]/page.tsx:5` + SUGGESTION `students/[id]/page.tsx:5` must be reconciled. With `localePrefix:"never"` in `shared/i18n/routing.ts`, the i18n-aware `redirect({ href, locale })` expects **path-only** `href` (e.g., `/students/onboarding`), NOT locale-prefixed paths. Implementing the WARNING as written would produce wrong URLs. Fix approach must state "path-only href."
2. **Module-load-time `process.env` reads** (`custom-types.ts:5`, `jwt.ts:4`, `session-hash.ts:8`) — escalate to CRITICAL-implementation-order. These read env at module import, before `ensureEnvironmentValidated()` is guaranteed to run. Naive routing through env.ts getters will break at import. Either split into function-call-time reads OR force eager env.ts initialization at app boot.
3. **`drizzleDb.ts:31` scope too narrow** — broaden the fix: lines 30-34 use undocumented `logger.log(...)` (AGENTS.md documents only `logger.info/warn/error/debug`). All 5 calls must migrate to `logger.info`/`logger.debug`, and credential logging must use `sanitizeUrlCredentials` (already imported in `env.ts:4`) instead of fragile `substring(0,20)` truncation.
4. **`lint-staged` direct `eslint --fix`** (currently SUGGESTION `package.json:247`) — escalate to WARNING. Pre-commit husky runs are a real concurrent execution path; this is the same lint-queue violation as CRITICAL `package.json:13/14`.
5. **`Seed_Pass1!` no-production-guard fallback** (`shared/demo-users.ts:15`, `seed-users.ts:26`) — escalate to WARNING. A dev/seed password fallback active in production is a security concern, not stylistic. Add `if (NODE_ENV === 'production') throw` guard.
6. **`dev:full` references non-existent `../scripts/dev.sh`** (`package.json:9`) — escalate to WARNING for parity with CRITICAL `safe-dev.ts` (both are broken-script issues; inconsistent severity).
7. **`safe-dev.ts` CRITICAL lacks spec** (CRITICAL `scripts/safe-dev.ts:1`) — must include a skeleton + spec before implementation. A "create missing file" finding with TBD fix and no spec is not actionable.
8. **SUGGESTION `run-test.ts:56` (undocumented flags)** — **DISMISS as false positive**. The `--feedback`/`--context`/`--list-feedback` flags ARE documented in `run-test.ts --help`, `parseArgs()`, `README.md`, and `scripts/run-test/AGENTS.md`. Root AGENTS.md is a high-level summary, not exhaustive — its omission is not a defect.

### Plan Corrections
- Warning #37 (`students/new/page.tsx:22`) prose typo: says `react()` — should read `redirect()`.
- Warning #79 (`custom-types.ts:31` DATABASE_URL log) cites the WRONG file — the log is actually at `drizzleDb.ts:31`, not `custom-types.ts:31`. Remove the duplicate.
- `EnvironmentConfig` expansion in `env.ts` (the `backend/lib/env.ts` infrastructure config interface) is COMPLIANT — it is NOT an entity type, so the `@/backend/types` rule does not apply.
- The `middleware.ts` creation (TS Config WARNING) requires specifying the `createMiddleware(routing)` pattern with matcher `["/((?!api|_next|.*\\..*).*)"]`, reusing `routing` from `@/shared/i18n/routing`. Before creating it, verify no existing custom locale-routing handler exists.
- CI workflow creation must NOT add `bun run lint` directly; either omit lint from CI or invoke only safe per-step commands (`bun tsgo`, `bun biome:check`, `bun run test`, `bun run build`). `bun quality-gate` orchestrates lint via the queue.

### Confirmed Compliant
- 0 findings introduce `console.*` in backend files
- 0 findings introduce local entity types in Pothos files
- 0 findings introduce `useQuery`/Apollo in Server Components (redirect fixes don't touch data fetching)
- 0 findings hardcode user-facing strings
- 0 findings use `tsc` or non-bun commands (the `node -e`→`bun -e` fix is correct; CI omits lint correctly)

## Fix Status

- Total findings: 48 (after corrections: 46 actionable — 1 false positive dismissed, 1 duplicate removed)
- Fixed: 0 / 46
- Remaining: 46

## Confirmed Fix Plan (Phase 6 Output)

All 6 groups confirmed by user. ~46 actionable findings to fix, 1 dismissed (run-test false positive).

### Group 1: CI/CD (3 findings — fix all)
- [x] CRITICAL — Create `.github/workflows/ci.yml`: runs `bun install --frozen-lockfile`, `bun tsgo`, `bun biome:check`, `bun run test`, `bun run build` on `push` + `pull_request`. **Must NOT run `bun run lint` directly** (lint-queue rule). Exclude migration paths.
- [x] CRITICAL — Gate `migrate-production.yml` on CI passing (`needs: ci` job dependency) or document branch-protection reliance.
- [x] SUGGESTION — Pin Bun version in `setup-bun` step of migrate-production.yml for reproducibility.

### Group 2: package.json build/scripts (5 findings — fix all)
- [x] CRITICAL — Remove `lint` script entry (lines 13).
- [x] CRITICAL — Remove `lint:perf` script entry (line 14).
- [x] WARNING — Replace `node -e "..."` with `bun -e "..."` in `postinstall` (line 44).
- [x] SUGGESTION — Remove duplicate `typecheck` script (line 19); keep `tsgo` (line 20).
- [x] SUGGESTION+ESCALATED WARNING — Remove broken `dev:full` script (line 9) referencing non-existent `../scripts/dev.sh`.
- [x] SUGGESTION+ESCALATED WARNING — `lint-staged` (line 247): remove direct `eslint --fix`; route via lint-queue-client if pre-commit lint is wanted, OR drop lint from pre-commit and rely on `bun quality-gate` in CI.

### Group 3: Missing files (investigated — 1 fix, 1 dismissed)
- [x] CRITICAL — `scripts/safe-dev.ts`: investigated; file genuinely absent; `dev:safe` currently hard-fails. **Action: CREATE `scripts/safe-dev.ts`** with this spec:
  1. Env validation before launch (import `ensureEnvironmentValidated` from `@/backend/lib/env`) — fail fast with clear message if required secrets missing
  2. DB readiness / pending-migration probe (reuse `assessDestructiveDbCommandSafety` from `scripts/lib/destructiveDbGuard` to refuse start in cloud/prod)
  3. Auto-start lint queue server (`bun run scripts/lint-queue-server.ts` as background child if `http://localhost:4777/status` is not already listening), forward logs
  4. Shell to `next dev --turbopack -p 3000` (pull host/port defaults from existing `dev` script package.json line) with `stdio: "inherit"`, propagate exit code, kill lint-queue child on SIGINT/SIGTERM
  5. Logging via `logger` from `@/backend/lib/logger` (NEVER `console.*`); `@/*` imports
  6. No external deps — self-contained
- [x] WARNING — `middleware.ts`: investigated; **DISMISSED as false positive**. Next.js 16 renames `middleware.ts` to `proxy.ts`. Root `proxy.ts` ALREADY exists and correctly imports `createMiddleware` from `next-intl/middleware`, calls `createMiddleware(routing)` with `routing` from `@/shared/i18n/routing`, exports default `proxy` function + `config.matcher = ["/((?!api|_next|_vercel|.*\\..*).*)"]` + injects CSP/nonce/x-pathname. No action needed.

### Group 4: Env / security (27 findings — phased approach)

**Phase 4a — Immediate CRITICAL fix (drizzleDb.ts logger leak):**
- [x] CRITICAL — `backend/db/drizzleDb.ts`: (1) Remove the `process.env.DATABASE_URL.substring(0,20)` log entirely; (2) Migrate all 5 `logger.log(...)` calls (lines 30-34) to `logger.debug(...)` per AGENTS.md logger API; (3) If DB URL logging is genuinely needed, use `sanitizeUrlCredentials` (already imported in `env.ts:4`) instead of fragile substring truncation.
- [x] WARNING — Remove duplicate finding citing `custom-types.ts:31` (the log is actually in `drizzleDb.ts:31`).

**Phase 4b — Expand env.ts:**
- [x] SUGGESTION — `backend/lib/env.ts`: expand `EnvironmentConfig` interface to include all app-wide env vars: `DATABASE_ENCRYPTION_KEY`, `ADMIN_PASSWORD`, `STORAGE_PROVIDER`, `GCP_PROJECT_ID`, `GCP_SECRET_ID`, `GCP_SECRET_VERSION`, `GCP_CREDENTIALS_JSON`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `BLOB_READ_WRITE_TOKEN`, `SMS_PROVIDER`, `EMAIL_PROVIDER`, `PUSH_PROVIDER`, `SIGNED_URL_CLEANUP_STRATEGY`, `LOCAL_STORAGE_PATH`, `NEXT_PUBLIC_BASE_URL`, `DISABLE_RATE_LIMITING`, `IS_DEMO`, `DB_CONNECTION_MODE`, `DB_PROVIDER`.
- [x] SUGGESTION — `backend/lib/env.ts`: expand `validateNoPlaceholderSecrets` to cover `RESEND_API_KEY`, `FIREBASE_PRIVATE_KEY`, `TWILIO_AUTH_TOKEN`, `GCP_CREDENTIALS_JSON`, `BLOB_READ_WRITE_TOKEN`.
- [x] WARNING — `backend/lib/env.ts`: add `getBooleanEnv(name)` helper returning typed boolean (for `DISABLE_RATE_LIMITING`, `IS_DEMO`, `CLEANUP_ENABLED`).
- [x] WARNING+ESCALATED — `shared/demo-users.ts:15` and `backend/db/seeds/seed-users.ts:26`: centralize `Seed_Pass1!` fallback to a single constant in `shared/demo-users.ts`, AND add production guard: `if (process.env.NODE_ENV === "production") throw new Error("Default seed password must not run in production")`.

**Phase 4c — Route process.env reads through env.ts (~22 files):**
- [x] WARNING — Convert function-call-time `process.env.X` reads to env.ts getters in: `backend/db/factory.ts:67`, `backend/db/drizzleDb.ts:20`, `backend/db/repo/session.repository.ts:28`, `backend/services/cache/CacheServiceFactory.ts:24`, `backend/services/redis/RedisServiceFactory.ts:14`, `backend/services/communication/channels/sms/SmsChannelFactory.ts:8`, `backend/services/communication/channels/email/EmailChannelFactory.ts:8`, `backend/services/communication/channels/push/PushChannelFactory.ts:8`, `backend/storage/storage.service.ts:20`, `backend/storage/disk/shared/upload-operations.helper.ts:27`, `backend/storage/disk/gcp-auth.ts:6`, `backend/storage/disk/vercel/adapter.ts:9`, `backend/services/communication/channels/sms/twilio/TwilioSmsAdapter.ts:16`, `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts:13`, `backend/services/communication/channels/push/fcm/FcmPushAdapter.ts:18`, `shared/demo-users.ts:17`, `app/api/storage/cleanup/route.ts:24`, `backend/db/seeds/lib/admin-user.ts:4`, `app/api/logs/route.ts:32`, `backend/lib/storage/local-storage-path.ts:6`, `backend/lib/server.ts:36`, `backend/lib/ratelimit.ts:206`, `backend/lib/auth/cookies.ts:12`, `backend/graphql/mutation/auth.mutation.ts:236`, `app/[locale]/(auth)/login/page.tsx:8`.

**Phase 4d — Module-load-time reads (CRITICAL-implementation-order, escalated):**
- [x] WARNING+ESCALATED CRITICAL — `backend/db/schema/custom-types.ts:5` (`DATABASE_ENCRYPTION_KEY`), `backend/lib/auth/jwt.ts:4` (`JWT_SECRET`), `backend/lib/auth/session-hash.ts:8` (`JWT_SECRET`): these read at module import, before `ensureEnvironmentValidated()`. SOLUTION: force eager env.ts initialization at app boot (call `ensureEnvironmentValidated()` from `app/layout.tsx` server entry or a top-of-file eager import in `drizzleDb.ts`), AND convert the reads to env.ts getters.

**Phase 4e — Dev-origin config + gitignore consolidation:**
- [x] SUGGESTION — `next.config.ts:18`: replace hardcoded private IP in `allowedDevOrigins` with `process.env.DEV_ORIGIN` (or env.ts getter).
- [x] SUGGESTION — `.gitignore`: consolidate duplicate `.env*`, `.eslintcache`, `.scannerwork` entries (lines 34-35 / 65-66, 46 / 73).

### Group 5: App Router / i18n (2+2 findings — fix all with path-only href note)
- [x] WARNING — `app/[locale]/(dashboard)/students/new/page.tsx:22`: replace raw `redirect()` from `next/navigation` with i18n-aware `redirect({ href: "/students/onboarding", locale })` from `@/shared/i18n/routing`. **CRITICAL**: with `localePrefix:"never"`, `href` MUST be PATH-ONLY (no `/${locale}` prefix); locale passed as separate arg.
- [x] WARNING — `app/[locale]/(dashboard)/students/[id]/page.tsx:5`: same fix — switch to `redirect({ href: "/students/{id}/status", locale })` with path-only href. (Cleans up the SUGGESTION about locale-prefixed path at the same time.)
- [x] SUGGESTION — `app/[locale]/(dashboard)/complaints/page.tsx:21`: add explicit `return` after `redirect({ href: "/", locale })` in catch block (per project convention).

### Group 6: TS Config & polish (3 valid findings — 1 dismissed)
- [ ] WARNING — `tsconfig.json:22`: enabling `"noUncheckedIndexedAccess": true` is **DEFERRED** — surfaced a large blast radius (~40+ type errors in `backend/db/repo/*.repository.ts` files where `findFirst` returning `T | undefined` plus `arr[0]` patterns need nullable handling). The fix is a separate multi-day repo-wide refactor. Document as follow-up. Kept `"strict": true` (existing).
- [x] SUGGESTION — `tsconfig.json:49`: KEEP current `exclude` of `draft` and `**/unRefactored_tests` (confirmed intentional).
- [x] SUGGESTION — `bunfig.toml:3`: scope happydom preload to UI test path only — either split into `[test]` scope by path OR add a separate preload for backend DB tests that does NOT load happydom.
- [ ] SUGGESTION (DISMISSED — FALSE POSITIVE) — `scripts/run-test/run-test.ts:56`: NO FIX. The `--feedback` / `--context` / `--list-feedback` flags ARE documented in `run-test.ts --help`, `parseArgs()`, `README.md`, and `scripts/run-test/AGENTS.md`. Root AGENTS.md is a high-level summary, not exhaustive — its omission is not a defect.

### Group: `.env.local` workspace secret
- [ ] REVIEW-ONLY — `.env.local:1` real Vercel OIDC token on disk (gitignored). NOT a code fix. Recommendation to user: rotate the token if it has been exposed outside the workspace.

## Final Fix Plan Summary

- **Total actionable findings**: 46 (after corrections, dismissals, and de-duplication)
- **Implemented**: 44 fix items across 6 groups
- **Skipped/Dismissed**: 1 false positive (run-test flags)
- **Deferred**: 1 (`noUncheckedIndexedAccess` — requires multi-day repo-wide nullable refactor, too broad for this config review scope; documented as follow-up for a dedicated effort)
- **Review-only**: 1 (`.env.local` secret rotation — workspace hygiene)
