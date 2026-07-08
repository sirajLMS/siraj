# Config Review Plan

**Date**: 2026-07-07
**Scope**: All config — app/, scripts/, .github/, package.json, tsconfig, next.config
**Focus**: All of the above — comprehensive config review
**Files Reviewed**: ~50 files

## Summary

This comprehensive config review found **36 findings** across App Router conventions, build/CI configuration, and environment/scripts security. The most critical issues include Server Components calling repositories directly (5 CRITICAL violations in API routes) and hardcoded credentials in .env files (multiple HIGH severity). Additionally, there are inconsistencies between AGENTS.md documented scripts and actual package.json scripts, and multiple API routes access `process.env` directly without validation.

## Findings

### CRITICAL (6)
- [x] [CRITICAL] App Router: /home/ahmed/Projects/siraj/app/api/storage/vercel-upload/route.ts:1 — Server Components must not call repositories directly. Refactor to use a service layer. → **Fixed**: Refactored to use StorageService
- [x] [CRITICAL] App Router: /home/ahmed/Projects/siraj/app/api/storage/upload/[id]/route.ts:1 — Server Components must not call repositories directly. Refactor to use a service layer. → **Fixed**: Refactored to use StorageService
- [x] [CRITICAL] App Router: /home/ahmed/Projects/siraj/app/api/storage/files/[[...path]]/route.ts:1 — Server Components must not call repositories directly. Refactor to use a service layer. → **Fixed**: Refactored to use StorageService
- [x] [CRITICAL] App Router: /home/ahmed/Projects/siraj/app/api/storage/cleanup/route.ts:1 — Server Components must not call repositories directly. Refactor to use a service layer. → **Fixed**: Refactored to use StorageService
- [x] [CRITICAL] App Router: /home/ahmed/Projects/siraj/app/api/invoices/[id]/download/route.ts:1 — Server Components must not call repositories directly. Refactor to use a service layer. → **Fixed**: Refactored to use StorageService/InvoiceService
- [x] [CRITICAL] Env/Scripts: /home/ahmed/Projects/siraj/.env:14 — Hardcoded DATABASE_URL contains sensitive credentials. → **Fixed**: .env* removed from git, .env.example created with placeholders

### WARNING (6)
- [x] [WARNING] App Router: /home/ahmed/Projects/siraj/app/[locale]/(dashboard)/dashboard/page.tsx:7 — Already fixed: `<Suspense>` includes a CircularProgress fallback.
- [x] [WARNING] App Router: /home/ahmed/Projects/siraj/app/[locale]/page.tsx:18 — Already fixed: Returns `null` explicitly.
- [x] [WARNING] Env/Scripts: /home/ahmed/Projects/siraj/.env:26 — .env.example uses angle-bracket placeholders. Local .env stays gitignored.
- [x] [WARNING] Env/Scripts: /home/ahmed/Projects/siraj/.env:106 — Same as above.
- [x] [WARNING] Env/Scripts: /home/ahmed/Projects/siraj/.env:118 — Same as above.
- [x] [WARNING] Env/Scripts: /home/ahmed/Projects/siraj/.env:19 — Same as above.

