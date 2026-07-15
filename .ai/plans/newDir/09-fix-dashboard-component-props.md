---
name: "09: Fix dashboard component prop mismatches"
overview: "Fix prop type mismatches in dashboard components"
todos:
  - id: "1"
    content: Fix DashboardMetricsSection - gridSize prop not in Mobile/Desktop props
    status: "pending"
  - id: "2"
    content: Fix FxStaleBanner - unused _locale parameter
    status: "pending"
  - id: "3"
    content: Fix NotificationButton - unused _locale parameter
    status: "pending"
  - id: "4"
    content: Fix ParentLifecycleContainer - unused _locale parameter
    status: "pending"
  - id: "5"
    content: Fix UserMenuButton - missing nav, impersonation, loading, returnToNormalLogin properties
    status: "pending"
  - id: "6"
    content: Fix ManagerRowActions - actions property missing
    status: "pending"
  - id: "7"
    content: Fix StaffInfoSection - ManagerOnboardingLabels callable issue
    status: "pending"
  - id: "8"
    content: Fix SystemAccessSection - indexing issues
    status: "pending"
  - id: "9"
    content: Fix ParentDashboardContainer - missing properties (pageTitle, welcome, etc.)
    status: "pending"
  - id: "10"
    content: Fix ParentStudentsContainer - argument type mismatches
    status: "pending"
isProject: false
---

# Plan 09: Fix Dashboard Component Prop Mismatches

## Files to Modify (15+ files)
Various dashboard view components with prop type mismatches and missing translation properties.

## Key Issues
1. Unused locale parameters (prefix with _ or remove)
2. Missing properties in label type definitions
3. GridSize prop not defined in component interfaces
4. Argument type mismatches for translation functions
