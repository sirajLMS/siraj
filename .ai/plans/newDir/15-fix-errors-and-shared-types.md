---
name: "15: Fix errors/index.ts duplicates and shared type issues"
overview: "Fix duplicate identifiers in errors/index.ts and other shared type issues"
todos:
  - id: "1"
    content: Remove duplicate sessionNotActivated in shared/locale/types/errors/index.ts
    status: "pending"
  - id: "2"
    content: Fix LocalizedStringInput - localeRequiredEntry with t.locale
    status: "pending"
  - id: "3"
    content: Fix useApolloConnectivity - errors property missing in CommonLabels
    status: "pending"
  - id: "4"
    content: Fix useDocumentTitle - string argument and callable issue
    status: "pending"
  - id: "5"
    content: Fix formatCurrencyForDisplay.stories - ProfileTeacherLabels vs TranslateFn
    status: "pending"
  - id: "6"
    content: Fix AppApolloProviderHelpers - common property missing
    status: "pending"
  - id: "7"
    content: Fix AuthProvider - AuthLoginLabels not callable
    status: "pending"
  - id: "8"
    content: Fix adminDashboardHooks/viewProps/useAdminDashboard - admin property missing
    status: "pending"
  - id: "9"
    content: Fix formatCurrencyForDisplay.stories - ProfileTeacherLabels vs TranslateFn
    status: "pending"
isProject: false
---

# Plan 15: Fix Errors Index Duplicates and Shared Type Issues

## Files to Modify (10+ files)
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
2. Missing properties in label type definitions
3. Labels objects used as callables
4. Type mismatches between label types and function types
