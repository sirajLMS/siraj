# Task 24 — student-lifecycle.test.ts Outcome

## File
`frontend/common/graphql/test/students/student-lifecycle.test.ts`

## Mutations Found
1. **`reassignStudentTeacherMutationDocument`** (`sharedDocuments/students/student-lifecycle.documents.ts`)
   - Required: `studentId`, `newTeacherId`
   - Optional: `expectedVersion` (`Int`, `InputMaybe`)
   - Document returns `version` field for chaining.

2. **`changeStudentStatusMutationDocument`** (`sharedDocuments/students/student-lifecycle.documents.ts`)
   - Required: `studentId`, `newStatus`
   - Optional: `expectedVersion` (`Int`, `InputMaybe`)
   - Document returns `version` field for chaining.

## State Before Changes
All mutation call sites already passed `expectedVersion: null`. No call site exercised a meaningful (non-null) `expectedVersion` value.

## Changes Made
### `reassignStudentTeacherMutationDocument`
- Added new test: **"super admin reassigns with a real expectedVersion from prior result"** that:
  1. Performs a reassign with `expectedVersion: null` and captures the returned `version`.
  2. Performs a second reassign passing the captured `version` as `expectedVersion`.
  3. Asserts the result id and `primaryTeacherId`.
- Existing tests retained; together they cover both `null` and real-value paths.

### `changeStudentStatusMutationDocument`
- Added new test: **"super admin changes status back to REGULAR using the version returned by prior mutation"** that:
  1. Performs a status change to `OnLeave` with `expectedVersion: null`, capturing the returned `version`.
  2. Asserts the captured version is defined.
  3. Performs a second change to `Regular` passing the captured `version` as `expectedVersion`.
  4. Asserts the final status is `Regular`.
- Existing tests retained (which pass `expectedVersion: null`), maintaining both `null` and real-value coverage.

## Coverage Summary
| Mutation | `null` cases | real-value cases |
|---|---|---|
| `reassignStudentTeacher` | multiple existing tests | new test (chained version) |
| `changeStudentStatus` | multiple existing tests | new test (chained version) |

Each optional arg (`expectedVersion`) is now tested with both `null` (in pre-existing tests) and a valid non-null integer (captured from a prior mutation's returned `version`).

## Backend Bugs / Cross-File Dependencies
None found. Both mutations correctly return a `version` field, enabling chained `expectedVersion` test scenarios without backend changes.

## Quality Loop Results
- **tsgo**: No errors in the modified file. Pre-existing errors exist in other test files (billing-management.test.ts, parent-onboarding.test.ts, manager-onboarding.test.ts, teacher.test.ts) — those are owned by other subagents and were not introduced by this change.
- **biome:check**: Clean — "Checked 4549 files. No fixes applied."
- **lint (queue client, port 4777)**: `{"success":true,"output":"","exitCode":0}` — clean.

All three quality gates pass for this file.
