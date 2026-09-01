# Payment Method Catalog

The payment method catalog is the set of admin-managed templates (mobile wallets, payment links, online accounts) that the academy accepts at payment time. An admin with `PAYMENT_METHODS_MANAGE_CATALOGS` opens the `payment-catalogs` dashboard page, which renders `PaymentCatalogsPageContainer` and talks to the GraphQL layer (`payment-method.query.ts` for lists, `payment-method.mutation.ts` for create/update/deactivate). Every operation funnels through `PaymentCatalogService`, whose `assertCatalogAdmin` gate rejects callers lacking the permission with a localized `insufficientPermissions` error. Catalog CRUD is delegated to the three `Supported*Repository` implementations, which persist rows in the `supported_mobile_wallets`, `supported_payment_links`, and `supported_online_accounts` tables; listings default to active rows with optional direction/country filters. The catalog is consumed downstream in two ways: `PaymentMethodService.createUserPaymentMethod` runs `assertCatalogActive` so a user method cannot reference an inactive or deleted catalog entry, and `PaymentMethodSnapshotService.buildTransactionSnapshot` resolves the catalog row (id, slug, name) into an immutable masked/encrypted snapshot that `recordPayin`/`recordPayout` store on the payment record, so historical transactions survive later catalog edits or deactivation. Soft-deactivation (rather than hard delete) plus the snapshot keeps in-flight and past payments auditable while removed templates disappear from new selections.

## Key sources

- `app/(dashboard)/payment-catalogs/page.tsx`
- `frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsPageContainer.tsx`
- `backend/graphql/query/billing/payment-method.query.ts`
- `backend/graphql/mutation/billing/payment-method.mutation.ts`
- `backend/services/payment-method/payment-catalog.service.ts`
- `backend/services/payment-method/payment-method.service.ts`
- `backend/services/payment-method/payment-method-snapshot.ts`

```mermaid
%% Payment Method Catalog — admin-managed templates consumed as masked snapshots at payment time
flowchart TB
  subgraph Admin["Catalog management (admin)"]
    Page["payment-catalogs page (withPageAuth)"]
    Container["PaymentCatalogsPageContainer (tabs view model)"]
    GQLQ["payment-method.query.ts (list catalog queries)"]
    GQLM["payment-method.mutation.ts (create / update / deactivate)"]
  end

  SVC["PaymentCatalogService"]
  Perm["assertCatalogAdmin (PAYMENT_METHODS_MANAGE_CATALOGS)"]
  RepoW["Supported * Repository (wallet / payment-link / online-account)"]
  DB[("supported_mobile_wallets supported_payment_links supported_online_accounts")]

  subgraph Consume["Consumption at payment time"]
    CreateUPM["PaymentMethodService.createUserPaymentMethod"]
    Assert["assertCatalogActive (reject inactive or missing catalog row)"]
    Snap["PaymentMethodSnapshotService.buildTransactionSnapshot"]
    Pay["recordPayin / recordPayout"]
    TxDB[("payments and teacher_payments (paymentMethodSnapshot JSONB)")]
  end

  Page --> Container
  Container --> GQLQ
  Container --> GQLM
  GQLQ --> SVC
  GQLM --> SVC
  SVC --> Perm
  Perm -.->|"denied: insufficientPermissions"| SVC
  SVC -->|"list / create / update / deactivate"| RepoW
  RepoW --> DB
  CreateUPM --> Assert
  Assert -->|"verified active"| DB
  Pay --> Snap
  Snap -->|"resolve catalog row (id, slug, name)"| DB
  Snap -->|"immutable masked snapshot"| TxDB
```

Machine-checkable copy: [payment-methods.mmd](./payment-methods.mmd)