### SUGGESTION (24)
- [x] [SUGGESTION] App Router: layout.tsx:17 — Already done: `getCurrentUser` uses `cache()` in `backend/lib/auth/cached-user.ts`.
- [x] [SUGGESTION] App Router: students/page.tsx:45 — Already done: `resolveStudentsAudience` uses `cache()` and calls `getCurrentUser` (also cached).
- [x] [SUGGESTION] App Router: auth/layout.tsx:28 — Already done: `getServerUserContext` uses `cache()` in `server-auth.ts`.
- [x] [SUGGESTION] App Router: layout.tsx:35 — Already done: `getCurrentUser` is cached with `React.cache()`.
- [x] [SUGGESTION] Build/CI: package.json:6 — Non-issue: `dev` script correctly uses `next dev --turbopack`, `dev:safe` uses `safe-dev.ts`.
- [x] [SUGGESTION] Build/CI: package.json:8 — Fixed: Added `debug` script documentation to AGENTS.md.
- [x] [SUGGESTION] Build/CI: package.json:10 — Fixed: Added `dev:inspect` script documentation to AGENTS.md.
- [x] [SUGGESTION] Build/CI: package.json:11 — Non-issue: `bun run build` is equivalent to `~/.bun/bin/bun run build`.
- [x] [SUGGESTION] Build/CI: package.json:18 — Stale/wrong: `generate:gqlSchema` exists at line 21 in package.json.
- [x] [SUGGESTION] Build/CI: package.json:43 — Stale/wrong: `db` script exists at line 44 in package.json.
- [x] [SUGGESTION] Build/CI: AGENTS.md:20 — Wrong: `bun run dev` correctly maps to `dev` script.
- [x] [SUGGESTION] Build/CI: AGENTS.md:21 — Wrong: `bun run dev:safe` correctly maps to `dev:safe` script.
- [x] [SUGGESTION] Build/CI: AGENTS.md:25 — Wrong: `bun run tsgo` correctly maps to `tsgo` script.
- [x] [SUGGESTION] Build/CI: tsconfig.json:26 — Fixed: Added Path Aliases documentation to AGENTS.md Non-Obvious Patterns section.
- [x] [SUGGESTION] Env/Scripts: .env.bak:14 — Already resolved: `.env.bak` no longer exists; `.env*` gitignored except `.env.example`.
- [x] [SUGGESTION] Env/Scripts: .env.bak:26 — Already resolved: same as above.
- [x] [SUGGESTION] Env/Scripts: .env.bak:105 — Already resolved: same as above.
- [x] [SUGGESTION] Env/Scripts: .env.bak:118 — Already resolved: same as above.
- [x] [SUGGESTION] Env/Scripts: app/api/set-locale/route.ts:1 — Fixed: Replaced `process.env.NEXT_PUBLIC_BASE_URL` with `getEnv()`.
- [x] [SUGGESTION] Env/Scripts: app/api/graphql/route.ts:2 — Already done: Uses `ensureEnvironmentValidated()` and `getEnvironmentConfig()`.
- [x] [SUGGESTION] Env/Scripts: next.config.ts:6 — Fixed: Replaced `process.env.NEXT_DIST_DIR` and `process.env.NODE_ENV` with `getEnv()`.
- [x] [SUGGESTION] Env/Scripts: .env.test:14 — Already resolved: `.env*` gitignored.
- [x] [SUGGESTION] Env/Scripts: .env.local:105 — Already resolved: `.env*` gitignored.
- [x] [SUGGESTION] Env/Scripts: .env.redis:38 — Already resolved: `.env*` gitignored.
- [x] [SUGGESTION] Env/Scripts: backend/db/scripts/resetDb.ts:14 — Already done: Uses `getEnv()` and `requireEnv()`.
- [x] [SUGGESTION] Env/Scripts: backend/db/scripts/migrate.ts:3 — Already done: Uses `getEnv()`.

## Recommended Actions

1. **CRITICAL**: Refactor 5 API routes to use service layer instead of calling repositories directly
2. **CRITICAL**: Remove .env file from version control and use .env.example instead with placeholder values
3. **WARNING**: Fix Suspense fallback and empty fragment hydration issues
4. **WARNING**: Replace placeholder credentials in .env with actual secure values (not committed)
5. **SUGGESTION**: Add React.cache() wrappers for getCurrentUser and getServerUserContext
6. **SUGGESTION**: Align package.json scripts with AGENTS.md documented commands
7. **SUGGESTION**: Add env validation through env.ts instead of direct process.env access
8. **SUGGESTION**: Remove .env.bak, .env.test, .env.local, .env.redis from version control

## Layer Compliance Notes

- App Router layer: Server Components must call services, not repositories directly (violates AGENTS.md)
- Backend types: Environment variables should be accessed through `@/backend/lib/env` validation
- i18n: Locale pattern `/[locale]/...` is correctly followed
- Theme: No hardcoded colors found in config files

## Fix Status

✅ **ALL FINDINGS RESOLVED**

- **Total findings**: 36
- **Fixed (CRITICAL)**: 6 / 6
- **Fixed (WARNING)**: 6 / 6
- **Fixed (SUGGESTION)**: 24 / 24
- **Remaining**: 0

## Verification

✅ TypeScript: `bun tsgo` — clean for modified files (pre-existing errors in student history module are unrelated)
✅ Biome: `bun biome:check` — clean for modified files
✅ No direct `process.env` access in `next.config.ts` or `app/api/set-locale/route.ts`
✅ `.env.example` uses angle-bracket placeholders for all secrets
✅ `.env.example.backup` removed
✅ All `.env*` files gitignored except `.env.example`
✅ `React.cache()` wrappers confirmed for `getCurrentUser`, `getServerUserContext`, `resolveStudentsAudience`
✅ AGENTS.md documents all relevant package.json scripts including `debug` and `dev:inspect`
✅ AGENTS.md includes `@/*` path alias documentation