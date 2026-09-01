# Phase 0 — Baseline Outcome (teacher-payroll-engine)

- **Date:** 2026-08-29 (captured ~02:15–02:21 UTC)
- **Branch:** `feat/teacher-payroll-engine` (created via `git checkout -B feat/teacher-payroll-engine master`, HEAD = `afb9601518` "plan")
- **Captured by:** P0-baseline subagent (SKILL.md §Phase 0 — Baseline Capture)

---

## Baseline Numbers

| Metric | Value | Evidence |
|---|---|---|
| tsgo errors (`grep "error TS" \| wc -l`) | **0** | `/tmp/baseline-tsgo.txt` — `bun tsgo` exit 0 (runs `tsgo -b --noEmit` via locked cmd) |
| biome warnings (`grep -c "warn"`) | **1** | `/tmp/baseline-biome.txt` — "Checked 6051 files in 5s. No fixes applied. Found 1 warning." |
| lint-service (`scripts/lint-service.ts --json --id baseline`) | **PASS** — exit 0, 739-byte JSON, `success: true`, `exitCode: 0`, scope=full-repo, durationMs=15127 | `/tmp/baseline-lint.json` |
| git stash count | **2** | `/tmp/baseline-stash.txt` — `stash@{0}: On master: wip before pr69`, `stash@{1}: On master: S7-final-baseline` |

### Pre-existing issues to ignore during post-implementation review

- **Biome 1 warning:** `.claude/skills internalError/fs — Dereferenced symlink` (broken symbolic link inside `.claude/skills`). Environmental, not a code defect — expect it to persist in every `biome:check` run.
- **lint-service output** contains only a Node `ESLintPoorConcurrencyWarning` performance notice (harmless).
- **tsgo:** clean — any `error TS` after implementation is NEW and owned by this plan.

## .env / DB_MODE Verification

- `.env` present with `DATABASE_URL` (scheme `postgresql`) and `DB_PROVIDER=postgres` → **PostgreSQL is the active provider** (matches EXPERIENCE.md: PG is primary dev DB; no sqlite fallback active).
- `.env.test` **exists** and also has `DB_PROVIDER=postgres` + `postgresql` scheme.
- No credentials/connection strings recorded here by policy.

## Deferred-Items Ledger

- `deferred-items.md` **created** from `.agents/spec-process-guide/templates/deferred-items-template.md` (154 lines).
- Structure: Ledger Table (`ID | Deferred Item | Source Task | Target Task | Status | Verified By | Notes`); status values: ✅ Done / ⚠️ Partial / ❌ Blocked / 🔄 In Progress.

## git diff --name-only Baseline (pre-existing modified files — IGNORE in post-implementation review)

Point-in-time snapshot captured to `/tmp/baseline-files.txt` (`git diff --name-only` + `git diff --cached --name-only`, deduped/sorted; 103 files). These belong to OTHER in-flight plans (credit-adjustment-system, student-credit-hours-system, and prior work) — do not touch or commit them as part of teacher-payroll-engine:

