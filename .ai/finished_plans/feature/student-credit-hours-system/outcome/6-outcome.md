# Task 6 Outcome — Frontend GraphQL documents + typed hooks

## Summary
All Phase 6 subtasks implemented. codegen exit 0; tsgo baseline-only.

## Files created
- frontend/common/graphql/sharedDocuments/accounting/accounting.documents.ts — 11 TypedDocumentNode documents (5 queries: PackagePlans/PackagePlan/AccountingPayments/AccountingPayment/StudentCreditHourBalance; 6 mutations: CreatePackagePlan/UpdatePackagePlan/ArchivePackagePlan/RecordAccountingPayment/UpdateAccountingPayment/UpdateAccountingPayment uses AccountingPaymentEditInput/ToggleAccountingPaymentPaidStatus). gql + types imported per credit-lms.documents.ts pattern; every selection includes id (Apollo normalization).
- frontend/common/graphql/sharedDocuments/accounting/index.ts — barrel

## Files modified
- frontend/common/graphql/sharedDocuments/index.ts (+accounting, alphabetical first)
- frontend/common/graphql/generated/gql/graphql.ts + schema.graphql — regenerated (bun run codegen exit 0)

## DEVIATION (documented — Task 6.4 expectation vs repo reality)
Plan expected codegen to emit useXxxQuery/useXxxMutation hook wrappers. This repo's codegen config generates TYPES + Document constants only; views call useQuery(document)/useMutation(document) directly from @apollo/client/react with TypedDocumentNode inference (verified: 0 hook-wrappers exist in generated output for ANY domain; 12 new type occurrences present). Functionally equivalent + type-safe. Phase 8/9 views will consume the exported *QueryDocument/*MutationDocument directly.

## Verification
- tsgo full: baseline-only ✓
- grep: PackagePlansQuery/RecordAccountingPaymentMutation/StudentCreditHourBalanceQuery present in generated gql/graphql.ts (12 occurrences) ✓

## Carry-forward knowledge
1. Use `import { useQuery } from "@apollo/client/react"` + our documents (never useLazyQuery per root AGENTS.md).
2. Document names lowerCamel + QueryDocument/MutationDocument suffix (repo convention overrides plan's PascalCase suggestion).
3. Update mutation input typename is AccountingPaymentEditInput (service-level AccountingPaymentUpdateInput) — plan's "AccountingPaymentUpdateInput" GraphQL name intentionally avoided clashing with PackagePlanUpdateInput conventions; rename trivial if desired later.
4. After ANY pothos change: bun run generate:gqlSchema && bun run codegen (order matters).
