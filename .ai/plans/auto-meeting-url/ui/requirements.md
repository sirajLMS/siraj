# Requirements Document: Auto-Meeting-URL UI/UX Improvement Plan

**Project**: Siraj Meetings  
**Feature**: Auto-Meeting-URL UI Enhancement  
**Version**: 1.0  
**Date**: 2026-08-02  
**Status**: Draft  

---

## Table of Contents

1. [Requirement 0: Execution Outcome Protocol & Task Progress Tracking](#requirement-0-execution-outcome-protocol--task-progress-tracking)
2. [Requirement 1: Settings Tab Component Compliance](#requirement-1-settings-tab-component-compliance)
3. [Requirement 2: Profile Meeting Configs Enhancement](#requirement-2-profile-meeting-configs-enhancement)
4. [Requirement 3: Meeting URL Display in Data Tables](#requirement-3-meeting-url-display-in-data-tables)
5. [Requirement 4: Cross-Navigation Between Settings and Profile](#requirement-4-cross-navigation-between-settings-and-profile)
6. [Requirement 5: OAuth Connection UX Flow](#requirement-5-oauth-connection-ux-flow)
7. [Requirement 6: Meeting URL Generation Feedback](#requirement-6-meeting-url-generation-feedback)
8. [Requirement 7: Mobile-Desktop Parity](#requirement-7-mobile-desktop-parity)
9. [Requirement 8: Accessibility and i18n](#requirement-8-accessibility-and-i18n)
10. [UX/Navigation Requirements](#uxnavigation-requirements-mandatory-section)
11. [Non-Functional Requirements](#non-functional-requirements)
12. [Dependencies and Assumptions](#dependencies-and-assumptions)

---

## Requirement 0: Execution Outcome Protocol & Task Progress Tracking

### User Story
As a developer implementing this plan, I need a standardized way to track progress and verify completion so that the implementation is transparent and auditable.

### Acceptance Criteria
- **AC-0.1**: Each requirement (1-8) has a corresponding task entry in the session database with status tracking (pending/in_progress/done/blocked)
- **AC-0.2**: Before starting any requirement, the implementer updates the task status to `in_progress`
- **AC-0.3**: Upon completion of a requirement, the implementer updates the task status to `done` and provides verification evidence (test results, lint pass, build pass)
- **AC-0.4**: A summary of all completed tasks is provided at the end of implementation

### EARS Format
```
WHEN a requirement implementation begins
THE system SHALL record the task as in_progress in the session database

WHEN a requirement implementation completes
THE system SHALL record the task as done with verification evidence

WHEN all requirements are implemented
THE system SHALL provide a completion summary
```

### Priority
Critical

### Complexity
Low (process overhead only)

### Dependencies
None

---

## Requirement 1: Settings Tab Component Compliance

### User Story
As an admin (SUPER_ADMIN, ACADEMY_ADMIN), I want the meeting integrations settings tab to follow the project's design system patterns so that it is consistent with other settings tabs and maintainable.

### Current State Analysis
- Uses raw `Card`, `Grid`, `Typography` instead of `DesktopMetricCardGrid` / `MobileMetricCardGrid` for provider health cards
- Uses raw `DataGrid` instead of `DesktopAppDataGrid` / `MobileCardList` for connected accounts table
- Credential forms lack zod validation and react-hook-form integration
- Accordion pattern inconsistent with other settings tabs (which use DataGrid)
- No "Connect Provider" button (OAuth initiation only on profile page)
- Revoke dialog uses raw `Dialog` instead of `BaseDeleteDialog`
- No cross-linking to profile meeting configs page

### Acceptance Criteria
- **AC-1.1**: Provider health cards use `DesktopMetricCardGrid` (desktop) and `MobileMetricCardGrid` (mobile) with proper metric card layout
- **AC-1.2**: Connected accounts table uses `DesktopAppDataGrid` (desktop) and `MobileCardList` (mobile) with consistent column definitions
- **AC-1.3**: Credential forms use `react-hook-form` + `zod` validation with translated labels via `useAppTranslation(Translation.Dashboard.SettingsMeetingIntegrations)`
- **AC-1.4**: Revoke token action uses `BaseDeleteDialog` with proper translation keys
- **AC-1.5**: "Connect Provider" button added for each unconnected provider, initiating OAuth flow
- **AC-1.6**: Cross-link button to `/profile?tab=meeting` for teacher meeting configs
- **AC-1.7**: All components lazy-loaded and code-split
- **AC-1.8**: Permission checks: `AppPermission.SettingsEditMeetingIntegrations` for write, `AppPermission.SettingsView` for read

### EARS Format
```
WHEN admin views the meeting integrations settings tab
THE system SHALL render provider health cards using DesktopMetricCardGrid (desktop) or MobileMetricCardGrid (mobile)

WHEN admin views connected accounts
THE system SHALL render the table using DesktopAppDataGrid (desktop) or MobileCardList (mobile)

WHEN admin edits provider credentials
THE system SHALL present a form with react-hook-form + zod validation and translated labels

WHEN admin clicks revoke token
THE system SHALL show BaseDeleteDialog with translated confirmation message

WHEN admin views an unconnected provider
THE system SHALL show a "Connect Provider" button that initiates OAuth flow

WHEN admin clicks cross-link to profile
THE system SHALL navigate to /profile?tab=meeting
```

### Priority
High

### Complexity
Medium

### Dependencies
- Backend: `meetingIntegrationProviders`, `meetingIntegrationConnectedAccounts`, `testMeetingProviderConnection`, `adminRevokeMeetingProviderToken` queries/mutations available
- Design system: `DesktopMetricCardGrid`, `MobileMetricCardGrid`, `DesktopAppDataGrid`, `MobileCardList`, `BaseDeleteDialog` components exist
- i18n: Translation namespace `Dashboard.SettingsMeetingIntegrations` exists in `shared/locale/`

---

## Requirement 2: Profile Meeting Configs Enhancement

### User Story
As a teacher, I want an enhanced meeting configs management experience with OAuth callback handling, batch actions, and URL visibility so that I can efficiently manage my meeting providers and see generated URLs.

### Current State Analysis
- No OAuth callback listener (user must manually refresh after OAuth)
- No "reconnect all" batch action for multiple expiring tokens
- No URL expiration display (`expiresAt` not populated in backend)
- No copy URL button for teachers (only join button)
- Reauth needed banner exists but no proactive reconnect UX
- Class meeting configs section exists but lacks URL generation preview

### Acceptance Criteria
- **AC-2.1**: OAuth callback auto-detection — after OAuth redirect returns to `/profile?tab=meeting`, the page auto-refreshes connected providers list without manual refresh
- **AC-2.2**: "Reconnect All" batch action button for providers with expiring/expired tokens (shows when ≥2 providers need reauth)
- **AC-2.3**: URL expiration display — show `expiresAt` for each generated meeting URL (requires backend to populate `expiresAt` field)
- **AC-2.4**: Copy URL button for teachers on each meeting config and class meeting config
- **AC-2.5**: Proactive reauth banner with "Reconnect" button per provider when token expires within 7 days
- **AC-2.6**: Meeting config form dialog uses `EntityFormDialogActions` with zod validation
- **AC-2.7**: Class meeting configs show generation status (pending/success/failed) with retry action
- **AC-2.8**: All forms use translated labels via `useAppTranslation(Translation.Ui.MeetingConfig)`

### EARS Format
```
WHEN teacher completes OAuth flow and returns to /profile?tab=meeting
THE system SHALL auto-detect callback completion and refresh connected providers list

WHEN teacher has 2+ providers with expiring tokens
THE system SHALL show "Reconnect All" batch action button

WHEN teacher views a generated meeting URL
THE system SHALL display expiration timestamp (expiresAt) if available

WHEN teacher clicks copy URL button
THE system SHALL copy the meeting URL to clipboard and show toast notification

WHEN provider token expires within 7 days
THE system SHALL show proactive reauth banner with per-provider reconnect button

WHEN teacher creates/edits meeting config
THE system SHALL use EntityFormDialogActions with zod validation and translated labels

WHEN class meeting config generation fails
THE system SHALL show retry button with error message
```

### Priority
High

### Complexity
Medium-High

### Dependencies
- Backend: `myConnectedMeetingProviders`, `userMeetingConfigs`, `classMeetingConfigs`, `connectMeetingProviderOAuth`, `disconnectMeetingProviderOAuth`, `generateMeetingUrl`, `createUserMeetingConfig`, `updateUserMeetingConfig`, `deleteUserMeetingConfig`, `setDefaultMeetingConfig` mutations available
- Backend enhancement needed: `expiresAt` field population for meeting URLs
- Design system: `EntityFormDialogActions`, `BaseDeleteDialog` components exist
- i18n: Translation namespace `Ui.MeetingConfig` already exists in `shared/locale/` (used by `useMeetingConfigsTabViewModel.ts`)

---

## Requirement 3: Meeting URL Display in Data Tables

### User Story
As a teacher/student/parent, I want to see meeting URL status, copy URLs, and join meetings directly from data tables (schedule, dashboard) so that I don't need to navigate to separate pages.

### Current State Analysis
- `MeetingJoinAction` component exists but only shows join button, pending chip, setup link
- No copy URL for non-admin users
- No URL-pending status indicators in data tables
- Teacher schedule grid, student next class card, parent dashboard lack URL status badges
- No generation status (pending/success/failed) visible in tables

### Acceptance Criteria
- **AC-3.1**: Teacher schedule grid (`DesktopAppDataGrid`/`MobileCardList`) shows meeting URL status badge (pending/generated/failed) per class instance
- **AC-3.2**: Teacher schedule grid includes copy URL button for generated URLs (visible to teachers with `AppPermission.MeetingConfigsManageOwn` or `AppPermission.MeetingConfigsManageClass`)
- **AC-3.3**: Student next class card shows join button + copy URL button for generated meeting URLs
- **AC-3.4**: Parent dashboard shows student's upcoming meeting URLs with copy/join actions
- **AC-3.5**: URL-pending indicator (skeleton/spinner) shown while auto-generation is in progress
- **AC-3.6**: Failed generation shows error badge with retry action (requires backend mutation for manual re-generate)
- **AC-3.7**: All status badges use theme colors (no hardcoded colors) and translated labels

### EARS Format
```
WHEN teacher views schedule grid
THE system SHALL display meeting URL status badge (pending/generated/failed) for each class instance

WHEN teacher clicks copy URL on schedule grid
THE system SHALL copy meeting URL to clipboard and show success toast

WHEN student views next class card
THE system SHALL show join button and copy URL button for generated URLs

WHEN parent views student dashboard
THE system SHALL show upcoming meeting URLs with join/copy actions

WHILE meeting URL auto-generation is in progress
THE system SHALL show pending indicator (skeleton/spinner) in place of URL

WHEN meeting URL generation fails
THE system SHALL show error badge with retry button
```

### Priority
High

### Complexity
Medium

### Dependencies
- Backend: `classMeetingConfigs`, `recurringMeetingConfigs` queries available
- Backend enhancement needed: manual re-generate mutation for failed class instances
- Frontend: `DesktopAppDataGrid`, `MobileCardList`, `MeetingJoinAction` components exist
- Design system: status badge components, theme-aware colors
- i18n: Translation keys for status badges (pending, generated, failed, expired)

---

## Requirement 4: Cross-Navigation Between Settings and Profile

### User Story
As an admin/teacher, I want seamless navigation between the admin settings tab and teacher profile meeting configs so that I can manage providers and configs without losing context.

### Current State Analysis
- Settings tab (`/dashboard/settings?tab=meetingIntegrations`) has no link to profile meeting configs
- Profile page (`/profile?tab=meeting`) has no link to admin settings tab
- No breadcrumb or contextual navigation
- Role-based visibility not clearly indicated

### Acceptance Criteria
- **AC-4.1**: Settings tab header includes "View Teacher Meeting Configs" button linking to `/profile?tab=meeting` (visible to admins with `AppPermission.SettingsEditMeetingIntegrations`)
- **AC-4.2**: Profile meeting configs header includes "Admin Provider Settings" button linking to `/dashboard/settings?tab=meetingIntegrations` (visible to users with `AppPermission.SettingsView` or `AppPermission.SettingsEditMeetingIntegrations`)
  - **Note**: Since `SettingsEditMeetingIntegrations` implies `SettingsView` access (the settings page guard requires `SettingsView`), the OR gate is functionally equivalent to `SettingsView` alone. Both are listed for explicitness.
- **AC-4.3**: Both links open in same tab (not new window) to preserve navigation history
- **AC-4.4**: Active tab state preserved when navigating between pages
- **AC-4.5**: Breadcrumb shows current location: "Settings > Meeting Integrations" / "Profile > Meeting Configs"

### EARS Format
```
WHEN admin views meeting integrations settings tab
THE system SHALL show "View Teacher Meeting Configs" button linking to /profile?tab=meeting

WHEN teacher/admin views profile meeting configs
THE system SHALL show "Admin Provider Settings" button linking to /dashboard/settings?tab=meetingIntegrations

WHEN user clicks cross-navigation button
THE system SHALL navigate in same tab preserving history

WHEN user navigates between settings and profile
THE system SHALL show breadcrumb with current location
```

### Priority
Medium

### Complexity
Low

### Dependencies
- Routing: `/dashboard/settings?tab=meetingIntegrations` and `/profile?tab=meeting` routes exist
- Permissions: `AppPermission.SettingsEditMeetingIntegrations`, `AppPermission.SettingsView`, `AppPermission.MeetingConfigsManageOwn`
- i18n: Translation keys for button labels and breadcrumbs

---

## Requirement 5: OAuth Connection UX Flow

### User Story
As a teacher, I want a smooth OAuth connection experience with auto-detection, loading states, and proactive reconnect prompts so that I can connect providers without friction.

### Current State Analysis
- OAuth initiation works but no callback listener
- No loading state during OAuth redirect
- No token expiration warning until token is fully expired
- No "reconnect" flow — only disconnect + reconnect
- OAuth popup/redirect behavior not standardized

### Acceptance Criteria
- **AC-5.1**: OAuth initiation shows loading overlay with "Connecting to {Provider}..." message
- **AC-5.2**: OAuth callback auto-detection via `window.addEventListener('message')` or URL param polling — refreshes provider list on completion
- **AC-5.3**: Token expiration warning banner appears 7 days before expiry with "Reconnect" button per provider
- **AC-5.4**: "Reconnect" action preserves existing meeting configs and only refreshes OAuth token
- **AC-5.5**: OAuth error handling shows translated error message with retry option
- **AC-5.6**: Disconnect action uses `BaseDeleteDialog` with warning about impact on meeting configs
- **AC-5.7**: Provider cards show connection status badge (connected/expiring/expired/disconnected) with theme colors

### EARS Format
```
WHEN teacher clicks "Connect Provider"
THE system SHALL show loading overlay with provider name during OAuth redirect

WHEN OAuth redirect returns to profile page
THE system SHALL auto-detect completion and refresh provider list

WHEN provider token expires within 7 days
THE system SHALL show warning banner with per-provider "Reconnect" button

WHEN teacher clicks "Reconnect"
THE system SHALL refresh OAuth token without affecting meeting configs

WHEN OAuth fails
THE system SHALL show translated error message with retry button

WHEN teacher clicks disconnect
THE system SHALL show BaseDeleteDialog warning about meeting config impact
```

### Priority
High

### Complexity
Medium

### Dependencies
- Backend: `connectMeetingProviderOAuth`, `disconnectMeetingProviderOAuth` mutations available
- Backend: `myConnectedMeetingProviders` query returns token expiry info
- Frontend: OAuth redirect URL configuration in env
- i18n: Translation keys for OAuth flow messages (connecting, success, error, reconnect, disconnect warning)

---

## Requirement 6: Meeting URL Generation Feedback

### User Story
As a teacher/admin, I want clear visual feedback for meeting URL auto-generation states so that I know when URLs are ready, pending, or failed.

### Current State Analysis
- Auto-generation happens at booking time but no UI feedback
- No generation status query available in backend
- No manual re-generate action for failed instances
- No URL generation preview before booking
- `expiresAt` not populated for generated URLs

### Acceptance Criteria
- **AC-6.1**: Class meeting configs show generation status badge: `pending` (spinner), `generated` (green check), `failed` (red error with retry)
- **AC-6.2**: "Retry Generation" button for failed class instances (requires backend mutation)
- **AC-6.3**: URL generation preview in meeting config form — shows "Meeting URL will be auto-generated at booking time" callout
- **AC-6.4**: Generated URL displays with `expiresAt` timestamp and copy button
- **AC-6.5**: Admin settings tab shows provider-level generation health (success rate, avg generation time)
- **AC-6.6**: Real-time updates via Apollo cache or subscription when generation completes (if backend supports)
- **AC-6.7**: All status messages use translated labels via i18n system

### EARS Format
```
WHEN class meeting config auto-generation starts
THE system SHALL show pending status badge with spinner

WHEN auto-generation succeeds
THE system SHALL show generated badge with URL, expiresAt, and copy button

WHEN auto-generation fails
THE system SHALL show failed badge with error message and retry button

WHEN teacher views meeting config form
THE system SHALL show generation preview callout

WHEN admin views provider health
THE system SHALL show generation success rate and avg time metrics
```

### Priority
Medium

### Complexity
Medium-High

### Dependencies
- Backend enhancement needed: generation status query, manual re-generate mutation, `expiresAt` population
- Backend enhancement needed: provider-level generation metrics
- Frontend: Apollo cache update or subscription for real-time updates
- i18n: Translation keys for generation statuses and preview text

---

## Requirement 7: Mobile-Desktop Parity

### User Story
As a mobile user, I want full feature parity with desktop for all meeting-related views so that I can manage meeting providers and URLs on any device.

### Current State Analysis
- Settings tab uses raw components (no mobile variant)
- Profile meeting configs has mobile support but incomplete
- `MeetingJoinAction` works on mobile but lacks copy URL
- Data tables use `MobileCardList` but meeting URL status not integrated
- No responsive testing documented

### Acceptance Criteria
- **AC-7.1**: Settings tab — provider health cards use `MobileMetricCardGrid`, connected accounts use `MobileCardList`
- **AC-7.2**: Profile meeting configs — all dialogs, forms, lists work on mobile with proper touch targets (≥48dp)
- **AC-7.3**: Schedule grid / data tables — `MobileCardList` shows meeting URL status, copy/join actions
- **AC-7.4**: OAuth flow — mobile-optimized redirect (full-screen or popup based on device)
- **AC-7.5**: All touch targets meet WCAG 2.1 AA minimum (48x48dp)
- **AC-7.6**: Horizontal scrolling avoided — content stacks vertically on mobile
- **AC-7.7**: Tested on viewport widths: 375px (mobile), 768px (tablet), 1440px (desktop)

### EARS Format
```
WHEN user views meeting integrations settings on mobile
THE system SHALL render using MobileMetricCardGrid and MobileCardList

WHEN user views profile meeting configs on mobile
THE system SHALL render all dialogs, forms, lists with touch-friendly layout

WHEN user views schedule grid on mobile
THE system SHALL show meeting URL status and actions in MobileCardList

WHEN user initiates OAuth on mobile
THE system SHALL use mobile-optimized redirect flow

WHEN any meeting UI renders on mobile
THE system SHALL ensure touch targets ≥48dp and no horizontal scrolling
```

### Priority
High

### Complexity
Medium

### Dependencies
- Design system: `MobileMetricCardGrid`, `MobileCardList`, `MobileCard` components exist
- CSS: Responsive breakpoints defined in theme
- Testing: Mobile viewport testing required

---

## Requirement 8: Accessibility and i18n

### User Story
As a user with accessibility needs or Arabic locale, I want all meeting UI to be fully accessible and translated so that I can use the feature without barriers.

### Current State Analysis
- i18n system exists in `shared/locale/` but meeting namespaces may be incomplete
- Raw components may lack ARIA attributes
- Color contrast not verified for status badges
- Keyboard navigation not tested for all flows
- Error messages may not be translated

### Acceptance Criteria
- **AC-8.1**: All user-facing strings use compile-time translation system (`useAppTranslation`, `getTranslations`, `ctx.t`)
- **AC-8.2**: Translation namespaces complete for: `Dashboard.SettingsMeetingIntegrations`, `Ui.MeetingConfig` (profile meeting configs — existing namespace, keys already present), `Dashboard.MeetingUrlStatus`, `Dashboard.OAuthFlow`
- **AC-8.3**: Arabic (RTL) layout tested and working for all meeting views
- **AC-8.4**: All interactive elements have proper ARIA labels and roles
- **AC-8.5**: Status badges meet WCAG 2.1 AA color contrast (4.5:1 for text, 3:1 for UI components)
- **AC-8.6**: Keyboard navigation works for all dialogs, tables, forms (Tab, Enter, Escape, Arrow keys)
- **AC-8.7**: Focus management in dialogs — focus trapped, restored on close
- **AC-8.8**: Screen reader announcements for status changes (generation complete, OAuth connected, error)
- **AC-8.9**: No hardcoded colors — all from theme palette (`theme.palette.*`)
- **AC-8.10**: Error messages use `Alert` component with translated `severity="error"`

### EARS Format
```
WHEN any meeting UI renders
THE system SHALL use compile-time translation functions for all user-facing strings

WHEN user switches to Arabic locale
THE system SHALL render RTL layout correctly for all meeting views

WHEN user navigates with keyboard
THE system SHALL provide full keyboard access to all interactive elements

WHEN status changes (generation, OAuth, error)
THE system SHALL announce via live region for screen readers

WHEN error occurs
THE system SHALL show Alert with translated message and error severity
```

### Priority
High

### Complexity
Medium

### Dependencies
- i18n: Translation namespaces must be defined in `shared/locale/` for all meeting keys
- Design system: Theme palette colors meet contrast requirements
- Testing: axe-core or similar accessibility testing required

---

## UX/Navigation Requirements (MANDATORY SECTION)

### Routes (Existing — No New Routes)
| Route | Purpose | Access |
|-------|---------|--------|
| `/dashboard/settings?tab=meetingIntegrations` | Admin meeting providers management | `AppPermission.SettingsEditMeetingIntegrations` (write), `AppPermission.SettingsView` (read) |
| `/profile?tab=meeting` | Teacher meeting configs management | `AppPermission.MeetingConfigsManageOwn` (teacher), `AppPermission.MeetingConfigsManageOther` (admin); tab visibility also granted by `AppPermission.ProfileMeetingConfigsViewOwn` / `AppPermission.ProfileMeetingConfigsViewOther` (see `isMeetingTabVisible` in `frontend/common/views/dashboard/profile/core/profileTabs.ts`) |
| `/dashboard/schedule` | Teacher schedule with meeting URLs | Teacher role |
| `/dashboard` (student) | Student next class with meeting URL | Student role |
| `/dashboard` (parent) | Parent view of student meetings | Parent role |

### Sidebar Placement
- **Settings Tab**: Already registered in `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts` with `id: "meetingIntegrations"`, `icon: VideocamOutlined`, `labelKey: "meetingIntegrations"` (i18n key, NOT a literal label), `permissions: [AppPermission.SettingsEditMeetingIntegrations, AppPermission.SettingsView]` (plural array — both write and read perms)
- **No new sidebar item** — meeting providers accessed via settings tab only
- **Profile tab**: Registered with `id: "meeting"` and `i18nKey: "shell.tabs.meeting"` (NOT an inline `permission` field). Tab visibility is computed at runtime by `isMeetingTabVisible` in `frontend/common/views/dashboard/profile/core/profileTabs.ts`: it returns `true` when the user has **either** the view permission (`AppPermission.ProfileMeetingConfigsViewOwn` for own scope / `AppPermission.ProfileMeetingConfigsViewOther` for other scope) **OR** the manage permission (`AppPermission.MeetingConfigsManageOwn` for own scope / `AppPermission.MeetingConfigsManageOther` for other scope). The plan must NOT narrow visibility to `MEETING_CONFIGS_MANAGE_OWN` alone
- **Profile tab audience prerequisite**: The profile meeting tab has an audience prerequisite — `TAB_VISIBILITY` record gates the meeting tab to `["TEACHER-OWN", "TEACHER-OTHER", "PARENT-OWN", "PARENT-OTHER"]` audiences. The `isMeetingTabVisible` function checks this in addition to permissions.

### Role-Based Access Matrix

| Feature | SUPER_ADMIN | ACADEMY_ADMIN | SUPERVISOR | TEACHER | PARENT | STUDENT | STAFF |
|---------|-------------|---------------|------------|---------|--------|---------|-------|
| Settings tab (view) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Settings tab (edit) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Connect provider (settings) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Revoke token (settings) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Profile meeting configs | ✅ | ✅ | ❌ | ✅ (own) | ❌ | ❌ | ❌ |
| Create/edit own configs | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage class configs | ✅ | ✅ | ❌ | ✅ (own classes) | ❌ | ❌ | ❌ |
| Copy meeting URL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Join meeting | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View student URLs (parent) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |

**NOTE**: `SETTINGS_EDIT_MEETING_INTEGRATIONS` enum value exists but is not yet seeded to any group. The Settings tab (edit) ✅ in the matrix reflects the intended permission once a seed is added; the backend guard at `app/(dashboard)/settings/page.tsx` must also be updated to include this permission when implementing.

### Per-Audience Rendering

#### Admin (SUPER_ADMIN, ACADEMY_ADMIN)
- Settings tab: Full CRUD on providers, connected accounts, credentials, health monitoring
- Cross-link to profile meeting configs
- Provider catalog management (separate permission: `AppPermission.MeetingProvidersManageCatalog`)

#### Teacher
- Profile meeting configs: Connect/disconnect OAuth, manage own meeting configs, class meeting configs
- Schedule grid: View/copy/join meeting URLs for own classes
- Reauth prompts for own providers

#### Parent
- Student dashboard: View upcoming meeting URLs for children, copy/join
- No config management

#### Student
- Next class card: Join meeting, copy URL
- No config management

#### Supervisor/Staff
- Settings tab: View-only
- Profile: View-only (if permitted)

### Mobile vs Desktop Variants

| View | Desktop Component | Mobile Component |
|------|-------------------|------------------|
| Settings: Provider Health | `DesktopMetricCardGrid` | `MobileMetricCardGrid` |
| Settings: Connected Accounts | `DesktopAppDataGrid` | `MobileCardList` |
| Settings: Credential Forms | `EntityFormDialogActions` (full-width dialog) | `EntityFormDialogActions` (full-screen dialog) |
| Profile: Provider Cards | `DesktopMetricCardGrid` | `MobileMetricCardGrid` |
| Profile: Meeting Configs List | `DesktopAppDataGrid` | `MobileCardList` |
| Profile: Config Form Dialog | `EntityFormDialogActions` | `EntityFormDialogActions` (full-screen) |
| Schedule Grid | `DesktopAppDataGrid` | `MobileCardList` |
| Student Next Class | Card layout | Card layout (stacked) |
| Parent Dashboard | `DesktopAppDataGrid` | `MobileCardList` |

### Responsive Breakpoints (from Theme)
- Mobile: `< 600px`
- Tablet: `600px - 900px`
- Desktop: `> 900px`

---

## Non-Functional Requirements

### Performance
- **NFR-1**: Lazy-load all meeting-related components (`React.lazy` + `Suspense`)
- **NFR-2**: Apollo queries use `fetchPolicy: 'cache-first'` with appropriate cache keys
- **NFR-3**: No N+1 queries — batch provider health checks, connected accounts, meeting configs
- **NFR-4**: Virtualized lists for large data sets (`DesktopAppDataGrid` uses virtualization)
- **NFR-5**: OAuth redirect completes in <3s (network dependent)

### Security
- **NFR-6**: All mutations check permissions on backend (not just frontend)
- **NFR-7**: OAuth tokens never exposed in client — only backend stores encrypted tokens
- **NFR-8**: Meeting URLs are signed/short-lived — `expiresAt` enforced
- **NFR-9**: CSRF protection on OAuth callback endpoint
- **NFR-10**: Rate limiting on OAuth initiation and test connection endpoints

### Usability
- **NFR-11**: Loading states for all async actions (skeleton for lists, spinner for buttons)
- **NFR-12**: Error states show translated message with retry action where applicable
- **NFR-13**: Empty states show helpful illustration + action button (e.g., "Connect your first provider")
- **NFR-14**: Toast notifications for all user actions (success, error, info) using `useNotifications()`
- **NFR-15**: Keyboard shortcuts: `Cmd/Ctrl+K` for search in data tables

### Reliability
- **NFR-16**: Error boundaries around each major meeting section
- **NFR-17**: Retry mechanism for failed mutations (exponential backoff, max 3 retries)
- **NFR-18**: Optimistic updates for connect/disconnect/revoke with rollback on error
- **NFR-19**: Offline detection — show banner when network unavailable
- **NFR-20**: Test coverage ≥80% for new components, 100% for critical paths (OAuth, URL generation)

---

## Dependencies and Assumptions

### Backend Dependencies (Must Be Available)
1. `meetingIntegrationProviders` query — provider catalog with health status
2. `meetingIntegrationConnectedAccounts` query — admin view of all connections
3. `myConnectedMeetingProviders` query — teacher's connected providers with token expiry
4. `userMeetingConfigs` query — teacher's meeting configs
5. `classMeetingConfigs` query — class-level meeting configs with generation status
6. `recurringMeetingConfigs` query — recurring meeting configs
7. `testMeetingProviderConnection` mutation
8. `adminRevokeMeetingProviderToken` mutation
9. `connectMeetingProviderOAuth` mutation — returns OAuth URL
10. `disconnectMeetingProviderOAuth` mutation
11. `generateMeetingUrl` mutation
12. `createUserMeetingConfig`, `updateUserMeetingConfig`, `deleteUserMeetingConfig`, `setDefaultMeetingConfig` mutations

### Backend Enhancements Needed (Out of Scope for This Plan)
- Generation status query for class instances (pending/success/failed)
- Manual re-generate mutation for failed class instances
- `expiresAt` population for generated meeting URLs
- Provider-level generation metrics (success rate, avg time)
- Real-time subscription for generation progress
- Class-instance generation error field

### Frontend Dependencies (Existing)
- `DesktopMetricCardGrid` in `frontend/desktop/components/ui/card/MetricCardGrid/DesktopMetricCardGrid.tsx`
- `MobileMetricCardGrid` in `frontend/mobile/components/ui/card/MobileMetricCardGrid.tsx`
- `DesktopAppDataGrid` in `frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid.tsx`
- `MobileCardList` in `frontend/mobile/components/ui/container/MobileCardList.tsx`
- `BaseDeleteDialog` in `frontend/common/components/ui/dialog/BaseDeleteDialog.tsx` (singular `dialog/`)
- `EntityFormDialogActions` in `frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions.tsx` (feature-specific, NOT in shared `components/ui/`)
- `MeetingJoinAction` in `frontend/common/components/ui/display/meetingConfig/MeetingJoinAction.tsx` (plus `.desktop.tsx` / `.mobile.tsx` variants)
- `useNotifications` from `@toolpad/core/useNotifications` (subpath import, NOT bare `@toolpad/core`)
- `useAppTranslation` from `@/shared/locale/client`
- Theme palette — accessed via `sx={(theme) => ({ color: theme.palette.primary.main })}` pattern (no standalone `frontend/theme/` directory)
- Settings tabs config in `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts`
- Profile tabs in `frontend/common/views/dashboard/profile/core/profileTabs.ts`

### i18n Namespaces Required
- `Dashboard.SettingsMeetingIntegrations` — settings tab
- `Ui.MeetingConfig` — profile meeting configs (existing namespace, keys already present in `shared/locale/`)
- `Dashboard.MeetingUrlStatus` — URL status badges (pending, generated, failed, expired)
- `Dashboard.OAuthFlow` — OAuth messages (connecting, success, error, reconnect, disconnect)
- `Dashboard.MeetingGeneration` — generation preview, retry, metrics

### Assumptions
1. Next.js 16 App Router with `[locale]` routing is used
2. Bun is the runtime (not Node.js)
3. MUI v9 with `sx` prop for styling
4. React 19 with `React.SubmitEvent` for forms
5. Apollo Client v4 with React hooks from `@apollo/client/react`
6. Zustand for client state
7. Drizzle ORM + Pothos GraphQL on backend
8. Custom compile-time i18n system in `shared/locale/`
9. Quality gate (`bun quality-gate`) must pass for all changes

---

## Implementation Order (Recommended)

1. **Requirement 1** — Settings Tab Component Compliance (foundation for admin UX)
2. **Requirement 5** — OAuth Connection UX Flow (core teacher flow)
3. **Requirement 2** — Profile Meeting Configs Enhancement (teacher self-service)
4. **Requirement 4** — Cross-Navigation (connects admin ↔ teacher views)
5. **Requirement 3** — Meeting URL Display in Data Tables (visibility across roles)
6. **Requirement 6** — Meeting URL Generation Feedback (status transparency)
7. **Requirement 7** — Mobile-Desktop Parity (responsive polish)
8. **Requirement 8** — Accessibility and i18n (quality baseline)

---

## Verification Checklist

Each requirement must pass:
- [ ] TypeScript compiles (`bun tsgo`)
- [ ] Biome checks pass (`bun biome:check`)
- [ ] Lint passes via queue (`bun run lint` or lint queue client)
- [ ] CodeScene health check passes (`bun run codescene --file <path>`)
- [ ] Unit tests pass (`bun run test:ui:components` for UI, `bun run test:db` for backend)
- [ ] E2E tests pass (`bun run test:ui:e2e` after `bun run build:test`)
- [ ] Manual QA on mobile (375px), tablet (768px), desktop (1440px)
- [ ] Arabic RTL layout verified
- [ ] Accessibility audit (axe-core) passes
- [ ] All user-facing strings translated (no hardcoded English/Arabic)

---

*End of Requirements Document*