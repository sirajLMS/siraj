---
name: "14: Fix desktop and mobile component TypeScript errors"
overview: "Fix TypeScript errors in desktop and mobile tier-specific components"
todos:
  - id: "1"
    content: Fix localizedStringDrawer.desktop.tsx - LocalizedStringLabels not callable, TranslationFn mismatch
    status: "pending"
  - id: "2"
    content: Fix adminBilling.desktop.tsx - showingResults type mismatch
    status: "pending"
  - id: "3"
    content: Fix manualInvoice.desktop.tsx - createSuccess type mismatch
    status: "pending"
  - id: "4"
    content: Fix classDetailsContainer.desktop.tsx - ClassDetailsLabels not callable
    status: "pending"
  - id: "5"
    content: Fix permissionManagementView.desktop.tsx - errors property missing
    status: "pending"
  - id: "6"
    content: Fix searchScheduleFilterDrawer.desktop.tsx - useAppTranslation not found
    status: "pending"
  - id: "7"
    content: Fix upcomingClassesTable.desktop.tsx - useTranslations, useLocale not found
    status: "pending"
  - id: "8"
    content: Fix jumpToDateHeader.desktop.tsx - type mismatch, useTranslations not found
    status: "pending"
  - id: "9"
    content: Fix teacherWeeklyScheduleView.desktop.tsx - argument type mismatch
    status: "pending"
  - id: "10"
    content: Fix localizedStringDrawer.mobile.tsx - missing properties (localeRequired, etc.)
    status: "pending"
  - id: "11"
    content: Fix adminBilling.mobile.tsx - showingResults type mismatch
    status: "pending"
  - id: "12"
    content: Fix manualInvoice.mobile.tsx - createSuccess type mismatch
    status: "pending"
  - id: "13"
    content: Fix classDetailsContainer.mobile.tsx - ClassDetailsLabels not callable
    status: "pending"
  - id: "14"
    content: Fix rescheduleView.mobile.tsx - namespace and meetingConfig property
    status: "pending"
isProject: false
---

# Plan 14: Fix Desktop and Mobile Component TypeScript Errors

## Files to Modify (14+ files)
Desktop and mobile tier-specific components in frontend/desktop and frontend/mobile.

## Key Issues
1. Labels objects used as callables
2. Type mismatches between locale types and message types (showingResults, createSuccess)
3. Missing translation properties in label types
4. useTranslations should be useAppTranslation
5. useLocale not imported (should be useAppLocale)
