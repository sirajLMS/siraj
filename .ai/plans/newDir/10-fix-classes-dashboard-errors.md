---
name: "10: Fix classes dashboard TypeScript errors"
overview: "Fix TypeScript errors in classes dashboard views"
todos:
  - id: "1"
    content: Fix ClassAuditContainer.tsx - argument type mismatches for pluralization
    status: "pending"
  - id: "2"
    content: Fix ClassDetailsToolbarArea.tsx - useTranslations not found
    status: "pending"
  - id: "3"
    content: Fix LiveSessionToolbar.tsx - labels not callable
    status: "pending"
  - id: "4"
    content: Fix useEventLogDownload.ts - actionFeedback, loadError missing
    status: "pending"
  - id: "5"
    content: Fix useClassDetailsLabels.ts - AdminViewLabels not exported
    status: "pending"
  - id: "6"
    content: Fix CreateRecurringClassContainer.tsx - CreateRecurringClassLabels not found, useTranslations
    status: "pending"
  - id: "7"
    content: Fix StatusTrackingContainer.tsx - totalSessions type mismatch
    status: "pending"
  - id: "8"
    content: Fix AdminComplaintsDesktopView.stories.tsx - useTranslations not found
    status: "pending"
isProject: false
---

# Plan 10: Fix Classes Dashboard TypeScript Errors

## Files to Modify (10+ files)
Various classes dashboard view components.

## Key Issues
1. Pluralization functions called with object instead of number
2. useTranslations from next-intl should be useAppTranslation
3. Labels objects used as callables
4. Missing exports in type definitions
5. Missing properties in label types
