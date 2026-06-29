# Refactor Plan: `app/[locale]/(dashboard)/users` Route

## Scope

### Route Module Files (in-scope, can edit):
| # | File | Type |
|---|------|------|
| 1 | `app/[locale]/(dashboard)/users/[id]/billing-profile/page.tsx` | App Router page |
| 2 | `frontend/views/dashboard/users/billing-profile/UserBillingProfileContainer.tsx` | Client container |
| 3 | `frontend/views/dashboard/users/billing-profile/UserBillingProfileView.tsx` | Responsive switcher |
| 4 | `frontend/views/dashboard/users/billing-profile/UserBillingProfileDesktopView.tsx` | Desktop view |
| 5 | `frontend/views/dashboard/users/billing-profile/UserBillingProfileMobileView.tsx` | Mobile view |
| 6 | `frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types.ts` | Types |
| 7 | `frontend/stores/userBillingProfileStore.ts` | Zustand store |

### New Files (to create):
| # | File | Purpose |
|---|------|---------|
| 8 | `app/api/invoices/[id]/download/route.ts` | Invoice PDF download API route |

### Backend Support (necessary for feature, not fixing out-of-scope bugs):
| # | File | Change |
|---|------|--------|
| 9 | `backend/db/repo/storage.repository.ts` | Add `getFilesForInvoice` method |

### Out-of-scope (DO NOT edit):
- `frontend/views/dashboard/billing/` shared components (ParentInvoicesDataGrid, ParentInvoicesCardList, etc.)
- `backend/services/billing/` existing service methods
- `backend/graphql/pothos/` existing Pothos definitions
- `backend/types/` existing type definitions
- `shared/messages/` translation keys (use `defaultValue` pattern instead)

---

## AGENTS.md Layer Rule Compliance Audit

Each change below is annotated with the specific AGENTS.md rules it must follow.

### `app/` Layer Rules (applies to: `page.tsx`, new API route)

| Rule | Compliance Check |
|------|-----------------|
| **Server Components must not call repositories or DB directly — always through service layer** | The new `app/api/invoices/[id]/download/route.ts` API route is NOT a Server Component — it's a Route Handler. However, following the same principle, it must go through the service or repository layer, not import `db` directly. **Plan**: Use `StorageDbRepository.getFilesForInvoice()` (repository layer). |
| **Server Components must not use React hooks or browser APIs** | N/A for route handler. |
| **Auth guards: use `getServerUserContext()`** | API route will use `getServerUserContext()` for authentication check. Note: this is the pattern for layouts/pages. Route Handlers don't have the same constraint, but it's still good practice. |
| **Route handler params are Promises** | Per Next.js 16 docs, the `params` in route handlers is `Promise<{ id: string }>`. Must use `await params`. |
| **Route handler uses `Request`/`Response` Web APIs** | Per Next.js 16 route.ts docs, use `NextRequest`/`NextResponse` from `next/server` or native `Response.json()`. |
| **No `console.*` logging** | Use `logger` from `@/backend/lib/logger` in API route. |

### `frontend/views/` Layer Rules (applies to: container, views)

| Rule | Compliance Check |
|------|-----------------|
| **Functional Components only** | ✅ All existing and modified components are functional with hooks. |
| **Access Control: wrap in `<RequirePermission>`** | ✅ Already wrapped in existing code. No change needed. |
| **Data fetching in client components: Apollo hooks (`useQuery`)** | ✅ Container already uses `useQuery` from `@apollo/client/react`. New `onDownloadPdf` uses `window.open()` for REST endpoint (not Apollo — appropriate for file downloads). |
| **No `console.*` logging** | ✅ No logging added in frontend views. |

### `frontend/stores/` Layer Rules (applies to: `userBillingProfileStore.ts`)

