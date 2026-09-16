# Task 5 Outcome — Accounting locale namespace (EN + AR)

## Summary
All Phase 5 subtasks implemented following shared/AGENTS.md compile-time i18n conventions. tsgo at baseline; locale:snapshots regenerated (248 processed, 10 written).

## Files created (TS implementation convention — plan said .json; repo uses .ts, snapshots JSON-ify at build)
- shared/locale/types/dashboard/accounting/payments.ts — PaymentsLabels (columns/filters/form/gateways{NONE..OTHER}/status/detail + currencyWarning fn)
- shared/locale/types/dashboard/accounting/package-plans.ts — PackagePlansLabels (CRUD + archive + hoursUnit)
- shared/locale/types/dashboard/accounting/student-credit-hours.ts — StudentCreditHoursLabels (balance card, reasons map, perAudience hints, nextClassConsumes)
- shared/locale/types/dashboard/accounting/index.ts — barrel
- shared/locale/en/dashboard/accounting/{payments,package-plans,student-credit-hours}.ts (dashboardAccountingPaymentsEn / …PackagePlansEn / …StudentCreditHoursEn)
- shared/locale/ar/dashboard/accounting/{payments,package-plans,student-credit-hours}.ts (full Arabic RTL strings, LTR brand names kept)
- shared/locale/namespaces/dashboard/accounting/{payments,package-plans,student-credit-hours}.namespace.ts — defineNamespace with STABLE ids: dashboard.accounting.payments / dashboard.accounting.package-plans / dashboard.accounting.student-credit-hours
- shared/locale/namespaces/dashboard/accounting/index.ts — barrel

## Files modified
- shared/locale/types/index.ts (+dashboard/accounting export)
- shared/locale/namespaces/dashboard/index.ts (+accounting barrel export)
- shared/locale/types/dashboard/core/nav.ts — +navGroupAccounting, +accountingPayments, +accountingPackages on DashboardNavigationLabels
- shared/locale/en/dashboard/core/nav.ts + ar/…/nav.ts — implementations (Accounting / المحاسبة, Payments / المدفوعات, Packages / الباقات)
- Task 5.9 errors: ALREADY DONE in Phase 2 (credit.insufficientHours + PackageErrors + package namespace, EN+AR)

## Verification
- tsgo full: baseline-only (2 storybook) ✓ after fixing 2 silently-failed payload writes (types pkg/sch) — ALWAYS ls-verify remote after batch writes
- bun run locale:snapshots → public/static/locale-snapshots/{en,ar}/dashboard.accounting.{payments,package-plans,student-credit-hours}.json ALL PRESENT ✓ (+ dashboard.core.nav.json updated)
- Background sub-loop codescene running on all 14 touched locale files (/tmp/subloop-p5-master.log)

## Carry-forward knowledge
1. Locale impls are TS modules exporting dashboard<X>En/Ar const typed against the shared interface — never raw JSON.
2. defineNamespace first arg MUST be the stable namespace id (browser cache key).
3. nav.ts interface impl keys must be added in BOTH en/ar or tsgo fails.
4. types/index.ts exports each domain dir directly (no types/dashboard/index.ts intermediate).
5. Silent write failures: ai_ssh returns ok even when a file lands partially — verify with ls after batch pushes.
