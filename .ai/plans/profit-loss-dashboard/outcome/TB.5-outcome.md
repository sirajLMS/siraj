# TB.5 Outcome — Penetration Verification (P&L GraphQL query + 4 CSV export routes)

**Date:** 2026-09-17
**Method:** `.agents/skills/pentester/SKILL.md` + `.agents/skills/idor-testing/SKILL.md` — audit of auth/permission enforcement, input validation (month argument), and CSV formula-injection sanitization. Backend-only abuse tests added to existing test files (no UI/e2e, per user instruction).

## Audit scope reviewed

| Surface | Enforcement point | Finding |
|---|---|---|
| `profitLossReport` GraphQL query | `authScopes: { permission: AppPermission.ACCOUNTING_PROFITS_VIEW }` in `backend/graphql/query/accounting/profit-loss.query.ts:18` + defense-in-depth `requirePermission` inside `ProfitLossService.getReport` (`backend/services/accounting/profit-loss.service.ts:214`) + `requireAuth` at `:213` | ✅ No BOLA/IDOR — object access is organization-wide financial data gated by a single global permission; no per-object id argument exists on the query, so there is no object-level reference to abuse |
| 4 CSV export routes (`app/api/profit-loss/{payments,expenses,income,summary}/export/route.ts`) | session cookie via `getServerUserContext` → 401 when absent; `ACCOUNTING_PROFITS_VIEW` enforced inside `ProfitLossService.getReport` before any tab read → 403 | ✅ All four routes reject with 403 before any data read; test coverage existed and was extended |
| Month argument validation | `validateMonth` (`backend/services/accounting/profit-loss-helpers.ts:157-165`): strict `/^\d{4}-\d{2}$/` pattern + calendar range check (monthPart 1–12). Month is used only via `startOfUtcMonth`/`startOfNextUtcMonth` date arithmetic in the repo queries (`backend/db/repo/scheduling/class-instances.ts:837-838`) — never interpolated into LIKE/regex | ✅ Wildcard/regex injection impossible: `%`, `.*`, `2024-1`, `2024-13`, `2024-00`, `2024-01; DROP TABLE`, `____-__` all rejected with `MONTH_INVALID` |
| CSV formula injection | `toCsvCell` (`backend/services/accounting/profit-loss-csv.serializer.ts:23-29`): OWASP prefixes `=, +, -, @, \t, \r` get a `'` prefix; RFC 4180 quoting for `,`, `"`, newlines | ✅ Sanitization correct; tests previously covered only `=` and `@` — extended to `+`, `-`, tab |
| Export filename header | `buildProfitLossCsvFilename` (`backend/services/accounting/profit-loss-csv.serializer.ts:185`) — month is validated before header construction; filename is quoted in `Content-Disposition` | ✅ No header injection (month already passed strict validation) |
| Currency argument | `isSupportedCurrency` allowlist against `CurrencyCode` enum (`backend/services/accounting/profit-loss-csv.serializer.ts:157`) | ✅ `XYZ` etc. rejected with 400 before any read |

## CRITICAL findings

None.

## HIGH findings

None.

## MEDIUM findings (fixed — abuse tests added to existing test files)

1. **M1 — Untested formula-prefix neutralization paths.** `toCsvCell` neutralizes 6 OWASP prefixes but route tests asserted only `=` (payments/income/summary) and `@` (expenses). The `+`, `-`, `\t`, `\r` branches were untested — a regression disabling them would have passed CI.
   Fixed by adding "neutralizes the remaining OWASP formula prefixes (+, -, tab, CR)" tests to:
   - `app/api/profit-loss/payments/export/route.test.ts`
   - `app/api/profit-loss/expenses/export/route.test.ts`
   - `app/api/profit-loss/income/export/route.test.ts`
   - `app/api/profit-loss/summary/export/route.test.ts`

2. **M2 — No role-specific BOLA probe at the GraphQL layer.** The existing denial test used a generic `permissions: []` context; it did not demonstrate that real business roles (teacher/student/parent/staff-manager) carrying their default permission sets are rejected.
   Fixed: `test.each` BOLA probe in `backend/graphql/query/accounting/profit-loss.query.test.ts` exercising `UserRole.TEACHER`, `UserRole.STUDENT`, `UserRole.PARENT`, `UserRole.STAFF` contexts — each rejected with FORBIDDEN and `getReport` never called (zero service calls).

3. **M3 — Wildcard/injection month inputs untested at the GraphQL and boundary layer.** `2024-00` (passes the shape regex, fails the range check) and injection strings like `2024-01; DROP TABLE` / `____-__` had no coverage.
   Fixed by adding:
   - `test.each` month-abuse cases (`%`, `.*`, `2024-1`, `2024-00`, `2024-01; DROP TABLE`, `____-__`) to `backend/graphql/query/accounting/profit-loss.query.test.ts`
   - `2024-00` boundary + injection-attempt cases to `validateMonth` block in `backend/services/accounting/profit-loss-helpers.test.ts`

## LOW findings (recommendations — not actioned)

1. **L1 — Export routes' 403 is asserted via a mocked `ForbiddenError`.** The route tests mock `ProfitLossService.getReport` and make it throw; the 403 path is proven, but the wiring of the real `requirePermission` to the route is only covered end-to-end by the journey tests (TB.1–TB.3). Acceptable given layer separation; recommend keeping TB.1–TB.3 green as the integration proof.
2. **L2 — GraphQL pagination arguments are not clamped server-side** (negative/huge `paymentsLimit` values pass through to the service). They are Drizzle `limit`/`offset` parameters (parameterized integers, no injection risk), but a negative offset could surface as a query error. Recommend clamping in `getReport` if abuse traffic is observed.

## Verification

- `bun run test/scripts/run-test.ts` on all six touched test files — all green:
  - payments export: 12 pass / 0 fail
  - expenses export: 11 pass / 0 fail
  - income export: 11 pass / 0 fail
  - summary export: 10 pass / 0 fail
  - profit-loss.query.test.ts: 22 pass / 0 fail
  - profit-loss-helpers.test.ts: 37 pass / 0 fail
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exit 0 for all six files (tsgo → oxlint → biome → lint → duplicates → codescene all passed)

## Files changed

- `app/api/profit-loss/payments/export/route.test.ts` (+1 test)
- `app/api/profit-loss/expenses/export/route.test.ts` (+1 test)
- `app/api/profit-loss/income/export/route.test.ts` (+1 test)
- `app/api/profit-loss/summary/export/route.test.ts` (+1 test)
- `backend/graphql/query/accounting/profit-loss.query.test.ts` (+2 test blocks: 4-role BOLA probe, 6-case month-abuse probe)
- `backend/services/accounting/profit-loss-helpers.test.ts` (+2 tests: month-00 boundary, injection attempts)

No production code changes were required — the enforcement layers were already correct; this task closed the test-coverage gaps proving them.
