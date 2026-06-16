# Siraj LMS UI Implementation Plan

**Generated**: 2026-06-12  
**Last updated**: 2026-06-13 (UI consistency layer)  
**Total Pages**: 37 unique pages from 78 HTML files  
**Strategy**: UI-only implementation following Next.js + MUI patterns  
**Organization**: Feature-based structure with permission-driven access  
**Architecture**: Single shared dashboard layout for all user types  
**UI patterns**: [COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md) — required reading for dashboard pages  
**Lessons learned**: [IMPLEMENTATION_LEARNINGS.md](IMPLEMENTATION_LEARNINGS.md) — required reading for coding patterns and preventing repeated mistakes  
**Implementation workflow**: [NEW_PAGE_WORKFLOW.md](NEW_PAGE_WORKFLOW.md) — mandatory master prompt for new features

---

## Core Principles

### 1. Feature-Based Organization

- Routes organized by **feature** (schedule, teachers, students), not by **role** (admin, teacher, parent)
- Each feature has its own directory with components, containers, and views
- Shared components live in `dashboard/components/`

### 2. Permission-Driven Access

- Users see features based on their **permissions array**, not their role
- Navigation items filtered at runtime using `user.permissions`
- Same dashboard layout used across all user types
- No role-specific layouts or duplicate code

### 3. Single Source of Truth

- One `DashboardLayout` component serves all users
- Navigation items defined once in `navigationConfig.ts`
- Permission checks happen at runtime, not compile time

### 4. Shared Dashboard UI Layer

All dashboard views use the shared primitives in [`src/components/ui/`](src/components/ui/). **Read [COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md) before implementing or refactoring any page.**

```
DashboardLayout (pageMargin)
  └── PageContainer (no extra p: 2/3)
        ├── PageHeader
        ├── MetricCard grid
        └── SectionPanel
              ├── AppDataGrid (desktop ≥ md)
              └── *CardList (mobile < md)
```

| Primitive                                             | Use for                                              |
| ----------------------------------------------------- | ---------------------------------------------------- |
| `PageContainer`                                       | Content wrapper — fixes double-padding with layout   |
| `PageHeader`                                          | Page title, subtitle, breadcrumbs, actions           |
| `MetricCard`                                          | Stat/metric rows (replaces per-feature metric cards) |
| `SectionPanel`                                        | Bordered section with title bar + actions            |
| `AppDataGrid`                                         | Desktop list tables via `@mui/x-data-grid`           |
| `StatusBadge`                                         | All status cells (correct `category` prop)           |
| `PrimaryPageAction` / `FilterButton` / `ExportButton` | Standard action buttons                              |

**Migrated pages (2026-06-13):** `/students`, `/dashboard` (schedule grid), `/schedule/alerts`, `/schedule/tracking/status`, `/schedule/tracking/reschedule` — all use `PageContainer`; five list tables use `AppDataGrid`.

**Analysis & rollout status:** [`.kiro/design-consistency-analysis.md`](.kiro/design-consistency-analysis.md), [`.gemini/ui-consistency-analysis.md`](.gemini/ui-consistency-analysis.md), [AGENTS.md](AGENTS.md) → Dashboard UI Patterns.

**Remaining UI work:** promote `formFieldStyles.ts`, table header token alignment, typography cleanup in class cards.

---

## `/[locale]/(auth)` - Authentication

### `/login`

- **Desktop**: `siraj_lms_login`
- **Mobile**: `siraj_lms_login_mobile`
- **Location**: `src/app/[locale]/(auth)/login/page.tsx`
- **Views**: `src/views/auth/login/`

---

## `/[locale]/(dashboard)` - Unified Dashboard

**All users use this layout group. Access controlled by permissions.**

### Home & Overview

#### `/dashboard`

- **Desktop**: `siraj_lms_admin_dashboard`, `siraj_lms_animated_admin_dashboard`
- **Mobile**: `siraj_lms_dashboard_mobile`
- **Location**: `src/app/[locale]/(dashboard)/dashboard/page.tsx`
- **Views**: `src/views/dashboard/schedule/`
- **Permissions**: `home`, `schedule-overview`
- **Notes**: Animated variant as optional state; content adapts to user permissions

