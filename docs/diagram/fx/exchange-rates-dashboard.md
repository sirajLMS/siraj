# Exchange Rates Administration

Admins manage foreign-exchange conversion rates from the billing dashboard: the route `app/(dashboard)/billing/exchange-rates/page.tsx` simply redirects to `/billing?tab=exchangeRates`, where the `useExchangeRatesViewModel` hook loads the latest rate per currency pair and the latest FX sync run via the `latestExchangeRates` and `latestFxSyncRun` GraphQL queries (both gated by `BILLING_VIEW_EXCHANGE_RATES` and served by `FxRateQueryService` over the `currencyExchangeRates` table). An admin with `BILLING_REFRESH_EXCHANGE_RATES` can trigger `refreshExchangeRates`, which first passes through `FxRateLimitService.checkManualRefreshRateLimit` — a `cacheService` counter allowing at most 3 refreshes per user per hour — before delegating to `FxIngestionService.refreshRates`, exceeding the limit surfaces a localized `FX_REFRESH_RATE_LIMIT_EXCEEDED` GraphQL error in a snackbar. An admin with `BILLING_OVERRIDE_EXCHANGE_RATES` can open `ManualOverrideDialog` to submit a currency pair, rate, and optional effective date to the `upsertManualExchangeRate` mutation, which `FxRateAdminService.upsertManualRate` re-checks via `PermissionsService` before `BillingRepository.updateExchangeRate` writes the new rate row plus an audit entry in `currencyExchangeAuditLogs` inside one transaction. Both mutations reject impersonated sessions (`notImpersonating` auth scope), and successful actions refetch the rates grid and show a localized success snackbar. Edge cases include permission-denied throws (`insufficientPermissions`), rate-limit exhaustion, empty rate input (blocked client-side), and stale-rate banners derived from the latest sync run.

Key sources:

- `app/(dashboard)/billing/exchange-rates/page.tsx`
- `frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel.ts`
- `frontend/common/views/dashboard/admin/billing/exchange-rates/ManualOverrideDialog.tsx`
- `backend/graphql/query/billing/fx-ingestion.query.ts`
- `backend/graphql/mutation/billing/fx-ingestion.mutation.ts`
- `backend/services/fx/fx-rate-admin.service.ts`
- `backend/services/fx/fx-rate-limit.service.ts`
- `backend/db/repo/billing/billing.repository.ts` (`updateExchangeRate`, `writeExchangeRateWithAudit`, `listLatestExchangeRates`)

```mermaid
%% Exchange Rates Administration — view, manual refresh (rate-limited), and manual override of FX rates
sequenceDiagram
    autonumber
    actor Admin
    participant Page as ExchangeRatesPage
    participant VM as useExchangeRatesViewModel
    participant Dialog as ManualOverrideDialog
    participant GQL as Pothos GraphQL Layer
    participant Query as FxRateQueryService
    participant RL as FxRateLimitService
    participant Ingest as FxIngestionService
    participant AdminSvc as FxRateAdminService
    participant Perm as PermissionsService
    participant Repo as BillingRepository
    participant Cache as cacheService
    participant DB as PostgreSQL

    Admin->>Page: GET /billing/exchange-rates
    Page-->>Admin: redirect to /billing?tab=exchangeRates

    Admin->>VM: Open exchange rates tab
    VM->>GQL: latestExchangeRates + latestFxSyncRun queries
    Note over GQL: authScope BILLING_VIEW_EXCHANGE_RATES
    GQL->>Query: listLatestExchangeRates / getLatestSyncRun
    Query->>Repo: listLatestExchangeRates (DISTINCT ON per pair)
    Repo->>DB: SELECT from currencyExchangeRates
    DB-->>Admin: latest rates grid + sync run status

    rect rgb(235, 245, 255)
        Note over Admin,DB: Manual Provider Refresh
        Admin->>VM: Click Refresh (canRefresh = BILLING_REFRESH_EXCHANGE_RATES)
        VM->>GQL: refreshExchangeRates mutation
        GQL->>RL: checkManualRefreshRateLimit(userId)
        RL->>Cache: incr fx refresh counter (max 3 per hour)
        alt Limit exceeded
            RL-->>GQL: throw fxRefreshRateLimitExceeded
            GQL-->>VM: GraphQLError code FX_REFRESH_RATE_LIMIT_EXCEEDED
            VM-->>Admin: snackbar with localized error
        else Within limit
            RL-->>GQL: ok
            GQL->>Ingest: refreshRates (trigger Manual, force flag)
            Ingest-->>VM: RefreshExchangeRatesResult
            VM-->>Admin: success snackbar + refetch rates and sync run
        end
    end

    rect rgb(245, 255, 235)
        Note over Admin,DB: Manual Rate Override
        Admin->>VM: Open override dialog (canOverride = BILLING_OVERRIDE_EXCHANGE_RATES)
        VM->>Dialog: open ManualOverrideDialog
        Admin->>Dialog: pick currencies, rate, effectiveDate, submit
        Dialog->>GQL: upsertManualExchangeRate mutation
        Note over GQL: authScope BILLING_OVERRIDE_EXCHANGE_RATES, notImpersonating
        GQL->>AdminSvc: upsertManualRate(userId, input, locale)
        AdminSvc->>Perm: hasPermission(BILLING_OVERRIDE_EXCHANGE_RATES)
        alt Permission missing
            Perm-->>AdminSvc: false
            AdminSvc-->>Dialog: throw insufficientPermissions
            Dialog-->>Admin: onError snackbar
        else Authorized
            AdminSvc->>Repo: updateExchangeRate(input, changedByUserId)
            Repo->>DB: transaction: insert currencyExchangeRates + currencyExchangeAuditLogs
            DB-->>Dialog: new rate row
            Dialog-->>VM: onSuccess
            VM-->>Admin: success snackbar + refetch rates
        end
    end
```

Machine-checkable copy: [exchange-rates-dashboard.mmd](./exchange-rates-dashboard.mmd)
