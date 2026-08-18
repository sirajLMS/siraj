# Uncommitted Changes Review Plan

**Date**: 2026-08-18
**Scope**: Uncommitted changes (staged, unstaged, untracked)
**Tracks**: All 6 (security, performance, business-logic, deploy-safety, duplication, dead-code)
**Files Reviewed**: 262 changed files (253 modified, 7 added, 2 deleted)
**Review Mode**: Review-only (no auto-fix, no commit) — per user's standing constraint

## Summary

Review of 262 uncommitted files across 6 parallel tracks. 4 tracks returned CLEAN (security, performance, deploy-safety, dead-code). 2 tracks found 5 total findings: 1 CRITICAL (duplication drift risk), 2 WARNING (duplication), 2 SUGGESTION (business-logic behavior changes). All findings are in files modified during this session's work.

## Findings

### CRITICAL (1)
- [ ] [CRITICAL] duplication: backend/graphql/mutation/auth/auth.mutation.ts:288 — Inlined `checkRateLimit(ipAddress, authRateLimiter)` + `throw GraphQLError(tErrors.auth.tooManyLoginAttempts, { code: "TOO_MANY_ATTEMPTS" })` at lines 288-294 (demoLogin) and 330-335 (refreshToken) duplicates the body of `requireAuthWithRateLimit` helper (auth-rate-limit.ts:12-22) which the same file already calls at line 419 (changePassword). Three near-identical rate-limit blocks drift from the authoritative helper.
  → Fix: Replace inline rate-limit blocks at lines 288-294 and 330-335 with calls to a new `checkAuthRateLimit(ctx)` helper (variant of `requireAuthWithRateLimit` that does NOT require auth — for login/refresh endpoints where there is no session yet). Or export a `checkRateLimitAndThrow(ctx)` from auth-rate-limit.ts that encapsulates the check-throw pattern without requiring auth.

### WARNING (2)
- [ ] [WARNING] duplication: frontend/common/views/dashboard/staff/home/ManagerRowActions.tsx:59 — `activateConfirmSx` is byte-identical to `reactivateConfirmSx` in ParentAccountActions.tsx:14 (same `py:1.5` + `palette.success/onSuccess/hover`), and near-copy of `warningConfirmSx` in LiveSessionToolbar.tsx:176. Copy-paste with palette rename only.
  → Fix: Extract a `createConfirmSx(paletteKey)` helper or extend BaseDeleteDialog's `confirmColor` prop to accept palette keys.

- [ ] [WARNING] duplication: frontend/common/views/dashboard/profile/parent/ParentAccountActions.tsx:14 — `reactivateConfirmSx` duplicates the success-palette `confirmSx` block already in committed `ProviderSettingsSection.tsx:136` (which uses `primary`), creating drift risk across BaseDeleteDialog consumers that inline the same `py:1.5 / backgroundColor / color / &:hover` shape.
  → Fix: Same as above — extract shared `createConfirmSx` helper.

### SUGGESTION (2)
- [ ] [SUGGESTION] business-logic: backend/services/profile/profile.service.ts:633 — `toIanaTimezone` silently substitutes `IanaTimezone.UTC` for invalid/null `user.timezone`, replacing `parseIanaTimezoneOrNull` which returned `null`. The `UnifiedProfileReturnType.timezone` field is typed `IanaTimezone | null`, so clients can no longer distinguish "no timezone configured" from "explicitly UTC" (silent fallback masks unset timezone data).
  → Fix: Use `parseIanaTimezoneOrNull` for the return value (preserving null), or change the return type to non-nullable `IanaTimezone` if the intent is to always default to UTC.

- [ ] [SUGGESTION] business-logic: backend/services/schedule/schedule.service.ts:133 — Invalid `input.date` now silently falls back to `new Date()` (today) instead of propagating an Invalid Date. Masks malformed date input by returning today's metrics rather than failing or surfacing the error.
  → Fix: Throw a validation error for invalid dates, or document that the fallback is intentional (e.g., when `input.date` is optional and unset).

## Recommended Actions

1. **Fix CRITICAL first**: Extract `checkRateLimitAndThrow(ctx)` helper from `requireAuthWithRateLimit` and replace the two inline blocks in auth.mutation.ts (lines 288-294, 330-335).
2. **Fix WARNINGs**: Extract `createConfirmSx(paletteKey)` shared helper for BaseDeleteDialog consumers.
3. **Consider SUGGESTIONs**: Decide whether the timezone-UTC fallback and date-today fallback are intentional. If so, document them. If not, restore null/error behavior.

## Layer Compliance Notes

- All changes comply with AGENTS.md barrel conventions, layer separation, i18n requirements, and type patterns.
- **Plan-review validation**: Plan passes all AGENTS.md rules for affected layers (backend/graphql, frontend, backend/services). No violations found.
- **Note on SUGGESTION #1 (profile.service.ts:633)**: The `toIanaTimezone` function returns `IanaTimezone` (non-null) but `UnifiedProfileReturnType.timezone` is typed `IanaTimezone | null` — this is a type contract mismatch. The fix (restore `parseIanaTimezoneOrNull`) aligns with the typed contract.
- **Note on CRITICAL (auth.mutation.ts)**: The proposed `checkRateLimitAndThrow(ctx)` helper follows the Pothos resolver delegation rule (§5) — extracting shared logic out of resolvers into a helper module is the documented pattern.

## Quality Gate Status

- ✅ TypeScript (tsgo) — clean
- ✅ Oxlint — clean
- ✅ Biome — clean
- ✅ Lint (ESLint) — clean
- ✅ Type-aware lint — clean
- ✅ Duplicates (jscpd) — 0 clones
- ✅ CodeScene — 5518 files perfect health, 0 warnings
- ✅ Quality gate: ALL PASSED

## Fix Status

- Total findings: 5
- Fixed: 0 / 5
- Remaining: 5 (review-only mode — no auto-fix per user constraint)
