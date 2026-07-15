---
name: "05: Fix type mismatches in localized strings and translation functions"
overview: "Fix various type mismatches between shared/locale/types and shared/messages types"
todos:
  - id: "1"
    content: Fix LocalizedStringInput.tsx - t.localeRequiredEntry usage with localeName
    status: "pending"
  - id: "2"
    content: Fix localizedStringDrawer.mobile.tsx - missing localeRequired, localesRequired properties
    status: "pending"
  - id: "3"
    content: Fix localizedStringDrawer.desktop.tsx - LocalizedStringLabels type mismatches
    status: "pending"
  - id: "4"
    content: Fix billing type mismatches (showingResults, createSuccess functions vs strings)
    status: "pending"
  - id: "5"
    content: Fix StatusTrackingLabels totalSessions type mismatch
    status: "pending"
  - id: "6"
    content: Fix ParentComplaintsContainer type mismatches
    status: "pending"
  - id: "7"
    content: Fix MetricCardGrid gridSize prop issue
    status: "pending"
  - id: "8"
    content: Fix useDocumentTitle hook type issues
    status: "pending"
  - id: "9"
    content: Fix formatCurrencyForDisplay.stories.tsx type issue
    status: "pending"
  - id: "10"
    content: Fix AdminBillingViewModel ProfileTeacherLabels type issue
    status: "pending"
  - id: "11"
    content: Fix AuthProvider AuthLoginLabels callable issue
    status: "pending"
  - id: "12"
    content: Fix admin dashboard labels (admin, billing properties missing)
    status: "pending"
  - id: "13"
    content: Fix ParentsDirectoryLabels not found
    status: "pending"
  - id: "14"
    content: Fix CreateRecurringClassLabels not found
    status: "pending"
  - id: "15"
    content: Fix useTranslations -> useAppTranslation migrations
    status: "pending"
isProject: false
---

# Plan 05: Fix Type Mismatches and Localized String Issues

## Files to Modify (20+ files)
This covers various type mismatches between the new compile-time i18n types and existing code.

## Key Issues
1. Function vs string type mismatches in billing (showingResults, createSuccess)
2. Missing properties in label types (localeRequired, etc.)
3. useTranslations not found - need useAppTranslation
4. Missing label types (ParentsDirectoryLabels, CreateRecurringClassLabels)
5. Callable type issues (AuthLoginLabels, CurrencyHedgesLabels)
6. Property access issues (admin, billing, errors properties)
