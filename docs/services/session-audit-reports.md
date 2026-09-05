# Session Audit Reports — Domain Reference

> Canonical reference for the accounting session-event audit report (spec plan
> `session-event-audit`): the `/accounting/reports` grid, its `sessionAuditReport`
> GraphQL query, and the CSV export. Consolidates architecture, contracts, and
> battle-tested gotchas discovered during implementation. Feature specifics live
> HERE, not in AGENTS.md rule files.

## Surface Map

| Surface | Path | Gate |
|---|---|---|
| Status mapper (shared rule) | `shared/constants/classes/session-audit-status.ts` (`mapToSessionAuditStatus`, `STATUS_TO_PREDICATE_KEY`) | none (pure function) |
| SQL predicate expansion | `backend/services/accounting/session-audit-status-predicate.ts` (`expandStatusesToSql`) | none (values parameterized) |
| Repository | `backend/db/repo/scheduling/session-audit.repository.ts` (`SessionAuditRepository.findReportRows`) | service-gated |
| Service | `backend/services/accounting/session-audit.service.ts` (`SessionAuditService.getReport`) | re-checks `ACCOUNTING_REPORTS_VIEW` before any read |
| CSV serializer | `backend/services/accounting/session-audit-csv.serializer.ts` (`serializeSessionAuditCsv`) | pure function |
| GraphQL query | `backend/graphql/query/billing/session-audit.query.ts` + `backend/graphql/pothos/accounting/session-audit.pothos.ts` + enums in `backend/graphql/pothos/shared/enum.pothos.ts` | scope-auth `ACCOUNTING_REPORTS_VIEW` + resolver `includeDeleted` strip |
| CSV export route | `app/api/accounting/reports/export/route.ts` | session + `ACCOUNTING_REPORTS_VIEW`; `includeDeleted` cleared unless `ACCOUNTING_REPORTS_MANAGE` |
| Reports UI | `frontend/common/views/dashboard/billing/accounting/reports/` (+ `frontend/desktop|mobile/...` tier views) | page `withPageAuth([ACCOUNTING_REPORTS_VIEW])`; nav `PAGE_PERMISSIONS.accountingReportsView` |
| Filter store + URL sync | `frontend/common/stores/sessionAuditFilterStore.ts` | none (client state) |
| Permissions migration | `backend/db/migration/39-accounting-reports-permissions.sql` | grants to `super_admin` + `academy_admin` |

## Architecture (data flow)

```
shared mapper mapToSessionAuditStatus (single rule, pure)
        │  consumed twice, never duplicated:
        ├─ service-side ▶ expandStatusesToSql (same rule as SQL WHERE fragments)
        ▼                (repo row mapper re-derives currentStatus in TS)
repository findReportRows (2 statements: joined SELECT + COUNT; sort/filter/paginate)
        ▼
SessionAuditService.getReport (permission re-check → date validation → default
        30-day window → repo read → last-page clamp → page-level aggregates → log)
        ▼                                    ▼
GraphQL sessionAuditReport          GET /api/accounting/reports/export
(ctx.t().errorsTranslations;        (locale from accept-language;
 wire<->domain enum mapping)         CSV via serializeSessionAuditCsv)
        ▼                                    ▲
sessionAuditReportQueryDocument ◀──── view model buildSessionAuditExportCsvUrl
        ▼                            (same URL-param serialization as the page)
SessionAuditFilterStore ⇄ URL (hydrateFromUrl + 100ms replaceState sync)
        ▼
SessionAuditReportsContainer → FilterBar / DataGrid / AggregateCard
        ▼ row action (MANAGE only)
/classes/<instanceId>/audit?openOverride=1 → ClassAuditContainer → OverrideDialog
```

Key layering rules:

- **One status rule, two representations.** The TS mapper (`mapToSessionAuditStatus`)
  is the canonical rule; `expandStatusesToSql` renders the same rule as SQL
  fragments so the `currentStatuses` filter can never disagree with the computed
  `currentStatus` on a row. Never add a third copy (e.g. in SQL views or the UI).
- The repository is read-model only: no business logic, no permission checks.
  `currentStatus` is computed in TypeScript per row (never in SQL); the
  `currentStatuses` filter goes through the predicate module.
