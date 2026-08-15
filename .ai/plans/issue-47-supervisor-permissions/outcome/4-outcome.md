# Phase 4 Outcome: GraphQL — Fix superAdmin authScopes

## Summary

Two GraphQL mutations in `student-lifecycle.pothos.ts` had `authScopes: { superAdmin: true }` which only allowed superAdmins. Changed to permission-based authScopes so supervisors and academy_admins with the correct permissions can access them.

## Files Modified

1. **`backend/graphql/pothos/students/student-lifecycle.pothos.ts`** (Task 4.1)
   - Line 3: Added `AppPermission` value import: `import { AppPermission } from "@/backend/enum"`
   - Line 37: `reassignStudentTeacher` authScope changed from `{ superAdmin: true }` to `{ permission: AppPermission.STUDENT_REASSIGN_TEACHER }`
   - Line 59: `changeStudentStatus` authScope changed from `{ superAdmin: true }` to `{ permission: AppPermission.STUDENT_MANAGE_STATUS }`

## Files NOT Modified
- No other GraphQL mutations needed changes (other student mutations already used permission-based authScopes)
- No type files changed

## Verification
- File passed `sub-loop.ts --lifecycle codescene` (exit 0)
- All 6 progressive checks passed: tsgo → oxlint → biome → lint:type-aware → duplicates → codescene

## AuthScope Pattern Reference
- `superAdmin: true` → only passes for `users.isSuperAdmin = true`
- `permission: AppPermission.X` → passes for `ctx.isSuperAdmin || ctx.permissions.includes(key)`
- Defined in `gqlSchemaBuilder.ts:109-128`

## Carry-Forward Knowledge
- `AppPermission` must be imported as a value import (not type-only) when used in runtime expressions like authScopes
- Task 4.2 (test update) depends on this change — tests must verify permission-based access instead of superAdmin-only
