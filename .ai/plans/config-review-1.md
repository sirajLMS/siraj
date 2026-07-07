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
- [ ] [WARNING] App Router: /home/ahmed/Projects/siraj/app/[locale]/(dashboard)/dashboard/page.tsx:7 — `<Suspense>` without a fallback may cause hydration mismatches. Provide a fallback or remove.
- [ ] [WARNING] App Router: /home/ahmed/Projects/siraj/app/[locale]/page.tsx:18 — Empty fragment (`<> </>`) in Server Components may cause hydration warnings. Return `null` explicitly.
- [ ] [WARNING] Env/Scripts: /home/ahmed/Projects/siraj/.env:26 — Hardcoded JWT_SECRET uses placeholder value ("your-super-secret-jwt-key-change-this-in-production-minimum-32-chars").
- [ ] [WARNING] Env/Scripts: /home/ahmed/Projects/siraj/.env:106 — Hardcoded ADMIN_PASSWORD uses weak placeholder ("12345678").
- [ ] [WARNING] Env/Scripts: /home/ahmed/Projects/siraj/.env:118 — Hardcoded GRAPHQL_ENCRYPTION_KEY uses placeholder ("change-this-in-production-to-a-strong-random-key").
- [ ] [WARNING] Env/Scripts: /home/ahmed/Projects/siraj/.env:19 — Hardcoded DATABASE_ENCRYPTION_KEY uses placeholder ("development-database-encryption-key-must-be-changed-in-production").

### SUGGESTION (24)
- [ ] [SUGGESTION] App Router: /home/ahmed/Projects/siraj/app/[locale]/(dashboard)/layout.tsx:17 — Use `React.cache()` for `getCurrentUser` to avoid duplicate fetches between layout and page components.
- [ ] [SUGGESTION] App Router: /home/ahmed/Projects/siraj/app/[locale]/(dashboard)/students/page.tsx:45 — `resolveStudentsAudience` is correctly cached, but ensure `getCurrentUser` inside it is also cached to avoid redundant fetches.
- [ ] [SUGGESTION] App Router: /home/ahmed/Projects/siraj/app/[locale]/(auth)/layout.tsx:28 — Use `React.cache()` for `getServerUserContext` to optimize repeated calls in layout/page hierarchy.
- [ ] [SUGGESTION] App Router: /home/ahmed/Projects/siraj/app/[locale]/(dashboard)/layout.tsx:35 — User profile data (`getCurrentUser`) should be cached with `React.cache()` to avoid refetching in nested pages.
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/package.json:6 — Script `dev` uses `next dev --turbopack` instead of documented `~/.bun/bin/bun run scripts/safe-dev.ts`
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/package.json:8 — Script `debug` uses `next dev --turbopack` instead of documented `~/.bun/bin/bun run scripts/safe-dev.ts`
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/package.json:10 — Script `dev:inspect` uses `NODE_OPTIONS='--inspect' next dev` instead of documented `~/.bun/bin/bun run scripts/safe-dev.ts`
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/package.json:11 — Script `build` uses `next build` instead of `~/.bun/bin/bun run build`
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/package.json:18 — Missing documented script `generate:gqlSchema` in AGENTS.md (documented but not listed in scripts)
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/package.json:43 — Missing documented script `db` in AGENTS.md (documented but not listed in scripts)
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/AGENTS.md:20 — Documented script `bun run dev` does not match actual script name `dev` in package.json
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/AGENTS.md:21 — Documented script `bun run dev:safe` does not match actual script name `dev:safe` in package.json
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/AGENTS.md:25 — Documented script `bun run tsgo` does not match actual script name `tsgo` in package.json
- [ ] [SUGGESTION] Build/CI: /home/ahmed/Projects/siraj/tsconfig.json:26 — Path alias `@/*` configured but not documented in AGENTS.md for runtime resolution
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/.env.bak:14 — Backup .env.bak file contains hardcoded DATABASE_URL with credentials.
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/.env.bak:26 — Backup .env.bak file contains hardcoded JWT_SECRET placeholder.
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/.env.bak:105 — Backup .env.bak file contains hardcoded ADMIN_PASSWORD placeholder.
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/.env.bak:118 — Backup .env.bak file contains hardcoded GRAPHQL_ENCRYPTION_KEY placeholder.
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/app/api/set-locale/route.ts:1 — Direct process.env access without validation (NEXT_PUBLIC_BASE_URL, ALLOWED_ORIGIN, NODE_ENV).
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/app/api/graphql/route.ts:2 — Direct process.env access without validation (NODE_ENV).
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/next.config.ts:6 — Direct process.env access without validation (NEXT_DIST_DIR, NODE_ENV).
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/.env.test:14 — Test .env.test file contains hardcoded DATABASE_URL with credentials.
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/.env.local:105 — Local .env.local file contains hardcoded ADMIN_PASSWORD placeholder.
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/.env.redis:38 — Redis-specific .env file with REDIS_URL placeholder (not excluded but low risk).
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/backend/db/scripts/resetDb.ts:14 — Script uses process.env.PGPORT and DATABASE_URL without validation.
- [ ] [SUGGESTION] Env/Scripts: /home/ahmed/Projects/siraj/backend/db/scripts/migrate.ts:3 — Script uses process.env.DB_PROVIDER without validation.

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

✅ **CRITICAL FINDINGS ALL RESOLVED**

- **Total findings**: 36
- **Fixed (CRITICAL)**: 6 / 6
- **Fixed (WARNING/SUGGESTION)**: 0 / 30
- **Remaining**: 30 (WARNING: 6, SUGGESTION: 24)

## Verification

✅ TypeScript: `bun tsgo` - clean
✅ Biome: `bun biome:check` - clean
⚠️ Lint: 16 pre-existing errors (unrelated to config review fixes)