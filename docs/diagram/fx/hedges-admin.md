# Currency Hedge Management

Billing admins manage currency hedge positions that protect the academy against FX volatility on billed amounts. The legacy route `/billing/currency-hedges` (`app/(dashboard)/billing/currency-hedges/page.tsx`) now just redirects to the **Hedges** tab of the billing dashboard (`/billing?tab=hedges`), where `useCurrencyHedgesViewModel` loads positions via the Apollo `currencyHedges` query and drives add/edit/delete dialogs backed by the `createCurrencyHedge`, `updateCurrencyHedge`, and `deleteCurrencyHedge` mutations. Every GraphQL field is gated by the `BILLING_MANAGE_CURRENCY_HEDGES` authScope (mutations additionally require `notImpersonating`), and `CurrencyHedgeService` re-checks the permission through `PermissionsService` before touching data. On writes the service validates `hedgeType` against `LONG`/`SHORT` and delegates to `CurrencyHedgeRepository`, which performs Drizzle CRUD against the `currency_hedges` table (PostgreSQL/SQLite, `amount` stored as text for decimal precision). Failure paths are localized errors: `insufficientPermissions` when the permission check fails, `invalidInput` for a bad hedge type, `recordNotFound` when an update/delete targets a missing row, and `currencyHedgeCreateFailed` if an insert returns nothing. Seeders bypass auth entirely through the `findHedgesByCurrencies` and `createManyHedges` bootstrap functions.

## Key sources

- `app/(dashboard)/billing/currency-hedges/page.tsx` — redirect page to `/billing?tab=hedges`
- `frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel.ts` — client ViewModel (query, dialog state, form state)
- `backend/graphql/query/billing/currency-hedge.query.ts` — `currencyHedges` query field
- `backend/graphql/mutation/billing/currency-hedge.mutation.ts` — create/update/delete mutations
- `backend/services/fx/currency-hedge.service.ts` — permission checks, hedge-type validation, seeder helpers
- `backend/db/repo/billing/currency-hedge.repository.ts` — Drizzle CRUD on the hedge table
- `backend/db/schema/billing/billing.ts` — `currencyHedges` table definition (`currency_hedges`)

## Diagram

```mermaid
%% Currency Hedge Management — admin CRUD over billing FX hedge positions
sequenceDiagram
  autonumber
  actor Admin
  participant Page as "currency-hedges page.tsx"
  participant VM as "useCurrencyHedgesViewModel"
  participant GQL as "GraphQL currencyHedge query/mutations"
  participant SVC as "CurrencyHedgeService"
  participant PERM as "PermissionsService"
  participant REPO as "CurrencyHedgeRepository"
  participant DB as "currency_hedges table"

  Admin->>Page: "GET /billing/currency-hedges"
  Page-->>Admin: "redirect to /billing?tab=hedges"
  Admin->>VM: Open Hedges tab
  VM->>GQL: currencyHedges query
  GQL->>SVC: listHedges(actorUserId, tErrors)
  SVC->>PERM: hasPermission(BILLING_MANAGE_CURRENCY_HEDGES)
  PERM-->>SVC: allowed
  SVC->>REPO: listAll()
  REPO->>DB: select order by updatedAt desc
  DB-->>REPO: hedge rows
  REPO-->>VM: rows rendered in data grid

  alt Create / Update / Delete hedge
    VM->>GQL: createCurrencyHedge / updateCurrencyHedge / deleteCurrencyHedge
    GQL->>GQL: authScopes permission + notImpersonating
    GQL->>SVC: createHedge / updateHedge / deleteHedge
    SVC->>PERM: hasPermission(BILLING_MANAGE_CURRENCY_HEDGES)
    alt permission denied
      PERM-->>SVC: false
      SVC-->>VM: Error insufficientPermissions
    else hedgeType invalid on write
      SVC->>SVC: assertValidHedgeType(LONG | SHORT)
      SVC-->>VM: Error invalidInput
    else valid write
      SVC->>REPO: create / update / deleteById
      REPO->>DB: insert / update / delete with returning
      alt row not found
        DB-->>REPO: no row returned
        REPO-->>VM: Error recordNotFound
      else success
        DB-->>REPO: affected row
        REPO-->>VM: updated hedge / true
      end
    end
  end

  Note over SVC,REPO: Seeders bypass auth via findHedgesByCurrencies and createManyHedges
```

Machine-checkable copy: [hedges-admin.mmd](./hedges-admin.mmd)
