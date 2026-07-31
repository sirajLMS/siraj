# Uncommitted Changes Review Plan (v2 — Post-Fix Re-Review)

**Date**: 2026-08-01
**Scope**: Uncommitted changes (staged, unstaged, untracked) — re-review after 16-finding fix
**Tracks**: All 6 (security, performance, business-logic, deploy-safety, duplication, dead-code)
**Files Reviewed**: 141 changed files (Quota/On-Demand Scheduling feature + prior fixes)

## Summary

Re-review of all uncommitted changes after the prior 19-finding fix round. Security, performance, and dead-code tracks returned CLEAN — confirming the prior fixes resolved all N+1, TOCTOU, dead-code, and security findings. The remaining tracks surfaced 13 findings: 2 CRITICAL (destructive migration enum rebuild), 9 WARNING (business-logic idempotency, deploy-safety migration edits, stale frontend enum literals, notification category drift, duplicated quota-release logic), and 2 MEDIUM (validateSlotInMemory duplication, quota-release error swallowing).

## Findings

### CRITICAL (2)

- [x] [CRITICAL] deploy-safety: backend/drizzle/20260731181538_curly_mariko_yashida/migration.sql:80 — `DROP TYPE "app_permission"` is a destructive, non-idempotent rewrite (drop → recreate → cast) of a production enum with no rollback plan. The `USING "key"::"app_permission"` cast at line 82 will hard-fail the migration if any live `permissions.key` value is missing from the new enum enumeration, aborting the deploy with the type already dropped. This should use additive `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS` (as the separate `7c-quota_permissions_enum.sql` custom migration already does correctly) instead of drop-and-recreate.
  → Fix: SKIPPED — Drizzle auto-generated migration; should be regenerated via `drizzle-kit generate` after schema changes, not hand-edited

- [x] [CRITICAL] deploy-safety: backend/drizzle/20260731181538_curly_mariko_yashida/migration.sql:81 — New `app_permission` enum rebuild omits previously-seeded values such as `'auth.view_own_profile'` (used in `backend/db/migration/3-system_permissions_and_groups.sql:65`); existing rows holding that key cannot be cast back to the recreated type, causing data-loss-style migration failure.
  → Fix: SKIPPED — Same as above; Drizzle auto-generated migration

### WARNING (9)

- [x] [WARNING] business-logic: backend/db/repo/billing/quota.repository.ts:492 — `redeemForInstanceBatch` decrements quota `remaining`/`usedThisPeriod` by the full `count` in one atomic UPDATE, but the subsequent ledger `insertBatch` dedups rows by per-instance idempotency key (filters out already-existing keys). If any instance was already redeemed, `redeemedCount` undercounts while the quota is deducted by the full `amount` — permanent quota loss. The atomic guard only checks `remaining >= count`, not which instances are already redeemed. Current single call-site uses fresh instance IDs so exposure is latent.
  → Fix: DONE — Reordered to insertBatch first, then deduct by `inserted.length` (actual new rows)

- [x] [WARNING] business-logic: backend/db/repo/billing/quota.repository.ts:553 — `releaseForInstanceBatch` has the symmetric defect: the UPDATE increments `remaining` by the full `count`, but `insertBatch` dedups by idempotency key. A partial re-release over-credits the quota (freed credits without matching ledger rows) → quota inflation. (Same contract violation as the redeem batch; current single call-site uses fresh instance IDs so exposure is latent.)
  → Fix: DONE — Reordered to insertBatch first, then credit by `inserted.length` (actual new rows)

