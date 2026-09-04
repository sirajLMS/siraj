# TB.3 Outcome — Payroll Permission Denials Journey

## Summary

`test/workflows/payroll/payroll-permission-denials.test.ts` (5 steps) is written, gated, and green. The journey lands one calculated baseline row (teacher telemetry → operator terminal stop → CALCULATED 120.00 SAR), then the four unauthorized actors — teacher (`teacher_default`), parent (permissionless), student (`student_default`), and a non-payroll staff member (`staff_default`, real system group that holds no payroll grants) — probe every payroll surface: the `payrollReport` query service, the CSV export permission gate, and the `applyPayrollOverride` mutation. A view-only auditor (custom non-system group whose ONLY grant is `accounting.payroll_view`) proves view access covers report reads and the export gate but never the override mutation. Final step proves the denial barrage wrote nothing: instance rows byte-identical (including `updatedAt`), event counts unchanged, zero `PAYROLL_OVERRIDE` events, zero `audit_logs` rows attributable to the run's actors, zero notification dispatches.

## Files

- **Created** `test/workflows/payroll/payroll-permission-denials.test.ts` — the journey (5 tests).
- **Modified** `test/workflows/payroll/DIAGRAMS.md` — appended the journey's `sequenceDiagram` section (3/3 blocks validate OK).
- **Bookkeeping** this outcome file + TB.3 checkbox in `trackable-tasks.md`.
- No product code, no helper, no schema, no git changes. No commit (orchestrator commits).

## Journey steps (what each proves)

| Step | Proves |
|---|---|
| 1 | Baseline: teacher activate+start, operator stop commit COMPLETED + CALCULATED 120.00 in one transaction; `CLASS_COMPLETED` fan-out intercepted and awaited (`waitForEventDispatchToUser`) then spy cleared; baseline snapshot of all 3 cast instances (13-field payroll projection incl. `updatedAt`) + per-instance `class_status_events` counts + zero `audit_logs` rows for all 6 run actors. |
| 2 | `getReport` denies teacher, parent, student, staff with `ForbiddenError` + `tErrors.insufficientPermissions` (asserted via `Promise.all` + `expectJourneyError`, never `.rejects`). Positive control: the view-only auditor reads the CALCULATED row (120.00) through the same call — the denials are honest permission outcomes, not vacuous. |
| 3 | CSV export gate: `requirePermission(actor, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors)` — the exact gate `GET /api/payroll/export` runs after session resolution, before any payroll read — denies all four; the view-only auditor passes (view covers the CSV surface). |
| 4 | `applyOverride` denies all four AND the view-only auditor (`VIEW` cannot override — the gate demands `ACCOUNTING_PAYROLL_MANAGE`). |
| 5 | State untouched: instance projections `toEqual` baseline (no field, no timestamp moved), event counts identical, zero `PAYROLL_OVERRIDE` events on the calculated row, zero `audit_logs` rows for the run's actors, `dispatchSpy.mock.calls.length === 0`. |

## Verification evidence

- **Journey runs** (mandatory runner `bun run test/scripts/run-test.ts test/workflows/payroll/payroll-permission-denials.test.ts`): **5 pass / 0 fail / 51 expect() calls**, exit 0 — reproduced twice (deterministic; self-cleanup verified by second run + DB scan).
- **Full suite** `bun run test:workflows`: **74 pass / 0 fail / 617 expect() calls across 11 files**, exit 0 (was 69/0/566 across 10 files before TB.3; the suite remains fully green).
- **Static gates** `bun run scripts/health/sub-loop.ts test/workflows/payroll/payroll-permission-denials.test.ts --lifecycle codescene`: **exit 0 on the first run** (tsgo, oxlint, biome:check, lint:type-aware, check:duplicates, codescene all green).
- **Diagrams** `bun run validate:mermaid test/workflows/payroll/DIAGRAMS.md`: 3/3 blocks OK.
- **DB hygiene** (scratch pg script against the `.env.test` database): zero `jrn_deny_%` rows in `users`, `permission_groups`, `class_categories`, `class_subjects` after both runs.
- **No e2e runs** (per session constraint) and no `runInRollback` (workflow-layer canon).

