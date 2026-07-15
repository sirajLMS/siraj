---
name: "10: Fix classes dashboard tsgo errors"
overview: "Fix TypeScript errors in classes dashboard views"
todos:
  - id: "1"
    content: Fix ClassAuditContainer - argument type mismatches for pluralization
    status: "pending"
  - id: "2"
    content: Fix ClassDetailsToolbarArea - useTranslations not found
    status: "pending"
  - id: "3"
    content: Fix LiveSessionToolbar - labels not callable
    status: "pending"
  - id: "4"
    content: Fix useEventLogDownload - actionFeedback, loadError missing
    status: "pending"
  - id: "5"
    content: Fix useClassDetailsLabels - AdminViewLabels not exported
    status: "pending"
  - id: "6"
    content: Fix CreateRecurringClassContainer - CreateRecurringClassLabels not found, useTranslations
    status: "pending"
  - id: "7"
    content: Fix StatusTrackingContainer - totalSessions type mismatch
    status: "pending"
  - id: "8"
    content: Fix AdminComplaintsDesktopView - useTranslations not found
    status: "pending"
isProject: false
---

# Plan 10: Fix Classes Dashboard TSGo Errors

## Files to Modify (10+ files)
- `frontend/common/views/dashboard/classes/audit/ClassAuditContainer.tsx`
- `frontend/common/views/dashboard/classes/details/components/ClassDetailsToolbarArea.tsx`
- `frontend/common/views/dashboard/classes/details/components/LiveSessionToolbar.tsx`
- `frontend/common/views/dashboard/classes/details/hooks/useEventLogDownload.ts`
- `frontend/common/views/dashboard/classes/details/useClassDetailsLabels.ts`
- `frontend/common/views/dashboard/classes/recurring/CreateRecurringClassContainer.tsx`
- `frontend/common/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx`
- `frontend/common/views/dashboard/complaints/AdminComplaintsDesktopView.stories.tsx`

## Key Issues
1. Pluralization functions called with wrong argument types
2. useTranslations should be useAppTranslation
3. Labels objects not callable - need to use sub-properties
4. Missing exports in type definitions
