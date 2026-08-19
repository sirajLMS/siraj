# Task 2: Update resolveTargetGroupSlug — Outcome

**Date**: 2026-08-15
**Task**: 2 — Update `resolveTargetGroupSlug` in manager onboarding service
**Status**: ✅ Complete

## Summary of Changes

- **File Modified**: `backend/services/staff/manager-onboarding.service.ts`
- **Changes**:
  - Removed `admin` branch from `resolveTargetGroupSlug`.
  - Changed default fallback mapping to `SystemPermissionGroupSlug.ACADEMY_ADMIN` for `ManagerAccountType.manager`.
  - Preserved `supervisor` branch mapping to `SystemPermissionGroupSlug.SUPERVISOR_DEFAULT`.

## Quality Verification

- Ran `bun run scripts/health/sub-loop.ts backend/services/staff/manager-onboarding.service.ts --lifecycle codescene`
- All checks (tsgo, oxlint, biome:check, lint:type-aware, check:duplicates, codescene) PASSED (exit code 0).

## Semantic Review & Instruction Verification

- Verified compliance with `backend/services/AGENTS.md` and `backend.instructions.md`.
- No dead branches, no cross-layer imports.

## Carry-Forward Knowledge

- Now onboarding a manager user maps to `ACADEMY_ADMIN` (academy administrator permissions).
- Next task (Task 3) updates `resolveRoleCondition` in `staff-profile.repository.ts` so the "manager" directory filter matches `%admin%` slugs.
