# Task 3: Update resolveRoleCondition in StaffProfileRepository — Outcome

**Date**: 2026-08-15
**Task**: 3 — Update `resolveRoleCondition` for manager role filter
**Status**: ✅ Complete

## Summary of Changes

- **File Modified**: `backend/db/repo/teachers/staff-profile.repository.ts`
- **Changes**:
  - Updated `resolveRoleCondition` so `filters?.roleFilter === "manager"` returns `ilike(permissionGroups.slug, "%admin%")`.
  - Removed unused imports `isNull` and `notIlike` from `drizzle-orm`.
  - Maintained `"admin"` and `"supervisor"` filters unchanged.

## Quality Verification

- Ran `bun run scripts/health/sub-loop.ts backend/db/repo/teachers/staff-profile.repository.ts --lifecycle codescene`
- All checks (tsgo, oxlint, biome:check, lint:type-aware, check:duplicates, codescene) PASSED (exit code 0).

## Semantic Review & Instruction Verification

- Verified compliance with `backend/db/repo/AGENTS.md` and `backend.instructions.md`.
- No dead branches, no unused variables or imports.

## Carry-Forward Knowledge

- Staff directory filtering for "manager" now returns users whose assigned group slug contains `admin` (e.g., `academy_admin`).
- Next task (Task 4) creates the Drizzle custom migration updating `academy_admin` group name to `{"ar": "مدير الأكاديمية", "en": "Manager"}`.
