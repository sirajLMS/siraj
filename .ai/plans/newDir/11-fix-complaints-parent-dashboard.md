---
name: "11: Fix complaints and parent dashboard TypeScript errors"
overview: "Fix TypeScript errors in complaints and parent dashboard views"
todos:
  - id: "1"
    content: Fix ParentComplaintsContainer.tsx - ComplaintsLabels missing parent/admin, type mismatches
    status: "pending"
  - id: "2"
    content: Fix ParentComplaintsDesktopView.stories.tsx - similar issues
    status: "pending"
  - id: "3"
    content: Fix ParentDashboardContainer.tsx - many missing properties in AdminViewLabels
    status: "pending"
  - id: "4"
    content: Fix ParentStudentsContainer.tsx - argument type mismatches
    status: "pending"
  - id: "5"
    content: Fix ParentLifecycleContainer.tsx - unused _locale, errors missing
    status: "pending"
  - id: "6"
    content: Fix ParentLifecycleView.tsx - missing properties
    status: "pending"
isProject: false
---

# Plan 11: Fix Complaints and Parent Dashboard Errors

## Files to Modify (6 files)
- `frontend/common/views/dashboard/complaints/ParentComplaintsContainer.tsx`
- `frontend/common/views/dashboard/complaints/ParentComplaintsDesktopView.stories.tsx`
- `frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer.tsx`
- `frontend/common/views/dashboard/parent/students/ParentStudentsContainer.tsx`
- `frontend/common/views/dashboard/parents/lifecycle/ParentLifecycleContainer.tsx`
- `frontend/common/views/dashboard/parents/lifecycle/ParentLifecycleView.tsx`

## Key Issues
1. `ComplaintsLabels` missing `parent` and `admin` properties
2. Type mismatches: `totalRecords` function vs string, `createSuccess` function vs string
3. Many missing properties in `AdminViewLabels` for parent dashboard
4. Argument type mismatches for translation functions