- Exactly **2 statements per report read** (SELECT + COUNT in one `Promise.all`).
- The GraphQL resolver and the export route are thin adapters over
  `SessionAuditService.getReport` — argument shapes are identical after
  wire→domain mapping.

## Status Mapping Truth Table

`SessionAuditStatus = "open" | "end" | "Absent" | "absent_student"` (wire values
are case-exact: capital-`A` `Absent`, snake_case `absent_student`).

| Audit status | Data condition |
|---|---|
| `end` | `execution_state = 'COMPLETED'` AND `outcome = 'TAKEN'` |
| `Absent` (teacher absent) | `COMPLETED` AND `outcome = 'ABSENT'` AND `actual_start_at IS NULL` |
| `absent_student` | `COMPLETED` AND (`outcome = 'LEAVE'` OR (`outcome = 'ABSENT'` AND `actual_start_at IS NOT NULL`)) |
| `open` | everything else (RUNNING, ACTIVATED, NOT_ACTIVATED, all ON_DEMAND_* states, COMPLETED with any unmatched outcome, null/undefined columns), and every unknown/legacy status string passed to the predicate expands to the `open` fragment |

SQL predicate shapes (`expandStatusesToSql`; enum values always parameterized):

- `open` → `NOT (execution_state = 'COMPLETED' AND outcome IN ('TAKEN','ABSENT','LEAVE'))`
- others → the table above literally.

## Permission Model

- **Two permissions** (migration 39, granted to `super_admin` + `academy_admin`
  groups only): `ACCOUNTING_REPORTS_VIEW` reads the report; `ACCOUNTING_REPORTS_MANAGE`
  unlocks the manage-only surfaces (soft-deleted rows via `includeDeleted`, the
  "Open audit page" row action). The deep link's dialog is gated on Plan-3
  `ACCOUNTING_PAYROLL_VIEW` + `ACCOUNTING_PAYROLL_MANAGE` instead.
- **Defense in depth on reads**: Pothos `authScopes` → resolver → the service's own
  `requirePermission` re-check (runs *before* date validation, so denied callers
  learn nothing about filter validity). The export route repeats session → `403` →
  service re-check. Denial is `ForbiddenError` with `extensions.code: "FORBIDDEN"`.
  Operators may filter by ANY teacher/student id by design (single-academy
  deployment); non-operators are denied even for their own ids.
- **`includeDeleted` is double-gated at the entry points, never in the service.**
  The service contract accepts `includeDeleted: true` unconditionally; the GraphQL
  resolver and the export route each clear it to `false` unless the caller holds
  `ACCOUNTING_REPORTS_MANAGE` (resolver: `ctx.isSuperAdmin ||
  ctx.permissions.includes(...)` — no extra DB query). Any future third caller of
  `getReport` MUST re-gate it. (This was a real pentest finding: the resolver
  initially passed the flag through while the route gated it.)
- The repository excludes soft-deleted rows unless `includeDeleted === true`.

## CSV Export Contract (`GET /api/accounting/reports/export`)

The page issues the same filters/sort the grid shows; the view model serializes the
export URL with the same param contract as the store.

- Always called as `getReport(actor, filters, sort, { limit: 10_000, offset: 0 }, tErrors)`.
- Query params: `teacherId`, `studentId`, `dateFrom`/`dateTo` (strict `YYYY-MM-DD`
  calendar dates; impossible days like `2026-02-30` rejected), `currentStatuses`
  (repeatable and/or comma-joined), `search` (max 200 chars), `includeDeleted`
  (`"true"/"false"`), `sortField` + `sortDirection` (paired; half-pair → 400).
- **Column order (AC-8.3)**: grid visual order, non-rendered siblings adjacent to
  the column they qualify, join-back ids last. Exactly 22 columns, header labels
  are camelCase field names:

```
scheduledStartAt,scheduledEndAt,teacherName,studentName,subjectName,subjectId,actualStartAt,actualEndAt,bookingTimezone,durationMinutes,currentStatus,calculatedDuration,teacherPaidAmount,teacherPaidCurrency,calculationStatus,isPartialPercentage,payrollNote,payrollCalculatedAt,teacherDuePaymentDate,teacherId,studentId,instanceId
```

