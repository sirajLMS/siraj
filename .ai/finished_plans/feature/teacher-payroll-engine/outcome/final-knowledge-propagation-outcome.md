# Outcome — Knowledge Propagation (final task)

- **Status**: ✅ Done
- **Date**: 2026-08-30
- **Agent**: Orchestrator (W5 closure wave)

## Process

Read all 46 outcome files in `.ai/plans/teacher-payroll-engine/outcome/` (phase0
baseline → 8.4 rehearsal + post-implementation-review-R1), extracted recurring
patterns, applied the Feature-Name Litmus Test to every candidate rule.

## Propagated knowledge

| Artifact | Change | Litmus verdict |
|---|---|---|
| `docs/services/teacher-payroll.md` (NEW) | Canonical domain reference: surface map + permission gates, money-math invariants (BigInt minor units, REFUND "0", PARTIALLY current-row proration), idempotency schemes, D22 permission-filtered-surfaces precedent, 8.4 migration/backfill rehearsal evidence (21ms ADD COLUMN, 60-65 rows/s backfill, session_replication_role restore pattern, db-migrate env clobber), testing patterns (journey casts, audit-trigger cleanup, Playwright CSV download), gotchas (compounding partials, NUL byte D24, scope-auth ANY hole D19) | Feature specifics → doc only |
| `docs/IDEMPOTENCY.md` (appended) | Global rules: hash RAW input / persist SANITIZED; content vs client-token schemes under distinct prefixes; carry the key on append-only rows + bounded-window dedup | Global invariant — every future idempotency implementation |
| `backend/services/AGENTS.md` (appended `## Transactions & Concurrency (CRITICAL)`) | Advisory-lock ABBA rule (`advisoryLock: tx == null` when a caller tx exists) + raw-hash idempotency rule + doc pointer | Global concurrency invariant |
| `.agents/instructions/tests.instructions.md` (appended) | `await expect(...)` await-thenable lint rule (const+expect / return-expect.rejects patterns); audit_logs immutability-trigger cleanup pattern for journeys | Repo-wide test conventions |
| Root `AGENTS.md` (Important References) | `docs/services/teacher-payroll.md` entry | Doc discoverability |

## Rejected candidates (litmus failed → doc only)

- REFUND exact-string "0" CHECK contract; grace-settings keys 3/6/30; the 8
  payroll columns; PAGE_PERMISSIONS view-only nav contract; journey cast fixture
  names — all feature-specific, kept in the canonical doc only.

## Verification

- Final deferred gate: `grep -c "❌\|⚠️" deferred-items.md` = **0** (ledger
  closure wave: D8 ratified re-scope, D21 re-labeled In Progress (execution
  waived per user instruction), D23 ratified closed, D25 re-registered heading-order
  item, D19 `$all` text restored, template/doc glyph purge).
- Docs/AGENTS/instructions edits are markdown-only (no code, no sub-loop applicable).
