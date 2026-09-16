# TB.1 Outcome — Journey: record hour-package payment → balance visibility + notification

## Result: COMPLETE — 4 journey steps, all passing

## What was built

**Journey test**: `test/workflows/accounting/record-payment-balance-visibility.test.ts`
(admin records paid hour-package payment → student + linked parent see bumped hour balance
and hour ledger; VIEW-only staff see the payment row; unrelated family is denied and sees
nothing; `ACCOUNTING_PAYMENT_RECORDED` reaches student + parent only).

- Step 1 (shared-state): `AccountingPaymentService.recordPayment` → invoice row (PAID,
  `CREDIT_HOURS_PACKAGE`, paidDate = payment date) + payment row + exactly one hour-ledger
  PURCHASE row (XOR: `changeAmount` NULL, `changeAmountHours` = 10, `sourcePaymentId` = payment)
  + `students.creditHoursTotal/creditHoursRemaining` bump — asserted via direct committed-row reads.
- Step 2 (visibility): student + parent read balance via `AccountingPaymentService.getStudentBalance`
  and ledger via `CreditService.getStudentTransactions(actor, studentId, null, tErrors, { hoursOnly: true })`
  (association-scoped, no permission needed); `staff_default` user (VIEW only) reads the row via
  `getById` + `listPaginated({studentId})`; admin confirms too.
- Step 3 (denial/isolation): unrelated student+parent users denied with
  `tErrors.insufficientPermissions` on `getStudentBalance` / `getById` / `listPaginated` /
  `getStudentTransactions`; unrelated family's own hour ledger is empty (no bleed);
  staff VIEW-only actor denied on `recordPayment` (no MANAGE) before any write.
- Step 4 (side effect): `ACCOUNTING_PAYMENT_RECORDED` targets exactly student user + parent user
  (never admin/staff/unrelated) — asserted on the spied payloads (payload `eventType` + `userId`).

## Reusable conventions established (TB.2–TB.4 MUST reuse these)

All in `test/workflows/helpers/` (re-exported from the `./` barrel):

- **`accounting-cast.ts`** — the accounting cast:
  `provisionAccountingJourneyCast(prefix): Promise<AccountingJourneyCast>` and
  `cleanupAccountingJourneyCast(cast): Promise<void>`.
  Cast members: `adminUser` (system group `academy_admin` → VIEW+MANAGE), `staffViewerUser`
  (`staff_default` → VIEW only), family under test (`parentUser`+`parent`, `studentUser`+`student`
  linked by `students.userId`), unrelated family (`unrelatedParentUser`+`unrelatedParent`,
  `unrelatedStudentUser`+`unrelatedStudent`), one active `plan: PackagePlanSelectType`
  (10h / 300.00 USD, inserted directly), `groupAssignments`.
  Cleanup is family-scoped: creditTransactions by studentIds → payments/invoices discovered via
  the two parent ids → packagePlans → revoke group memberships → students → parents → users
  (FK-safe order; sweeps service-created invoice/payment/ledger rows without callers tracking ids).
- **`journey-errors.ts`** — `expectJourneyError(fn): Promise<Error>` (the repo-wide try/catch
  helper; replaces per-file `catchError` duplicates).
- **`notification-spy.ts`** — `DispatchSpy` type, `dispatchTargetsForEvent(spy, eventType): string[]`
  (payload-aware; payloads live in spy call arg 0, one per user×channel), and
  **`waitForEventDispatchToUser(spy, eventType, userId, timeoutMs = 5000): Promise<boolean>`** —
  REQUIRED because accounting notifications dispatch fire-and-forget (`void` post-commit), unlike
  the lesson-report journey where synchronous assertion happened to work. Polls the spy (25 ms).
- Spy setup kept per-file in `beforeAll`:
  `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([])` with
  `mockRestore()` in `afterAll` before cleanup. Module-namespace `spyOn` DOES intercept the
  accounting notification service — verified empirically (step 4 sees the payloads).
- Actor permission model (migration 33 + 6):
  `super_admin`/`academy_admin` = VIEW+MANAGE, `staff_default` = VIEW only,
  `student_default`/`parent_default` = NEITHER — their reads pass via `assertAssociatedOrManage`
  association only. Note `CreditService.getStudentTransactions` is scoped with `CREDITS_MANAGE`
  (not accounting perms) — no staff group holds it, so only associated family members (or
  academy admins) can read the ledger.

## Verification

- `bun run test/scripts/run-test.ts test/workflows/accounting/record-payment-balance-visibility.test.ts`
  — 4 pass / 0 fail / 57 expects.
- `bun run test:workflows` — 9 pass / 0 fail across 2 files (lesson-report journey unaffected).
- Per-file `sub-loop.ts … --lifecycle lint` on all 5 touched files: green; the test file + helpers
  also pass `--lifecycle codescene`.

## Pitfalls / notes for TB.2–TB.4 agents

1. **oxlint `no-await-in-loop` fails the build** — per-actor assertion loops MUST use
   `Promise.all(actorIds.map(async actorId => …))` (and `Promise.all` for grouped error captures).
2. **oxlint `no-unsafe-type-assertion`** — no `as` casts from `any`/narrowing assertions on mock
   call args; narrow with `typeof`/`in` guards (see `isCommunicationPayload` in notification-spy.ts).
3. `staffViewer`/denial `recordPayment` calls never reach the DB (denied at `requirePermission`
   before the tx) — safe to use any payload.
4. `recordPayment` requires a parent-linked student (`invoices.parent_id NOT NULL`) and rejects
   `amount <= 0` / `creditHours <= 0` with `tErrors.package.invalidInput`.
5. Denial message is always `tErrors.insufficientPermissions` (ForbiddenError from
   `requirePermission`/`assertAssociatedOrManage`); localized product errors (archive/version
   mismatch/insufficient hours) are distinct typed labels already asserted in Phase 10 tests.
6. `resolveAssociatedViewer` is cached (60 s TTL) — never mutate cast associations mid-journey.
7. Step 4 must run after the paying step; the fire-and-forget dispatch completes during steps 2–3,
   but keep `waitForEventDispatchToUser` regardless — timing is not guaranteed.
8. Numeric columns arrive as `string` — assert via `Number(row.column)` (balances "10.00").