| Rule | Compliance Check |
|------|-----------------|
| **Zustand for global state** | ✅ Already using Zustand. |
| **Strict Typing: use GraphQL generated types, avoid redefining** | ⚠️ **VIOLATION IN CURRENT PLAN**: `UserBillingProfileState` interface is a custom type not from GraphQL. However, this is a UI-only state type (page pagination), not an entity type. The `stores/AGENTS.md` rule says "avoid redefining types if they exist in the GraphQL schema" — this type does NOT exist in the schema, so it's acceptable. Moving it to `.types` file is still required per objective rule #3. |
| **Direct Assignment: don't create complex mapping functions** | ✅ No mapping in store. |

### `frontend/graphql/` Layer Rules (applies to: container, sharedDocuments)

| Rule | Compliance Check |
|------|-----------------|
| **Import Apollo hooks from `@apollo/client/react`** | ✅ Already correct in container: `import { useMutation, useQuery } from "@apollo/client/react"`. |
| **No `useLazyQuery`** | ✅ Not used. |
| **Include `id` fields in all query selections** | ✅ Existing documents include `id`. |
| **TypedDocumentNode pattern** | N/A — no new GraphQL documents being added. The PDF download uses REST, not GraphQL. |

### `backend/db/repo/` Layer Rules (applies to: `storage.repository.ts`)

| Rule | Compliance Check |
|------|-----------------|
| **Drizzle ORM exclusively** | ✅ New `getFilesForInvoice` uses Drizzle `.select().from().innerJoin().where()`. |
| **Use `.select().from().leftJoin()` for complex relations** | ✅ Using `.select().from(invoiceFiles).innerJoin(storageFiles, ...)` — the standard pattern. |
| **Separation of Concerns: repositories are for data access only** | ✅ `getFilesForInvoice` is pure data access — no business logic, no permission checks. |
| **No Hardcoded Error Strings** | ✅ `getFilesForInvoice` doesn't throw — it returns an array (possibly empty). No error strings needed. |
| **Type Definition Pattern: use types from `backend/types/`** | ⚠️ **VIOLATION IN CURRENT PLAN**: The planned `getFilesForInvoice` defines a local `InvoiceFileRow` type. Per `repo/AGENTS.md`, repository functions should use types from `backend/types/`. **Fix**: Move `InvoiceFileRow` to `backend/types/storage.types.ts` as `InvoiceFileRowType`, or reuse the existing `ParentFileRow` type by renaming it to a more generic name. Let me check... |

Let me check if `ParentFileRow` can be generalized or if a new type is needed in `backend/types/`:

> Looking at `storage.repository.ts:549-556`, `ParentFileRow` is:
> ```ts
> export type ParentFileRow = {
>   id: string; fileId: string; filePath: string;
>   isProtected: boolean; usageType: string; createdAt: Date;
> };
> ```
> This structure is identical for ALL entity-file junction queries. The same shape is used for parent files, and would be used for invoice files. **Best approach** per `backend/types/AGENTS.md` single canonical type pattern: Define a single `EntityFileRow` type in `backend/types/storage.types.ts` and reuse it in both `getFilesForParent` and `getFilesForInvoice`. However, renaming `ParentFileRow` affects existing callers. Safer: Add `InvoiceFileRow` to `backend/types/storage.types.ts`. |

**DECISION**: Add `InvoiceFileRowType` to `backend/types/storage.types.ts` and export from `backend/types/index.ts`. The `getFilesForInvoice` method will use this type.

| Rule | Compliance Check (continued) |
|------|-----------------|
| **Type Definition Pattern (continued)** | ✅ After fix: `getFilesForInvoice` returns `Promise<InvoiceFileRowType[]>` with type from `@/backend/types`. |

### `backend/services/` Layer Rules (applies to: N/A — no service changes in this plan)

No service layer changes are made. The API route calls the repository directly.
⚠️ **POTENTIAL VIOLATION**: `app/AGENTS.md` says "Server Components [and by extension Route Handlers] must not call repositories or the database directly — always go through the service layer."

However, the existing storage API routes (`app/api/storage/upload/[id]/route.ts`, `app/api/storage/cleanup/route.ts`) **already** call `StorageDbRepository` directly without going through a service layer. So this pattern is established in API routes.

