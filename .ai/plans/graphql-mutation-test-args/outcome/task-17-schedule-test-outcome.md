# Task 17: Schedule Test — Mutation Args Verification

## File
`frontend/common/graphql/test/scheduling/schedule.test.ts`

## Mutations Found

### 1. `clearWeeklyScheduleMutationDocument`
- **Document file**: `frontend/common/graphql/sharedDocuments/scheduling/schedule-deletion.documents.ts`
- **Required variables**: `teacherId` (ID!)
- **Optional variables**: none

**Call sites**:
| Line | Pattern | Variables passed | Status |
|------|---------|-----------------|--------|
| 357 | `testClient.mutate` (denial test — teacher access) | `teacherId` | ✓ All required args present |

### 2. `deleteRecurringClassMutationDocument`
- **Document file**: `frontend/common/graphql/sharedDocuments/scheduling/schedule-deletion.documents.ts`
- **Required variables**: `classInstanceId` (ID!)
- **Optional variables**: none

**Call sites**:
| Line | Pattern | Variables passed | Status |
|------|---------|-----------------|--------|
| 341 | `testClient.mutate` (denial test — teacher access) | `classInstanceId` | ✓ All required args present |
| 374 | `authenticatedRequest` (admin success test) | `classInstanceId` | ✓ All required args present |

### 3. `executeDstBulkUpdateMutationDocument`
- **Document file**: `frontend/common/graphql/sharedDocuments/scheduling/dst-migration.documents.ts`
- **Required variables**: `offsetMinutes` (Int!), `description` (String!)
- **Optional variables**: none

**Call sites**:
| Line | Pattern | Variables passed | Status |
|------|---------|-----------------|--------|
| 37 | `testClient.mutate` (helper `assertDstBulkUpdateFails`) | `offsetMinutes`, `description` | ✓ All required args present |
| 304 | `testClient.mutate` (system admin success test) | `offsetMinutes`, `description` | ✓ All required args present |

## Changes Made
**No changes were needed.** All mutation call sites already pass all required variables. Since all three mutations only have required args (no optional args per the mutation-args-reference.json), and every call site already includes all required fields, the file was already compliant.

## Missing Variables Before Changes
None — all required variables were already present at every call site.

## Backend Bugs Found
None.

## Quality Loop Results

| Check | Result |
|-------|--------|
| `tsgo` | ✓ No errors in `schedule.test.ts` (errors in other files are outside this task's scope) |
| `biome:check` (file-scoped) | ✓ 0 errors on `frontend/common/graphql/test/scheduling/schedule.test.ts` |
| `lint` (queue client, file-scoped) | ✓ `exitCode: 0`, no output |

## Cross-File Dependencies
None.
