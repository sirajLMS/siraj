# Task TB.1 Outcome — Carryover Bulk-Create Settlement Journey

- **Date**: 2026-09-05
- **Status**: ✅ Complete (7 tests / 129 expects, all green)

## What was implemented

`test/workflows/accounting/carryover-bulk-create.journey.test.ts` — cross-actor journey for the
bulk-create settlement flow, plus its cast helper `test/workflows/helpers/carryover-create-cast.ts`
(registered in the helpers barrel). Real services + real DB, committed fixtures, tracked `afterAll`
cleanup, no `runInRollback`, honest permission groups, notification dispatch spied via
`spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`.

### Cast composition

- `provisionCarryoverCreateCast(prefix)` (new helper): `academy_admin` operator, two SAR-rated
  teachers, one household (parent + two students), three committed **audited** sessions
  (terminal `COMPLETED/TAKEN`, `calculationStatus: CALCULATED`, `calculatedDuration`,
  `teacherPaidAmount`/`teacherPaidCurrency`) — 2 sessions teacher A (student A 60 min/120.00,
  student B 90 min/180.00) + 1 session teacher B — split 2:1 across the local rate cascade-free
  fixtures. Subject/category are run-prefixed via `createCastSubjectPair`.
- `legacySession` — a fourth audited teacher-B session used only by the already-linked denial step
  (see below).
- Actors extra: `provisionCarryoverExpenseExtras` (existing helper from the TB.2 sibling wave) —
  second `academy_admin` operator + a VIEW-only auditor whose custom run-prefixed group grants
  exactly `accounting.carryover_view`.

### Journey steps (per TB.1)

1. **Precondition** — audit grid (`SessionAuditService.getReport`) shows all sessions `CALCULATED`;
   carryover report is empty for both operators and the viewer.
2. **Denial** — VIEW-only auditor calling `bulkCreateCarryoverBalances` is rejected
   (`insufficientPermissions`) before any write; DB rows/link columns untouched.
3. **Bulk create** — operator aggregates all three sessions → 2 groups (teacher A: payable `300.00`,
   duration `2.50`, studentsCount 2, SAR, comma-joined both students' names in `studentsText`;
   teacher B: `120.00`/`1.00`), 2 `auditLogIds`; committed carryover rows unpaid (`paid "0"`);
   item snapshots persist original amount/currency/`CALCULATED` status with null conversion
   columns; every session is `WAITING_PAID` with `carryoverBalanceId` pointing at its teacher's
   carryover (asserted on committed rows, not the return value).
4. **Side effects** — exactly one `CARRYOVER_CREATE`/`CARRYOVER_BALANCE` audit row per carryover,
   attributed to the operator and keyed on the carryover id; one "Linked to carryover …"
   `PAYROLL_STATUS_TRANSITION` event per session, attributed to the operator and carrying the right
   carryover id.
5. **Cross-actor visibility** — the second operator and the VIEW-only auditor read both carryovers
   via `getReport` and the linked-session snapshots via `getLinkedSessions`
   (`originalStatus CALCULATED` → `currentStatus WAITING_PAID`); both operators see the sessions as
   `WAITING_PAID` on the audit grid feed. Teacher role (`teacher_default`) is denied every
   carryover read (`insufficientPermissions`).
6. **Re-selection denials** — the legacy-linked audited session (linked via a direct fixture UPDATE,
   teaching the guard's real reachability; noted in-code) is rejected with
   `CARRYOVER_SESSION_ALREADY_LINKED`; re-selecting the already-linked original set is rejected with
   `CARRYOVER_SESSION_NOT_AUDITED` (the WAITING_PAID state trips the audited guard first — the
   honest ordering in production), zero writes, zero audit rows for the second operator.
7. **No dispatch** — bulk create dispatches no notifications; the spy stays at zero calls after a
   settle window.

## Files touched

| File | Change |
|---|---|
| `test/workflows/accounting/carryover-bulk-create.journey.test.ts` | 🆕 7-step journey. |
| `test/workflows/helpers/carryover-create-cast.ts` | 🆕 cast provision + FK-safe cleanup (incl. carryover rows by teacher, the legacy-linked session, and trigger-lifted audit_logs sweep handled in the journey's `afterAll`). |
| `test/workflows/helpers/index.ts` | ➕ `export * from "./carryover-create-cast";` |
| `test/workflows/accounting/DIAGRAMS.md` | ➕ `carryover-bulk-create.journey.test.ts` section (sequenceDiagram); `bun run validate:mermaid` → all 9 blocks OK. |

## Verification

- `~/.bun/bin/bun run test/scripts/run-test.ts test/workflows/accounting/carryover-bulk-create.journey.test.ts`
  → **7 pass / 0 fail / 129 expects** (run twice: once after lint refactors).
- `~/.bun/bin/bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` → **exit 0** for all
  three TS files (fixed en route in the journey: unused event constant removed, `[...x].sort()` →
  `toSorted(compareIds)` for `no-array-sort` + `sonarjs/no-alphabetical-sort`, `Promise.all`
  restructuring for `no-await-in-loop`).
- Audit cleanup follows the journey-layer trigger protocol (`prevent_audit_log_mod_trigger`
  disabled → run-scoped row sweep → re-enable in `finally`).

## Carry-forward

- **`CARRYOVER_SESSION_ALREADY_LINKED` is unreachable on a real same-set re-selection.** The service
  validates audited status before the link guard, and every service-created link atomically moves
  the session to `WAITING_PAID`; re-selecting the same ids therefore lands on
  `CARRYOVER_SESSION_NOT_AUDITED`. The already-linked guard is only reachable through a row linked
  while still audited — the journey stages that via a direct fixture UPDATE (legacy/migrated data
  shape). Consider validating the link guard first (or documenting the ordering) if the spec (TB.1)
  intends plain re-selection to surface `ALREADY_LINKED`.
- The cast helper is reusable for future carryover journeys needing audited-session fixtures.