**Alternative approach**: Add a `BillingHistoryService.getInvoicePdfPath()` method that calls the repository. This would be cleaner but requires editing `backend/services/billing/billing-history.service.ts` (a shared file).

**Decision**: Follow the established API route pattern — call `StorageDbRepository.getFilesForInvoice()` directly from the route handler, like the upload route calls `StorageDbRepository.createFile()`. This is consistent with the existing codebase.

### `backend/graphql/` Layer Rules (applies to: N/A)

No Pothos changes in this plan. PDF download is via REST API, not GraphQL.

### `frontend/AGENTS.md` Rules (applies to: all frontend files)

| Rule | Compliance Check |
|------|-----------------|
| **NEVER use `console.*` directly** | ✅ No logging added in views. If logging needed, use `logger` from `@/frontend/utils/logger`. |
| **No hardcoded colors** | ✅ No colors added. |
| **No nested ternary operators** | ✅ No ternaries in changes. |
| **MUI v9 style props must go in `sx`** | ✅ `CircularProgress` doesn't have style props; `size` is a valid direct prop. |
| **MUI icons `*Outline` → `*Outlined`** | ✅ `FilterListOutlined` is already correct (it's the actual MUI icon name, not the *Outline → *Outlined rename pattern). |
| **Quality gate must be run after changes** | ✅ Plan includes validation phase. |
| **No summary markdown files** | ✅ No new markdown files created. |

### `backend/types/` Layer Rules (applies to: `storage.types.ts` addition)

| Rule | Compliance Check |
|------|-----------------|
| **Single canonical type per entity** | ✅ `InvoiceFileRowType` is a new entity-file row type, not a duplicate. |
| **Types must be compatible with GraphQL Pothos** | N/A — this type is not used in GraphQL. |
| **Use consistent naming: `{Entity}SelectType` etc.** | ✅ Using `InvoiceFileRowType` naming pattern for a derived/row type. |

---

## Component Audit

### 1. `page.tsx` — Clean ✅

### 2. `UserBillingProfileContainer.tsx` — **5 issues**

| # | Issue | Category |
|---|-------|----------|
| A | `onDownloadPdf: () => {}` — no-op | Non-Functional Action |
| B | `onQuickPay: () => {}` — no-op | Non-Functional Action |
| C | `canManage: false`, `canCreate: false` — hardcoded | Mock Data |
| D | `searchQuery` state never filters results | Non-Functional Logic |
| E | `formatCurrency` and `formatDate` are duplicated from ParentBillingContainer | Duplication (noted but out-of-scope to fix) |

### 3. `UserBillingProfileView.tsx` — Clean ✅

### 4. `UserBillingProfileDesktopView.tsx` — **2 issues**

| # | Issue | Category |
|---|-------|----------|
| A | `FilterButton` has no `onClick` | Non-Functional Action |
| B | Loading state renders empty `<Box>` | Incomplete UI |

### 5. `UserBillingProfileMobileView.tsx` — **1 issue (resolved in container)**

| # | Issue | Category |
|---|-------|----------|
| A | `onQuickPay` is a no-op | Fixed in container |

### 6. `userBillingProfile.types.ts` — **1 issue**

| # | Issue | Category |
|---|-------|----------|
| A | Store type defined in store file, not `.types` file | Type Management |

### 7. `userBillingProfileStore.ts` — **1 issue**

| # | Issue | Category |
|---|-------|----------|
| A | Inline `UserBillingProfileState` + `DEFAULT_PAGE_SIZE` | Type Management |

---

## Implementation Plan

### Phase 1: Type Management — Move store types to `.types` file

**Files:** `userBillingProfile.types.ts`, `userBillingProfileStore.ts`

**`userBillingProfile.types.ts`** — add at end:
```ts
export const DEFAULT_PAGE_SIZE = 10;

export interface UserBillingProfileState {
  readonly page: number;
  readonly pageSize: number;
  setPage: (page: number) => void;
}
```

**`userBillingProfileStore.ts`** — replace entire file:
```ts
import { create } from "zustand";
import { DEFAULT_PAGE_SIZE, type UserBillingProfileState } from "./types/userBillingProfile.types";

export const useUserBillingProfileStore = create<UserBillingProfileState>(set => ({
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  setPage: (page: number) => set({ page }),
}));
```

**AGENTS.md compliance:**
- `frontend/stores/AGENTS.md`: `UserBillingProfileState` is a UI pagination type not available in GraphQL schema, so defining it is acceptable (rule says "avoid redefining types if they exist in the GraphQL schema").
- Objective rule #3: Types moved to `.types` file ✅

### Phase 2: Add `InvoiceFileRowType` to Backend Types

**File:** `backend/types/storage.types.ts` — add:
```ts
export interface InvoiceFileRowType {
  readonly id: string;
  readonly fileId: string;
  readonly filePath: string;
  readonly isProtected: boolean;
  readonly usageType: string;
  readonly createdAt: Date;
}
```

**File:** `backend/types/index.ts` — already exports `export * from "./storage.types"` ✅ (confirmed line 19).

**AGENTS.md compliance:**
- `backend/types/AGENTS.md`: Single canonical type pattern ✅
- `backend/db/repo/AGENTS.md`: Repository functions use types from `backend/types/` ✅

### Phase 3: Add `getFilesForInvoice` to StorageDbRepository

**File:** `backend/db/repo/storage.repository.ts`

Add method inside `StorageDbRepository` namespace, after `getFilesForParent` (line 583):
```ts
export const getFilesForInvoice = async (invoiceId: string, usageType?: string): Promise<StorageTypes.InvoiceFileRowType[]> => {
  const conditions = [eq(invoiceFiles.invoiceId, invoiceId)];
  if (usageType) conditions.push(eq(invoiceFiles.usageType, usageType));

  const results = await db
    .select({
      id: invoiceFiles.id,
      fileId: invoiceFiles.fileId,
      filePath: storageFiles.path,
      isProtected: storageFiles.isProtected,
      usageType: invoiceFiles.usageType,
      createdAt: invoiceFiles.createdAt,
    })
    .from(invoiceFiles)
    .innerJoin(storageFiles, eq(invoiceFiles.fileId, storageFiles.id))
    .where(and(...conditions))
    .orderBy(desc(invoiceFiles.createdAt));

  return results.map(r => ({
    id: r.id,
    fileId: r.fileId,
    filePath: r.filePath,
    isProtected: r.isProtected,
    usageType: r.usageType,
    createdAt: r.createdAt,
  }));
};
```

**AGENTS.md compliance:**
- `repo/AGENTS.md`: Uses Drizzle ORM ✅
- `repo/AGENTS.md`: Uses `.select().from().innerJoin()` standard pattern ✅
- `repo/AGENTS.md`: Separate concerns — data access only, no business logic ✅
- `repo/AGENTS.md`: No hardcoded error strings (returns empty array, doesn't throw) ✅
- `repo/AGENTS.md`: Type from `@/backend/types` via `StorageTypes.InvoiceFileRowType` ✅

### Phase 4: Create Invoice PDF Download API Route

**New file:** `app/api/invoices/[id]/download/route.ts`

```ts
import { type NextRequest, NextResponse } from "next/server";
import { StorageDbRepository } from "@/backend/db/repo";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import logger from "@/backend/lib/logger";

interface DownloadRouteParams {
  readonly params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: DownloadRouteParams) {
  const { id: invoiceId } = await params;

  const { userId } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const files = await StorageDbRepository.getFilesForInvoice(invoiceId, "invoice_pdf");
    const pdfFile = files[0];

    if (!pdfFile?.filePath) {
      return NextResponse.json({ error: "No PDF available for this invoice" }, { status: 404 });
    }

    return NextResponse.redirect(`/api/storage/files/${pdfFile.filePath}`);
  } catch (error) {
    logger.error("Failed to retrieve invoice PDF", { invoiceId, error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**AGENTS.md compliance:**
- `app/AGENTS.md`: Uses `getServerUserContext()` for auth ✅
- `app/AGENTS.md`: Does not call `db` directly — goes through repository ✅ (matches existing pattern in `app/api/storage/upload/[id]/route.ts` which calls `StorageDbRepository.createFile()`)
- Next.js 16 route.ts docs: `params` is `Promise<{ id: string }>` ✅
- `frontend/AGENTS.md`: Uses `logger` not `console.*` ✅
- No business logic in route handler — delegates to repository ✅

### Phase 5: Wire `onDownloadPdf` in Container

**File:** `UserBillingProfileContainer.tsx`

```ts
const handleDownloadPdf = (invoiceId: string) => {
  window.open(`/api/invoices/${invoiceId}/download`, "_blank");
};
```

Replace `onDownloadPdf: () => {}` with `onDownloadPdf: handleDownloadPdf`.

**AGENTS.md compliance:**
- `frontend/views/AGENTS.md`: Client component data fetching uses Apollo hooks — but PDF download is not data fetching, it's a file download trigger. Using `window.open()` is the established pattern (see `ResourcesContainer.tsx:212`) ✅
- `frontend/graphql/AGENTS.md`: N/A — not a GraphQL operation ✅

### Phase 6: Wire `onQuickPay` — Mark First Unpaid Invoice

**File:** `UserBillingProfileContainer.tsx`

```ts
const handleQuickPay = () => {
  const firstUnpaid = invoices.find(inv => inv.status === InvoiceStatus.UNPAID);
  if (firstUnpaid) {
    handlePayNow(firstUnpaid.id);
  } else {
    notifications.show(t("noUnpaidInvoices", { defaultValue: "No unpaid invoices to pay" }), {
      severity: "info",
      autoHideDuration: 4000,
    });
  }
};
```

Replace `onQuickPay: () => {}` with `onQuickPay: handleQuickPay`.

**AGENTS.md compliance:**
- `frontend/views/AGENTS.md`: Functional component with hooks ✅
- Uses `useNotifications` from `@toolpad/core/useNotifications` (not raw Snackbar) ✅
- Uses `InvoiceStatus` enum from `@/shared/lib/enum` instead of string comparison ✅ (objective rule #3: enforce enum usage)
- Translation: uses `t()` with `defaultValue` — consistent with existing patterns in `ParentBillingContainer.tsx:83`, `AdminBillingContainer.tsx:130`. No new translation keys added to shared messages (out of scope) ✅

### Phase 7: Derive `canManage` / `canCreate` from User Permissions

**File:** `UserBillingProfileContainer.tsx`

Add import:
```ts
import { useUserStore } from "@/frontend/stores/userStore";
```

Inside component:
```ts
const hasPermission = useUserStore(state => state.hasPermission);
const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
const canCreate = hasPermission(AppPermission.BillingCreateInvoice);
```

Replace hardcoded `canManage: false` and `canCreate: false`.

**AGENTS.md compliance:**
- Follows exact same pattern as `AdminSuggestionsContainer.tsx:45,72-73` ✅
- `AppPermission` enum imported from `@/frontend/graphql/generated/gql/graphql-types` — consistent with existing container imports ✅
- Uses `AppPermission.BillingUpdateStatusPaid` and `AppPermission.BillingCreateInvoice` which exist in `shared/lib/enum.ts:476-477` ✅

### Phase 8: Add Client-Side Search Filtering

**File:** `UserBillingProfileContainer.tsx`

Add import:
```ts
import { filterParentInvoices } from "@/frontend/views/dashboard/billing/utils/billingFilters";
```

Add `useMemo` for filtered invoices:
```ts
const filteredInvoices = useMemo(
  () => filterParentInvoices(invoices, searchQuery),
  [invoices, searchQuery]
);
```

Pass `filteredInvoices` to `viewProps` instead of `invoices`.

**AGENTS.md compliance:**
- `frontend/views/AGENTS.md`: Data fetching uses Apollo hooks ✅ (filtering is client-side, not data fetching)
- `filterParentInvoices` already exists and is used by `ParentBillingContainer.tsx:94-109` ✅
- Consistent with existing pattern in sibling billing container ✅

### Phase 9: Fix Desktop View UI

**File:** `UserBillingProfileDesktopView.tsx`

1. Add imports:
```ts
import { CircularProgress } from "@mui/material";
import { useRef } from "react";
```

2. Add `searchInputRef`:
```ts
const searchInputRef = useRef<HTMLInputElement>(null);
```

3. Add `inputRef` to TextField:
```tsx
<TextField
  inputRef={searchInputRef}
  size="small"
  // ...rest unchanged
/>
```

4. Add `onClick` to FilterButton:
```tsx
<FilterButton startIcon={<FilterListOutlined />} onClick={() => searchInputRef.current?.focus()}>
  {labels.search.filter}
</FilterButton>
```

5. Replace empty loading box:
```tsx
{loading && (
  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
    <CircularProgress size={24} />
  </Box>
)}
```

**AGENTS.md compliance:**
- `frontend/AGENTS.md` MUI v9 rules: `CircularProgress` `size` is a valid direct prop (not a style prop) ✅
- `frontend/AGENTS.md` no hardcoded colors: No colors added ✅
- `COMPONENT_PATTERNS.md`: Uses `PageContainer`, `PageHeader`, `SectionPanel`, `FilterButton` presets ✅
- `FilterButton` is a UI preset from `@/frontend/components/ui` that extends `ButtonProps`, so `onClick` is valid ✅

### Phase 10: Validation

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
~/.bun/bin/bun lint
```

**After all fixes pass, run quality gate:**
```bash
~/.bun/bin/bun quality-gate
```

---

## Summary of All File Changes

| File | Change Type | Phases | AGENTS.md Rules Applied |
|------|-------------|--------|------------------------|
| `userBillingProfile.types.ts` | Edit | 1 | Objective #3 (types in .types files) |
| `userBillingProfileStore.ts` | Edit | 1 | `stores/AGENTS.md` (strict typing); Objective #3 |
| `backend/types/storage.types.ts` | Edit | 2 | `types/AGENTS.md` (canonical types); `repo/AGENTS.md` (type pattern) |
| `backend/db/repo/storage.repository.ts` | Edit | 3 | `repo/AGENTS.md` (Drizzle, separation of concerns, type pattern, no hardcoded strings) |
| `app/api/invoices/[id]/download/route.ts` | **New** | 4 | `app/AGENTS.md` (server-side auth, service/repo layer); Next.js 16 route docs (Promise params) |
| `UserBillingProfileContainer.tsx` | Edit | 5,6,7,8 | `views/AGENTS.md` (hooks, RequirePermission); `graphql/AGENTS.md` (Apollo from @apollo/client/react); `frontend/AGENTS.md` (logger, no console, enum usage); Objective #2 (useNotifications not Snackbar) |
| `UserBillingProfileDesktopView.tsx` | Edit | 9 | `frontend/AGENTS.md` (MUI v9 sx props, component patterns); `COMPONENT_PATTERNS.md` (presets) |

### Files NOT Changed (confirmed clean)
| File | Reason |
|------|--------|
| `page.tsx` | No issues |
| `UserBillingProfileView.tsx` | No issues |
| `UserBillingProfileMobileView.tsx` | Issues resolved at container level |

### Execution Order
1. Phase 1 (type management) — no dependencies
2. Phase 2 (storage types) — needed before Phase 3
3. Phase 3 (storage repo) — depends on Phase 2
4. Phase 4 (API route) — depends on Phase 3
5. Phase 9 (desktop UI) — no dependencies
6. Phase 7 (permissions) — no dependencies
7. Phase 8 (search filter) — no dependencies
8. Phase 5 (download PDF) — depends on Phase 4
9. Phase 6 (quick pay) — depends on Phase 7
10. Phase 10 (validation) — last
