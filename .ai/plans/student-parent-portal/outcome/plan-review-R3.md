# Plan Review R3 — student-parent-portal

Third refinement round: verified the four residuals left open after R2 and patched `design.md` + `tasks.md` accordingly.

## Findings (verified against codebase)

1. **Quota trigger interplay — RESOLVED (policy decision, no schema change)**
   - `leave_quota_usage` + `trg_enforce_leave_quota_limits` caps monthly leaves from `system_settings` (`student_max_leaves`, default 2, seeded in `backend/db/seeds/shared/system-settings.ts`).
   - Existing teacher-leave flow (`updateStatusLeave`, `class-session.service.ts:523`) asserts `SESSION_UPDATE_STATUS_LEAVE` + `SystemRulesService.assertLeaveQuotaAvailable(teacherId)` and writes usage via `SchedulingRepository.processClassLeave` + `leave-quota-usage.repository.ts`.
   - DECISION: self-service Cancel requests do NOT consume the student leave quota. Approve-cancel reuses the same cancel path (which already performs `releaseQuotaIfDeducted` / `refundCreditIfDeducted` — the spec R2.6 "existing quota-refund policy") but skips `assertLeaveQuotaAvailable` and never inserts `leave_quota_usage`. Trigger risk eliminated by design, not schema.
   - Design updated with the decision + new integration-test requirement (single refund row per approved cancel) added to task 5.6 risks.

2. **Sessions range query — VERIFIED (not supported, now planned)**
   - Repo filters use only `gte(classInstances.scheduledStartAt, now)` (`backend/db/repo/scheduling/scheduling-queries.repository.findUpcoming.ts:52`, `.helpers.ts:209`) — no upper bound / arbitrary window.
   - F3 now explicitly adds `from`/`to` params (repo → service → Pothos), capped at 42 days; default = current month so Month view is unchanged. Added to design §F3 and task 7.1.

3. **Permission seed mechanics — ADDRESSED (routing identified)**
   - Group membership lives in `backend/db/schema/permissions/permissions.ts`; per-user overrides only in `backend/db/seeds/auth/seed-user-permission-overrides.ts` (1 AppPermission reference — confirms overrides are exception-only).
   - Design gained a "Permissions & seeds" subsection: task 0.2 must locate the AppPermission → group mapping seed and assign the six new permissions to groups (not overrides).

4. **Payments package name — NARROWED**
   - `InvoiceType` enum (`backend/enum/billing/billing.enum.ts`) is the only package-kind signal on invoices (no line-items table — verified). 0.2 must enumerate its members; if mapping payment → quota-kind remains ambiguous, keep the "—" placeholder fallback per deferred-items.md.

## Plan changes applied

- `design.md`: §F2 quota bullet → resolved decision + cancel-reuse note; §F3 backend bullet → range-param plan; §F5 invoiceType narrowing; new "Permissions & seeds" subsection before Security.
- `tasks.md`: 0.2 checklist updated (3 items struck as verified, 1 narrowed, 1 added for permission-group mapping); 5.2 approve-cancel path rewritten to enforce no-quota-write policy; 7.1 adds the from/to range subtask; 5.6 adds double-refund risk + test.

## Residual risks (gonogo chain)

- Sequential assumption holds: 1 → 2 → 4 → 5 → 6 → 7, 3 / 8 / 9 after 7. Solo dev, biggest risk = F5 payments ledger reliability and F2 approve-correctness — both now have explicit anchor paths.
- No remaining open questions that block Task 0.2; all items in its checklist are concrete lookups, not design choices.
