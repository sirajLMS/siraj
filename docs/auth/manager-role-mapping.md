# Manager Role Mapping Architecture

## Overview

In Siraj, staff accounts are created via the Manager Onboarding flow. There are two selectable account types:
1. **Manager (`manager` / "مدير الأكاديمية")**: Maps to the system permission group `academy_admin`.
2. **Supervisor (`supervisor` / "مشرف")**: Maps to the system permission group `supervisor_default`.

The legacy `admin` account type was removed to eliminate role redundancy with `manager`.

## Role & Permission Group Mapping

| Onboarding Account Type | System Permission Group Slug | Display Name (AR) | Display Name (EN) | Description |
|---|---|---|---|---|
| `ManagerAccountType.manager` | `academy_admin` | مدير الأكاديمية | Manager | Full administrative access for managing teachers, students, schedules, billing, reports, and complaints — excluding system permission management. |
| `ManagerAccountType.supervisor` | `supervisor_default` | مشرف | Supervisor | Supervisory access for schedule and student/teacher coordination. |

## Permission Boundaries

- **Super Admin (`super_admin`)**: Full platform control, including `permission_groups.manage` and `permission_groups.assign`.
- **Manager (`academy_admin`)**: All operational permissions (teachers, students, classes, billing, reports, resources, complaints, suggestions), but **NO** `permission_groups.manage` or `permission_groups.assign`.
- **Supervisor (`supervisor_default`)**: Scoped operations for day-to-day coordination.

## Staff Directory Role Filtering

In `backend/db/repo/teachers/staff-profile.repository.ts`, directory role filtering maps as follows:
- `roleFilter === "admin"`: Filters by `ilike(permissionGroups.slug, "%admin%")`.
- `roleFilter === "manager"`: Filters by `ilike(permissionGroups.slug, "%admin%")` (matching `academy_admin`).
- `roleFilter === "supervisor"`: Filters by `ilike(permissionGroups.slug, "%supervisor%")`.
- `metrics.totalAdmin`: Counts staff users whose assigned permission group slug matches `%admin%` (capturing all manager/admin staff).