- **Formula-injection hardening**: cells starting with `=`, `+`, `-`, `@`, tab, or
  CR get a leading `'` BEFORE RFC 4180 quoting; quoting wraps cells containing
  `,`, `"`, `\n`, `\r` with `"` doubling. Line separator CRLF, trailing CRLF,
  nulls → empty cells.
- **Headers**: `Content-Type: text/csv; charset=utf-8`;
  `Content-Disposition: attachment; filename="session-audit-report.csv"` (fixed
  name, no date suffix); `X-Export-Truncated: "true"|"false"` — always present,
  `"true"` exactly when `totalCount > 10_000`. The UI toasts `exportTruncated`
  when true.
- Errors: 401 unauthenticated, 403 missing VIEW, 400 any malformed param (bodies
  carry only the localized message; locale from `accept-language`, fallback `ar`),
  500 unexpected. No request input ever reaches a response header.

## URL-Param Contract (grid page ↔ store ↔ export route)

Owned by `sessionAuditFilterStore` (serialization) and mirrored by
`buildSessionAuditExportCsvUrl`. Defaults are omitted from the URL entirely.

| Param | Format | Notes |
|---|---|---|
| `teacherId`, `studentId` | string | blank ignored |
| `dateFrom` / `dateTo` | `YYYY-MM-DD` | validated independently; inverted ranges hydrate anyway (UI shows `error.dateRangeInvalid`) |
| `currentStatuses` | comma-joined wire values | unknown members dropped, deduped, order preserved |
| `search` | string | trimmed; store keeps raw, view model debounces 300 ms |
| `sortField` / `sortDirection` | wire enum value / lowercase `asc`\|`desc` | pair-validated; unknown or half pair → default (`scheduledStartAt desc`) |
| `page` | integer, **0-based** | malformed ignored |
| `pageSize` | integer ≥ 1 | default 50 |

Rules: sync uses `history.replaceState` after a 100 ms debounce (never push);
foreign params (e.g. `openOverride`) are preserved; `hydrateFromUrl` **resets to
defaults first** so stale filters never leak across navigations.

## `openOverride` Deep-Link Mechanics

`/classes/<instanceId>/audit?openOverride=1` (emitted only for MANAGE holders):

1. `ClassAuditContainer`'s `useOpenOverrideDeepLink` reads `useSearchParams`;
   truthiness is the contract.
2. Fires only when the actor holds `ACCOUNTING_PAYROLL_MANAGE`; the flag is ALWAYS
   stripped from the URL via `history.replaceState` afterward (single-shot — a
   refresh or copied URL never re-fires), and other params are preserved.
3. The flag lives on the **audit-scoped** `useClassAuditStore.overrideDialogOpen`
   (NOT the class-details store — that one drives the different rate-override
   dialog and would leak across navigation).
4. `useClassAuditViewModel`'s `useClassAuditPayroll` fetches the payroll snapshot
   via the existing `classInstance(id:)` document (same route param id as
   `groupClassAudit`) and status events via `classStatusEventsQueryDocument`;
   both are `skip`-gated on `ACCOUNTING_PAYROLL_VIEW`, and the server additionally
   strips payroll fields for non-holders. The dialog mounts only when the actor
   holds BOTH payroll VIEW and MANAGE.
5. `<OverrideDialog>` (Plan 3) is rendered in `ClassAuditView` with its `row` prop
   narrowed to `OverrideDialogRow = Pick<PayrollReportRow, "instanceId" |
   "calculationStatus" | "teacherPaidAmount" | "teacherPaidCurrency" |
   "calculatedDuration" | "isPartialPercentage" | "payrollNote">` — the
   `ClassInstanceQuery_classInstance` result satisfies it structurally (NO-MAPPING).
   `onApplied` refetches the instance, status-events, and audit queries after a
   successful override; the mutation re-checks the permission server-side.

## Known Design Decisions (ratified)

