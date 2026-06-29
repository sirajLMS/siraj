# Refactor Plan: `users/[id]/billing-profile`

## Objective

Refactor the billing-profile page to ensure all components, actions, and data interactions are real and functional. Replace placeholder GraphQL data, non-functional buttons, and mock actions with actual implementations.

---

## Current State

The route `app/[locale]/(dashboard)/users/[id]/billing-profile/` currently has:
- **`page.tsx`**: Simple Server Component that extracts `id` from params and passes as `userId` to client view
- **`UserBillingProfileView.tsx`**: Placeholder stub — renders only a title and `userId` text. No data fetching, no metrics, no invoice table, no actions, no responsive split

### Critical Gap: `userId` vs `parentId`

The URL parameter `[id]` is a **`users.id`** (userId). But all billing GraphQL queries require **`parents.id`** (parentId). These are **different UUIDs** — the `parents` table has its own `id` PK and a `userId` FK referencing `users.id`.

**Resolution**: Extend existing billing GraphQL queries (`parentInvoiceHistory`, `parentBillingSummary`) to accept an optional `userId` arg. The service layer already has `ParentRepository.findByUserId()` for this resolution.

---

## Scope

### In-Scope Files (under the route module and its subcomponents)

| File | Action |
|------|--------|
| `app/[locale]/(dashboard)/users/[id]/billing-profile/page.tsx` | Minimal update |
| `frontend/views/dashboard/users/billing-profile/UserBillingProfileView.tsx` | Refactor to responsive switcher |
| `frontend/views/dashboard/users/billing-profile/UserBillingProfileContainer.tsx` | **New** |
| `frontend/views/dashboard/users/billing-profile/UserBillingProfileDesktopView.tsx` | **New** |
| `frontend/views/dashboard/users/billing-profile/UserBillingProfileMobileView.tsx` | **New** |
| `frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types.ts` | **New** |
| `frontend/stores/userBillingProfileStore.ts` | **New** |
| `frontend/graphql/sharedDocuments/user-billing-profile.documents.ts` | **New** |
| `frontend/graphql/sharedDocuments/index.ts` | Add export |
| `test/ui/components/UserBillingProfileView.test.tsx` | Update |

### Required Backend Changes (necessary for data flow)

| File | Action | Reason |
|------|--------|--------|
| `backend/services/billing/billing-history.service.ts` | Add `userId` param to `getParentInvoiceHistory` and `getParentBillingSummary` | Resolution: `parentId` > `userId` (via `findByUserId`) > `actorUserId` fallback |
| `backend/graphql/pothos/billing-history.pothos.ts` | Add `userId: String` arg to `parentInvoiceHistory` and `parentBillingSummary` queries | Allow client to pass userId for resolution |

---

## Implementation Phases

### Phase 1: Backend — Extend billing queries with `userId` arg

#### 1a. Modify `backend/services/billing/billing-history.service.ts`

- `getParentInvoiceHistory(actorUserId, parentId, pagination, locale?)` → add `userId?: string | null` parameter
- `getParentBillingSummary(actorUserId, parentId, locale?)` → add `userId?: string | null` parameter
- Resolution priority in both functions:
  1. If `parentId` is provided → use it directly (existing behavior)
  2. Else if `userId` is provided → call `ParentRepository.findByUserId(userId)` to resolve `parentId`
  3. Else → existing fallback: resolve via `actorUserId` (current behavior for self-service)

```ts
let resolvedParentId = parentId;
if (!resolvedParentId) {
  const lookupUserId = userId || actorUserId;
  const parent = await ParentRepository.findByUserId(lookupUserId);
  if (!parent) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("parentNotFound"));
  }
  resolvedParentId = parent.id;
}
```

#### 1b. Modify `backend/graphql/pothos/billing-history.pothos.ts`

- `parentInvoiceHistory` query: Add `userId: t.arg.string({ required: false })` to args
- `parentBillingSummary` query: Add `userId: t.arg.string({ required: false })` to args
- Pass `args.userId ?? null` to service functions

#### 1c. Regenerate GraphQL types

```bash
~/.bun/bin/bun run generate:gqlSchema && ~/.bun/bin/bun codegen
```

---

### Phase 2: Frontend — Type Management

#### 2a. Create `frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types.ts`

Types to define:
- `UserBillingProfileContainerProps` — `{ readonly userId: string }`
- `UserBillingProfileViewProps` — view-level props (labels, summary, invoices, handlers, pagination)
- `UserBillingProfileDesktopViewProps` — same as view props
- `UserBillingProfileMobileViewProps` — same as view props

