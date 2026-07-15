---
name: "12: Fix billing dashboard tsgo errors"
overview: "Fix TypeScript errors in billing dashboard views"
todos:
  - id: "1"
    content: Fix AdminBillingContainer - namespace and missing billing property
    status: "pending"
  - id: "2"
    content: Fix DeleteInvoiceDialog - namespace and cancel property
    status: "pending"
  - id: "3"
    content: Fix SupportedCurrenciesContainer - namespace and missing billing property
    status: "pending"
  - id: "4"
    content: Fix CurrencyHedgesContainer - CurrencyHedgesLabels not callable
    status: "pending"
  - id: "5"
    content: Fix useAdminBillingViewModel - ProfileTeacherLabels vs TranslateFn
    status: "pending"
  - id: "6"
    content: Fix AdminDashboardContainer stories/utils - namespace and missing admin property
    status: "pending"
  - id: "7"
    content: Fix ScheduleOverviewPagination - expected 2 arguments
    status: "pending"
  - id: "8"
    content: Fix adminDashboardViewLabels - admin property missing
    status: "pending"
  - id: "9"
    content: Fix ParentBillingContainer - ProfileTeacherLabels vs TranslateFn
    status: "pending"
  - id: "10"
    content: Fix ManualInvoiceContainer - BillingManualLabels callable and unknown property
    status: "pending"
  - id: "11"
    content: Fix ManualInvoiceFormFields - createSuccess type mismatch
    status: "pending"
  - id: "12"
    content: Fix buildBillingLabels - BillingManualLabels missing properties
    status: "pending"
isProject: false
---

# Plan 12: Fix Billing Dashboard TSGo Errors

## Files to Modify (15+ files)
Various billing dashboard view components.

## Key Issues
1. Translation namespace mismatches ("dashboard" vs "dashboard.billing")
2. Labels objects used as callables
3. Type mismatches between locale types and message types
4. Missing properties in label type definitions