### Schedule Management

#### `/schedule/search`

- **Desktop**: _(reuse schedule components)_
- **Mobile**: _(reuse schedule components)_
- **Location**: `src/app/[locale]/(dashboard)/schedule/search/page.tsx`
- **Views**: `src/views/dashboard/schedule/`
- **Permissions**: `schedule-search`

#### `/schedule/tracking/reschedule`

- **Desktop**: `siraj_lms_admin_dashboard_reschedule_tracking`
- **Mobile**: `siraj_lms_admin_dashboard_reschedule_tracking_mobile`
- **Location**: `src/app/[locale]/(dashboard)/schedule/tracking/reschedule/page.tsx`
- **Views**: `src/views/dashboard/schedule/`
- **Permissions**: `schedule-tracking`

#### `/schedule/tracking/status`

- **Desktop**: `siraj_lms_admin_dashboard_status_tracking`
- **Mobile**: `siraj_lms_admin_dashboard_status_tracking_mobile`
- **Location**: `src/app/[locale]/(dashboard)/schedule/tracking/status/page.tsx`
- **Views**: `src/views/dashboard/schedule/`
- **Permissions**: `schedule-tracking`

#### `/schedule/alerts`

- **Desktop**: `siraj_lms_admin_dashboard_alerts_quotas`
- **Mobile**: `siraj_lms_admin_dashboard_alerts_quotas_mobile`
- **Location**: `src/app/[locale]/(dashboard)/schedule/alerts/page.tsx`
- **Views**: `src/views/dashboard/schedule/`
- **Permissions**: `schedule-alerts`

### Classes Management

#### `/classes/[id]`

- **Desktop**: `siraj_lms_teacher_class_details_actions`, `siraj_lms_admin_class_details`
- **Mobile**: `siraj_lms_teacher_class_details_mobile`, `siraj_lms_admin_class_details_mobile`
- **Location**: `src/app/[locale]/(dashboard)/classes/[id]/page.tsx`
- **Views**: `src/views/dashboard/classes/`
- **Permissions**: `classes-view`, `classes-manage`

#### `/classes/[id]/audit`

- **Desktop**: `siraj_lms_admin_class_details_audit_trail`
- **Mobile**: `siraj_lms_class_audit_trail_mobile`
- **Location**: `src/app/[locale]/(dashboard)/classes/[id]/audit/page.tsx`
- **Views**: `src/views/dashboard/classes/`
- **Permissions**: `classes-audit`

#### `/classes/new`

- **Desktop**: `siraj_lms_add_recurring_class`
- **Mobile**: `siraj_lms_add_recurring_class_mobile`
- **Location**: `src/app/[locale]/(dashboard)/classes/new/page.tsx`
- **Views**: `src/views/dashboard/classes/`
- **Permissions**: `classes-create`

### Students Management

#### `/students`

- **Desktop**: `siraj_lms_master_student_directory`
- **Mobile**: `siraj_lms_student_directory_mobile`
- **Location**: `src/app/[locale]/(dashboard)/students/page.tsx`
- **Views**: `src/views/dashboard/students/`
- **Permissions**: `students-view`

#### `/students/[id]`

- **Location**: `src/app/[locale]/(dashboard)/students/[id]/page.tsx`
- **Views**: `src/views/dashboard/students/`
- **Permissions**: `students-view`

#### `/students/[id]/history`

- **Desktop**: `siraj_lms_student_class_history`
- **Mobile**: `siraj_lms_student_history_mobile`
- **Location**: `src/app/[locale]/(dashboard)/students/[id]/history/page.tsx`
- **Views**: `src/views/dashboard/students/`
- **Permissions**: `students-history`

#### `/students/[id]/quota`

