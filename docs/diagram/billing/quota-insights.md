# Quota Insights & Balances

The `/quotas/insights` dashboard page is the analytics surface for the billing quota system. The server component in `app/(dashboard)/quotas/insights/page.tsx` wraps rendering in `withPageAuth(AppPermission.QUOTAS_VIEW)`, so only authenticated users with that permission reach the page, it then mounts the client-side `QuotaInsightsContainer`, which delegates to `useQuotaInsightsViewModel`. The view model issues the `quotas` GraphQL query (cache-and-network, no filter/pagination) via Apollo, the resolver in `backend/graphql/query/billing/quota.query.ts` requires auth and delegates to `QuotaService.listQuotas`. That service enforces `QUOTAS_VIEW` again and applies IDOR scoping: callers with `QUOTAS_MANAGE` see all quotas, while parents and teachers are restricted to their associated students via `resolveAssociatedStudentIds` — with multiple students and no explicit `studentId` filter, the full scoped set is fetched and filtered/paginated in memory so pagination operates only on authorized rows. Back on the client, the view model applies local filters (date range, kind, status, student), computes headline metrics (active count, total remaining, total reserved, quotas expiring within 7 days, and an overdue "pending backlog" of active quotas past `validUntil` with remaining classes), and builds the four chart series plus a CSV export. A separate `quotaBalance` query powers the per-student balance view: `QuotaService.getStudentQuotaBalance` gates with `QUOTAS_VIEW` plus `assertAssociatedOrManage`, loads active quotas through `QuotaRepository.listActiveByStudent` ordered by priority DESC, `validUntil` ASC, `createdAt` ASC — the exact FIFO ordering used by `selectQuotaForBookingFIFO` — and returns aggregated totals with a FIFO-ordered `breakdownByExpiration`, projecting which quota will drain first. Edge cases: callers with no associated students receive empty results rather than an error, and rows are only quotas that are not soft-deleted (and, for balances, ACTIVE with remaining > 0).

## Key sources

- `app/(dashboard)/quotas/insights/page.tsx` — server entry, `withPageAuth([AppPermission.QUOTAS_VIEW])`
- `frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.tsx` — client container, responsive mobile/desktop views
- `frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel.ts` — Apollo query, filters, metrics, CSV export
- `frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers.ts` — `computeInsightsMetrics` and chart builders
- `backend/graphql/query/billing/quota.query.ts` — `quotas` and `quotaBalance` query resolvers
- `backend/graphql/pothos/billing/quota.pothos.ts` — `Quota`, `QuotaBalance`, `QuotaExpirationBreakdown` object types
- `backend/services/billing/quota.service.ts` — `listQuotas` (IDOR scoping) and `getStudentQuotaBalance` (aggregation)
- `backend/db/repo/billing/quota.repository.ts` — `listAllPaginated`, `listActiveByStudent`, `selectQuotaForBookingFIFO` (FIFO ordering)

```mermaid
%% Quota Insights & Balances — analytics assembly of remaining/expiring quotas per student with FIFO projection
sequenceDiagram
    autonumber
    actor U as Staff, Parent, or Teacher
    participant PAGE as Insights page - quotas insights page.tsx
    participant VM as useQuotaInsightsViewModel
    participant GQL as quota.query.ts - quotas and quotaBalance queries
    participant SVC as QuotaService
    participant REPO as QuotaRepository
    participant DB as quotas table

    U->>PAGE: GET quotas insights route
    PAGE->>PAGE: withPageAuth enforces AppPermission.QUOTAS_VIEW
    Note over PAGE: title localized via getTranslations
    PAGE-->>U: renders QuotaInsightsContainer client component

    VM->>VM: useQuery quotasQueryDocument filter null pagination null
    VM->>GQL: quotas query via Apollo Client, cache-and-network
    GQL->>GQL: requireAuth from ctx
    GQL->>SVC: listQuotas with filter, pagination, actorUserId, locale
    SVC->>SVC: requirePermission QUOTAS_VIEW
    alt caller holds QUOTAS_MANAGE
        SVC->>REPO: listAllPaginated with filter and pagination
    else parent or teacher scoped
        SVC->>SVC: resolveAssociatedStudentIds via permission-utils
        opt multiple students, no studentId filter
            SVC->>REPO: listAllPaginated with filter, pagination null
            SVC->>SVC: filter to associated students, paginate in memory
        end
        opt single associated student
            SVC->>REPO: listAllPaginated with scoped filter
        end
    end
    REPO->>DB: SELECT rows and COUNT WHERE deleted_at IS NULL
    DB-->>SVC: quota rows plus totalCount
    SVC-->>GQL: QuotaPaginatedResult via mapQuotaToReturnType
    GQL-->>VM: data.quotas.rows
    VM->>VM: applyInsightsFilters dateRange, kind, status, studentId
    VM->>VM: computeInsightsMetrics - active, remaining, reserved, expiring within 7 days, overdue backlog
    VM->>VM: build chart data - purchases over time, redemption by type, delivery rate, expired slippage
    VM-->>U: metric cards and charts, exportCsv builds quota-insights.csv

    U->>GQL: quotaBalance query with studentId
    GQL->>SVC: getStudentQuotaBalance with studentId, actorUserId, locale
    SVC->>SVC: requirePermission QUOTAS_VIEW plus assertAssociatedOrManage
    SVC->>REPO: listActiveByStudent with studentId
    REPO->>DB: SELECT WHERE status ACTIVE AND remaining greater than 0
    Note over REPO,DB: ORDER BY priority DESC, validUntil ASC, createdAt ASC - same FIFO order as selectQuotaForBookingFIFO, LIMIT 100
    DB-->>SVC: active quotas in FIFO consumption order
    SVC->>SVC: sum totalActiveClasses, totalRemaining, totalReserved
    SVC->>SVC: build breakdownByExpiration per quota - quotaId, validUntil, remaining
    SVC-->>GQL: QuotaBalanceReturnType with FIFO-ordered expiration breakdown
    GQL-->>U: QuotaBalance payload
```

Machine-checkable copy: [quota-insights.mmd](./quota-insights.mmd)
