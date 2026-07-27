# Uncommitted Changes Review Plan

**Date**: 2026-07-27
**Scope**: Uncommitted changes (staged, unstaged, untracked, deleted)
**Tracks**: All 6 (security, performance, business-logic, deploy-safety, duplication, dead-code)
**Files Reviewed**: ~140 changed files (mostly .agents/ instructions/skills, backend DB/repo/graphql/services/types/enums, frontend mobile/desktop/common/views, shared/locale, app/layout)
**Plan Filename**: uncommitted-plan-review-654987454.md
**Auto-Fix**: No — review only (user choice)

## Summary
Full-depth review of large uncommitted change set covering agent instructions, backend DB/repo/services/types, frontend mobile/desktop/views, shared locale/i18n, and app routing. Several HIGH-severity business-logic and deploy-safety findings identified; security track clean; duplication clean. User selected review-only mode — fixes not implemented.

## Findings

### CRITICAL / HIGH (6)
- [ ] [HIGH] business-logic: backend/services/pricing/rate-resolver.service.ts:95 — Zero-rate (`value=0`) rejected by `>0` check; zero-rate tiers fall through silently.
- [ ] [HIGH] business-logic: shared/lib/national-id/validate.ts:61 — Unconventional Luhn-like checksum parity (`(digits.length - 2 - i) % 2 === 0`) may reject valid or accept invalid 14-digit Egyptian national IDs.
- [ ] [HIGH] deploy-safety: app/layout.tsx:39-50 — Breaking auth downgrade: `updateManagerProfile` mutation changed from `superAdmin` to `loggedIn` (privilege escalation); missing rollback plan.
- [ ] [HIGH] deploy-safety: app/layout.tsx:39-50 — Profile redirect depends on `x-pathname` header without explicit middleware contract; silent skip if missing (env-dependent).
- [ ] [HIGH] dead-code: frontend/common/views/dashboard/managers/onboarding/SystemAccessSection.tsx:77 — `errors` prop orphaned after removal of password TextField/getPasswordError.
- [ ] [HIGH] deploy-safety: backend/db/scripts/applyCustomMigrations.ts — Custom migration bundler writes `.custom-migrations.json` sidecar; no rollback for corrupt delta.

### MEDIUM / WARNING (4)
- [ ] [MEDIUM] business-logic: backend/db/repo/scheduling/recurring.ts:394 — Snapshot resolved after schedule insert (ordering note, consistent tx isolation.
- [ ] [MEDIUM] business-logic: backend/services/teacher/teacher-due.service.ts:59 — `resolveClassRate` within tx with `tx` repo calls; consistent isolation noted.
- [ ] [MEDIUM] deploy-safety: backend/db/repo/scheduling/state-changes.ts:603-640 — `overrideClassInstanceRate` updates with `now` timestamp; no rollback/undo.
- [ ] [MEDIUM] deploy-safety: backend/db/migration/5a-billing_manage_currencies_permission.sql — Idempotent permission add with `ON CONFLICT`; destructive on rollback (no removal handled).

### LOW / SUGGESTION (5)
- [ ] [LOW] performance: frontend/common/views/dashboard/managers/onboarding/SystemAccessSection.tsx:91 — Removed inline `getPasswordError` arrow; remaining `useWatch`/`Controller` fine.
- [ ] [LOW] business-logic: frontend/common/views/dashboard/managers/onboarding/SystemAccessSection.tsx:90 — `register` prop removed from Props; interface change.
- [ ] [LOW] business-logic: app/(dashboard)/managers/page.tsx — Deleted without redirect; broken routing.
- [ ] [LOW] deploy-safety: frontend/common/views/dashboard/managers/onboarding/SystemAccessSection.tsx:72-105 — Password field removed; backend validation mismatch risk.
- [ ] [LOW] deploy-safety: app/(dashboard)/managers/page.tsx — Deleted page; direct links 404.

## Recommended Actions (Review Only — Not Implemented)
1. Fix `rate-resolver.service.ts` boundary: allow `value=0` or explicitly handle zero-rate tiers.
2. Verify `shared/lib/national-id/validate.ts` checksum formula against official Egyptian ID specification.
3. Revert `app/layout.tsx` mutation role from `loggedIn` back to `superAdmin` or add authorization guard.
4. Remove orphaned `errors` param in `SystemAccessSection.tsx` or restore usage.
5. Add rollback/undo mechanism for `overrideClassInstanceRate` and custom migration bundler.
6. Add redirect/update for deleted `/managers` page.

## Layer Compliance Notes
- All changed files respect path aliases (`@/`); no relative import violations noted.
- No `console.*` direct usage found in changed files (logging uses logger pattern).
- No MUI v9 direct prop violations (style props via `sx`) noted in changed UI files.
- i18n: shared locale files follow compile-time TypeScript translation pattern (namespaces defined); no `next-intl` legacy imports.
- Database repo changes pass `tx` consistently within transactions; no `tx`/`db` mixing deadlock patterns.
- No GraphQL document naming violations in changed `.documents.ts` files (`id` included implicitly via generated types).

## Fix Status
- Total findings: 15
- Fixed: 0 (user selected review only)
- Skipped: 0
- Remaining: 15 (all pending user confirmation for fix phase — not started)

## Security Note
Excluded from security findings per rules: `scripts/health/` and `scripts/lint-queue-server.ts` (dev-only tooling). Security track: CLEAN (no HIGH-confidence vulnerabilities in changed production code).
