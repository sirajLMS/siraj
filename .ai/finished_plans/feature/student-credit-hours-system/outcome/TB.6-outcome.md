# TB.6 Outcome — Penetration verification of the accounting GraphQL surface

## Result: COMPLETE — 20 tests, all passing (124 assertions)

**Suite**: `frontend/common/graphql/test/accounting/accounting-security.test.ts`
(new `accounting/` domain dir mirroring `sharedDocuments/` taxonomy; runs against a real
dev server on port 3099 via `setupTestServerLifecycle` + `loginAndProvision` cast, real
PostgreSQL, real Pothos resolvers — RBAC and BOLA are exercised end-to-end, not mocked).

Runner: `bun run test/scripts/run-test.ts frontend/common/graphql/test/accounting/accounting-security.test.ts`
→ **20 pass / 0 fail** (final run after the two fixes below; earlier runs reproduced each
failure mode before fixing).

Per-file verification: `bun run scripts/health/sub-loop.ts <file> --lifecycle lint` green for
the test file AND both modified product files (tsgo → oxlint → biome → lint:type-aware).

## Attack matrix — attack vector → expected → actual (all confirmed green)

### 1. BOLA / IDOR (cross-family reads)

| Probe | Actor | Expected | Actual | Test |
|---|---|---|---|---|
| `studentCreditHourBalance(victimStudentId)` | unrelated student (`student_default`) | FORBIDDEN | FORBIDDEN | `unrelated student is FORBIDDEN…` |
| `accountingPayment(victimPaymentId)` | unrelated student | FORBIDDEN | FORBIDDEN | same |
| `accountingPayments(filter {studentId: victim})` | unrelated student | FORBIDDEN | FORBIDDEN | same |
| same 3 probes | unrelated parent (`parent_default`) | FORBIDDEN | FORBIDDEN | `unrelated parent is FORBIDDEN…` |
| `accountingPayments(filter {parentId: victimParentId})` (no studentId) | unrelated parent | FORBIDDEN | FORBIDDEN | same |
| `accountingPayments(filter: null)` global listing | unrelated parent | FORBIDDEN | FORBIDDEN | same |
| balance/payment/list | victim's own student | OK (association) | OK | `victim student can read own…` |
| balance/payment/list | victim's linked parent | OK (association) | OK | `linked parent can read…` |
| balance/payment detail | `staff_default` (VIEW, no MANAGE) | OK (documented VIEW grant) | OK | `VIEW-only staff can read…` |

Service paths verified live: `assertAssociatedOrManage` (association-pass + denial) inside
`AccountingPaymentService.{getStudentBalance,getById,listPaginated}` — the Phase-10
`resolveAssociatedViewer` null-association IDOR fix holds (NULL teacher never matches).

### 2. BFLA / privilege escalation — all 6 admin mutations

`createPackagePlan`, `updatePackagePlan`, `archivePackagePlan`, `recordAccountingPayment`,
`updateAccountingPayment`, `toggleAccountingPaymentPaidStatus` probed per principal:

| Principal | Expected | Actual | Test |
|---|---|---|---|
| `staff_default` (VIEW, no MANAGE) | FORBIDDEN at resolver gate | FORBIDDEN | `${principal.name} is FORBIDDEN on every admin mutation` (×4 registered) |
| `student_default` | FORBIDDEN | FORBIDDEN | same loop |
| `parent_default` | FORBIDDEN | FORBIDDEN | same loop |
| victim's own parent (family ≠ manage rights) | FORBIDDEN | FORBIDDEN | same loop |
| unauthenticated (no token) | UNAUTHENTICATED | UNAUTHENTICATED | `unauthenticated callers…` |
| malformed `Bearer not-a-real-token` | UNAUTHENTICATED | UNAUTHENTICATED | `malformed bearer token…` |

Side-effect sweep after all denial probes: victim payment unchanged (`isPaidStatusOn=true`,
`creditHours=6`, `paymentNote` intact) — `denied mutation probes leave the victim payment untouched`.
(Service-level `requirePermission` re-check on the same paths stays covered by Phase-10 /
TB.1–TB.3 suites; resolver gate now short-circuits before the service.)

### 3. Injection / wildcard / malformed input (`AccountingPaymentFilterInput`)

| Probe | Expected | Actual | Test |
|---|---|---|---|
| `studentId` ∈ `"' OR '1'='1' --"`, `%`, `%%`, `_`, `../../../../etc/passwd` | rejected, zero rows leaked | GraphQL error (22P02), `data.accountingPayments === null` | `SQL-injection and wildcard studentId filters…` |
| `parentId` = `' UNION SELECT id FROM users --` | rejected, no leak | GraphQL error | `injected parentId filter…` |
| `fromDate` ∈ `not-a-date`, `999-99-99`, `'); DROP TABLE payments; --` | rejected | GraphQL error | `malformed date bounds…` |
| `fromDate 2999-01-01 → 2999-01-31` (extreme, valid) | safe empty | 0 rows, no error | `extreme and reversed date ranges…` |
| reversed range 2030 → 2020 | safe empty | 0 rows, no error | same |
| `paginationArgs { first: 100000, maxCount: 100000 }` | clamped ≤ 200 | ≤ 200 rows | `oversized pagination is clamped…` |
| `amount: 1e15` on `recordAccountingPayment` | rejected, no row persisted | **FIXED — see finding below** | `extreme numeric payment amounts…` |