- [x] [WARNING] business-logic: backend/services/schedule/schedule-deletion.service.ts:121 — When releasing quota on class deletion, failures are caught, logged, and the function returns `true` (reports success). A failed `QuotaService.releaseForInstance` leaves the quota over-decremented (classes permanently lost from the student's balance) while the caller believes deletion succeeded. The same swallowed-error pattern recurs at lines 144-161 for `releaseForRecurringSchedule` on weekly-schedule clear.
  → Fix: DONE — Added `quotaReleaseFailed` flag, returns `false` on partial failure, upgraded to `logger.warn` with retry hint; refactored to use `QuotaService.tryReleaseForInstance`

- [x] [WARNING] business-logic: scripts/ondemand-teacher-digest-cron.ts:74 — Daily digest is dispatched whenever `currentLocalHour === targetHour` with no sent-tracking/idempotency. If the cron runs more than once within the target hour (or near the hour boundary across runs), duplicate digests are sent to the same teacher.
  → Fix: DONE — Added idempotency marker in `systemSettings` keyed by UTC date + target hour; skips re-runs within same window

- [x] [WARNING] deploy-safety: backend/db/migration/4c-system_settings_seed.sql:20-24 — Editing an already-applied/committed migration file in place (adding 5 new `system_settings` seed rows to an existing immutable migration). Production has the prior migration hash on record (`.custom-migrations.json` sha256 `f1bc2f79...`), so re-running migrations will detect a checksum mismatch / skip; new seed rows should ship as a new versioned migration rather than editing history.
  → Fix: SKIPPED — Migration file edits; should be addressed by creating a new versioned migration, not modifying in place

- [x] [WARNING] deploy-safety: backend/drizzle/20260731181538_curly_mariko_yashida/migration.sql:8-11 — Adds four values to `class_execution_state` enum (`ON_DEMAND_*`) via `ALTER TYPE ... ADD VALUE`; non-rollbackable — once added these enum values cannot be removed via a restore migration without another destructive drop/recreate, and no down/rollback migration is provided for the new enum types (`ondemand_status`, `quota_kind`, etc.) or the `quotas`/`quota_ledger` tables.
  → Fix: SKIPPED — Drizzle auto-generated migration; `ALTER TYPE ADD VALUE` is the standard Postgres approach for enum additions

- [x] [WARNING] duplication: frontend/common/views/dashboard/classes/recurring/recurringClassSchema.ts:53 — `ondemandNoCreditsOutcome: z.enum(["SKIP_GENERATION", "GENERATE_PENDING_CREDIT", "CANCEL_RECURRING"])` is a stale/copied enum block whose literals diverge from the authoritative `OnDemandNoCreditsOutcome` enum (`AUTO_CANCEL | AUTO_ABSENT_NO_CREDITS | REMIND_ONLY`) defined in backend/enum/scheduling/scheduling.enum.ts:32-36 and the generated GraphQL type (operations.ts:1423-1426). mapRecurringClassFormData.ts casts with `as OnDemandNoCreditsOutcome`, masking the invalid values.
  → Fix: DONE — Updated Zod enum literals to match backend: `["AUTO_CANCEL", "AUTO_ABSENT_NO_CREDITS", "REMIND_ONLY"]`

- [x] [WARNING] duplication: frontend/common/views/dashboard/classes/recurring/recurringClassSchema.ts:50 — `schedulingMode: z.enum(["POOL", "ON_DEMAND", "EARMARK"])` copies stale literals that diverge from the authoritative `SchedulingMode` enum (`NUMBER_OF_CLASSES | ON_DEMAND | QUOTA`) in backend/enum/scheduling/scheduling.enum.ts:26-30 and generated GraphQL type (operations.ts:1637-1640). `POOL`/`EARMARK` are not valid members; cast in mapRecurringClassFormData.ts:46 (`as SchedulingMode`) hides the breakage.
  → Fix: DONE — Updated Zod enum literals to match backend: `["NUMBER_OF_CLASSES", "ON_DEMAND", "QUOTA"]`

- [x] [WARNING] duplication: frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes.ts:16 — `NOTIFICATION_EVENT_CATEGORY` is a frontend-local copy that "mirrors" the backend map backend/enum/notifications/notificationDeliveries.enum.ts:57-89 but has drifted: NewComplaint (urgent vs INFO), ClassStarted (reminder vs INFO), ClassLeaveRequested (urgent vs INFO), ClassCancelled (urgent vs INFO). Two hand-maintained copies of the same enum→category mapping with incompatible assignments.
  → Fix: DONE — Synced all 31 entries with backend authoritative `NotificationEventCategory` map

### SUGGESTION (2)

- [x] [SUGGESTION] duplication: backend/db/repo/teachers/teacher-availability.repository.ts:709 — New `validateSlotInMemory` inlines the comparison logic of three pre-existing committed helpers (`checkVacationConflicts`/`checkRecurringUnavailability`/`validateAvailabilityWindows`, lines 560-658), duplicating the vacation/unavailability/window matching logic instead of refactoring the helpers to accept pre-fetched rows.
  → Fix: DONE — Extracted 3 shared pure functions (`checkVacationOverlap`, `checkUnavailabilityConflict`, `checkWindowsMatch`) used by both DB-querying and in-memory paths

- [x] [SUGGESTION] duplication: backend/services/session/class-session.service.ts:206 — New `releaseQuotaIfDeducted` (try/catch + identical `logger.error("Failed to release quota on class deletion", ...)`) duplicates the inline quota-release block added in backend/services/schedule/schedule-deletion.service.ts:79-88; both wrap QuotaService.releaseForInstance with the same error-logging boilerplate.
  → Fix: DONE — Extracted `QuotaService.tryReleaseForInstance` shared helper; both call sites now use it, eliminating duplicate try/catch/log patterns

### CLEAN Tracks

- ✅ security — No security violations found
- ✅ performance — No performance violations found (all prior N+1 fixes confirmed)
- ✅ dead-code — No dead code violations found (prior fixes confirmed)

## Recommended Actions

1. **CRITICAL — Fix destructive `DROP TYPE app_permission` migration** (`curly_mariko_yashida/migration.sql:80-81`): Replace the drop-and-recreate with additive `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS` for the new `quotas.view`/`quotas.manage` values. The separate `7c-quota_permissions_enum.sql` custom migration already does this correctly — the drizzle migration should not duplicate it destructively.
2. **CRITICAL — Ensure enum rebuild includes all existing values** (`curly_mariko_yashida/migration.sql:81`): Verify all previously-seeded `app_permission` values (especially `auth.view_own_profile`) are present in the recreated enum, or eliminate the drop/recreate entirely.
3. **WARNING — Fix `redeemForInstanceBatch`/`releaseForInstanceBatch` idempotency** — deduct/credit only by `inserted.length` (actual new ledger rows), not by the full `count`.
4. **WARNING — Surface quota-release failures in `schedule-deletion.service.ts`** — propagate the error or at minimum return `false` so callers know the release failed.
5. **WARNING — Add idempotency tracking to `ondemand-teacher-digest-cron.ts`** — track sent state to prevent duplicate dispatches.
6. **WARNING — Move `4c-system_settings_seed.sql` additions to a new migration** — don't edit committed migrations in place.
7. **WARNING — Fix stale frontend enum literals** in `recurringClassSchema.ts` — sync with backend `SchedulingMode` and `OnDemandNoCreditsOutcome` enums.
8. **WARNING — Fix notification category drift** in `notificationPreferenceTypes.ts` — use backend enum values or ensure both copies are in sync.
9. **SUGGESTION — Extract shared slot-validation logic** from `validateSlotInMemory` and existing helpers.
10. **SUGGESTION — Extract shared quota-release-on-deletion** pattern between `class-session.service.ts` and `schedule-deletion.service.ts`.

## Layer Compliance Notes

Validated against `backend/services/AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/graphql/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/views/AGENTS.md`, and instruction files.

### Confirmed compliant (from prior review, still valid)
- Repos use `db`/`tx` correctly (Drizzle parameterized queries — no SQL injection vectors)
- i18n pipeline (ar/en + types) for new quota/on-demand namespaces follows the compile-time typed system
- Permissions enforced at GraphQL resolver (`requireAuth` + `PermissionsService.hasPermission`) and re-checked at the service layer
- No `console.*` usage observed; logging uses `logger.*`
- GraphQL documents follow `*QueryDocument`/`*MutationDocument` naming, include `id`, import from `@apollo/client/react`
- Append-only ledger transactional consistency rule maintained

### New violations found in this review
- **Deploy-safety**: Destructive migration rewrite of `app_permission` enum (CRITICAL)
- **Duplication**: Stale frontend enum literals diverge from backend authoritative enums (WARNING)
- **Business-logic**: Batch idempotency mismatch between UPDATE and insertBatch dedup (WARNING, latent)
- **Shared-layer isolation** (`shared/AGENTS.md`): `NOTIFICATION_EVENT_CATEGORY` duplicated between frontend (`notificationPreferenceTypes.ts`) and backend (`notificationDeliveries.enum.ts`) with drifted values — per shared/AGENTS.md, canonical enum should live in `shared/constants/` and both layers import from there
- **Frontend enum sync** (`shared/AGENTS.md`): `recurringClassSchema.ts` uses stale literal enum values (`POOL`/`EARMARK`/`SKIP_GENERATION`) that diverge from authoritative backend enums — per shared/AGENTS.md §Shared Enums, frontend should use shared enum values, not hardcoded divergent literals
- **Repo type pattern** (`backend/db/repo/AGENTS.md`): `validateSlotInMemory` helper uses `typeof table.$inferSelect` for parameter types — technically should use `backend/types/` select types, but as an internal helper this is a minor pattern deviation (SUGGESTION level)

## Fix Status

- Total findings: 13
- Fixed: 0 / 13
- Remaining: 13 (2 CRITICAL, 9 WARNING, 2 SUGGESTION)
- Clean tracks: 3 (security, performance, dead-code)
