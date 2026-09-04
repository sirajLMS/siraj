# Knowledge Propagation Outcome — Credit Adjustment System

- **Status**: ✅ Done
- **Date**: 2026-08-30

## Deliverable 1 — Canonical doc

Created `docs/billing/credit-adjustments.md` (the repo-facing feature/pattern
reference, styled on `docs/billing/quota-system.md` / `credit-hours-system.md`).
Sections:

1. Ledger-relationship preface (class ledger via `changeAmount`; XOR CHECK)
   preserved; credit-hours ledger untouched; on-demand quota refresh triggered.
2. Architecture overview — ASCII data-flow map + layer→file table (enum →
   schema → repo → service → Pothos mutation → store/components).
3. Adjustment types & column model — three types + `CreditReason` mapping,
   the 5 added `credit_transactions` columns (TEXT ISO carryover dates
   convention, `.$type<>()` pin, default `'ADD'`), indexes, FK delete rule,
   the two date fences + shared `PAYMENT_DATE_MAX_FUTURE_DAYS` constant.
4. Service layer — `recordAdjustment` dispatcher order (permission → validate
   → dispatch) and the exact in-transaction ordering of
   `executeAdjustmentTransaction` with `path:line` refs verified against the
   live source (`credit.service.ts:205`/`credit.service.ts:863`).
5. Idempotency design — key segments (namespace + actor + payload, notes
   excluded), same-actor collapse vs cross-actor distinct, replay-pre-check
   before state-dependent guards (with the drained-balance rationale), 23505
   winner recovery, post-commit/only-on-new-row log+audit symmetry.
6. Security posture — permission-first gating, `findActiveById` soft-delete
   guards (`student.repository.ts:145`, `teacher.repository.ts:90`), sanitizer
   allowlist contract incl. the DOMPurify/jsdom ban rationale, LIKE escaping
   (`escapeLikeWildcards`) + parameterized FTS, best-effort audit shape,
   React-text notes rendering.
7. Frontend — pages, `creditAdjustFormStore` (clearCarryover / token rotation
   / reset-on-unmount), form composition (deep-link `?studentId=` preselection
   with summary-row workaround, dual cache eviction, client double-submit
   guard, `errorPolicy: "none"` mapping, `hasReasonText` fix), TipTap
   RichTextEditor↔sanitizer allowlist alignment, `resultsCappedHint(500)`
   caption, CLDR Arabic plurals, snapshot-regen caveat.
8. Carryover handoff seam — `CarryoverHandoffPayload` contract (incl.
   `approvedByUserId`, verified `carryover-handoff.ts:62` inserts the column),
   current no-op behavior, what the payout settlement workstream must replace,
   pointer to the pinned probe-branch suite + spy-based journey assertions.
9. Testing inventory — suite table (journeys, security workflows, service,
   idempotency, handoff, repo, migration, mutation, components, E2E,
   sanitizer) with file paths and what each proves.
10. Related documents (quota system, credit-hours, quota UI patterns).

No REQ/Task/`.ai/plans` tags in repo-facing text — verified via grep
(`Task |REQ-|TB\.|\.ai/plans|AC-\d|E\d+` → zero matches in the doc).

## Deliverable 2 — Root AGENTS.md pointer

Added one line in `AGENTS.md` "Important References", directly after the
credit-hours entry:

```
- `docs/billing/credit-adjustments.md` - Credit Adjustment System: manual Add/Subtract/Carryover operator adjustments, server-derived idempotency (lock-then-replay-check ordering), rich-text sanitizer, carryover payout handoff (plan: `.ai/plans/credit-adjustment-system`)
```

(Plan-pointer parenthetical mirrors the existing credit-hours entry format.)
Re-read the section after the edit — the line is in place; the on-disk
"changed" reminder was triggered by this edit itself.

## Deliverable 3 — Global invariant (decision: ADDED, generalizes)

Added one bullet to `backend/services/AGENTS.md` immediately after the
existing "Single-Orchestrator Write Pattern" bullet (the section where tx /
advisory-lock / idempotency guidance already lives):

```
- **Replay Pre-Check Ordering (idempotent transactions)**: Inside a locked idempotent transaction, the idempotency replay pre-check must run immediately after acquiring the lock, BEFORE any state-dependent guards (existence, balance, sufficiency). A replay must return the originally persisted row even when the state that guarded the first write has since moved; running guards first makes legitimate retries throw. See `docs/billing/credit-adjustments.md`.
```

Judgment: the existing write-pattern rule covers single-service ownership of
one transaction but says nothing about the ordering of the replay check vs
state-dependent guards; that ordering was a post-review HIGH defect with a
durable, feature-agnostic lesson. Incentive to add. No feature specifics in
the bullet itself — only the doc pointer.

## Verification

- Only markdown files were created/edited — per the task rules, no sub-loop
  runs were required (no code/config locale files touched).
- `docs/billing/credit-adjustments.md` re-read end-to-end post-write;
  plan-artifact tags grepped to zero; every `path:line` reference verified
  against live sources (`credit.service.ts:67/205/268/863`,
  `credit-adjustment.idempotency.ts:30`, `carryover-handoff.ts:53/62`,
  `findActiveById` in both repos).
- Root `AGENTS.md` Important References section re-read post-edit (line 447
  confirmed).

## Files touched

- `docs/billing/credit-adjustments.md` 🆕
- `AGENTS.md` ✏️ (one pointer line)
- `backend/services/AGENTS.md` ✏️ (one invariant bullet)
- `.ai/plans/credit-adjustment-system/outcome/knowledge-propagation-outcome.md` 🆕 (this file)

`trackable-tasks.md` untouched. No unrelated dirty files touched.

## Carry-forward notes

- Outcome-file facts that a future doc-reconciliation pass should watch:
  the payload's `approvedByUserId` is inserted into
  `teacher_carryover_balances` — the payout workstream must add that column
  when it ships the table.
- Known follow-ups documented by other outcomes (not propagated as rules):
  a dedicated `CREDIT_TRANSACTION` `AuditEntityType` instead of
  `entityType: "STUDENT"`; legacy purchase/read flows still accept
  soft-deleted students; `DashboardBillingCreditAdjustment` is not registered
  in the `Translation` lookup object (direct-handle imports only).
