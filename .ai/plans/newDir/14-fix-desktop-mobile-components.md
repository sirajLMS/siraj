---
name: "14: Fix desktop and mobile component tsgo errors"
overview: "Fix TypeScript errors in desktop and mobile tier-specific components"
todos:
  - id: "1"
    content: Fix localizedStringDrawer.desktop - LocalizedStringLabels not callable, TranslationFn mismatch
    status: "pending"
  - id: "2"
    content: Fix adminBilling.desktop - showingResults type mismatch
    status: "pending"
  - id: "3"
    content: Fix manualInvoice.desktop - createSuccess type mismatch
    status: "pending"
  - id: "4"
    content: Fix classDetailsContainer.desktop - ClassDetailsLabels not callable
    status: "pending"
  - id: "5"
    content: Fix permissionManagementView.desktop - errors property missing
    status: "pending"
  - id: "6"
    content: Fix searchScheduleFilterDrawer.desktop - useAppTranslation not found
    status: "pending"
  - id: "7"
    content: Fix upcomingClassesTable.desktop - useTranslations, useLocale not found
    status: "pending"
  - id: "8"
    content: Fix jumpToDateHeader.desktop - type mismatch, useTranslations not found
    status: "pending"
  - id: "9"
    content: Fix teacherWeeklyScheduleView.desktop - argument type mismatch
    status: "pending"
  - id: "10"
    content: Fix localizedStringDrawer.mobile - missing properties (localeRequired, etc.)
    status: "pending"
  - id: "11"
    content: Fix adminBilling.mobile - showingResults type mismatch
    status: "pending"
  - id: "12"
    content: Fix manualInvoice.mobile - createSuccess type mismatch
    status: "pending"
  - id: "13"
    content: Fix classDetailsContainer.mobile - ClassDetailsLabels not callable
    status: "pending"
  - id: "14"
    content: Fix rescheduleView.mobile - namespace and meetingConfig property
    status: "pending"
isProject: false
---

# Plan 14: Fix Desktop and Mobile Component TSGo Errors

## Files to Modify (20+ files)
Desktop and mobile tier-specific components.

## Key Issues
1. Labels objects used as callables
2. Type mismatches between locale and message types
3. Missing translation properties in label types
4. useTranslations should be useAppTranslation
5. useLocale not imported