### 4. Idempotency replay abuse

| Probe | Expected | Actual | Test |
|---|---|---|---|
| identical `recordAccountingPayment` replay | same payment id, no double-credit | same id, `creditHoursTotal` stays 6.00 | `identical replay returns the same payment…` |
| altered payload (amount 300→301) | distinct key → separate row, double credit | distinct id, total 12.00 | `altered payload derives a distinct key…` |
| client-supplied idempotency key | not expressible (key is server-derived from content; no input field) | confirmed by generated `AccountingPaymentInput` type — parameter does not exist | n/a (schema-level) |

## Findings (both FIXED minimally in this task)

### VULN-1 — Privilege-escalation denials mis-labeled as INTERNAL_SERVER_ERROR at the resolver gate
- **Severity**: Low (availability/precision issue, not an access-control bypass — access was still denied).
- **Target**: `backend/graphql/mutation/billing/accounting.mutation.ts` — all 6 admin mutations duplicated a plain
  `throw new Error(ctx.t().errorsTranslations.insufficientPermissions)` after a hand-rolled `PermissionsService.hasPermission` check.
- **Impact**: RBAC denials surfaced as `INTERNAL_SERVER_ERROR` (500-class) instead of `FORBIDDEN`, violating
  `backend/graphql/AGENTS.md` ("all resolver errors MUST use DomainError subclasses"), polluting 5xx alerting,
  and breaking client-side error-code handling. Duplicated gate ×6 also drifted from the shared guard.
- **Fix**: replaced all six blocks with the shared `requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors)`
  guard (throws `ForbiddenError` → `extensions.code = "FORBIDDEN"`); dropped the per-resolver `PermissionsService` import.
  The security suite asserts `FORBIDDEN` for every principal × mutation — it failed pre-fix conceptually and passes post-fix.

### VULN-2 — Declared `@constraint` bounds not enforced server-side (`recordAccountingPayment` amount/creditHours)
- **Severity**: Medium-low (bounded write abuse by MANAGE holders; data-integrity, not privilege escalation).
- **Target**: `AccountingPaymentService.recordPayment` + `AccountingPaymentInput` Pothos input.
- **Root cause**: the `@constraint { min, max }` directives are registered as SDL metadata only
  (`gqlSchema.ts` uses `extendSchema`, no runtime constraint transformer), so `amount: 1e15` sailed through
  GraphQL validation and the service's only guard (`Number.isFinite && > 0`) into the ledger.
- **Proof (pre-fix)**: the suite's `extreme numeric payment amounts` probe recorded the 1e15 payment successfully.
- **Fix**: `MAX_PAYMENT_AMOUNT = 99_999_999` / `MAX_PAYMENT_CREDIT_HOURS = 100_000` constants mirroring the
  declared input contract, enforced in `recordPayment` with the existing `ValidationError(tErrors.package.invalidInput)`.
  (Same gap exists on `PackagePlanInput.priceAmount/creditHours` — left to the package-plan owner; noted for follow-up.)

## Not-a-vulnerability (documented for the record)

- **Anonymous probe false alarm**: `packagePlans` "succeeded anonymously" in an earlier run — root cause was the
  shared Apollo test client's global cookie jar carrying the last demo login's session into "unauthenticated"
  calls. Fixed in the test (`clearCookies()` from `@/test/helpers` before anonymous probes + labeled probes);
  server behavior was correct (`UNAUTHENTICATED`) once the jar was cleared.
- **Suite needed a rate-limit reset**: demo logins share the Redis `ratelimit:auth:[IP_REDACTED]` window
  (10/15 min); repeated runs hit the lockout. The suite clears it in `beforeAll` via the same
  `clearAuthRateLimitCache` convention as `rate-limit.test.ts`.
- **Negative page size / invalid date strings** surface as GraphQL errors (PG 22007 / drizzle RangeError) —
  rejected safely, no crash, no leak. Hardening idea (not implemented, out of TB.6 scope): clamp
  `PaginationArgs.perPage` at `>= 0` to return an empty page instead of a PG error.

## Files touched

- NEW: `frontend/common/graphql/test/accounting/accounting-security.test.ts` (the security suite)
- MOD: `backend/graphql/mutation/billing/accounting.mutation.ts` (VULN-1 fix — 6 gates unified on `requirePermission`)
- MOD: `backend/services/billing/accounting-payment.service.ts` (VULN-2 fix — input contract enforcement)

## Regression sweeps (green)

- `backend/db/test/logic/lms/accounting-payment-workflow.test.ts` — 10 pass / 0 fail
- `backend/db/test/logic/lms/credit-hours-workflow.test.ts` — 5 pass / 0 fail
- repo-wide `bun tsgo` — clean
- `sub-loop.ts --lifecycle lint` — green on both product files + the new test file
