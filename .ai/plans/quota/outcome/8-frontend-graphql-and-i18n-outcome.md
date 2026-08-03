# Phase 8 Outcome: Frontend GraphQL Documents & i18n

## Tasks Covered
- Task 20: Shared GraphQL Documents
  - `frontend/common/graphql/sharedDocuments/billing/quota.documents.ts`
  - `frontend/common/graphql/sharedDocuments/scheduling/available-slots.documents.ts`
  - `frontend/common/graphql/sharedDocuments/billing/index.ts`
  - `frontend/common/graphql/sharedDocuments/scheduling/index.ts`
- Task 21: i18n System Setup
  - `shared/locale/types/dashboard/billing/quota.ts`
  - `shared/locale/en/dashboard/billing/quota.ts`
  - `shared/locale/ar/dashboard/billing/quota.ts`
  - `shared/locale/namespaces/dashboard/billing/quota.namespace.ts`
  - `shared/locale/namespaces/index.ts`
  - `shared/locale/types/errors/index.ts`
  - `shared/locale/en/errors/index.ts`
  - `shared/locale/ar/errors/index.ts`

---

## Implementation Details

1. **Shared GraphQL Documents**:
   - `quota.documents.ts`: Implemented `quotaQueryDocument`, `quotasQueryDocument`, `studentQuotasQueryDocument`, `studentOpenQuotasQueryDocument`, `quotaBalanceQueryDocument`, `quotaLedgerQueryDocument`, `createQuotaMutationDocument`, `updateQuotaMutationDocument`, and `deleteQuotaMutationDocument`.
   - `available-slots.documents.ts`: Implemented `availableClassSlotsQueryDocument`.
   - Re-exported from domain index files.
   - Code generation ran cleanly via `bun run generate:gqlSchema && bun codegen`.

2. **i18n Translation System**:
   - Defined `QuotaLabels` type schema covering page titles, form field labels, quota kinds, statuses, period types, actions, ledger columns, and overview statistics.
   - Added complete English (`quotaEn`) and Arabic (`quotaAr`) translations.
   - Defined `DashboardBillingQuota` namespace (`"dashboard.billing.quota"`) with lazy imports and registered it in `shared/locale/namespaces/index.ts`.
   - Extended error translations (`outOfQuota`, `quotaExpired`, `quotaNotFound`, `invalidQuotaState`) in English and Arabic.

---

## Quality Verification

- `bun run generate:gqlSchema && bun codegen`: Passed cleanly (0 errors).
- `bun tsgo`: Passed cleanly (0 errors).
- `bun biome:check`: Passed cleanly (0 errors, 0 warnings).
