---
name: "05: Fix type mismatches in localized strings and translation functions"
overview: "Fix BillingLabels vs BillingManualLabels, ProfileTeacherLabels vs TranslateFn mismatches"
todos:
  - id: "1"
    content: Fix ParentBillingContainer.tsx - ProfileTeacherLabels vs TranslateFn
    status: "pending"
  - id: "2"
    content: Fix ManualInvoiceContainer.tsx - BillingManualLabels vs BillingManualTranslator
    status: "pending"
  - id: "3"
    content: Fix ManualInvoiceFormFields.tsx - BillingManualLabels type mismatches (createSuccess function vs string)
    status: "pending"
  - id: "4"
    content: Fix buildBillingLabels.ts - BillingManualLabels missing properties
    status: "pending"
  - id: "5"
    content: Fix adminBilling desktop/mobile - BillingLabels showingResults function vs string
    status: "pending"
  - id: "6"
    content: Fix manualInvoice desktop/mobile - createSuccess type mismatches
    status: "pending"
  - id: "7"
    content: Fix LocalizedStringInput.tsx - localeRequiredEntry call
    status: "pending"
  - id: "8"
    content: Fix ClassAuditContainer.tsx - pluralization function calls
    status: "pending"
  - id: "9"
    content: Fix StudentHistoryContainer.tsx - useParams missing import
    status: "pending"
  - id: "10"
    content: Fix ClassSessionList.tsx - namespace and missing properties
    status: "pending"
  - id: "11"
    content: Fix MobileWeeklyScroller.tsx - namespace and missing properties
    status: "pending"
  - id: "12"
    content: Fix PerformanceStreak.tsx - namespace and missing properties
    status: "pending"
  - id: "13"
    content: Fix StudentHistoryDesktop/Mobile.tsx - pluralization and useLocale
    status: "pending"
  - id: "14"
    content: Fix StudentQuotaContainer.tsx - CommonLabels missing notSet
    status: "pending"
  - id: "15"
    content: Fix ContextualHelperCards.tsx - namespace and missing properties
    status: "pending"
  - id: "16"
    content: Fix StudentStatusContainer.tsx - CommonLabels not callable
    status: "pending"
  - id: "17"
    content: Fix StudentStatusView.tsx - namespace and type conversion
    status: "pending"
isProject: false
---

# Plan 05: Fix Type Mismatches

## Categories of Issues

### 1. Billing Label Type Mismatches
- `ParentBillingContainer.tsx` - ProfileTeacherLabels passed where TranslateFn expected
- `ManualInvoiceContainer.tsx` - BillingManualLabels vs BillingManualTranslator
- `ManualInvoiceFormFields.tsx` - createSuccess function vs string mismatch
- `buildBillingLabels.ts` - BillingManualLabels missing properties from BillingLabels
- Admin billing desktop/mobile - showingResults function vs string
- Manual invoice desktop/mobile - createSuccess type mismatches

### 2. LocalizedStringInput
- Line 226: `t.localeRequiredEntry({ localeName: t.locale[...] })` - `t.locale` doesn't exist

### 3. Pluralization Function Calls
Multiple files calling translation functions with object args when they expect numbers:
- `ClassAuditContainer.tsx` - `{ count: number }` passed where `number` expected
- `StudentHistoryDesktop/Mobile.tsx` - similar issues
- `ContextualHelperCards.tsx` - namespace issues

### 4. Missing Imports
- `StudentHistoryContainer.tsx` - `useParams` not imported
- `StudentHistoryMobile.tsx` - `useLocale` not imported (should be `useAppLocale`)

### 5. Namespace Issues
Many files using `"dashboard.studentHistory.classDetails"` etc. but those namespaces may not exist in MessageSchema
