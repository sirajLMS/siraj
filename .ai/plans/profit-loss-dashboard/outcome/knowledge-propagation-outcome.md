# Knowledge Propagation — profit-loss-dashboard

**Date:** 2026-09-17
**Status:** Complete

## Sources Read

All outcome files in `.ai/plans/profit-loss-dashboard/outcome/` (1.1–1.9, 2.1–2.4, 3.1–3.4,
4.1–4.4, 5.1–5.5, TB.1–TB.5, phase0, phase0-baseline, plan-review R1/R2,
post-implementation-review, test-layer-coverage).

## Propagated (this run + prior run)

| Artifact | Action | Content |
|---|---|---|
| `docs/billing/profit-loss-dashboard.md` | CREATED (prior run) | Canonical domain reference: surface map, architecture, contracts, battle-tested gotchas |
| `.agents/skills/fix-tests/SKILL.md` | UPDATED (prior run) | Cross-Actor Workflows: test-DB permission migrations, notification spy scope, FK RESTRICT cleanup order, `createdAt` stamping, state-machine CHECK constraints |
| `.agents/skills/drizzle/SKILL.md` | UPDATED (prior run) | Dialect-Aware Constraints: raw SQL bulk fixture constraints (NOT NULL/CHECK/FK chains/exact enum strings) |
| `docs/graphql/dual-enum-bridges.md` | CREATED (this run) | Codegen enum vs domain enum structural incompatibility + string-value/type-guard bridge with explicit house-default fallback. Generalized from the `CurrencyCode` dual-enum carry-forward (4.2) |
| `docs/drizzle/repo-boundary-input-guards.md` | CREATED (this run) | Malformed filter input (month string) reaching a Drizzle SQL expression throws `RangeError`; repo contract is no data-access throw, no widened scan — guard and return a stable empty page. From TB.4 (6 RED repo tests fixed) |
| `docs/frontend/zustand-persist-stores.md` | CREATED (this run) | Persisted filter-store idiom: default-state factory, non-negative page clamping, page reset on filter change, enum value imports at runtime, JSON-serializable persist state. From 4.2/4.3 |
| `docs/i18n/locale-namespace-migration.md` | EXTENDED (this run) | Tooling note: no `locale:validate` script — `locale:snapshots` is the validator/executor; verify written snapshots by grep. From 3.3/3.4 outcomes |

## Already Documented Elsewhere (verified, not duplicated)

- **CSV export route pattern** (shared serializer + RFC 4180 + OWASP formula-injection
  neutralization + `X-Export-Truncated` header): already covered in
  `docs/services/session-audit-reports.md` (CSV Export Contract section) and
  `docs/billing/profit-loss-dashboard.md`. No new doc.
- **Journey-test patterns** (fixture provisioning cast, `afterAll` audit-log sweep under the
  immutability trigger, notification-dispatch spying with ESM live-binding caveat): already
  covered in `docs/testing/workflow-journey-tests.md` and `.agents/skills/fix-tests/SKILL.md`.
  No new doc.

## Deliberately NOT Propagated (feature-specific)

- Profit & Loss surface map, sidebar placement, permission strings
  (`ACCOUNTING_PROFITS_VIEW`), route paths, tab names — live in the billing doc only.
- Plan-path vs actual-path corrections (payments → accounting-payment.repository,
  credit-transactions → credit.repository) — plan-verification bookkeeping, not reusable.
- `provisionPayrollJourneyCast` / P&L-specific repo test names — fixture helpers are
  feature-scoped; the generalized fixture/sweep/spy invariants are what propagated.
- Sub-loop data-driven `test.each` dedup pattern — process-specific to this plan's test run.
- ViewModel interface / labels-bundle carry-forwards — consumed within the plan itself.

## Verification

- All four docs touched this run: `bun biome:check` on the docs tree (markdown is not
  oxlint-lintable — the sub-loop's oxlint stage reports "No files found to lint" for markdown,
  a pre-existing limitation noted in the prior run).
- Skills updated in the prior run: tsgo passed (same markdown limitation).
