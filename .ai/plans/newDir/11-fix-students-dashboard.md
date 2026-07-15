---
name: "11: Fix students dashboard tsgo errors"
overview: "Fix TypeScript errors in students dashboard views"
todos:
  - id: "1"
    content: Fix StudentHistoryContainer - useParams not found
    status: "pending"
  - id: "2"
    content: Fix ClassSessionList - namespace and callable issues
    status: "pending"
  - id: "3"
    content: Fix MobileWeeklyScroller - missing properties
    status: "pending"
  - id: "4"
    content: Fix PerformanceStreak - missing properties
    status: "pending"
  - id: "5"
    content: Fix StudentHistoryDesktop/Mobile - argument type mismatches
    status: "pending"
  - id: "6"
    content: Fix StudentHistoryMobile - useLocale not found
    status: "pending"
  - id: "7"
    content: Fix StudentQuotaContainer - notSet missing in CommonLabels
    status: "pending"
  - id: "8"
    content: Fix ContextualHelperCards - namespace and missing properties
    status: "pending"
  - id: "9"
    content: Fix StudentStatusContainer/View - CommonLabels not callable, validation namespace
    status: "pending"
isProject: false
---

# Plan 11: Fix Students Dashboard TSGo Errors

## Files to Modify (15+ files)
Various student dashboard view components.

## Key Issues
1. useParams, useLocale hooks not imported correctly
2. Translation namespace mismatches
3. Labels objects used as callables
4. Missing properties in label types
