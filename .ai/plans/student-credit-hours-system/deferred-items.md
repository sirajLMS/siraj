# Deferred Items — student-credit-hours-system

| ID | Source Task | Target | Description | Status | Notes |
|---|---|---|---|---|---|
| D-1 | specs (Plan 6 / Epic 6) | future plan | `student.billingMode` discriminator (CLASS_BASED/HOUR_BASED/MIXED) driving schedule generation + instance activation; wires `deductHoursForBooking` into production | 📋 Future | v1: CreditService hour methods are intentional dead code — DO NOT remove as unused |
| D-2 | specs Open Questions | Plan 2 | Package plan → quota bridge (`quotas` row with totalHours) — hook placeholder in AccountingPaymentService.post-commit | 📋 Future | |
| D-3 | specs EC-6 / R2 note | v2 | True refund-of-payment flow (reverse ledger effects); v1 only allows update-with-decrease under balance floor | 📋 Future | |
| D-4 | specs Plan 4 | Plan 4 | Multi-currency hour ledger; v1 single numeric balance, currency informational; UI soft-warning required when payment currency differs from student's most recent payment currency | 📋 Planned v1 UI warning | warning implemented in Add Payment form |
| D-5 | specs Plan 7 | Plan 7 | Gateway webhook integrations calling recordPayment auto (PayPal etc.) | 📋 Future | enum values supported in v1 only |