- **Desktop**: `siraj_lms_student_profile_quota_override`
- **Mobile**: `siraj_lms_student_profile_quota_override_mobile`
- **Location**: `src/app/[locale]/(dashboard)/students/[id]/quota/page.tsx`
- **Views**: `src/views/dashboard/students/`
- **Permissions**: `students-quota`

#### `/students/[id]/status`

- **Desktop**: `siraj_lms_student_status_schedule_hold`
- **Mobile**: `siraj_lms_student_status_schedule_hold_mobile`
- **Location**: `src/app/[locale]/(dashboard)/students/[id]/status/page.tsx`
- **Views**: `src/views/dashboard/students/`
- **Permissions**: `students-status`

### Teachers Management

#### `/teachers`

- **Desktop**: `siraj_lms_teachers_directory`
- **Mobile**: `siraj_lms_teachers_directory_mobile`
- **Location**: `src/app/[locale]/(dashboard)/teachers/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teachers-view`

#### `/teachers/[id]`

- **Location**: `src/app/[locale]/(dashboard)/teachers/[id]/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teachers-view`

#### `/teachers/[id]/profile`

- **Desktop**: `siraj_lms_teacher_profile_editor`
- **Mobile**: `siraj_lms_teacher_profile_editor_mobile`
- **Location**: `src/app/[locale]/(dashboard)/teachers/[id]/profile/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teachers-profile` (or self-edit)

#### `/teachers/[id]/availability`

- **Desktop**: `siraj_lms_teacher_availability_tool`
- **Mobile**: `siraj_lms_teacher_availability_mobile`
- **Location**: `src/app/[locale]/(dashboard)/teachers/[id]/availability/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teachers-availability` (or self-edit)

#### `/teachers/[id]/schedule/weekly`

- **Desktop**: `siraj_lms_teacher_weekly_schedule`
- **Mobile**: `siraj_lms_teacher_weekly_schedule_mobile`
- **Location**: `src/app/[locale]/(dashboard)/teachers/[id]/schedule/weekly/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teachers-schedule`

#### `/teachers/[id]/schedule/future`

- **Desktop**: `siraj_lms_teacher_future_schedule`
- **Mobile**: `siraj_lms_teacher_future_schedule_mobile`
- **Location**: `src/app/[locale]/(dashboard)/teachers/[id]/schedule/future/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teachers-schedule`

#### `/teachers/[id]/reassignment`

- **Desktop**: `siraj_lms_teacher_reassignment_status_control`
- **Mobile**: `siraj_lms_teacher_reassignment_mobile`
- **Location**: `src/app/[locale]/(dashboard)/teachers/[id]/reassignment/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teachers-reassignment`

#### `/teachers/onboarding`

- **Desktop**: `siraj_lms_teacher_onboarding_form`
- **Mobile**: `siraj_lms_teacher_onboarding_mobile`
- **Location**: `src/app/[locale]/(dashboard)/teachers/onboarding/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teachers-onboard` (or self-onboard)

### Parents Management

#### `/parents`

- **Desktop**: `siraj_lms_parents_directory`
- **Mobile**: `siraj_lms_parents_directory_mobile`
- **Location**: `src/app/[locale]/(dashboard)/parents/page.tsx`
- **Views**: `src/views/dashboard/parents/`
- **Permissions**: `parents-view`

#### `/parents/[id]`

- **Location**: `src/app/[locale]/(dashboard)/parents/[id]/page.tsx`
- **Views**: `src/views/dashboard/parents/`
- **Permissions**: `parents-view`

#### `/parents/[id]/profile`

- **Desktop**: `siraj_lms_parent_profile_management`
- **Mobile**: `siraj_lms_parent_profile_mobile`
- **Location**: `src/app/[locale]/(dashboard)/parents/[id]/profile/page.tsx`
- **Views**: `src/views/dashboard/parents/`
- **Permissions**: `parents-profile` (or self-edit)

#### `/parents/onboarding`

