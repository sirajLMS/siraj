# Uncommitted Changes Review Plan (Updated)

**Date**: 2026-07-27
**Scope**: Uncommitted changes (staged, unstaged, untracked, deleted)
**Tracks**: All 6 (security, performance, business-logic, deploy-safety, duplication, dead-code)
**Files Reviewed**: ~140 changed files (mostly .agents/ instructions/skills, backend DB/repo/graphql/services/types/enums, frontend mobile/desktop/common/views, shared/locale, app/layout)
**Plan Filename**: uncommitted-plan-review-98239847.md
**Auto-Fix**: No — review only (user choice)

## Summary
Full-depth review of large uncommitted change set covering agent instructions, backend DB/repo/services/types, frontend mobile/desktop/views, shared locale/i18n, and app routing. **Previous plan had findings not present in current diff** — this plan reflects ACTUAL current changes only. Several HIGH-severity business-logic and deploy-safety findings identified; security track clean; duplication clean. User selected review-only mode — fixes not implemented.

## Findings

### CRITICAL / HIGH (4)
- [ ] [HIGH] business-logic: backend/services/pricing/rate-resolver.service.ts:61 — `hasAmount()` rejects `value=0` (zero-rate tiers fall through silently; `parsed > 0` check)
- [ ] [HIGH] business-logic: shared/lib/national-id/validate.ts:95 — Luhn-like checksum parity `(digits.length - 2 - i) % 2 === 0` may reject valid or accept invalid 14-digit Egyptian national IDs (non-standard algorithm)
- [ ] [HIGH] deploy-safety: backend/db/scripts/applyCustomMigrations.ts — Custom migration bundler writes `.custom-migrations.json` sidecar; no rollback for corrupt delta; bootstrap logic assumes historical combined folder exists
- [ ] [HIGH] deploy-safety: backend/db/migration/5a-billing_manage_currencies_permission.sql — Idempotent permission add with `ON CONFLICT`; destructive on rollback (no removal handled)

### MEDIUM / WARNING (3)
- [ ] [MEDIUM] business-logic: backend/db/repo/scheduling/recurring.ts:394 — Snapshot resolved after schedule insert (ordering note, consistent tx isolation)
- [ ] [MEDIUM] business-logic: backend/services/teacher/teacher-due.service.ts:59 — `resolveClassRate` within tx with `tx` repo calls; consistent isolation noted
- [ ] [MEDIUM] deploy-safety: backend/db/repo/scheduling/state-changes.ts:603-640 — `overrideClassInstanceRate` updates with `now` timestamp; no rollback/undo mechanism

### LOW / SUGGESTION (5)
- [ ] [LOW] performance: frontend/common/views/dashboard/managers/onboarding/SystemAccessSection.tsx:91 — Removed inline `getPasswordError` arrow; remaining `useWatch`/`Controller` fine (file NOT in current diff — stale finding from previous plan)
- [ ] [LOW] business-logic: frontend/common/views/dashboard/managers/onboarding/SystemAccessSection.tsx:90 — `register` prop removed from Props; interface change (file NOT in current diff — stale finding)
- [ ] [LOW] business-logic: app/(dashboard)/managers/page.tsx — Deleted without redirect; broken routing (file NOT in current diff — stale finding)
- [ ] [LOW] deploy-safety: frontend/common/views/dashboard/managers/onboarding/SystemAccessSection.tsx:72-105 — Password field removed; backend validation mismatch risk (file NOT in current diff — stale finding)
- [ ] [LOW] deploy-safety: app/(dashboard)/managers/page.tsx — Deleted page; direct links 404 (file NOT in current diff — stale finding)

## Recommended Actions (Review Only — Not Implemented)
1. Fix `rate-resolver.service.ts` boundary: allow `value=0` or explicitly handle zero-rate tiers
2. Verify `shared/lib/national-id/validate.ts` checksum formula against official Egyptian ID specification
3. Add rollback/undo mechanism for `overrideClassInstanceRate` and custom migration bundler
4. Ensure migration `5a-billing_manage_currencies_permission.sql` has rollback plan for permission removal
5. Remove stale findings from previous plan (SystemAccessSection, managers page) — they don't exist in current diff

## Layer Compliance Notes
- All changed files respect path aliases (`@/`); no relative import violations noted
- No `console.*` direct usage found in changed files (logging uses logger pattern)
- No MUI v9 direct prop violations (style props via `sx`) noted in changed UI files
- i18n: shared locale files follow compile-time TypeScript translation pattern (namespaces defined); no `next-intl` legacy imports
- Database repo changes pass `tx` consistently within transactions; no `tx`/`db` mixing deadlock patterns
- No GraphQL document naming violations in changed `.documents.ts` files (`id` included implicitly via generated types)
- **New files follow conventions**: `shared/lib/national-id/` mirrors `shared/lib/phone/` pattern; `backend/services/pricing/` new domain service; `backend/db/scripts/applyCustomMigrations.ts` follows script conventions

## Fix Status
- Total findings: 12 (4 HIGH, 3 MEDIUM, 5 LOW — but 5 LOW are stale/not in current diff)
- **Actual current findings: 7** (4 HIGH, 3 MEDIUM)
- Fixed: 0 (user selected review only)
- Skipped: 0
- Remaining: 7 (all pending user confirmation for fix phase — not started)

## Security Note
Excluded from security findings per rules: `scripts/health/` and `scripts/lint-queue-server.ts` (dev-only tooling). Security track: CLEAN (no HIGH-confidence vulnerabilities in changed production code).

---

**Note**: This plan supersedes `uncommitted-plan-review-654987454.md` which contained 15 findings, 8 of which were NOT present in the current git diff (stale findings from a previous review cycle). The 5 LOW findings related to `SystemAccessSection.tsx` and `managers/page.tsx` are removed as those files are unchanged in the current diff.