Rules:
- NO type definitions in non-`.types` files
- Use enum types from `@/shared/lib/enum` (e.g., `InvoiceStatus`) instead of string literals
- Frontend files MUST NOT import from `backend/` — use `@/frontend/...` and `@/shared/...` only
- Import `BillingLabels` from `@/shared/messages/types/dashboard/billing`
- Reuse `ParentBillingSummary` and `ParentInvoiceRow` from `../billing/types/parentBillingTypes` (already frontend types)
- No re-exports of types from non-`.types` files

---

### Phase 3: Frontend — GraphQL Documents

#### 3a. Create `frontend/graphql/sharedDocuments/user-billing-profile.documents.ts`

New documents with `userId` arg:

```ts
export const userBillingProfileSummaryQueryDocument: TypedDocumentNode<
  Operations.UserBillingProfileSummaryQuery,
  Types.QueryUserBillingProfileSummaryArgs
> = gql`
  query UserBillingProfileSummary($userId: String) {
    parentBillingSummary(userId: $userId) {
      id
      outstandingBalance
      paidThisTerm
      nextDueDate
      activeStudents
    }
  }
`;

export const userBillingProfileInvoiceHistoryQueryDocument: TypedDocumentNode<
  Operations.UserBillingProfileInvoiceHistoryQuery,
  Types.QueryUserBillingProfileInvoiceHistoryArgs
> = gql`
  query UserBillingProfileInvoiceHistory($userId: String, $paginationArgs: PaginationArgs) {
    parentInvoiceHistory(userId: $userId, paginationArgs: $paginationArgs) {
      id
      rows {
        id
        issueDate
        dueDate
        paidDate
        amount
        currency
        status
        invoiceType
        studentId
        studentName
      }
      totalCount
      pageInfo {
        count currentPage firstItem hasMorePages lastItem lastPage perPage total
      }
    }
  }
`;
```

#### 3b. Update `frontend/graphql/sharedDocuments/index.ts`

Add export:
```ts
export * from "./user-billing-profile.documents";
```

#### 3c. Regenerate types (if needed after schema change from Phase 1)

```bash
~/.bun/bin/bun codegen
```

---

### Phase 4: Frontend — Zustand Store

#### 4a. Create `frontend/stores/userBillingProfileStore.ts`

Follow `parentBillingStore` pattern:

```ts
import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 10;

interface UserBillingProfileState {
  readonly page: number;
  readonly pageSize: number;
  setPage: (page: number) => void;
}

export const useUserBillingProfileStore = create<UserBillingProfileState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setPage: (page: number) => set({ page }),
}));
```

---

### Phase 5: Frontend — Container Component

#### 5a. Create `frontend/views/dashboard/users/billing-profile/UserBillingProfileContainer.tsx`

Pattern: similar to `ParentBillingContainer` and `AdminBillingContainer`

```
"use client"

Imports:
  - useQuery, useMutation from "@apollo/client/react"
  - useNotifications from "@toolpad/core/useNotifications"
  - useTranslations from "next-intl"
  - useMemo, useState from "react"
  - RequirePermission from "@/frontend/components/auth/RequirePermission"
  - AppPermission from generated types
  - userBillingProfileSummaryQueryDocument, userBillingProfileInvoiceHistoryQueryDocument
  - markInvoicePaidMutationDocument
  - useUserBillingProfileStore
  - UserBillingProfileView
  - filter helpers (reuse filterParentInvoices from billing/utils/billingFilters)
  - buildBillingLabels from billing/utils/buildBillingLabels
  - buildParentMetrics from billing/utils/billingMetrics

Data flow:
  1. useQuery(parentBillingSummary, { variables: { userId } })
  2. useQuery(parentInvoiceHistory, { variables: { userId, paginationArgs } })
  3. useMutation(markInvoicePaid) with refetchQueries
  4. useMemo to map GQL data → view types
  5. useMemo to filter invoices by searchQuery
  6. Handle mutations with notifications.show() for success/error

Permission:
  - RequirePermission with AppPermission.BillingViewHistory
  - (NOT UserViewProfile — billing data requires billing permission)

View props passed:
  - labels, summary, invoices, searchQuery
  - canManage, canView, canCreate
  - onSearchChange, onPayNow, onDownloadPdf, onQuickPay
  - page, pageSize, totalCount, onPageChange
```

