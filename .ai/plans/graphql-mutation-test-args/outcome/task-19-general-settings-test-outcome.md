# Task 19: general-settings.test.ts Outcome

## Mutations Found
- `upsertSystemSettingMutationDocument` (operation: `upsertSystemSetting`)
  - Required top-level variable: `input` (type: `SystemSettingUpsertInput`)

## Input Type: `SystemSettingUpsertInput`
Looked up in `frontend/common/graphql/generated/gql/graphql-types.ts`:

| Field | Type | Required |
|-------|------|----------|
| `key` | `Scalars['String']['input']` | ✅ required |
| `value` | `Scalars['String']['input']` | ✅ required |
| `category` | `InputMaybe<SystemSettingCategory>` | optional |
| `dataType` | `InputMaybe<SystemSettingDataType>` | optional |
| `description` | `InputMaybe<Scalars['String']['input']>` | optional |

## State Before Changes
The test had two `upsertSystemSetting` mutation call sites in the test
"super admin can upsert a known general system setting value":

1. Upsert call (set value to "true") — included ALL 5 fields of `SystemSettingUpsertInput`.
2. Restore call (restore original value) — included ALL 5 fields of `SystemSettingUpsertInput`.

Both calls already passed all required and optional input fields with meaningful non-null values.

## Gap vs. Guidance
Per shared-context guidance: optional variables should pass a meaningful non-null value in at
least one test case AND `null` in at least one test case. The existing two calls only passed
non-null values for the optional fields (`category`, `dataType`, `description`). No test case
exercised the nullable (null) path for these optionals.

## Changes Made
Added a third `upsertSystemSetting` mutation call between the existing upsert and restore calls
that passes the required fields (`key`, `value`) with valid values and the optional fields
(`dataType`, `description`, `category`) explicitly as `null`, then asserts the returned setting
reflects the null-input state. The restore call remains unchanged and re-populates all optional
fields to return the setting to its pre-test state.

No other files were modified. Imports already used `@/` aliases. No backend bugs found.

## Quality Loop Results
- `~/.bun/bin/bun tsgo` — No errors in `frontend/common/graphql/test/settings/general-settings.test.ts`.
  (Unrelated TS6133 errors exist in `frontend/common/graphql/test/auth/impersonation.test.ts`,
  `test/ui/e2e/debug-submit.test.ts`, and `test/ui/e2e/teacher_onboarding.test.ts` — not in this task's scope.)
- `~/.bun/bin/bun biome:check` — No errors for this file. (One unrelated biome error in
  `test/ui/e2e/debug-submit.test.ts` line 51, outside this task's scope.)
- Lint queue client (`http://localhost:4777/lint`, files-scoped) —
  `{"success":true,"output":"","exitCode":0}` — 0 errors, 0 warnings.

## CROSS-FILE DEPENDENCY Reports
None.
