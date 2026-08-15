# Task 14: Update Staff Profile Repository Test — Outcome

**Date**: 2026-08-15
**Task**: 14 — Update staff profile repository test
**Status**: ✅ Complete

## Summary of Changes

- **File Modified**: `backend/db/test/repo/teachers/staff-profile.test.ts`
- **Changes**:
  - Updated "filters by manager role" test to assert that `manager` roleFilter matches users with `%admin%` group slugs and excludes users with non-admin slugs or without groups.

## Test & Quality Verification

- Ran test suite: `bun run scripts/run-test/run-test.ts backend/db/test/repo/teachers/staff-profile.test.ts` → 35 tests passed (0 failed).
- Ran `bun run scripts/health/sub-loop.ts backend/db/test/repo/teachers/staff-profile.test.ts --lifecycle codescene` → All checks PASSED (exit code 0).

## Semantic Review & Instruction Verification

- Verified compliance with `backend/db/test/AGENTS.md`, `tests.instructions.md`, and `backend.instructions.md`.
- Uses `runInRollback`, passes `tx` to repository calls, no `expect().rejects.toThrow()`.
