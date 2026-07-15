---
name: "13: Fix meeting providers, parents, managers dashboard errors"
overview: "Fix TypeScript errors in meeting providers, parents, managers dashboard views"
todos:
  - id: "1"
    content: Fix MeetingProvidersContainer - MeetingProvidersLabels not callable
    status: "pending"
  - id: "2"
    content: Fix ParentsContainer - ParentsDirectoryLabels not found
    status: "pending"
  - id: "3"
    content: Fix ParentsMetricGrid - namespace and directory property missing
    status: "pending"
  - id: "4"
    content: Fix ParentInfoSection - ParentOnboardingLabels callable
    status: "pending"
  - id: "5"
    content: Fix useStudentsViewModel - errors property missing
    status: "pending"
  - id: "6"
    content: Fix parents/students/utils - indexing and type mismatch
    status: "pending"
  - id: "7"
    content: Fix ManagersDataGrid - ManagersDirectoryLabels not callable
    status: "pending"
  - id: "8"
    content: Fix StaffInfoSection - ManagerOnboardingLabels callable
    status: "pending"
  - id: "9"
    content: Fix SystemAccessSection - indexing issues
    status: "pending"
isProject: false
---

# Plan 13: Fix Meeting Providers, Parents, Managers Dashboard Errors

## Files to Modify (15+ files)
Various meeting providers, parents, and managers dashboard view components.

## Key Issues
1. Labels objects used as callables
2. Missing type exports
3. Translation namespace mismatches
4. Indexing/type issues in utility functions
