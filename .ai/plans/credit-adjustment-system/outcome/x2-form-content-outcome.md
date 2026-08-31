# x2 Outcome — Credit adjust form content deltas (frontend)

- **Status**: ✅ Done
- **Date**: 2026-08-30

## Summary

Implemented the four prototype-inspired form deltas on top of the x1 backend
`internalNotes` extension: per-type card descriptions, a live balance-context
surface with outcome preview, a pre-submit summary strip plus a full-width
error band, and the plain-text Internal Notes field wired store → mutation.

## What changed, per delta

### 1. Type-card descriptions — `AdjustmentTypeRadioGroup.tsx`

Each card's icon+label stack gains a one-line description `Typography`
(`addDescription` / `subtractDescription` / `subtractWithCarryoverDescription`)
in its own `minWidth: 0` sub-stack, clamped at 2 lines
(`display: "-webkit-box"`, `WebkitLineClamp: 2`) so a long translation can't
unbalance the card row. The vertical-centering (`justifyContent: { sm:
"center" }`, `height: { sm: "100%" }`) and compact-mobile row layout from the
visual-fix passes are untouched. Selected cards tint the description with the
`on<Family>Container` token alongside the label; unselected use
`text.secondary`.

Side effect: the accessible name of each radio now includes the description
("Add Grant bonus hours"). Tests compensate with an anchored
`label + " " + description` regex (`radioNamePattern`); a bare `^Subtract`
prefix would collide with the carryover card.

### 2. Balance context + live preview — `CreditAdjustForm.tsx`

- `studentByIdQueryDocument` is now keyed on the **store's** `studentId`
  (was: only the deep-link prop), so the summary card (`SelectedStudentCard`,
  extracted from the component body during the CodeScene complexity fix — same
  JSX, palette tokens, name-ellipsis and BALANCE-chip layout byte-identical)
  is live for both deep links and manual picks. A stale row whose id no longer
  matches the store id is never rendered.
- Preview: `computeBalancePreview(row, type, hours)` returns
  `{ from, to } | null` (Add → `remaining + hours`; Subtract/Carryover →
  `remaining − hours`). Rendered as `<Alert severity={to < 0 ? "error" :
  "info"}>` with `t.preview.balance(from, to)` directly under the student
  card. Renders **only** when the row loaded, `classesRemaining` is a number,
  and hours is a positive integer — zero-state shows nothing.

### 3. Pre-submit summary + error band — `CreditAdjustForm.tsx`

- `buildSummaryText(t, draft, studentName)` (module scope): ADD →
  `summary.add(hours, name)`; SUBTRACT → `summary.subtract(hours, name)`;
  CARRYOVER → `summary.carryover(hours, teacherName, paymentDate)` with the
  teacher name resolved from the person-picker cache (`resolveTeacherDisplayName`),
  falling back to the plain subtraction wording until teacher/date resolve.
  Rendered as an `info` Alert directly above the action row, re-derived every
  render from the store.
- Rejected mutations now set a `submitError` state (`{ code, message }`)
  rendered as a full-width `error` Alert: `extensions.code` in a `Chip` next
  to the server's localized message. The band replaces the old error toast
  (`Severity: "error"` toast path removed); `INSUFFICIENT_CLASSES` keeps its
  inline hours-field error in addition to the band. The band clears at the
  start of each new submit attempt; retry semantics (`submittedTokenRef`
  reset) unchanged.

### 4. Internal Notes — store, document, form

- `creditAdjustFormStore.ts`: new `internalNotes: string` field (default `""`)
  + `setInternalNotes`; `reset()` restores the default via
  `buildInitialFields()` (carryover-clear semantics untouched).
- `credit-adjustment.documents.ts`: `internalNotes` added to the mutation
  selection set; `bun codegen` regenerated `RecordCreditAdjustmentMutation`.
- Form: plain multiline `TextField` (minRows 2) below the Reason editor,
  label `form.internalNotes`, helper `form.internalNotesHint`,
  `maxLength: 2000` on the input (mirrors the server cap).
- `buildAdjustmentInput` trims and sends `internalNotes: undefined` when blank
  — the key still satisfies the generated `string | null | undefined` member
  while the value collapses out of the payload.

## i18n

New keys in `shared/locale/types/dashboard/billing/creditAdjustment.ts`
(structural, additive): `adjustmentType.{add,subtract,subtractWithCarryover}Description`,
`form.internalNotes`, `form.internalNotesHint`, `preview.balance(from, to)`,
`summary.add/subtract/carryover(hours, …)`. Arabic leaves apply CLDR-style
pluralization (1 / 2 / 3–10 / other) exactly like the existing `success.*`
toasts. `bun run locale:snapshots` → 254 processed, 103 written — of those,
`{en,ar}/dashboard.billing.creditAdjustment.json` are mine; the rest are
other in-flight workstreams' edits, left untouched per the shared-tree
convention.

## Verification

- **Sub-loop `--lifecycle codescene` (exit 0)**: `creditAdjustFormStore.ts`,
  `credit-adjustment.documents.ts`, all three locale files,
  `AdjustmentTypeRadioGroup.tsx`, `CreditAdjustForm.tsx` (2 rounds: optional-
  chain + cognitive-complexity fixes — the card extraction), the test file
  (1 round: hoist regex escaper).
- **Tests**: `bun run test/scripts/run-test.ts
  test/ui/components/accounting/CreditAdjustForm.test.tsx` → **17 pass / 0
  fail / 83 expects** (12 pre-existing all green). New tests:
  1. all three card descriptions render;
  2. preview hidden in zero-state, shows `14 → 16` for Add, flips to `14 → 12`
     on Subtract, disappears when hours are cleared;
  3. summary strip renders the Add wording, then Subtract, then the carryover
     wording once teacher/date resolve (teacher name via the picker cache);
  4. typed internal note arrives in the mutation variables;
  5. a `VALIDATION` rejection renders the band with code chip + message, no
     navigation, no toast.
- Existing tests' mutation fixtures pass `internalNotes: undefined`, matching
  the form's omit-when-blank behavior (generated input type requires the key
  with an `undefined`-able value).
- No prototype row data hardcoded; no plan tags in comments.

## Files touched

- `frontend/common/stores/creditAdjustFormStore.ts`
- `frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents.ts`
- `frontend/common/graphql/generated/gql/graphql.ts` (codegen)
- `shared/locale/types/dashboard/billing/creditAdjustment.ts`
- `shared/locale/en/dashboard/billing/creditAdjustment.ts`
- `shared/locale/ar/dashboard/billing/creditAdjustment.ts`
- `frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.tsx`
- `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx`
- `test/ui/components/accounting/CreditAdjustForm.test.tsx`
- `public/static/locale-snapshots/{en,ar}/dashboard.billing.creditAdjustment.json`

## Notes / follow-ups

- The summary card query now fires for manual picks too; tests mock the row
  (`preselectedStudentMock`) wherever a student id reaches the store.
- The error band clears only on the next submit attempt (not on every
  keystroke) — deliberate; it stays readable as the authoritative rejection
  until the operator retries.
