# Task 5: Update Seed SQL Mirrors — Outcome

**Date**: 2026-08-15
**Task**: 5 — Update seed SQL mirrors for consistency
**Status**: ✅ Complete

## Summary of Changes

- **Files Modified**:
  1. `backend/db/migration/3-system_permissions_and_groups.sql` (lines 1023-1031)
  2. `backend/drizzle/20260815025626_custom_3-system_permissions_and_groups/migration.sql` (lines 1057-1065)
- **Changes**:
  - Updated `academy_admin` INSERT `name` to `'{"ar": "مدير الأكاديمية", "en": "Manager"}'::jsonb`.
  - Updated `description` to `'{"ar": "وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات", "en": "Full system access for managing teachers, students, schedules, and billing — except permission control"}'::jsonb`.
  - The `ON CONFLICT (slug) DO UPDATE` clauses use `EXCLUDED.name` and `EXCLUDED.description`, which automatically apply the updated values on subsequent migrations/seeds.

## Carry-Forward Knowledge

- Seed migrations now consistently initialize `academy_admin` with the updated name and description.
- Next phase (Phase D: Tasks 6-10) handles i18n updates for onboarding and directory labels.
