# Plan Review R2 — Refinement (codebase-verified)

Refined `design.md` + `tasks.md` by resolving every assumption flagged "verify in Task 0.2" in round R1 against the live codebase.

## Verified findings baked into the plan

1. **`LeaveRequesterType` canonical location** — `backend/enum/scheduling/scheduling.enum.ts` (backend-only; members TEACHER/PARENT/ADMIN). R1's assumption of `shared/constants/` was wrong; backend/enum/AGENTS.md forbids shared importing backend/enum, and the frontend consumes codegen enums. Drizzle value generated via `createPgEnumFromEnum("leave_requester_type", …)` in `backend/db/schema/enums.ts` — adding STUDENT propagates automatically through `bun run db push`.

2. **`LeaveRequestStatus` has no REJECTED** (PENDING/APPROVED/RESCHEDULED/CANCELLED only). Spec R2.7/R4.2 need a rejected decision visible to requesters → **Decision: add `REJECTED`**. Tasks updated (5.1).

3. **`leave_requests` schema gap** (`backend/db/schema/classes/scheduling.ts` ~line 321): no request-type discriminator and no proposed datetime for delay requests. Plan now requires a new `LeaveRequestType` enum (DELAY/CANCEL), `requestType` column, `proposedStartAt timestamp NULL`, and the partial unique index `(classInstanceId) WHERE status='PENDING'`. Schema must use `createTable` + dialect-aware helper columns (`uuidColumn`, `timestampColumn`, …) per `backend/db/schema/AGENTS.md`.

4. **Quota interplay risk discovered**: `leave_quota_usage` + trigger `trg_enforce_leave_quota_limits` caps monthly leaves (system_settings `student_max_leaves`, default 2). Approve-cancel flow may be blocked for students at their leave cap. Moved verification into Task 0.2 with an explicit policy question.

5. **Reschedule service path corrected**: `reschedule()` lives in `backend/services/session/class-session.service.ts` (dir is `session/`, not `classes/`); it asserts `SESSION_RESCHEDULE`, runs `validateRescheduleState` (`backend/services/scheduling/state-change-validation.service.ts`), and writes idempotency key `manual-reschedule-{classInstanceId}-{isoStart}` — approve-delay reuses this path.

6. **Reschedule/tracking UI confirmed**: `frontend/common/views/dashboard/reschedule/tracking/` (Container/ViewModel/shared + desktop/mobile tiers + `rescheduleTrackingStore.ts` + `schedule.documents.ts`), staff-gated by `SESSION_RESCHEDULE`. Student/parent **requester view is genuinely new** — plan no longer assumes an existing requester surface.

7. **F1 placement confirmed**: types subdir `backend/types/report/` exists → `monthly-appraisal.types.ts` goes there. Repo subdirs mirror schema subdirs; since the table lives in `schema/students/`, repo is `backend/db/repo/students/monthly-appraisal.repository.ts`.

8. **F5 payments linkage verified**: `payments.invoiceId → invoices` (parentId/studentId/invoiceType/status). **No invoice-line-items table exists** — only `invoiceCoverageMonths`, and `payments` has no package column. Package-name derivation remains genuinely open; design now points at the real tables and keeps the "—" fallback (deferred-items.md) as the exit. Balance read from quotas cached columns per `docs/billing/quota-system.md` instead of re-aggregating `credit_transactions`.

9. **F3 anchor corrected**: student history Container + ViewModel confirmed at `frontend/common/views/dashboard/students/history/` (tier-neutral), not `frontend/desktop/...`.

10. **Permissions**: `AppPermission` enum at `backend/enum/permissions/permission.enum.ts` (`SESSION_RESCHEDULE = "session.reschedule"` exists); new perms (`APPRAISAL_SUBMIT`, `APPRAISAL_VIEW`, `APPRAISAL_FEEDBACK`, `SESSION_SELF_DELAY`, `SESSION_SELF_CANCEL`, `PAYMENTS_LEDGER_VIEW`) to be added there + seeds (structure verified in 0.2).

## Residual open items (intentionally in 0.2)

- Package-name derivation path (no line-items table — may resolve to placeholder fallback)
- `leave_quota_usage` trigger interplay with approve-cancel
- Student sessions date-range query shape for week/day views
- Permission seed mechanics for the 6 new AppPermission entries
