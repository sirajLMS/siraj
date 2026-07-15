---
name: "15: Fix shared types, hooks, and providers TypeScript errors"
overview: "Fix TypeScript errors in shared types, hooks, and providers"
todos:
  - id: "1"
    content: Fix errors/index.ts - duplicate sessionNotActivated
    status: "pending"
  - id: "2"
    content: Fix LocalizedStringInput.tsx - localeRequiredEntry with t.locale
    status: "pending"
  - id: "3"
    content: Fix useApolloConnectivity.ts - errors property missing in CommonLabels
    status: "pending"
  - id: "4"
    content: Fix useDocumentTitle.ts - string argument and callable issue
    status: "pending"
  - id: "5"
    content: Fix formatCurrencyForDisplay.stories.tsx - ProfileTeacherLabels vs TranslateFn
    status: "pending"
  - id: "6"
    content: Fix AppApolloProviderHelpers.tsx - common property missing
    status: "pending"
  - id: "7"
    content: Fix AuthProvider.tsx - AuthLoginLabels not callable
    status: "pending"
  - id: "8"
    content: Fix adminDashboardHooks.ts - admin property missing
    status: "pending"
  - id: "9"
    content: Fix adminDashboardViewProps.ts - admin property missing
    status: "pending"
  - id: "10"
    content: Fix useAdminDashboard.ts - admin property missing
    status: "pending"
isProject: false
---

# Plan 15: Fix Shared Types, Hooks, and Providers TypeScript Errors

## Files to Modify (10 files)
- `shared/locale/types/errors/index.ts`
- `frontend/common/components/ui/input/localizedString/LocalizedStringInput.tsx`
- `frontend/common/hooks/useApolloConnectivity.ts`
- `frontend/common/hooks/useDocumentTitle.ts`
- `frontend/common/lib/formatCurrencyForDisplay.stories.tsx`
- `frontend/common/providers/apollo/AppApolloProviderHelpers.tsx`
- `frontend/common/providers/apollo/AuthProvider.tsx`
- `frontend/common/views/dashboard/admin/__shared__/adminDashboardHooks.ts`
- `frontend/common/views/dashboard/admin/__shared__/adminDashboardViewProps.ts`
- `frontend/common/views/dashboard/admin/__shared__/useAdminDashboard.ts`

## Key Issues
1. Duplicate identifier in errors/index.ts
2. Missing properties in label types (errors, common, admin)
3. Labels objects used as callables
4. Type mismatches between label types and function types
5. Incorrect translation function usage (t.locale doesn't exist)
