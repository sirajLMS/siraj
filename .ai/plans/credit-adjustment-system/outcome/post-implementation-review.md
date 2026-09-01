# Post-Implementation Review Wave — Credit Adjustment System

- **Status**: ✅ Complete (1 review wave + 1 fix wave; verification folded into fix agents)
- **Date**: 2026-08-29

## Review dispatch

Three parallel read-only reviews scoped to this plan's files only (filtered against the
Phase 0 baseline; 12 pre-existing modified files + foreign in-flight work excluded):

- **Backend review** — tx/TOCTOU, layering, migrations, mutation, tests.
- **Frontend review** — MUI v9, Apollo v4, React 19, Zustand, i18n, a11y, RTL, double-submit guard.
- **Types review** — canonical naming, enum mirror chains, import discipline, nullability.

## Findings & resolution

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | HIGH | Replay-before-guards: in-tx idempotency pre-check ran after balance/teacher guards; replay of a subtract after balance drained threw instead of returning the original row | Fixed — dedup check moved to immediately after advisory lock; regression test added |
| 2 | HIGH | Idempotency key excluded actor → cross-operator same-payload collapse (violates spec E14) | Fixed — `deriveAdjustmentIdempotencyKey(actorUserId, input)`; tests cover E14 and same-actor collapse |
| 3 | MEDIUM | `approvedByUserId` collected in handoff payload but dropped from INSERT | Fixed in `carryover-handoff.ts` + test |
| 4 | MEDIUM | Inverted JSDoc on idempotency | Fixed |
| 5 | MEDIUM | Reason-emptiness bypass via rich-text HTML ("`<p>&nbsp;</p>`") | Fixed — `hasReasonText` strips tags/entities before validation |
| 6 | MEDIUM | StudentCreditsList silent 500-row truncation | Fixed — translated `resultsCappedHint(limit)` caption + test + snapshots |
| 7 | LOW | Service-side hours bounds weaker than GraphQL (`Int` 1..100000) | `Number.isInteger` + `≤100_000` added |
| 8 | LOW | `requireCarryoverBlock` trim/return mismatch | Returns trimmed id |
| 9 | LOW | Replay paths logged/audited asymmetrically | Post-commit log+audit gated on `createdNewRow` |
| 10 | LOW | Plan-tag comment `(Task 1.2 / EC-9)` in schema file | Removed |
| 11 | LOW | Stale "sanitized" comment on input type | Corrected |
| 12 | LOW | Form didn't evict `studentById` on success | Added second `cache.evict` + test |
| 13 | LOW | Payment-date fence constant duplicated | Shared `creditAdjust.constants.ts` |
| 14 | LOW | TipTap stale `onChange` closure | Ref-mirror pattern (defensive; not reproducible on v3 — documented) |
| 15 | LOW | Arabic success toasts lacked CLDR plural forms | one/two/few/many branching added per quota-ui patterns |

## Carried as documented-accepted (no fix)

- SQLite drizzle mirror missing the new columns — **pre-existing repo-wide drift** (mirror predates payroll columns too); flagged to owners, not a plan defect.
- Shared Pothos field block widening schema surface of transaction/purchase types — accepted (columns physically exist on the table).
- Legacy `recordPurchase`/read paths still accept soft-deleted students — noted by TB.4; out of plan scope.

## Verification after fixes

- sub-loop `--lifecycle codescene`: exit 0 on all 21 modified files.
- `test:workflows`: 50 pass / 1 pre-existing fail (payroll `lesson-report-lifecycle` cleanup — not this plan).
- Service 42/42, idempotency 22/22, handoff 9/9, journeys 7/7 + 8/8 + 8/8; form 12/12, list 6/6, editor 9/9.

## Zero new feature-specific findings remain outstanding.