**Important**: Use `useNotifications` — NOT `Snackbar`. No direct `Snackbar` usage allowed.

---

### Phase 6: Frontend — View Components

#### 6a. Refactor `UserBillingProfileView.tsx` → responsive switcher

Pattern: identical to `ParentBillingView.tsx`

```tsx
"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { UserBillingProfileDesktopView } from "./UserBillingProfileDesktopView";
import { UserBillingProfileMobileView } from "./UserBillingProfileMobileView";
import type { UserBillingProfileViewProps } from "./types/userBillingProfile.types";

export function UserBillingProfileView(props: Readonly<UserBillingProfileViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <UserBillingProfileMobileView {...props} />;
  }

  return <UserBillingProfileDesktopView {...props} />;
}
```

#### 6b. Create `UserBillingProfileDesktopView.tsx`

Layout following `ComponentPatterns.md`:

```
PageContainer
  → PageHeader (title: billingProfileTitle, subtitle: user name/context)
  → BillingMetricsRow (reuse from billing/components/BillingMetricsRow)
      → 4 MetricCards: outstandingBalance, paidThisTerm, nextDueDate, activeStudents
  → SectionPanel (invoice history)
      → actions: SearchBar + FilterButton
      → ParentInvoicesDataGrid (reuse existing component from billing)
  → actions area:
      → Button: "View All Invoices" (links to /billing?parentId=X)
      → Button: "Create Invoice" (if canCreate, links to /billing/manual?parentId=X)
```

Styling rules:
- NO hardcoded colors — all from theme palette
- MUI v9 style props MUST go in `sx` prop
- Typography variants: `headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`
- Use `theme.layout.sectionGap` for spacing

#### 6c. Create `UserBillingProfileMobileView.tsx`

Mobile layout:
```
PageContainer
  → PageHeader (title)
  → MetricCard stack (vertical, 2x2 grid on small screens)
  → ParentInvoicesCardList (reuse existing component from billing)
  → FAB: quick-pay action
```

---

### Phase 7: Frontend — Page Server Component

#### 7a. Minimal update to `page.tsx`

The current page is already fine — it passes `userId` to the client component. The client `UserBillingProfileContainer` will handle the rest.

Potential addition: `generateMetadata` for SEO.

---

### Phase 8: Tests & Validation

#### 8a. Update `test/ui/components/UserBillingProfileView.test.tsx`

- Update existing tests to reflect new component structure
- Add test for: loading state, empty invoices, metrics rendering
- Mock Apollo hooks for query data
- Permission tests should use `BillingViewHistory` not just `UserViewProfile`

#### 8b. Quality checks

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
~/.bun/bin/bun lint
```

#### 8c. Targeted test run

```bash
~/.bun/bin/bun test test/ui/components/UserBillingProfileView.test.tsx
```

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| userId → parentId | Extend existing GraphQL queries with `userId` arg | Service already has `findByUserId` fallback; minimal backend change |
| Permission model | `BillingViewHistory` | Billing data requires billing-specific permission, not just `UserViewProfile` |
| Reuse vs create DataGrid | Reuse `ParentInvoicesDataGrid` + `ParentInvoicesCardList` | Avoid duplication, consistent UX across billing pages |
| Metrics | Reuse `BillingMetricsRow` + `buildParentMetrics()` | Same data shape, already exists |
| Notifications | `useNotifications` from `@toolpad/core` | Project standard — no raw Snackbar |
| Types location | `.types.ts` file under `types/` subdirectory | Per AGENTS.md rules — no types in non-`.types` files |
| Enums | `InvoiceStatus` from `@/shared/lib/enum` | DB-layer enum, consistent across all layers |
| State management | New Zustand store `userBillingProfileStore` | Minimal: page, pageSize — follows existing pattern |
| Frontend imports | Only from `@/frontend/...` and `@/shared/...` | Frontend must NOT import from `backend/` |
| No `Snackbar` | All feedback via `useNotifications` | Project-wide standard per AGENTS.md |

---

## Execution Order

1. **Phase 1**: Backend changes (service + Pothos + codegen)
2. **Phase 3**: Frontend GraphQL documents
3. **Phase 2**: Type management (create `.types.ts`)
4. **Phase 4**: Zustand store
5. **Phase 5**: Container component
6. **Phase 6**: View components (View switcher, Desktop, Mobile)
7. **Phase 7**: Page update
8. **Phase 8**: Tests + validation

After each phase, run `bun tsgo` and `bun biome:check` to catch type/lint errors early.
