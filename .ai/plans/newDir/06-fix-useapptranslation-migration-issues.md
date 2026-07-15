---
name: "06: Fix useTranslations/useLocale migration and other i18n issues"
overview: "Fix remaining migration issues from next-intl to compile-time i18n"
todos:
  - id: "1"
    content: Fix useTranslations not found - replace with useAppTranslation in ClassDetailsToolbarArea, CreateRecurringClassContainer, AdminComplaintsDesktopView, upcomingClassesTable, jumpToDateHeader
    status: "pending"
  - id: "2"
    content: Fix useLocale not found - replace with useAppLocale in StudentHistoryMobile
    status: "pending"
  - id: "3"
    content: Fix useParams not found in StudentHistoryContainer
    status: "pending"
  - id: "4"
    content: Fix AdminDashboardLabels missing properties (admin, billing, meetingProviders, adminView)
    status: "pending"
  - id: "5"
    content: Fix AdminViewLabels missing admin property
    status: "pending"
  - id: "6"
    content: Fix CommonLabels missing errors, common properties
    status: "pending"
  - id: "7"
    content: Fix searchScheduleFilterDrawer useAppTranslation import
    status: "pending"
  - id: "8"
    content: Fix rescheduleView.mobile.tsx meetingConfig namespace
    status: "pending"
  - id: "9"
    content: Fix ProfileAdministrationPanel, ImpersonationBanner, GroupSimulationBanner, ViewAsUserButton - missing translation properties
    status: "pending"
isProject: false
---

# Plan 06: Fix useTranslations/useLocale Migration and Other i18n Issues

## Files to Modify (15+ files)
- Various dashboard view files using old next-intl hooks
- Admin dashboard label type definitions
- Search schedule filter drawer
- Reschedule view mobile

## Key Issues
1. `useTranslations` from next-intl not found - replace with `useAppTranslation`
2. `useLocale` from next-intl not found - replace with `useAppLocale`
3. Missing properties in label type definitions
4. Missing imports for useAppTranslation
