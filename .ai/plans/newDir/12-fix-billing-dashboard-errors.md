---
name: "12: Fix billing dashboard TypeScript errors"
overview: "Fix TypeScript errors in billing dashboard views"
todos:
  - id: "1"
    content: Fix AdminBillingContainer.tsx - namespace and missing billing property
    status: "pending"
  - id: "2"
    content: Fix DeleteInvoiceDialog.tsx - namespace and cancel property
    status: "pending"
  - id: "3"
    content: Fix SupportedCurrenciesContainer.tsx - namespace and missing billing property
    status: "pending"
  - id: "4"
    content: Fix CurrencyHedgesContainer.tsx - CurrencyHedgesLabels not callable
    status: "pending"
  - id: "5"
    content: Fix useAdminBillingViewModel.ts - ProfileTeacherLabels vs TranslateFn
    status: "pending"
  - id: "6"
    content: Fix AdminDashboardContainer.tsx - namespace and missing admin property
    status: "pending"
  - id: "7"
    content: Fix AdminDashboardContainer.stories.tsx - namespace and missing admin property
    status: "pending"
  - id: "8"
    content: Fix ScheduleOverviewPagination.tsx - expected 2 arguments
    status: "pending"
  - id: "9"
    content: Fix utils.ts - namespace and missing admin property
    status: "pending"
  - id: "10"
    content: Fix adminDashboardViewLabels.ts - admin property missing
    status: "pending"
  - id: "11"
    content: Fix ParentBillingContainer.tsx - ProfileTeacherLabels vs TranslateFn
    status: "pending"
  - id: "12"
    content: Fix ManualInvoiceContainer.tsx - BillingManualLabels callable and unknown
    status: "pending"
  - id: "13"
    content: Fix ManualInvoiceFormFields.tsx - createSuccess type mismatch
    status: "pending"
  - id: "14"
    content: Fix buildBillingLabels.ts - BillingManualLabels missing properties
    status: "pending"
  - id: "15"
    content: Fix MeetingProvidersContainer.tsx - MeetingProvidersLabels not callable
    status: "pending"
isProject: false
---

# Plan 12: Fix Billing Dashboard TypeScript Errors

## Files to Modify (15+ files)
Various billing dashboard view components and admin dashboard.

## Key Issues
1. Translation namespace mismatches ("dashboard" vs "dashboard.billing", "dashboard.admin")
2. Labels objects used as callables
3. Type mismatches between locale types and message types
4. Missing properties in label type definitions
5. Argument count mismatches
