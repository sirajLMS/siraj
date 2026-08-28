# Phase 3 Outcome: Backend Services & Integrations

## Executive Summary
Phase 3 implemented the business logic layer for quota management, slot availability checking, and automated notification dispatches, while performing critical service integrations to eliminate double deductions and direct SQL quota updates across the codebase.

## Deliverables & Key Changes

1. **Availability Service (`backend/services/scheduling/availability.service.ts`)**
   - Implemented `isSlotAvailable`, `assertSlotAvailable`, `assertSchedulePatternAvailable`, and `findAvailableSlots`.
   - Checks overlapping un-deleted class instances for the student or teacher.

2. **Quota Service (`backend/services/billing/quota.service.ts`)**
   - Implemented full CRUD (`createQuota`, `getQuota`, `listQuotas`, `updateQuota`, `deleteQuota`).
   - Implemented FIFO quota selection (`selectQuotaForBooking`), transaction-safe reservation (`reserveForRecurringSchedule`), release (`releaseForRecurringSchedule`), redemption (`redeemForInstance`), and cancellation release (`releaseForInstance`).
   - Implemented automated jobs (`expireOverdueQuotas`, `refreshPeriodicQuotas`, `refreshStudentOndemandInstances`).

3. **Quota Notification System**
   - Added 7 notification event types in `backend/enum/notifications/notificationDeliveries.enum.ts` and allowlists in `shared/constants/notification-event-allowlists.ts`.
   - Added typed labels in `shared/locale/types/notifications/index.ts` and implemented localized strings in `en` and `ar`.
   - Created payload builders in `backend/services/notification/quota-notification.builders.ts` with category tags (`reminder`, `info`, `urgent`, `digest`).
   - Created dispatch service in `backend/services/billing/quota-notification.service.ts`.

4. **Service Integrations & Bug Fixes**
   - **`backend/db/repo/scheduling/state-changes.ts`**: Removed direct SQL `students.classesRemaining` decrements/increments in `handleQuotaDeduction` and `adjustQuotaOnUpdate`, delegating single-writer access to `QuotaService` and `quota_ledger`.
   - **`backend/services/teacher/teacher-dashboard.service.ts`**: Fixed double-deduction bug in `createManualEntry` by attempting `QuotaService.redeemForInstance` first, falling back to `CreditService.deductForBooking`.
   - **`backend/services/billing/credit.service.ts`**: Added automatic call to `QuotaService.refreshStudentOndemandInstances` after any credit purchase or refund.
   - **`backend/services/session/class-session.service.ts`**: Added session-start credit/quota redemption for on-demand instances in `activate` and `activateOverride`.
   - **`backend/services/schedule/recurring-class.service.ts`**: Integrated `AvailabilityService` pattern checks and `QuotaService` reservation/redemption, while disabling raw credit loops when quota is set.

## Verification
- `tsgo`: Passed clean.
- `biome:check`: Passed clean.
- `lint-queue-client`: Passed clean (exit code 0).