```
.agents/instructions/backend.instructions.md
.agents/instructions/frontend.instructions.md
.agents/skills/drizzle/SKILL.md
.agents/skills/spec-driven-development/SKILL.md
.agents/skills/spec-implementation/SKILL.md
.agents/skills/stitch/SKILL.md
.ai/plans/IMPLEMENTATION-ORDER.md
.ai/plans/credit-adjustment-system/deferred-items.md
.ai/plans/credit-adjustment-system/outcome/0.1-0.2-enums-outcome.md
.ai/plans/credit-adjustment-system/outcome/0.3-permission-outcome.md
.ai/plans/credit-adjustment-system/outcome/0.4-schema-outcome.md
.ai/plans/credit-adjustment-system/outcome/0.5-migration-outcome.md
.ai/plans/credit-adjustment-system/outcome/0.6-regression-outcome.md
.ai/plans/credit-adjustment-system/outcome/1.1-types-outcome.md
.ai/plans/credit-adjustment-system/outcome/1.2-repo-outcome.md
.ai/plans/credit-adjustment-system/outcome/1.3-idempotency-outcome.md
.ai/plans/credit-adjustment-system/outcome/1.4-sanitizer-outcome.md
.ai/plans/credit-adjustment-system/outcome/phase0-baseline-outcome.md
.ai/plans/credit-adjustment-system/trackable-tasks.md
.ai/plans/student-credit-hours-system/outcome/13-quality-gate-outcome.md
.ai/plans/student-credit-hours-system/outcome/14-knowledge-propagation-outcome.md
.ai/plans/student-credit-hours-system/outcome/TB.1-outcome.md
.ai/plans/student-credit-hours-system/trackable-tasks.md
.ai/plans/teacher-payroll-engine/prototype/payroll-override-dialog.png
.ai/plans/teacher-payroll-engine/prototype/payroll-reports-page.png
AGENTS.md
app/AGENTS.md
app/api/health/db/route.ts
app/error.tsx
app/global-error.tsx
backend/db/drizzleRelations.ts
backend/db/factory.ts
backend/db/http-client.ts
backend/db/migration/35-accounting-credits-permission.sql
backend/db/repo/AGENTS.md
backend/db/repo/billing/credit.repository.ts
backend/db/schema/AGENTS.md
backend/db/schema/billing/credit-transactions.ts
backend/db/schema/enums.ts
backend/db/test/migrations/credit-adjustment-columns.test.ts
backend/db/test/repo/billing/credit-adjustment.repository.test.ts
backend/drizzle/.custom-migrations.json
backend/drizzle/20260828212837_custom_35-accounting-credits-permission/migration.sql
backend/drizzle/20260828222827_fair_justice/migration.sql
backend/drizzle/20260828222827_fair_justice/snapshot.json
backend/enum/AGENTS.md
backend/enum/billing/credit-adjustment.enum.ts
backend/enum/billing/index.ts
backend/enum/permissions/permission.enum.test.ts
backend/enum/permissions/permission.enum.ts
backend/graphql/pothos/shared/enum.pothos.ts
backend/lib/errors.ts
backend/lib/index.ts
backend/lib/retry.ts
backend/lib/sanitize/index.ts
backend/lib/sanitize/richTextSanitizer.test.ts
backend/lib/sanitize/richTextSanitizer.ts
backend/lib/test/db-unavailable.test.ts
backend/lib/test/retry.test.ts
backend/services/AGENTS.md
backend/services/billing/carryover-handoff.ts
backend/services/billing/credit-adjustment.idempotency.test.ts
backend/services/billing/credit-adjustment.idempotency.ts
backend/services/billing/credit.service.ts
backend/services/billing/index.ts
backend/types/billing/credit.types.ts
docs/backend/db-availability-fail-fast.md
docs/backend/login-cold-start-resilience.md
docs/billing/credit-hours-system.md
docs/billing/quota-system.md
docs/drizzle/dialect-aware-constraints.md
frontend/common/views/errors/FullScreenErrorView.tsx
frontend/common/views/errors/index.ts
public/static/locale-snapshots/ar/dashboard.accounting.package-plans.json
public/static/locale-snapshots/ar/dashboard.accounting.payments.json
public/static/locale-snapshots/ar/dashboard.classes.audit.json
public/static/locale-snapshots/ar/dashboard.lms.lessonReports.json
public/static/locale-snapshots/ar/dashboard.settings.main.json
public/static/locale-snapshots/ar/dashboard.settings.meetingIntegrations.json
public/static/locale-snapshots/ar/dashboard.teachers.classList.json
public/static/locale-snapshots/ar/dashboard.teachers.futureSchedule.json
public/static/locale-snapshots/ar/dashboard.teachers.students.json
public/static/locale-snapshots/en/dashboard.accounting.package-plans.json
public/static/locale-snapshots/en/dashboard.accounting.payments.json
public/static/locale-snapshots/en/dashboard.classes.audit.json
public/static/locale-snapshots/en/dashboard.lms.lessonReports.json
public/static/locale-snapshots/en/dashboard.settings.main.json
public/static/locale-snapshots/en/dashboard.settings.meetingIntegrations.json
public/static/locale-snapshots/en/dashboard.teachers.classList.json
public/static/locale-snapshots/en/dashboard.teachers.futureSchedule.json
public/static/locale-snapshots/en/dashboard.teachers.students.json
shared/constants/billing/credit-adjustment.enum.ts
shared/constants/billing/credit.enum.ts
shared/constants/billing/index.ts
shared/constants/index.ts
shared/constants/service-availability.constants.ts
shared/locale/ar/errors/index.ts
shared/locale/en/errors/index.ts
shared/locale/types/errors/index.ts
test/ui/components/errors/FullScreenErrorView.test.tsx
test/workflows/accounting/record-payment-balance-visibility.test.ts
test/workflows/accounting/toggle-paid-invoice-cascade.test.ts
test/workflows/helpers/accounting-cast.ts
test/workflows/helpers/index.ts
test/workflows/helpers/journey-errors.ts
test/workflows/helpers/notification-spy.ts
```

## Anomalies / Notes

1. **Concurrent working-tree activity observed.** Between branch creation and the diff capture, the modified-file set changed (13 new files appeared — e.g. `credit-adjustment-system/outcome/1.2-*`, `1.3-*`, `1.4-*`, `richTextSanitizer.test.ts`, `test/workflows/accounting/*`; 6 files dropped out — e.g. `frontend/AGENTS.md`, `backend/graphql/AGENTS.md`, `.agents/skills/review-frontend/SKILL.md`). A re-check minutes later showed 106 modified files vs the 103 captured. A sibling plan agent (credit-adjustment-system) appears to be actively implementing on the same working tree. **The list above is the point-in-time snapshot; expect drift. Review waves should treat this list (and sibling-plan paths under `.ai/plans/credit-adjustment-system/`, `.ai/plans/student-credit-hours-system/`) as pre-existing, not attributable to teacher-payroll-engine.**
2. All baseline counts were re-verified against raw tool output (`/tmp/tsgo-raw.txt`, `/tmp/biome-raw.txt`) — numbers above are genuine, not script-not-found artifacts.
3. `biome:check` reported "No fixes applied" — the working tree was not modified by the baseline capture itself.

> **These baseline numbers are the reference for filtering pre-existing issues in ALL review waves of teacher-payroll-engine.** New tsgo errors, new biome warnings beyond the 1 broken-symlink warning, or lint failures introduced after this point are attributable to this plan.