- **Desktop**: `siraj_lms_parent_onboarding_form`
- **Mobile**: `siraj_lms_parent_onboarding_mobile`
- **Location**: `src/app/[locale]/(dashboard)/parents/onboarding/page.tsx`
- **Views**: `src/views/dashboard/parents/`
- **Permissions**: `parents-onboard` (or self-onboard)

### Managers Management

#### `/managers`

- **Desktop**: `siraj_lms_managers_directory`
- **Mobile**: `siraj_lms_managers_directory_mobile`
- **Location**: `src/app/[locale]/(dashboard)/managers/page.tsx`
- **Views**: `src/views/dashboard/managers/`
- **Permissions**: `managers-view`

#### `/managers/[id]`

- **Location**: `src/app/[locale]/(dashboard)/managers/[id]/page.tsx`
- **Views**: `src/views/dashboard/managers/`
- **Permissions**: `managers-view`

#### `/managers/onboarding`

- **Desktop**: `siraj_lms_manager_onboarding_form`
- **Mobile**: `siraj_lms_manager_onboarding_mobile`
- **Location**: `src/app/[locale]/(dashboard)/managers/onboarding/page.tsx`
- **Views**: `src/views/dashboard/managers/`
- **Permissions**: `managers-onboard` (or self-onboard)

### Billing Management

#### `/billing`

- **Desktop**: `siraj_lms_admin_billing_invoices`, `siraj_lms_parent_billing_invoices`
- **Mobile**: `siraj_lms_admin_billing_mobile`, `siraj_lms_parent_billing_invoices_mobile`
- **Location**: `src/app/[locale]/(dashboard)/billing/page.tsx`
- **Views**: `src/views/dashboard/billing/`
- **Permissions**: `billing-view`, `billing-manage`
- **Notes**: Same component, different data based on user type

#### `/billing/manual`

- **Desktop**: `siraj_lms_manual_invoice_form`
- **Mobile**: `siraj_lms_manual_invoice_form_mobile`
- **Location**: `src/app/[locale]/(dashboard)/billing/manual/page.tsx`
- **Views**: `src/views/dashboard/billing/`
- **Permissions**: `billing-create`

### Complaints & Feedback

#### `/complaints`

- **Desktop**: `siraj_lms_admin_complaints_resolution`, `siraj_lms_parent_complaints_record`
- **Mobile**: `siraj_lms_complaints_resolution_mobile`, `siraj_lms_parent_complaints_record_mobile`
- **Location**: `src/app/[locale]/(dashboard)/complaints/page.tsx`
- **Views**: `src/views/dashboard/complaints/`
- **Permissions**: `complaints-view`, `complaints-manage`, `complaints-submit`
- **Notes**: Same route, different views based on permission level

#### `/suggestions`

- **Desktop**: `siraj_lms_parent_suggestions`
- **Mobile**: `siraj_lms_parent_suggestions_mobile`
- **Location**: `src/app/[locale]/(dashboard)/suggestions/page.tsx`
- **Views**: `src/views/dashboard/suggestions/`
- **Permissions**: `suggestions-submit`
- **Notes**: Parent submit form route

#### `/suggestions/manage`

- **Desktop**: Proxy from `siraj_lms_admin_complaints_resolution` (queue + metrics)
- **Mobile**: Card list variant
- **Location**: `src/app/[locale]/(dashboard)/suggestions/manage/page.tsx`
- **Views**: `src/views/dashboard/suggestions/`
- **Permissions**: `suggestions-manage`
- **Notes**: Admin review queue; separate route/store from parent submit

### Resources Management

#### `/resources`

- **Desktop**: `siraj_lms_learning_resources_management`, `siraj_lms_learning_resources`
- **Mobile**: `siraj_lms_learning_resources_mobile_1`, `siraj_lms_learning_resources_mobile_2`
- **Location**: `src/app/[locale]/(dashboard)/resources/page.tsx`
- **Views**: `src/views/dashboard/resources/`
- **Permissions**: `resources-view`, `resources-manage`
- **Notes**: Management view for admin permissions, browse view for others

### Reports & Analytics

#### `/reports`