## Key facts established (for the penetration wave)

- `requirePermission(userId, AppPermission.X, tErrors)` throws `ForbiddenError(tErrors.insufficientPermissions)` through the live `user_permission_groups → group_permissions → permissions` join — no cache, so freshly committed memberships resolve immediately.
- Migration 36 grants `accounting.payroll_{view,manage}` ONLY to `super_admin` + `academy_admin`. `staff_default` holds accounting credits/payments grants (migration 33) but NO payroll grants — an honest "non-accounting-for-payroll" staff actor via real group membership.
- View-only auditor pattern: insert a non-system `permission_groups` row (slug `<prefix>_payroll_viewer`) + one `group_permissions` row referencing the existing `accounting.payroll_view` catalog permission + one `user_permission_groups` membership. The system-permission trigger is untouched (no `permissions` inserts; group is `is_system: false`). Cleanup: explicit membership/grant deletes + group delete + user delete (cascade also covers it).
- Permission gates fire BEFORE any read/write in both surfaces: `getReport` gate precedes `findPayrollReportRows`; `applyOverride` gate precedes validation, idempotency, and the write transaction — so a denied call cannot touch state (step 5's byte-identical snapshot proves it end-to-end).
- The denials mirror NOTHING into `audit_logs` (only successful overrides call `emitOverrideAuditLog`), so the journey's `afterAll` needs NO audit-trigger sweep — plain cast cleanups suffice, exactly as TB.2 predicted.

## Deliberate decision — CSV export leg exercised beneath the cookie layer

The dispatch instruction anticipated either (a) importing the route's GET handler with a forged session cookie, or (b) calling the permission-checked composition beneath it, "following the repo precedent EXACTLY". Precedent check: NO file under `test/workflows/` imports `next/server`, a route handler, or `getServerUserContext` (verified by grep); the sibling `credit-adjustment-security` workflow suite tests route-adjacent denials through the service/permission layer with real permission rows, and the route handler itself (including its 403 path, gate ordering, and "service never called" proof) is already covered by `app/api/payroll/export/route.test.ts` (12 unit tests, task 2.6). `getServerUserContext()` reads the Next cookie store (`cookies()`), which cannot resolve inside `bun:test` without `mock.module`-ing `@/backend/lib` — that would replace the real error classes and violate the workflow layer's real-services canon. Decision: the journey calls the route's exact auth composition — `requirePermission(actor, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors)` (imported from the same `@/backend/services` barrel the route uses) plus the service `getReport` denial (defense-in-depth layer) — with real permission rows. This covers every payroll-permission branch of the route except the 401 cookie-resolution branch, which belongs to the unit-tested route layer, not the DB-backed journey layer.

## Carry-forwards for the penetration wave (TB.5)

- Reusable denial-matrix shape: `Promise.all` over actor ids + `expectJourneyError` + `instanceof ForbiddenError` + translated message — one line per surface; actors resolve through real group rows.
- The view-only auditor fixture (custom group + single `group_permissions` grant) is defined INSIDE this test file; if the penetration wave needs a MANAGE-less or VIEW-less matrix again, promote it into `test/workflows/helpers/` rather than duplicating.
- `force`-flag escalation (`force: true` without `ACCOUNTING_PAYROLL_MANAGE`) still lands on the same `requirePermission` gate — the gate precedes input validation, so no new surface is reachable; the pentest wave should still probe it explicitly.
- `getClassStatusEvents` surface still lacks `actorUserId` (D22 open); this journey read raw `class_status_events`/`audit_logs` for attribution — same approach for TB.5.
- CSV export query-string abuse (wildcards, oversized `search`) is guarded at the route layer (400 paths unit-tested in 2.6); the service search wildcard-escaping lives in the repository (1.2) — the pentest wave should re-probe through `getReport` with hostile filters.

## Cross-file dependencies

- None blocking. Informational: concurrent sub-loop runs against `backend/services/teacher/payroll-calculation.service.test.ts` (another agent's TB.4 work) were observed queueing on the process-lock; no interference with this journey's runs.
