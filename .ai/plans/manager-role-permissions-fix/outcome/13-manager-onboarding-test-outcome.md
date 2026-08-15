# Task 13: Update Manager Onboarding Service Test — Outcome

**Date**: 2026-08-15
**Task**: 13 — Update manager onboarding service test
**Status**: ✅ Complete

## Summary of Changes

- **File Modified**: `backend/services/staff/test/manager-onboarding.service.test.ts`
- **Changes**:
  - Removed "creates manager with admin account type" test.
  - Updated "creates manager with manager account type" test to assert assigned group is `SystemPermissionGroupSlug.ACADEMY_ADMIN`.

## Test & Quality Verification

- Ran test suite: `bun run scripts/run-test/run-test.ts backend/services/staff/test/manager-onboarding.service.test.ts` → 7 tests passed (0 failed).
- Ran `bun run scripts/health/sub-loop.ts backend/services/staff/test/manager-onboarding.service.test.ts --lifecycle codescene` → All checks PASSED (exit code 0).

## Semantic Review & Instruction Verification

- Verified compliance with `backend/services/AGENTS.md`, `tests.instructions.md`, and `backend.instructions.md`.
