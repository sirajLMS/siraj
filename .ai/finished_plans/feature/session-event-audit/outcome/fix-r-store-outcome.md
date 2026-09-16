# FIX-R — FIX-STORE slice (review-frontend MEDIUM #4 + LOW #10 + LOW #11)

- **Date:** 2026-09-05
- **Status:** Complete — all sliced findings fixed; every touched file passes
  `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0).

## Findings addressed

### MEDIUM #4 — `hydrateFromUrl` leaked stale filters across navigations

`frontend/common/stores/sessionAuditFilterStore.ts`:
`hydrateFromUrl` previously merged parsed URL params over the current module-level
store state, so filters set on a previous visit survived a URL that omitted them.
It now resets to `defaultState()` first, then applies the parsed params:

```ts
hydrateFromUrl: search => set({ ...defaultState(), ...parseSessionAuditUrlParams(search ?? currentWindowSearch()) }),
```

JSDoc on the action updated to state the reset-first contract. The dependent
outcome contract in `4.3-filter-store-outcome.md` was updated to match.

### LOW #11 — empty sort model (third header click) was ignored

`frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.tsx`:
`handleSortModelChange` now treats an empty `GridSortModel` as "return to the
default server sort" (`ScheduledStartAt` / `OrderSortDirection.Desc` — the same
defaults the filter store uses, so the URL sync omits the pair again). Only the
sort-handler hunk was touched; the rest of the file was left to the concurrent
FIX-GRID agent (the handler region was re-read immediately before editing and
had not drifted). `4.7-data-grid-outcome.md` sorting contract updated.

### LOW #10 — MANAGE-without-VIEW could open a blank override dialog

`frontend/common/views/dashboard/classes/audit/useClassAuditViewModel.ts`
(`useClassAuditPayroll`): both override entry points now require **both**
`AppPermission.AccountingPayrollView` (data) and
`AppPermission.AccountingPayrollManage` (action):

- `openDialog` (exposed as `onOverride` to the tier views) no-ops without both.
- `payrollOverrideDialog.open` is derived as `open && canViewPayroll && canManagePayroll`,
  so even if the container deep link sets the store flag for a manage-only actor,
  the dialog never mounts (its `row` snapshot is `null` for them already).

`ClassAuditContainer.tsx` intentionally untouched (different slice ownership; its
behavior is superseded by the view-model gate). The contract note in
`p1-override-dialog-wired-outcome.md` was updated.

## Test updates (WRITTEN, NEVER RUN — per slice policy)

- `frontend/common/stores/sessionAuditFilterStore.test.ts` — new case in the
  `hydrateFromUrl` describe: pre-seed stale filters/sort/page, hydrate from a URL
  carrying only `studentId`, assert the stale values returned to defaults and the
  parsed param applied.
- `test/ui/components/accounting/SessionAuditDataGrid.test.tsx` — new sorting
  case: clicking the actively-descending `scheduledStartAt` header (MUI cycle
  `desc → cleared`) calls `setSort(ScheduledStartAt, Desc)` — the previous
  behavior passed the same click silently.
- `test/ui/components/accounting/SessionAuditReportsContainer.test.tsx` — reviewed;
  **no change needed** (its hydration case starts from a reset store, so
  reset-then-merge is observationally identical there).
- `ClassAuditContainer.test.tsx` — unchanged deliberately: the container still sets
  the audit-store flag for manage-only actors; the dialog-level blocking now lives
  in the view model, which that suite mocks out. (Follow-up idea, not done: a
  view-model-level suite asserting the gated `payrollOverrideDialog.open`.)

## Verification

- `sub-loop --lifecycle codescene` → exit 0 on all four touched TS/TSX files:
  `sessionAuditFilterStore.ts`, `sessionAuditFilterStore.test.ts`,
  `SessionAuditDataGrid.tsx`, `useClassAuditViewModel.ts`, plus
  `SessionAuditDataGrid.test.tsx` (tsgo → oxlint → biome → lint:type-aware →
  duplicates → codescene).
- No UI/E2E or store tests were executed, per the slice's test policy.

## Semantic review / instruction verification

- No `console.*`; no new user-facing strings (zero i18n surface change).
- No `as` casts introduced; the sort default reuses the codegen enums directly.
- No styling changes (theme-palette rules vacuously satisfied).
- No plan-artifact references (REQ/Task/Phase/`.ai/`) in source comments or JSDoc;
  the two new code comments describe domain behavior only.
- `frontend/common/stores/AGENTS.md`: types still imported straight from
  `graphql.ts`; no mapping layer; store remains non-`persist`.
- Scope discipline: only the four slice files + the three named test files'
  expectations were considered; sibling agents' in-flight files (container,
  generated graphql.ts, reports container) were not modified.

## CROSS-FILE DEPENDENCY

None raised. One observation handed to the orchestrator as a note (not a blocker):
`ClassAuditContainer.tsx`'s deep-link hook still writes the store flag gated on
MANAGE alone; the dialog is now harmless in that case, but a future wave could
also require `AccountingPayrollView` there for symmetric bookkeeping.
