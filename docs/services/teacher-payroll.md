# Teacher Payroll Engine — Domain Reference

> Canonical reference for the teacher-payroll calculation engine (spec plan
> `teacher-payroll-engine`). Consolidates architecture, invariants, and
> battle-tested gotchas discovered during implementation. Feature specifics
> live HERE, not in AGENTS.md rule files.

## Surface Map

| Surface | Path | Gate |
|---|---|---|
| Calculation service | `backend/services/teacher/payroll-calculation.service.ts` | `calculateForInstance`/`applyOverride` = `ACCOUNTING_PAYROLL_MANAGE`; `getReport` = `ACCOUNTING_PAYROLL_VIEW` |
| Grace settings resolver | `backend/services/teacher/payroll-grace-settings.ts` | no gate (pure settings read; silent defaults 3/6/30) |
| Override idempotency | `backend/services/teacher/payroll-override.idempotency.ts` | pure function |
| Repo extension | `backend/db/repo/scheduling/class-instances.ts` (`getById` forUpdate / `updatePayrollCalculation` / `findPayrollReportRows`) | service-gated |
| Events idempotency read | `backend/db/repo/scheduling/class-status-events.repository.ts` (`findRecentByInstanceAndHash`) | service-gated |
| GraphQL | `backend/graphql/{query,mutation}/teachers/payroll.*` + `pothos/teachers/payroll.pothos.ts` | scope-auth + service re-check |
| CSV export | `app/api/payroll/export/route.ts` | `ACCOUNTING_PAYROLL_VIEW` (session + requirePermission) |
| Reports UI | `frontend/common/views/dashboard/accounting/payroll/**` + desktop/mobile tiers | page `withPageAuth([VIEW])`; nav `PAGE_PERMISSIONS.accountingPayrollView` (VIEW-only by design, ratified D23) |
| Backfill | `scripts/payroll-backfill.ts` | MANAGE actor required (`--actor-user-id`); 500-row cap/run; idempotent on `payroll_calculated_at` |
| Teacher settlement | `teacher-due.service.ts` (accrual from `teacherPaidAmount` on lesson-report approval; `WAITING_PAID` → `PAID`) | own-teacher visibility |

## Calculation Invariants

- **Money is BigInt minor units end-to-end.** `numeric(12,2)` columns serialize as
  strings; every arithmetic step happens in minor units. REFUND persists the exact
  string `"0"` (CHECK contract); PARTIALLY prorates the CURRENT row amount
  (`row.teacherPaidAmount ?? fresh calculation`) per AC-6.6, then writes
  `is_partial_percentage`.
- **Terminal-only, PAID-immutable.** Calculation writes require a terminal
  execution state; `PAID` blocks everything (force included). `WAITING_PAID`
  blocks overrides unless `force` (settlement protection).
- **Four-branch classification** keys on outcome + attendance telemetry:
  teacher-absence = `actualStartAt IS NULL` (zero pay, ratified AC-4.4 override);
  student-absence = ABSENT + telemetry present (full pay); late windows use the
  grace settings (short/long/threshold) resolved per call with wholesale fallback
  to defaults on ANY negative/unparseable value.
- **Auto-trigger on stop** runs in the caller's transaction via
  `calculateForInstance(input, tErrors, tx)`; failures degrade the row to
  `NOT_CALCULATED` with an `"Auto-calc failed: <reason>"` note — never roll back
  the state change (AC-2.5).
- **Reconciliation path**: operator `applyOverride` in Calculated mode re-runs the
  calculator inline — the zero-telemetry historical-rows backfill path.

## Idempotency Scheme (see `docs/IDEMPOTENCY.md` for the global rules)

- Overrides: `sha256("payroll-override:" + instanceId + ":" + targetStatus + ":" +
  (partialPercentage ?? "") + ":" + (note ?? "") + ":" + (force ?? false))` —
  the RAW note is hashed while the SANITIZED note is persisted. A provided
  `clientRequestId` keys on `(instanceId, token)` under a distinct prefix;
  blank/absent falls back to the content key.
- Calculations: content-derived `sha256("payroll-calculation:{instanceId}:{status}:{duration}:{amount}")` — replay-safe by construction.
- Events: every payroll event write carries `toState.idempotencyKey`;
  `findRecentByInstanceAndHash` collapses duplicates inside a 30s window.

## Permission Filtering on Derived Surfaces (D22 precedent)

Surfaces that embed domain-sensitive JSONB (e.g. `class_status_events`
`fromState/toState` carrying payroll amounts) MUST filter the sensitive event
types per viewer permission — `getClassStatusEvents` drops `PAYROLL_*` events for
actors without `ACCOUNTING_PAYROLL_VIEW` (in-memory filter after the per-instance
read; no extra query). The instance-detail surface strips the 8 payroll snapshot
fields the same way (`withoutPayrollSnapshot`).

## Migration & Backfill Notes (8.4 rehearsal evidence)

- The 3 payroll migration units are additive: nullable columns (constant default
  = catalog-only ADD COLUMN, ~21ms ACCESS EXCLUSIVE on PG 18), enum values,
  settings INSERTs. Rehearsal: row count unchanged, columns nullable/defaulted,
  re-runs no-op via the drizzle journal.
- Backfill throughput ≈ 60–65 rows/s (sequential, per-row calculator); plan the
  500-row cap loop for large datasets (2645-row staging: 3 runs + idempotent 4th
  with 0 candidates).
- Two-phase `pg_dump` section restores (pre-data/data, post-data separately) can
  surface FK validation errors from concurrent writes between dumps — restore
  data with `SET session_replication_role = replica` for snapshot fidelity, or
  use a single consistent dump.
- `bun run db migrate` CLI clobbers `process.env.DATABASE_URL` from `.env`
  (applyEnvFile); to migrate an alternate DB, invoke
  `bun --no-env-file run backend/db/scripts/migrate.ts` with the env parsed and
  `DATABASE_URL` overridden to the target.

## Testing Patterns Proven Here

- Journey casts: `provisionPayrollJourneyCast`/`cleanupPayrollJourneyCast`
  (`test/workflows/helpers/payroll-cast.ts`) — operator w/ VIEW+MANAGE, teacher,
  student, parent, view-only auditor fixture (custom group + single grant).
- Audit-writing journeys must clean `audit_logs` under the immutability trigger
  (DISABLE → delete own rows → ENABLE in `finally`).
- CSV download verification: Playwright `waitForEvent("download")` +
  `suggestedFilename` + `saveAs` + quote-aware parser (see the payroll e2e spec).

## Gotchas

- `applyOverride` mirrors overrides into append-only `audit_logs` protected by
  `prevent_audit_log_mod_trigger` — test cleanup needs the trigger dance above.
- PARTIALLY percentage applies to the CURRENT row amount, so sequential partials
  compound (product semantics — pinned by the pentest P5 probe).
- NUL bytes in user text pass `sanitizePlainText` and explode at the pg driver
  (SQLSTATE 22021 → 500-class); tracked as deferred D24 for a global input pipe.
- The GraphQL scope-auth ANY-semantics hole (D19): multi-key authScope maps are
  OR-ed unless wrapped in `$all` — the payroll mutation uses `$all`; repo-wide
  hardening is a separate wave.
