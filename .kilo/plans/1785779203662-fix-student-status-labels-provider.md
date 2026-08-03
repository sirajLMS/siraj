# Fix Missing StudentStatusLabelsProvider in StudentClassesDesktopView and StudentClassesMobileView

## Problem
The `UpcomingClassesTableDesktop` and `UpcomingClassesTableMobile` components use `useStudentStatusLabels()` hook which requires being wrapped within a `StudentStatusLabelsProvider`. Currently, both `StudentClassesDesktopView` and `StudentClassesMobileView` don't wrap their content with this provider, causing the error:
```
useStudentStatusLabels must be used within StudentStatusLabelsProvider
```

## Root Cause
- `StudentStatusDesktopView` and `StudentStatusMobileView` (status tab) correctly wrap their body with `StudentStatusLabelsProvider`
- `StudentClassesDesktopView` and `StudentClassesMobileView` (classes tab) do NOT wrap their content with `StudentStatusLabelsProvider`
- Both views are rendered as tabs within `StudentProfilePageDesktopView` and `StudentProfilePageMobileView`
- The `UpcomingClassesTableDesktop` and `UpcomingClassesTableMobile` components (used by `StudentClassesDesktopView` and `StudentClassesMobileView` respectively) call `useStudentStatusLabels()` but have no provider in their ancestor chain

## Solution
Wrap the body content of both `StudentClassesDesktopView` and `StudentClassesMobileView` with `StudentStatusLabelsProvider` using the `t` (translations) from the ViewModel, similar to how `StudentStatusDesktopView` and `StudentStatusMobileView` do it.

## Files to Modify
1. `/home/ahmed/Projects/siraj/frontend/desktop/views/dashboard/students/status/studentClasses.desktop.tsx`
2. `/home/ahmed/Projects/siraj/frontend/mobile/views/dashboard/students/status/studentClasses.mobile.tsx`

## Implementation Steps
For each file:
1. Import `StudentStatusLabelsProvider` from `@/frontend/common/views/dashboard/students/status/studentStatusLabelsContext`
2. Wrap the `body` content (the `UpcomingClassesTableDesktop`/`UpcomingClassesTableMobile` component) with `StudentStatusLabelsProvider labels={t}`
3. Ensure the provider wraps the content for both embedded and non-embedded cases

## Verification
- Run `bun tsgo` to verify TypeScript compilation
- Run `bun biome:check` to verify formatting
- Run lint queue for the modified files
- Test the student profile page classes tab on both desktop and mobile to ensure no console errors

## Risk Assessment
- Low risk: Only adding a context provider wrapper
- No changes to business logic or data flow
- Follows existing pattern used in `StudentStatusDesktopView` and `StudentStatusMobileView`