# Billing Alerts & History

This workflow covers how the platform assembles billing alerts (overdue/unpaid invoices) and the per-entity billing history timeline for admins and parents. Entry points are Pothos GraphQL query fields — `unpaidInvoicesAlert`, `parentInvoiceHistory`, `parentBillingSummary`, `adminInvoices`, `adminBillingSummary`, and `studentCreditStatus` — all gated by `authScopes` and re-checked inside the service layer. `BillingAlertsService.getUnpaidInvoices` requires `BILLING_VIEW_UNPAID_INVOICES`, then reads overdue invoices via `BillingRepository.getUnpaidInvoicesSummary`, groups them by parent, and joins parent users so the admin alert list shows who owes what. The history queries require `BILLING_VIEW_HISTORY`, parent-scoped ones additionally resolve a `parentId` (falling back to the caller's own parent record via `ParentRepository.findByUserId`) and enforce an ownership-vs-admin check added as an IDOR fix, throwing `parentNotFound` or `insufficientPermissions` on failure. Repository queries over `invoices`, joined with `students` and `parents`, carry `EXISTS` flags for `invoice_files` payment proofs and rejected `invoice_payment_submissions`, and support pagination plus a LIKE-based search. Edge cases include anonymous callers (rejected by `requireAuth`/auth scopes), missing parent profiles, and cross-tenant access attempts, before returning, resolvers enrich rows with FX display amounts via `resolveDisplayAmountFields`/`enrichSummaryWithDisplayAmounts`.

## Key sources

- `backend/services/billing/billing-alerts.service.ts`
- `backend/services/billing/billing-history.service.ts`
- `backend/graphql/query/billing/billing-alerts.query.ts`
- `backend/graphql/query/billing/billing-history.query.ts`
- `backend/db/repo/billing/billing.repository.ts`

## Diagram

```mermaid
%% Billing Alerts & History: unpaid-invoice alerts and per-entity billing history timeline
sequenceDiagram
  autonumber
  participant Client as "Admin UI / Parent Portal"
  participant GQL as "GraphQL Query Fields"
  participant BAS as BillingAlertsService
  participant BHS as BillingHistoryService
  participant PS as PermissionsService
  participant PR as ParentRepository
  participant BR as BillingRepository
  participant DB as "DB: invoices, parents, users, students, payments"

  rect rgb(245, 245, 245)
    note over Client,DB: Alerts — unpaidInvoicesAlert query
    Client->>GQL: unpaidInvoicesAlert
    GQL->>GQL: authScopes loggedIn, reject anonymous
    GQL->>BAS: getUnpaidInvoices(userId, tErrors)
    BAS->>PS: hasPermission BILLING_VIEW_UNPAID_INVOICES
    alt permission denied
      PS-->>BAS: false
      BAS-->>GQL: throw tErrors.unauthorizedAction
    else authorized
      BAS->>BR: getUnpaidInvoicesSummary()
      BR->>DB: fetchOverdueInvoices from invoices
      BR->>DB: fetch parent users, group invoices by parent
      BR-->>BAS: UnpaidInvoicesSummaryResult items
      BAS-->>GQL: overdue counts plus per-parent items
      GQL->>GQL: FX display enrichment via resolveDisplayAmountFields
      GQL-->>Client: unpaid invoices summary
    end
  end

  rect rgb(245, 245, 245)
    note over Client,DB: Parent-scoped history — parentInvoiceHistory / parentBillingSummary
    Client->>GQL: parentInvoiceHistory(parentId?, userId?, pagination, search)
    GQL->>GQL: prepareParentScopedResolver
    GQL->>BHS: getParentInvoiceHistory(callerUserId, parentId, userId, ...)
    BHS->>PS: hasPermission BILLING_VIEW_HISTORY
    BHS->>PR: findByUserId fallback when parentId is null
    alt parent not found
      PR-->>BHS: null
      BHS-->>GQL: throw tErrors.billing.parentNotFound
    end
    BHS->>PS: getUserContext for ownership-vs-admin check
    BHS->>PR: caller parent lookup (IDOR guard)
    alt caller is neither admin nor the parent
      BHS-->>GQL: throw tErrors.insufficientPermissions
    end
    BHS->>BR: getInvoicesForParent(resolvedParentId, pagination, search)
    BR->>DB: invoices join students, parents, EXISTS invoice_files and invoice_payment_submissions
    BR-->>BHS: rows, totalCount, pageInfo
    BHS-->>GQL: InvoiceHistoryPaginatedResult
    GQL->>GQL: FX display enrichment on rows
    GQL-->>Client: paginated invoice timeline
  end

  rect rgb(245, 245, 245)
    note over Client,DB: Admin history — adminInvoices / adminBillingSummary / studentCreditStatus
    Client->>GQL: adminInvoices / adminBillingSummary / studentCreditStatus
    GQL->>GQL: requireAuth plus authScopes BILLING_VIEW_HISTORY
    GQL->>BHS: getAdminInvoices / getAdminBillingSummary / getStudentCreditStatus
    BHS->>PS: assert BILLING_VIEW_HISTORY
    BHS->>BR: getAllInvoices / getAdminBillingSummary / getStudentsWithCreditStatus
    BR->>DB: scoped aggregates over invoices, payments, students
    BR-->>BHS: admin rows and summaries
    BHS-->>GQL: results
    GQL->>GQL: enrichSummaryWithDisplayAmounts
    GQL-->>Client: admin billing history and summaries
  end
```

Machine-readable copy: [billing-alerts-history.mmd](./billing-alerts-history.mmd)
