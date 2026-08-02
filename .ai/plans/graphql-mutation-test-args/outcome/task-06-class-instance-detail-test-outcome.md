# Task 06: class-instance-detail.test.ts Outcome

## Mutations Found

- `createTeacherManualClassEntryMutationDocument` — imported from `@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents`

## Argument Analysis

### Top-level variable: `input` (required)
- Type: `CreateManualClassEntryInput`
- Defined at line 1095 of `frontend/common/graphql/generated/gql/graphql-types.ts`

### `CreateManualClassEntryInput` fields:

| Field | Type | Required | Present Before? |
|---|---|---|---|
| `studentId` | `Scalars['ID']['input']` | Yes | Yes |
| `teacherId` | `Scalars['ID']['input']` | Yes | Yes |
| `subjectId` | `Scalars['ID']['input']` | Yes | Yes |
| `scheduledStartAt` | `Scalars['String']['input']` | Yes | Yes |
| `scheduledEndAt` | `Scalars['String']['input']` | Yes | Yes |
| `durationMinutes` | `Scalars['Int']['input']` | Yes | Yes |
| `classType` | `InputMaybe<ClassType>` | No (optional) | Yes (non-null) |

## Changes Made

The existing single call site (provision test) already passed ALL 7 fields of `CreateManualClassEntryInput` (6 required + 1 optional `classType: ClassType.Regular`).

Per the shared context requirement that optional fields be tested with both a meaningful non-null value AND `null`, I added a second test case:

1. **Provision test** (unchanged): passes `classType: ClassType.Regular` (non-null meaningful value). This is the primary class instance used by all downstream query assertions.

2. **New test "createTeacherManualClassEntry with null classType defaults to Regular"**: passes `classType: null` to verify the backend applies its default. The backend service (`teacher-dashboard.service.ts` line 101) does `input.classType ?? "REGULAR"`, so `null` safely defaults to `ClassType.Regular`. The test asserts that a valid class instance ID is returned.

## Backend Bugs Found

None.

## CROSS-FILE DEPENDENCIES

None.

## Quality Loop Results

- **tsgo**: No errors in `class-instance-detail.test.ts` (errors exist in other test files — not in scope)
- **biome:check**: No issues found (no fixes applied)
- **lint (queue client)**: `{"success":true,"output":"","exitCode":0}` — 0 errors, 0 warnings
