# Review Fix Wave — FIX-GRAPHQL — Outcome

- **Date**: 2026-09-05
- **Status**: ✅ Complete
- **Findings**: review-frontend #1 (HIGH), review-types ×2 (LOW)

## Finding 1 (HIGH): `groupClassAudit` rejected academy admins

`backend/graphql/query/classes/group-class.query.ts` gated the field with
`authScopes: { superAdmin: true }`, but this plan's accounting operators are
`academy_admin` (not super admin), so the audit-page drill-down was rejected for
them even though the service already asserts
`AppPermission.SESSION_VIEW_DETAILS` (`group-class.service.ts:101`).

**Fix**: replaced the gate with
`authScopes: { permission: AppPermission.SESSION_VIEW_DETAILS }` — super admins
still pass via the `permission` scope's `ctx.isSuperAdmin` short-circuit
(`gqlSchemaBuilder.ts:71`), so access for existing super-admin callers is
unchanged while permission holders (academy_admin includes
`session.view_details` in the seeded group) now pass. The service-level
`assertPermission` remains the authoritative check. This matches the canonical
pattern in `backend/graphql/AGENTS.md` ("permission vs superAdmin") and every
other permission-gated query in `backend/graphql/query/`.

**Contract updated**: `.ai/plans/session-event-audit/outcome/3.6-override-dialog-wiring-outcome.md`
("Facts established during investigation") now describes the permission gate.

### Tests

- **New backend schema test** `backend/graphql/query/classes/group-class.query.test.ts`
  (modeled on `session-audit.query.test.ts`'s real-builder + mocked-service harness):
  1. non-super-admin with `SESSION_VIEW_DETAILS` reads the audit and the service
     receives the caller's `userId` / `classInstanceId` / `tErrors`;
  2. super admin without the explicit permission passes;
  3. caller without the permission gets `FORBIDDEN` and the service is not called;
  4. logged-out caller gets `FORBIDDEN` and the service is not called.
  Run green: `bun run test/scripts/run-test.ts backend/graphql/query/classes/group-class.query.test.ts` → **4 pass, 0 fail**.
- **Extended integration test** `frontend/common/graphql/test/classes/group-class.test.ts`
  with a `groupClassAudit` run as the provisioned academy admin (`adminToken`)
  — previously every audit call used `superAdminToken`. Run green via the
  locked dev-server runner (`run-server-tests.ts`, single file): **8/8 pass**.

## Finding 2 (LOW): ternary sort-direction coercion

`backend/graphql/query/billing/session-audit.query.ts` now maps the sort
direction via an exhaustive
`SORT_DIRECTION_FROM_POTHOS_ENUM: Record<OrderSortDirection, SessionAuditReportSort["direction"]>`
(`asc` / `desc`), mirroring the neighboring `STATUS_FROM_POTHOS_ENUM` /
`SORT_FIELD_FROM_POTHOS_ENUM` records; unknown enum members now fail type-check
instead of silently coercing to `desc`. The existing
`backend/graphql/query/billing/session-audit.query.test.ts` covers both
directions and stays green (run via `run-test.ts`: **15 pass, 0 fail**).

## Finding 3 (LOW): unused fields in the report document

Greps across `frontend/` and `test/ui/` show `SessionAuditFilterBar.tsx:70,72`
reads `row.teacherId` / `row.studentId` to resolve person-filter selections, and
the report row type drives three UI test fixtures. So the removal was
**partial by design**:

- **Removed** from `sessionAuditReportQueryDocument`
  (`frontend/common/graphql/sharedDocuments/billing/session-audit.documents.ts`):
  `payrollCalculatedAt`, `subjectId` (no frontend consumer; the CSV export and
  backend row type keep all 22 columns).
- **Kept**: `teacherId`, `studentId` — consumed by `SessionAuditFilterBar`.
  Removing them would break the filter bar and the grid, contrary to the
  "don't remove fields the grid consumes" guardrail.

Codebase selection trimmed to 20 columns; `bun run generate:gqlSchema && bun codegen`
re-run clean — `SessionAuditReportQuery_sessionAuditReport_rows` no longer
contains the two removed fields.

**UI test fixtures updated (not run, per policy)**: `payrollCalculatedAt` /
`subjectId` keys dropped from the row factories in
`test/ui/components/accounting/SessionAuditDataGrid.test.tsx`,
`SessionAuditFilterBar.test.tsx`, `SessionAuditReportsContainer.test.tsx` so
they stay assignable to the regenerated row type.

**Contract updated**: `outcome/4.1-documents-outcome.md` — selection set and the
"22 columns" note now reflect the trimmed document and the reason teacherId /
studentId remain.

## Verification (per-file pipeline)

`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exit 0 for:

- `backend/graphql/query/classes/group-class.query.ts`
- `backend/graphql/query/classes/group-class.query.test.ts`
- `backend/graphql/query/billing/session-audit.query.ts`
- `frontend/common/graphql/sharedDocuments/billing/session-audit.documents.ts`
- `frontend/common/graphql/test/classes/group-class.test.ts`
- `test/ui/components/accounting/SessionAuditDataGrid.test.tsx`
- `test/ui/components/accounting/SessionAuditFilterBar.test.tsx`
- `test/ui/components/accounting/SessionAuditReportsContainer.test.tsx`

## Semantic review / notes

- No `console.*`, no `as` casts introduced, no plan-artifact references in code
  comments (new backend test's comments describe mechanism only).
- Pre-existing tsgo errors in other agents' in-flight files
  (`backend/services/teacher/*payroll*` tests, `classDetails` fixtures) are
  unrelated to this slice and were left untouched.
- During the run, another agent's in-flight `whatsapp-sync-request.repository.ts`
  briefly broke `@/backend/lib` (`coerceSyncType` export); it was fixed by its
  owner in parallel and all tests then ran green — no action taken by this wave.

## CROSS-FILE DEPENDENCY

None opened, none left open.
