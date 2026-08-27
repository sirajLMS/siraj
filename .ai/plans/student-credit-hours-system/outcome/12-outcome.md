# Phase 12 Outcome — Notifications (Lightweight)

## Result: COMPLETE
- Event types `ACCOUNTING_PAYMENT_RECORDED` (INFO) + `ACCOUNTING_LOW_HOURS` (REMINDER) added to NotificationEventType, category map, EVENT_CHANNEL_ALLOWLIST (ON_APP+EMAIL each) and role allowlists (student list extended; parent/staff/admin are ALL).
- `backend/services/notification/accounting-notification.builders.ts` mirrors quota skeleton (empty-guard → labels → fanOutToUsers w/ metadata).
- `backend/services/billing/accounting-notification.service.ts`: sendPaymentRecorded / sendLowHours / maybeNotifyLowHours(threshold via `accounting_low_hours_threshold`, default 5) — all fire-and-forget with logged transient failures.
- Wiring: recordPayment commits → notifyPaymentRecorded(student+linked-parent). update() negative-delta branch → maybeNotifyLowHours. Recipients resolved by new Support.resolveHourLedgerRecipients.
- EN + AR label slices added; storybook NotificationsLabels fixture extended (F13 mock exemption documented inline).

## Deferred deviation
- Admin fan-out for LOW_HOURS deferred: resolving admin userId set requires an index on ACCOUNTING_PAYMENTS_VIEW holders not yet exposed; v1 delivers student + parent (documented in builders/service comments).

tsgo 0 errors post-phase; workflow tests unaffected.
