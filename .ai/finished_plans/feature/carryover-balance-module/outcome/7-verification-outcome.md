# Task 7.x Outcome — Constraint Directives + Phase 7 Verification (i18n / a11y / RTL / NFR-11 logging)

- **Date**: 2026-09-05
- **Status**: ✅ Complete (with one repo-wide CROSS-FILE DEPENDENCY reported, not fixed)

## Scope A — GraphQL input size constraints

### What changed

The three carryover bulk selection inputs now carry `@constraint(maxItems: 500)` — the
exact precedent verified in `backend/graphql/mutation/teachers/teacher-due.mutation.ts:13`
(`t.arg.idList({ required: true, directives: { constraint: { maxItems: 500 } } })`):

| Field | File |
|---|---|
| `BulkCreateCarryoverInput.instanceIds` | `backend/graphql/pothos/teachers/carryover.pothos.ts` |
| `BulkToExpenseInput.carryoverIds` | `backend/graphql/pothos/teachers/carryover.pothos.ts` |
| `bulkDeleteCarryoverBalances(ids:)` arg | `backend/graphql/mutation/teachers/carryover.mutation.ts` (`t.arg.idList` now, matching the precedent's call shape; same `[ID!]!` SDL) |

**`minItems: 1` was deliberately NOT added**, although the assignment suggested
`minItems: 1, maxItems: 500`. Reasons, in order of weight:

1. **Runtime hazard**: under the currently-installed `graphql-constraint-directive@6.0.0` +
   `graphql@17.0.2` stack, `minItems` on a variable-bound input fires a false-positive
   rejection (`must be at least 1 in length`) for *every* request, including valid ones
   (proven in the in-process harness — see cross-file report below). Shipping `minItems`
   would risk hard-breaking all three bulk mutations.
2. The verified precedent (teacher-due) uses `maxItems` only.
3. Empty-array rejection is already enforced and tested at the service layer
   (`VALIDATION` GraphQL error via `tErrors.carryover.noInstances` / `noCarryovers`; covered
   by the empty-selection tests in `carryover.mutation.test.ts`).

### Tests (`backend/graphql/mutation/teachers/carryover.mutation.test.ts`)

The three `forwards an oversized selection …` tests (per the 2.4b outcome's flip
instruction) became `rejects an oversized selection (>500 ids) via the @constraint
directive`:

- Enforcement is exercised through the **real production path**: an in-process
  `ApolloServer` over the test schema plus `createApollo4QueryValidationPlugin()` — the
  exact plugin installed in `app/api/graphql/route.ts:79`. The plugin short-circuits at
  `didResolveOperation`, so the constraint rejection is validated end-to-end (same error
  shape operators see: `extensions.code = "BAD_USER_INPUT"`).
- Documents embed the oversized selection (the pre-existing 501-element fixtures) as
  **inline literals** — literal args are where the plugin stack currently evaluates in this
  runtime (see cross-file report); each bulk surface (input-object field for bulkCreate/
  toExpense, root arg for bulkDelete) is asserted.
- Assertions: exactly 1 error, message contains `no more than 500 in length`,
  `extensions.code === "BAD_USER_INPUT"`, and the mocked service was never called.
- Typing/lint constraints respected: no `as` assertions (oxlint `no-unsafe-type-assertion`
  bans `as unknown as`), no module augmentation in the test file (biome `noExportsInTest`),
  `GraphQLFormattedError` typing for `executeOperation` results, `JSON.stringify` for the
  literal builder (sonarjs `no-nested-template-literals`).

## Scope B verification — all ✅

- **i18n (7.1 / NFR-7)**: Swept every file in
  `frontend/common/views/dashboard/accounting/carryover/` for hardcoded user-visible
  strings (JSX text nodes, `label`/`title`/`placeholder`/`helperText` string props,
  sentence-case literals). Zero hits — all strings flow through the
  `DashboardAccountingCarryover` namespace (`useAppTranslation`) or ViewModel `labels`.
- **Accessibility (7.2)**:
  - Filter inputs: search text field carries `"aria-label": placeholder`
    (`CarryoverFilterBar.tsx:111`); paid-status radio group uses
    `FormLabel` + `aria-labelledby` (`CarryoverFilterBar.tsx:134-137`); teacher autocomplete
    and date range picker receive localized labels via their props.
  - Chips: `PaidStatusChip` and `DisabledTeacherChip` both set `aria-label` to the full
    localized chip label.
  - Dialogs: all four dialogs (`CarryoverFormDialog`, `BulkToExpenseModal`,
    `DeleteCarryoverDialog`, `UnpayCarryoverDialog` via `CarryoverConfirmScaffold`) render
    MUI `Dialog` with `DialogPresets` — focus trap and Escape-to-close are MUI defaults and
    are additionally guarded against closing mid-submit (`onClose={busy ? undefined : onClose}`),
    with close `IconButton` carrying the localized `ariaClose` label.
  - Grid: actions column aria-labeled (`CarryoverDataGrid.tsx:122`), `ariaLabel` on the grid
    (`:643`), localized `headerName`s; sortable-column announcement (`aria-sort`) is an
    MUI X DataGrid default.
- **RTL (7.3)**: zero direction-hardcoded styles found (`left:`/`right:`, `marginLeft`,
  `paddingRight`, `borderLeft`, `textAlign: left/right`, `flex-start/-end` literal strings) —
  the layout uses logical props (`marginInlineStart`, `InputAdornment position="start"`) and
  MUI's direction-aware defaults; flexbox `start`/`end` axis values flip with `dir`.
- **Logging (7.4 / NFR-11)**: `backend/services/teachers/carryover-balance.service.ts` emits
  structured `logger.info` on every bulk create (`:751`), to-expense (`:966`), unpay (`:1033`),
  single delete (`:1293`), bulk delete (`:1350`), plus manual create (`:1129`) and update
  (`:1217`) paths — matching the field semantics adjudicated in outcome 1.7–1.11
  (per-carryover `action`/`entityId` are carried by the audit rows written in the same
  transaction; truncation and ledger-unavailable fallbacks log `logger.warn`).
- No code fixes were needed in scope B; no UI tests were run (per task constraint).

## Verification

| Check | Command | Result |
|---|---|---|
| Mutation tests | `bun run test/scripts/run-test.ts backend/graphql/mutation/teachers/carryover.mutation.test.ts` | **39 pass, 0 fail** (343 expects) |
| Query sibling (shared scalar-guard/builder regress check) | `bun run test/scripts/run-test.ts backend/graphql/query/teachers/carryover.query.test.ts` | **20 pass, 0 fail** |
| sub-loop codescene | `backend/graphql/pothos/teachers/carryover.pothos.ts` | **exit 0** |
| sub-loop codescene | `backend/graphql/mutation/teachers/carryover.mutation.ts` | **exit 0** |
| sub-loop codescene | `backend/graphql/mutation/teachers/carryover.mutation.test.ts` | **exit 0** (fixes en route: return-type `GraphQLFormattedError`, nested template literal) |

## Files touched

| File | Change |
|---|---|
| `backend/graphql/pothos/teachers/carryover.pothos.ts` | `maxItems: 500` constraint on `instanceIds` and `carryoverIds` input fields. |
| `backend/graphql/mutation/teachers/carryover.mutation.ts` | `ids` arg switched to `t.arg.idList({ required: true, directives: { constraint: { maxItems: 500 } } })`. |
| `backend/graphql/mutation/teachers/carryover.mutation.test.ts` | Oversized-selection tests flipped to production-stack rejection assertions (in-process `ApolloServer` + real constraint plugin); `SelectionGuardCase` slimmed (`oversizedLiteralSource` replaces `oversizedVariables`/`capturedSelection`/`oversizedSelection`). |
| `.ai/plans/carryover-balance-module/outcome/7-verification-outcome.md` | This file. |

## CROSS-FILE DEPENDENCY (reported, not executed)

- **Target file(s)**: `app/api/graphql/route.ts` + dependency `graphql-constraint-directive`
  (both outside this task's assignment).
- **Rule/goal violated**: `@constraint(maxItems)` etc. are expected to gate list/size limits
  at the API boundary, but under `graphql@17.0.2` the plugin **silently skips all
  variable-bound argument validation** repo-wide: `graphql-constraint-directive@6`'s
  `QueryValidationVisitor` reads `.coerced` from `getVariableValues`, which in graphql v17
  returns `{ variableValues: { sources, coerced } }` (and the CJS/ESM dual-instance instance
  checks break coercion outright), leaving `variableValues === undefined`; all value-dependent
  checks become no-ops except `minItems`, which then fires on *every* request.
- **Evidence**: in-process `ApolloServer` + `createApollo4QueryValidationPlugin()` over a
  minimal schema — identical setup to `app/api/graphql/route.ts` — rejects a 501-id
  **literal** arg (`BAD_USER_INPUT`) but passes the same 501 ids **via variables** untouched.
  Affects every existing constrained field (`teacher-due.mutation.ts` `dueIds`,
  permission-management `permissionIds`, storage `sourcePaths`, carryover's new fields, all
  `maxLength`/`format` input constraints bound via variables).
- **Required fix**: upgrade/patch `graphql-constraint-directive` for graphql 17
  (or replace the plugin with a graphql-17-native validation rule), then add a
  variable-bound regression test. Until then every `maxItems: 500` directive is documentation
  at the API boundary, not enforcement (service layers remain the actual defense, and do
  reject empty selections).

## Carry-forward notes

- The generated SDL (`frontend/common/graphql/generated/schema.graphql`) was intentionally
  **not** regenerated: it is already dirty in the shared working tree with other agents'
  Phase-N work, and the new directives don't alter any generated TS input types
  (`[ID!]!` shapes unchanged — no codegen impact). It should be refreshed by whoever runs
  `bun run generate:gqlSchema` next in a clean tree.
- If the constraint stack is ever fixed for graphql 17, consider adding `minItems: 1` to the
  three inputs and extending the three oversized tests with a variable-bound variant.
- `ApolloServer` instances do not self-close in Bun test processes; the harness exits via
  the run-test runner without dangling handles observations (runtime ≤ 2 s), but if a future
  test runner hangs, call `constraintServer.stop()` in an `afterAll`.
