# Phase 0 Baseline (pre-implementation)

- **Date**: 2026-08-29
- **tsgo errors**: 0
- **biome warnings**: 1
- **lint**: exit 0 (clean full-repo)
- **stash**: none

## Pre-existing modified files (git diff --name-only baseline)

These 12 files were already modified before this plan started (unrelated work: login-cold-start, locale/error namespace edits). Never revert or reformat them; post-implementation review must not attribute changes in them to this plan:

- AGENTS.md
- app/AGENTS.md
- backend/db/factory.ts
- backend/db/http-client.ts
- backend/lib/errors.ts
- backend/lib/retry.ts
- backend/lib/test/retry.test.ts
- docs/backend/login-cold-start-resilience.md
- shared/constants/index.ts
- shared/locale/ar/errors/index.ts
- shared/locale/en/errors/index.ts
- shared/locale/types/errors/index.ts

(Plus pre-existing untracked `app/api/health/`.)

## Plan-readiness notes recorded at intake

- Plan type: **full spec** (specs.md + implementation.md + trackable-tasks.md); plan-review R1 + R2-se outcomes exist.
- `prototype/` present (6 screens): credit-adjust-form, credit-adjust-error, credit-adjust-carryover, student-credits-list, student-credits-mobile, student-credit-history.
- Task checkboxes: main phases use bullet sub-items (no checkboxes); subagents append ` ✅ DONE` to the `###` heading. TB.x tasks have real checkboxes.
- Test kinds the plan mandates: repo (`test:db`), service (`test:services`), GraphQL mutation, UI component, journeys (`test:workflows` — TB.1/TB.2), E2E (8.1, conditional), pentest (TB.4).
- Known plan/reference gaps discovered during Wave A:
  - `shared/constants/credit.enum.ts` does not exist — canonical mirror is `shared/constants/billing/credit.enum.ts` (plan doc reference stale; no code fix needed).
  - `backend/db/seeds/permissions/` does not exist; permission grants are seeded via custom SQL migrations (`backend/db/migration/NN-*.sql` + `applyCustomMigrations`), per `backend/db/seeds/AGENTS.md`.
  - No `Accounting`/`Finance Manager` permission group exists; grant went to `super_admin` + `academy_admin`, mirroring the `accounting.payments_manage` precedent.
- Custom migration `backend/db/migration/35-accounting-credits-permission.sql` + drizzle folder `20260828212837_custom_35-accounting-credits-permission/` created in Wave A (0.3).
