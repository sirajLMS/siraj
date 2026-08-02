# Task-09 — complaint.test.ts Outcome

## Mutations in the File

| Mutation | Required Vars | Optional Vars | Input Type | Input Fields (req) | Input Fields (opt) |
|---|---|---|---|---|---|
| `deleteComplaintMutationDocument` | `complaintId` | none | n/a | n/a | n/a |
| `respondToComplaintMutationDocument` | `input` | none | `RespondToComplaintInput` | `body`, `complaintId` | none |
| `submitComplaintMutationDocument` | `input` | none | `ComplaintSubmitInput` | `body`, `category`, `submitterEmail` | `files` (`InputMaybe<Array<ComplaintFileMetadataInput>>`), `studentId` (`InputMaybe<String>`) |

`ComplaintFileMetadataInput` sub-fields (all required): `path: String`, `mimeType: String`, `sizeBytes: Int`.

## State Before Changes

- All three mutations already passed all required top-level variables at every call site.
- All input-object fields were present at every `respondToComplaint` call (`complaintId`, `body`).
- For `submitComplaint`, the optional `studentId` and `files` were always passed as `null`. The `studentId` field already received a meaningful non-null value (`NIL_UUID`) in the Threat-2 IDOR test.
- The optional `files` field was **always** passed as `null` across every `submitComplaint` call site — no test exercised a non-null value.

## Changes Made

- **`submitComplaint` — "authorized parent submits complaint successfully" test**: replaced `files: null` with a meaningful non-null array containing a single `ComplaintFileMetadataInput` object (`path: "uploads/test-complaint.pdf"`, `mimeType: "application/pdf"`, `sizeBytes: 1024`). This gives the optional `files` field both a non-null exercise (this test) and `null` coverage (remaining tests: teacher-denied, empty-body, IDOR, helper-submitTestComplaint, Threat-2-with-NIL-studentId).
- No other call sites changed. The optional `files` field is still explicitly `null` in the other call sites, ensuring both null and non-null coverage.
- The optional `studentId` field already had both `null` (most tests) and non-null `NIL_UUID` (Threat-2 IDOR test) coverage — no change needed.
- All required fields (`body`, `category`, `submitterEmail`, `complaintId`) remain present at every call site.
- `deleteComplaint` calls only require `complaintId` and were already complete — no change.
- `respondToComplaint` input object has no optional fields; all calls were already complete — no change.

## Backend Bugs Found

None. No CROSS-FILE DEPENDENCY reports.

## Quality Loop Results

- `~/.bun/bin/bun tsgo`: ✅ No errors in `frontend/common/graphql/test/complaints/complaint.test.ts`. (Pre-existing TS errors exist in other unrelated test files — impersonation, billing-management, manager-onboarding, teacher — outside this task's scope.)
- `~/.bun/bin/bun biome:check`: ✅ Passed (formatter auto-fixed).
- Lint queue client (file-scoped on `frontend/common/graphql/test/complaints/complaint.test.ts`): ✅ `{"success":true,"output":"","exitCode":0}`.

## Summary

Only one surgical change was required: adding the optional `files` field's non-null exercise to the "authorized parent submits complaint successfully" test, providing a `ComplaintFileMetadataInput` array. All required input fields and top-level variables were already present at every mutation call site. Coverage now satisfies the requirement that every optional variable appears with both a meaningful non-null value (at least one test) and `null` (at least one test).