- **Dominant-currency aggregate**: `totalPaidAmount` sums non-null
  `teacherPaidAmount` values via exact minor-unit bigint math (never floats);
  malformed decimal strings are excluded, not zeroed. `totalPaidCurrency` is the
  currency carried by the most rows (ties → first-seen; empty page → `SAR`).
- **Aggregates are page-level** (over returned rows, not the full filtered set);
  `totalCount` carries the full size. `rowCountByStatus` always exposes all four
  keys; empty filters/loads render real zeros, never placeholders.
- **Last-30-days default window lives in the service**: when the caller supplies
  NEITHER date bound, the service fills `dateTo` = today (UTC) and `dateFrom` = 30
  days earlier; a single caller bound is respected. GraphQL query and CSV route
  share this; the frontend "Clear filters" reset relies on it and does no window
  math of its own.
- **Strict date validation is service-side** (regex + UTC round-trip rejects
  impossible days); the GraphQL `format: date` constraint alone is insufficient.
  The route keeps its own pre-validation only to map errors to HTTP 400.
- **Repo → service deep import precedent**: the repository imports the predicate
  from `@/backend/services/accounting/session-audit-status-predicate` (deep
  module) to avoid a barrel-level import cycle — an established pattern
  (`class-instances.ts` imports the availability service the same way).
- **Pothos enum wiring**: real TS enums in `backend/enum/billing/session-audit.enum.ts`
  (member keys = wire values) registered once in `shared/enum.pothos.ts`; the
  canonical `SessionAuditStatus` stays a shared string-literal union, bridged by
  exhaustive `Record` converters (zero casts). Sort direction reuses the shared
  `OrderSortDirection` (ASC/DESC); lowercase `asc`/`desc` exist only service-side
  and in URLs.
- **Student name source**: `students.name` directly (matches the payroll report);
  teacher name via `teachers → users`.
- **`teacherDuePaymentDate`** joins `teacher_dues → teacher_payments` and is
  surfaced only when `calculation_status = 'PAID'` (gated in the row mapper).
- **Default sort `scheduledStartAt desc` is owned by the service**; resolver and
  store pass `null`/defaults through, never build one. DataGrid empty-sort-model
  (third header click) resets to the same default.

## Gotchas

- **`updateStatusAbsent` never produces mapper-`Absent`.** The state machine stamps
  `actual_start_at: existing ?? now`, so a live teacher-absence read lands as
  `absent_student`. True `Absent` rows only exist for telemetry-less legacy data.
- **`includeDeleted` privilege check lives in BOTH entry points** — gating only one
  is a privilege-escalation hole (see Permission Model).
- **Search is AND-across-tokens, OR-across-teacher/student**, case-insensitive, with
  `escapeLikeWildcards` — `%`/`_` in search text match literally.
- **`teacherPaidAmount` is decimal-as-text**: sorting goes through
  `CAST(... AS NUMERIC)` with `NULLS FIRST/LAST`; keep the cast when touching it.
- **Offset past the end** returns `[]` with full `totalCount` from the repo; the
  service re-fetches the real last page (`floor((totalCount-1)/limit)*limit`).
- **`calculationStatus` defaults to `NOT_CALCULATED`, never null**, for
  never-calculated rows; the null payroll amount/duration/note columns are the
  graceful-degradation surface.
- The codegen config emits types only for documents in `sharedDocuments/**`; there
  is NO generated `useSessionAuditReportQuery` hook — always
  `useQuery(sessionAuditReportQueryDocument, { variables })`.
- GraphQL `aggregates.rowCountByStatus`/`rowCountByPaid` are `JSON` scalars
  (`unknown` in codegen) — narrow them once at the view-model boundary with runtime
  guards (no casts); the narrowed view model guarantees `totalPaidAmount` non-null.
- `SessionAuditFilterBar` reads `row.teacherId`/`row.studentId` — do not trim those
  from the selection set; `payrollCalculatedAt`/`subjectId` were deliberately
  trimmed (20 columns in the query; CSV keeps all 22 separately).
- Journey tests (`test/workflows/accounting/session-audit-*.test.ts`) always scope
  reads by `teacherId` — the shared test DB has more committed history than any
  small page, so unfiltered reads do not reliably contain fixture rows.
