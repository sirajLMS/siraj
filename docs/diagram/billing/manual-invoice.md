# Manual Invoice Creation

A staff member with the `BILLING_CREATE_INVOICE` permission creates a one-off invoice for a parent from the Manual tab of the Billing page (`/billing?tab=manual`, the legacy `/billing/manual` route only redirects there). The `useManualInvoiceViewModel` client hook validates the line item (parent, optional student, amount, currency, issue/due dates) with the Zod `manualInvoiceSchema`, then calls the GraphQL `createManualInvoice` mutation, which enforces auth, the `notImpersonating` scope, and argument constraints before delegating to `BillingManagementService.createManualInvoice`. The service re-checks permissions and input (non-empty parentId, positive amount), builds an insert payload with status `UNPAID` and a derived SHA-256 `idempotencyKey`, and inserts the `invoices` row inside a transaction. For non-USD currencies without an explicit snapshot, the repository resolves the latest recorded FX rate from the `exchange_rates` table and stores the `exchangeRateSnapshot`/`exchangeRateSource` on the invoice — if no rate exists, creation fails with a localized error, optional billing months are written to `invoiceCoverageMonths`. After commit, `NotificationSyncService.syncUnpaidNotifications` refreshes unpaid-invoice notifications when `sendEmail` was chosen, and an invoice-generated notification is dispatched to the parent (resolved via `ParentRepository`) through `dispatchWithPreferences`, notification failures are logged but never roll back the invoice. Finally, the resolver converts the amount to the viewer's display currency via `FxDisplayService.convertForDisplay` (`resolveDisplayAmountFields`), returning a `ManualInvoiceResult` whose `displayAmount` is shown in the UI alongside a success toast.

## Key sources

- `app/(dashboard)/billing/manual/page.tsx` — redirect-only route to `/billing?tab=manual`
- `frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel.ts` — RHF/Zod form, Apollo `useMutation(createManualInvoiceMutationDocument)`
- `frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema.ts` — client-side line-item validation
- `backend/graphql/mutation/billing/billing-management.mutation.ts` — `createManualInvoice` mutation field, auth scopes, `resolveDisplayAmountFields`
- `backend/services/billing/billing-management.service.ts` — permission check, input validation, payload building, coverage months, notification dispatch
- `backend/db/repo/billing/billing.repository.ts` — `createInvoice` transaction, `resolveExchangeRateSnapshot`, `createInvoiceCoverageMonths`
- `backend/graphql/pothos/billing/fx-display.pothos.ts` — FX conversion of the returned amount to the display currency

## Diagram

```mermaid
%% Manual Invoice Creation — billing/manual-invoice
sequenceDiagram
    autonumber
    actor M as Billing Manager
    participant UI as useManualInvoiceViewModel
    participant GQL as createManualInvoice mutation
    participant SVC as BillingManagementService
    participant REPO as BillingRepository
    participant FX as exchange_rates table
    participant DB as invoices and invoiceCoverageMonths
    participant NS as NotificationSyncService
    participant NT as dispatchWithPreferences
    participant P as Parent

    M->>UI: Open /billing?tab=manual and fill line item (parent, student, amount, currency, dates)
    Note over UI: /billing/manual page only redirects to /billing?tab=manual, Zod manualInvoiceSchema validates the form client-side
    UI->>GQL: createManualInvoice(input, sendEmail)
    GQL->>GQL: requireAuth + authScopes (BILLING_CREATE_INVOICE, notImpersonating)
    GQL->>SVC: createManualInvoice(actorUserId, input, tErrors)
    SVC->>SVC: requirePermission + validateManualInvoiceInput (parentId, amount > 0)
    alt invalid input or missing permission
        SVC-->>UI: localized Error (invalidParentId / invalidInvoiceAmount / insufficientPermissions)
    end
    SVC->>SVC: buildInvoiceInsertPayload (status UNPAID, derived SHA-256 idempotencyKey)
    SVC->>REPO: createInvoice(payload) in transaction
    REPO->>REPO: resolveExchangeRateSnapshot
    alt currency is USD or snapshot supplied
        REPO->>REPO: pass-through provided snapshot
    else non-USD currency
        REPO->>FX: getLatestExchangeRate(currency, USD)
        alt no rate found
            REPO-->>UI: localized error, invoice not created
        end
    end
    REPO->>DB: INSERT invoices row with exchangeRateSnapshot and exchangeRateSource
    opt billingMonths provided
        REPO->>DB: createInvoiceCoverageMonths rows
    end
    opt sendEmail is true
        SVC->>NS: syncUnpaidNotifications(locale)
    end
    SVC->>SVC: resolveParentUserId via ParentRepository
    SVC->>NT: buildInvoiceGeneratedPayloads then dispatch (failure logged, not thrown)
    NT-->>P: Invoice-generated notification
    SVC-->>GQL: ManualInvoiceResult
    GQL->>GQL: resolveDisplayAmountFields via FxDisplayService.convertForDisplay
    GQL-->>UI: ManualInvoiceResult with displayAmount
    UI-->>M: success toast with auto-dismiss
```

Machine-checkable copy: [manual-invoice.mmd](./manual-invoice.mmd)