- **Desktop**: `siraj_lms_master_reporting_engine`
- **Mobile**: `siraj_lms_master_reporting_mobile`
- **Location**: `src/app/[locale]/(dashboard)/reports/page.tsx`
- **Views**: `src/views/dashboard/reports/`
- **Permissions**: `reports-view`, `reports-generate`

### Reschedule Management

#### `/reschedule`

- **Desktop**: `siraj_lms_admin_reschedule_form`
- **Mobile**: `siraj_lms_admin_reschedule_form_mobile`
- **Location**: `src/app/[locale]/(dashboard)/reschedule/page.tsx`
- **Views**: `src/views/dashboard/reschedule/`
- **Permissions**: `schedule-reschedule`

### System Tools

#### `/tools/dst-migration`

- **Desktop**: `siraj_lms_dst_migration_tool`
- **Mobile**: `siraj_lms_dst_migration_mobile`
- **Location**: `src/app/[locale]/(dashboard)/tools/dst-migration/page.tsx`
- **Views**: `src/views/dashboard/tools/`
- **Permissions**: `system-admin`

### User Dashboards

**Note**: User-specific dashboards now live under their respective feature areas

#### Teacher Dashboard

- **Desktop**: `siraj_lms_teacher_dashboard`, `siraj_lms_teacher_dashboard_active_controls`
- **Mobile**: `siraj_lms_teacher_dashboard_mobile`, `siraj_lms_teacher_dashboard_active_mobile`
- **Location**: `src/app/[locale]/(dashboard)/dashboard/page.tsx`
- **Views**: `src/views/dashboard/teachers/`
- **Permissions**: `teacher-dashboard`
- **Notes**: Same route as main dashboard, different view based on permissions

#### Parent Dashboard

- **Desktop**: `siraj_lms_parent_dashboard`
- **Mobile**: `siraj_lms_parent_dashboard_mobile`
- **Location**: `src/app/[locale]/(dashboard)/dashboard/page.tsx`
- **Views**: `src/views/dashboard/parents/`
- **Permissions**: `parent-dashboard`
- **Notes**: Same route as main dashboard, different view based on permissions

---

## Implementation Notes

### Feature-Based Architecture

**Directory Structure**:

```
src/
├── app/[locale]/(dashboard)/
│   ├── layout.tsx                        # Shared dashboard layout
│   ├── dashboard/page.tsx                # Home (adapts to user)
│   ├── schedule/
│   │   ├── search/page.tsx
│   │   ├── tracking/reschedule/page.tsx
│   │   └── alerts/page.tsx
│   ├── classes/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── [id]/audit/page.tsx
│   │   └── new/page.tsx
│   ├── students/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── [id]/history/page.tsx
│   ├── teachers/
│   ├── parents/
│   ├── managers/
│   ├── billing/
│   ├── complaints/
│   ├── resources/
│   ├── reports/
│   └── tools/
│
└── views/dashboard/
    ├── components/                        # Shared layout components
    │   ├── DashboardLayout.tsx
    │   ├── Sidebar.tsx
    │   ├── TopNavbar.tsx
    │   └── BottomNavbar.tsx
    ├── config/
    │   └── navigationConfig.ts            # Permission-based navigation
    ├── schedule/                          # Schedule feature
    │   ├── components/
    │   ├── ScheduleContainer.tsx
    │   └── ScheduleView.tsx
    ├── classes/                           # Classes feature
    │   ├── components/
    │   ├── ClassesContainer.tsx
    │   └── ClassesView.tsx
    ├── students/                          # Students feature
    ├── teachers/                          # Teachers feature
    ├── parents/                           # Parents feature
    ├── managers/                          # Managers feature
    ├── billing/                           # Billing feature
    ├── complaints/                        # Complaints feature
    ├── resources/                         # Resources feature
    ├── reports/                           # Reports feature
    └── tools/                             # System tools
```

### Permission System

**How It Works**:

1. User has `permissions: string[]` array (e.g., `["schedule-view", "students-view", "reports-generate"]`)
2. Navigation items in `navigationConfig.ts` have `permission?: string` field
3. At runtime, filter navigation items: `items.filter(item => !item.permission || user.permissions.includes(item.permission))`
4. Page-level protection via middleware or layout checks
5. Component-level hiding via permission checks

**Benefits**:

- No role-specific code duplication
- Easy to add new permission groups (just new permission combinations)
- Flexible: users can have custom permission sets
- Scalable: adding new features doesn't require new roles

### Responsive Strategy

- Each page implements **one responsive component** that adapts to mobile/desktop
- Use MUI breakpoints: `xs`, `sm`, `md`, `lg`, `xl`
- Mobile-specific interactions handled through conditional rendering
- No separate mobile/desktop routes

### State Management

- **Zustand stores** at feature level (e.g., `scheduleStore`, `studentsStore`)
- Components receive data via props (no direct store access)
- Containers connect stores to components
- Example: `ScheduleContainer` → reads `scheduleStore` → passes to `ScheduleView` → passes to child components

### Data Flow Pattern

```
Store (Zustand) → Container → View → Components (presentational)
                      ↓
                  Server Actions
```

### Shared vs Feature Components

**Shared UI primitives** (`src/components/ui/`):

- `PageContainer`, `PageHeader`, `SectionPanel`
- `BaseCard`, `MetricCard`, `StatusBadge`
- `AppDataGrid` (+ feature-specific `*DataGrid` wrappers)
- `PrimaryPageAction`, `FilterButton`, `ExportButton`

See [COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md) for usage rules.

**Shared layout** (`dashboard/components/`):

- DashboardLayout
- Sidebar
- TopNavbar
- BottomNavbar
- Common UI elements used across features

**Feature Components** (`dashboard/[feature]/components/`):

- Feature-specific UI
- Business logic containers
- Specialized forms and tables

### State Variations

- Pages with multiple states (e.g., `teacher_dashboard` + `teacher_dashboard_active_controls`) use component state
- Animated variants can be optional props or separate components
- Active/inactive states handled via local state or store flags

### Missing Files

Files marked as _(missing - to be provided)_:

- `/classes/[id]/overrides` desktop variant
- `/classes/new` desktop variant

These will be implemented when provided.

### Workflow Per Page

1. Read [COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md) for layout/table/card rules
2. Analyze `screen.png` for visual design
3. Review `code.html` for structure
4. Check `siraj_lms_combined.txt` for related pages/patterns
5. Create feature directory if new
6. Implement Container (connects store)
7. Implement View — `PageContainer` → `PageHeader` → `MetricCard` → `SectionPanel` → `AppDataGrid` / `*CardList`
8. Implement Components (presentational; feature `*DataGrid` for column defs)
9. Add Zod schemas for forms
10. Add server actions if needed
11. Add i18n keys (English + Arabic), including DataGrid `emptyMessage` keys
12. Update `navigationConfig.ts` with permission
13. Run `bun quality-gate` and resolve all issues until perfect health is reached.

### MUI Component Usage

- **Always check mui-mcp** for current component APIs
- Use MUI v9+ syntax (components from `@mui/material`)
- Prefer `slotProps` over deprecated `InputProps`
- Use theme callbacks in `sx` props: `sx={{ p: (theme) => theme.layout.cardPadding }}`
- Import icons from `@mui/icons-material`
- **List tables:** use `AppDataGrid` — not hand-built MUI `Table` (see exceptions in COMPONENT_PATTERNS.md)

---

## Summary

- **37 unique pages** from 78 HTML files
- **Feature-based organization** (not role-based)
- **Permission-driven access** (runtime filtering)
- **Single dashboard layout** for all user types
- **2 missing desktop variants** (will be provided later)
- **UI-only** implementation (no backend integration yet)
- **Shared UI layer** at `src/components/ui/` — documented in [COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md)
- **Follows conventions**: MUI v9+, Next.js 16+, TypeScript, Zustand, next-intl, `@mui/x-data-grid`
