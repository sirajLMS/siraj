---
name: "13: Fix students dashboard TypeScript errors"
overview: "Fix TypeScript errors in students dashboard views"
todos:
  - id: "1"
    content: Fix StudentHistoryContainer.tsx - useParams not found
    status: "pending"
  - id: "2"
    content: Fix ClassSessionList.tsx - namespace and callable issues
    status: "pending"
  - id: "3"
    content: Fix MobileWeeklyScroller.tsx - missing properties
    status: "pending"
  - id: "4"
    content: Fix PerformanceStreak.tsx - missing properties
    status: "pending"
  - id: "5"
    content: Fix StudentHistoryDesktop.tsx - argument type mismatches
    status: "pending"
  - id: "6"
    content: Fix StudentHistoryMobile.tsx - argument type mismatches, useLocale
    status: "pending"
  - id: "7"
    content: Fix StudentQuotaContainer.tsx - notSet missing in CommonLabels
    status: "pending"
  - id: "8"
    content: Fix ContextualHelperCards.tsx - namespace and missing properties
    status: "pending"
  - id: "9"
    content: Fix StudentStatusContainer.tsx - CommonLabels not callable
    status: "pending"
  - id: "10"
    content: Fix StudentStatusView.tsx - validation namespace, type conversion
    status: "pending"
isProject: false
---

# Plan 13: Fix Students Dashboard TypeScript Errors

## Files to Modify (10+ files)
Various student dashboard view components.

## Key Issues
1. useParams, useLocale hooks not imported correctly
2. Translation namespace mismatches
3. Labels objects used as callables
4. Missing properties in label types (notSet, weeklyAttendance, week, days, etc.)
3. Argument type mismatches for pluralization functions
