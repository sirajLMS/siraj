# Plan Review Outcome — R4 (Refinement Round 4)

**Date**: 2026-06-01
**Reviewer**: /plan-review skill — plan files re-verified against codebase post-template-rewrite
**Plan**: `.ai/plans/student-parent-portal/` (specs, design, tasks)

## Findings (violations found → fixed)

| # | Layer/rule | File | Violation | Fix |
|---|---|---|---|---|
| 1 | [i18n] locale architecture | tasks.md (4.1 steps, QL lists; 4.2 QL; 3.1 QL; 8.1 QL; 10.2 QL) | Referenced removed legacy system: `shared/locale/types/<ns>/index.ts`, `shared/locale/<locale>/<ns>/`, `serverLegacy.ts` `namespacePaths` | Replaced with real compile-time system: `shared/locale/namespaces/**/<name>.namespace.ts` via `defineNamespace("<stable.string.id>", config)` + en/ar implementations + `MessageSchema` entry in `shared/locale/types/message.ts`; explicit note that serverLegacy/namespacePaths no longer exist |
| 2 | [Architecture] frontend/views is DEPRECATED | design.md (F5 Payments Ledger) | New page planned at `frontend/views/dashboard/parent/payments/` | Changed to `frontend/common/views/dashboard/parent/payments/` Container + ViewModel with tier views in `frontend/desktop|mobile/views/...` per frontend/views/AGENTS.md rule "Container+ViewModel in frontend/common/views/, desktop tier in frontend/desktop/views/, mobile tier in frontend/mobile/views/" |
| 3 | [Frontend] MetricCard rule | design.md F5; tasks.md 10.1 scope/steps/exit | Bare "MetricCard" in a view violates "never use components/MetricCard directly in a domain view; single metric still uses MetricCardGrid wrapper" | Changed to `DesktopMetricCardGrid` / `MobileMetricCardGrid` throughout |
| 4 | [Factual] evidence citations | design.md Absent or Not Reused; tasks.md P0.3, P1.5 R3 bullet | Claimed `scheduling-queries.repository.findUpcoming.ts:52` lacks range support; actually its line 53 has `lte(scheduledStartAt, windowEnd)` — it's a `withinHours` (default 24h) cron-reminder helper, not the student sessions query | Reworded: missing arbitrary-window support is evidenced by the student sessions list helpers (`.helpers.ts:209`, `gte`-only); findUpcoming is documented as a separate cron-reminder path. Task 3.1 keeps findUpcoming in its "files modified" list (it gains from/to params) — that use is correct |

## Verified path claims (already correct in plan)

- `frontend/common/views/AGENTS.md` — exists with MetricCardGrid rule
- `backend/db/repo/scheduling/scheduling-queries.repository.findUpcoming.ts` — exists (cron helper, `withinHours`)
- `backend/db/repo/scheduling/scheduling-tracking/` (session-reschedules-queue) — exists
- `backend/lib/dialectAwareBuilder.ts` — exists
- `shared/constants/scheduling.enum.ts` — exists with `createPgEnumFromEnum` used from `shared/lib/enums.ts`
- `backend/lib/Interval.ts` DomainError — exists (`backend/lib/Interval`)
- Docs cited in tasks: `docs/drizzle/prepared-statements.md`, `docs/graphql/dataloader-batching.md`, `docs/graphql/domain-error-extensions-code.md`, `docs/frontend/quota-ui-patterns.md`, `docs/billing/quota-system.md` — all exist
- Missing-INTENT guard phrasing ("read backend/services/<domain>/AGENTS.md and backend/db/repo/<domain>/AGENTS.md if present") correct for scheduling & billing (neither has sub-AGENTS.md); existing ones (backend/services/communication, backend/db/repo/meetings, backend/db/repo/quotas) correctly named.

## Verdict

All four violations fixed in design.md / tasks.md. Plan passes all AGENTS.md rules for affected layers.
