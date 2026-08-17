# Task 8: Update English Onboarding Translations — Outcome

**Date**: 2026-08-15
**Task**: 8 — Update English onboarding translations — remove `admin`, update `manager`
**Status**: ✅ Complete

## Summary of Changes

- **File Modified**: `shared/locale/en/dashboard/staff/onboarding.ts`
- **Changes**:
  - Removed `admin: "Administrator"` from `accountType`.
  - Removed `admin` entry from `accountTypeDescriptions`.
  - Kept `accountType.manager` as `"Manager"`.
  - Updated `accountTypeDescriptions.manager` to `"Full system access for managing teachers, students, schedules, and billing — except permission control"`.

## Quality Verification

- Ran `bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/staff/onboarding.ts --lifecycle codescene`
- All checks PASSED (exit code 0).

## Semantic Review & Instruction Verification

- Verified compliance with `shared/AGENTS.md`. No cross-layer imports.
