# Story 5 — Patch Plan: Missing Core Sections & Tasks

## Purpose

This patch addresses core gaps in the original plan (`.kilo/plans/done/story-5-permissions-alerts-availability.md`) measured against the planning instructions in `.ai/AGENTS_UI_TEST_PLANNNIG.md`. The original plan's implementation (Tasks A–H) is **fully deployed** — all backend, GraphQL, frontend, and i18n files exist and work. This patch adds only what was structurally missing: code defect fixes, test coverage tasks, and required plan sections.

**Scope:** Core parts only — no formatting or representation changes.

---

## Section 0: Verified Current State

All Story 5 implementation files confirmed present:

| Layer | File | Status |
|-------|------|--------|
| Enum | `shared/lib/enum.ts` — `NOTIFICATION_VIEW_ALERTS`, `BILLING_VIEW_UNPAID_INVOICES`, `USER_VIEW_PROFILE` | ✅ Exists (lines 466-468) |
| Migration | `backend/db/migration/3-system_permissions_and_groups.sql` — permission seeds | ✅ Exists |
| Repository | `backend/db/repo/billing.repository.ts` — `getUnpaidInvoicesSummary()` | ✅ Exists |
| Repository | `backend/db/repo/teacher-availability.repository.ts` — `searchCrossStaffAvailability()` | ✅ Exists |
| Types | `backend/types/billing.types.ts`, `backend/types/teacher-availability.types.ts` | ✅ Exists |
| Service | `backend/services/notification/notification-alerts.service.ts` | ✅ Exists (has defect) |
| Service | `backend/services/billing/billing-alerts.service.ts` | ✅ Exists |
| Service | `backend/services/schedule/availability-search.service.ts` | ✅ Exists (has defect) |
| Pothos | `backend/graphql/pothos/notification-alerts.pothos.ts` | ✅ Exists |
| Pothos | `backend/graphql/pothos/billing-alerts.pothos.ts` | ✅ Exists |
| Pothos | `backend/graphql/pothos/availability-search.pothos.ts` | ✅ Exists |
| Query | `backend/graphql/query/availability-search.query.ts` | ✅ Exists |
| Apollo Doc | `frontend/graphql/sharedDocuments/notification-alerts.documents.ts` | ✅ Exists |
| Apollo Doc | `frontend/graphql/sharedDocuments/billing-alerts.documents.ts` | ✅ Exists |
| Apollo Doc | `frontend/graphql/sharedDocuments/availability-search.documents.ts` | ✅ Exists |
| View | `frontend/views/dashboard/components/navbar/NotificationPanel.tsx` | ✅ Exists |
| View | `frontend/views/dashboard/components/navbar/UnpaidInvoicesSection.tsx` | ✅ Exists |
| View | `frontend/views/dashboard/search-schedule/SearchScheduleContainer.tsx` | ✅ Exists |
| View | `frontend/views/dashboard/search-schedule/SearchScheduleForm.tsx` | ✅ Exists |
| View | `frontend/views/dashboard/search-schedule/SearchScheduleView.tsx` | ✅ Exists |
| View | `frontend/views/dashboard/search-schedule/TeacherAvailabilityGrid.tsx` | ✅ Exists |
| View | `frontend/views/dashboard/users/billing-profile/UserBillingProfileView.tsx` | ✅ Exists |
| Story | `frontend/views/dashboard/search-schedule/SearchScheduleContainer.stories.tsx` | ✅ Exists |
| Route | `app/[locale]/(dashboard)/search-schedule/page.tsx` | ✅ Exists |
| Route | `app/[locale]/(dashboard)/users/[id]/billing-profile/page.tsx` | ✅ Exists |
| Nav | `frontend/views/dashboard/config/navigationConfig.ts` — search-schedule item | ✅ Exists (line 27) |
| i18n EN | `shared/messages/en.ts` — `searchSchedule`, `notifications` sections | ✅ Exists |
| i18n AR | `shared/messages/ar/dashboard/core/search.schedule.ts` | ✅ Exists |
| i18n AR | `shared/messages/ar/dashboard/core/notifications.ts` | ✅ Exists |
| i18n Types | `shared/messages/types/dashboard/core/search.schedule.ts` | ✅ Exists |
| i18n Types | `shared/messages/types/dashboard/core/notifications.ts` | ✅ Exists |

**Test coverage status:**

| Test File | Status |
|-----------|--------|
| `test/ui/components/UserBillingProfileView.test.tsx` | ✅ Exists (created post-plan) |
| `test/ui/components/NotificationPanel.test.tsx` | ❌ Missing |
| `test/ui/components/UnpaidInvoicesSection.test.tsx` | ❌ Missing |
| `test/ui/components/SearchScheduleContainer.test.tsx` | ❌ Missing |
| `test/ui/e2e/notifications-billing.test.ts` | ❌ Missing |
| `test/ui/e2e/availability-search.test.ts` | ❌ Missing |
| `test/manual/scenario/notifications/*.md` | ❌ Missing |
| `test/manual/scenario/admin-dashboard/availability-search.md` | ❌ Missing |
| `test/manual/scenario/users/billing-profile.md` | ❌ Missing |

---

## Section 1: Code Defect Fixes (P0)

Two implementation defects violate the plan's own rules and must be fixed before test tasks can be authored.

### Task P1 — Fix Hardcoded Strings in NotificationAlertsService

**Status:** Pending

**Objective:** Replace 2 hardcoded English strings in `notification-alerts.service.ts` with localized translations via `getBackendTranslations`, as required by the plan's Section 1.5 (Localization) and the backend service layer AGENTS.md.

**Layer-Specific Rules (Backend Services — Flattened from `backend/services/AGENTS.md`):**
- i18n: All user-facing error messages, alerts, and feedback MUST be translated using `getBackendTranslations`, accepting `locale?: string`.
- Hardcoded strings for exceptions or responses are forbidden.
- Services are domain-driven — one service per domain.

**Input Sources (What to Read):**
- `backend/services/notification/notification-alerts.service.ts` — lines 64 and 75 with hardcoded strings
- `shared/messages/en.ts` — existing notification keys at `dashboard.core.notifications.*`
- `shared/messages/ar/dashboard/core/notifications.ts` — Arabic translations
- `shared/messages/types/dashboard/core/notifications.ts` — type definitions

**Target Files:**
- `backend/services/notification/notification-alerts.service.ts` (modify)
- `shared/messages/en.ts` (modify — add 2 new keys)
- `shared/messages/ar/dashboard/core/notifications.ts` (modify — add 2 new Arabic keys)
- `shared/messages/types/dashboard/core/notifications.ts` (modify — add 2 new type keys)

**Action Plan:**

*Step 1: Add i18n keys to English messages*

In `shared/messages/en.ts`, inside the `notifications` object under `dashboard.core`, add:

```typescript
newUnansweredComplaint: "New Unanswered Complaint",
defaultSystemNotification: "System Notification",
```

*Step 2: Add Arabic translations*

In `shared/messages/ar/dashboard/core/notifications.ts`, add the Arabic equivalents:

```typescript
newUnansweredComplaint: "شكوى جديدة غير مجاب عليها",
defaultSystemNotification: "إشعار النظام",
```

*Step 3: Add type definitions*

In `shared/messages/types/dashboard/core/notifications.ts`, add the 2 new keys to the notification messages type interface.

*Step 4: Wire translations into the service*

In `backend/services/notification/notification-alerts.service.ts`, the `getAlerts` method already receives `locale` but only uses it for the `errors` namespace. Add a second translation lookup for the `dashboard.core.notifications` namespace:

```typescript
// Before the for-loops that build alerts, add:
const tNotifications = await getBackendTranslations({ locale, namespace: "dashboard.core.notifications" });
```

Then replace:
- Line 64: `title: "New Unanswered Complaint"` → `title: tNotifications("newUnansweredComplaint")`
- Line 75: `title: notification.title ?? "System Notification"` → `title: notification.title ?? tNotifications("defaultSystemNotification")`

**Test Execution Requirements:**
```bash
bun run test:db
bun tsgo
```
Expected: All existing tests still pass, TypeScript compiles cleanly.

**Completion Criteria:**
- [ ] No hardcoded English strings remain in `notification-alerts.service.ts`
- [ ] Both `en.ts` and `ar/` have the 2 new keys
- [ ] Type definitions updated
- [ ] `bun tsgo` passes with 0 errors

---

### Task P2 — Fix Unsafe `as Gender` Cast in AvailabilitySearchService

**Status:** Pending

**Objective:** Replace the unchecked `input.gender as Gender` cast with a proper type guard function, as required by the plan's Section 1.2 (Type Safety — NO casts, narrow using type guards).

**Layer-Specific Rules (Backend Services — Flattened from `backend/services/AGENTS.md`):**
- Type safety: No blind casts. Use type narrowing via type guard functions.
- Business logic centralization: Validation belongs in the service layer.

**Input Sources (What to Read):**
- `backend/services/schedule/availability-search.service.ts` — line 22 with the cast
- `shared/lib/enum.ts` — `Gender` enum definition (only `MALE` and `FEMALE`)

**Target Files:**
- `backend/services/schedule/availability-search.service.ts` (modify)

**Action Plan:**

*Step 1: Add a type guard function*

Add at the top of `availability-search.service.ts` (after imports, before the namespace):

```typescript
function isGender(value: string): value is Gender {
  return value === Gender.MALE || value === Gender.FEMALE;
}
```

*Step 2: Replace the cast with the guard*

Replace line 22:
```typescript
const genderFilter = input.gender ? (input.gender as Gender) : null;
```

With:
```typescript
const genderFilter = input.gender && isGender(input.gender) ? input.gender : null;
```

This safely narrows the string to a valid `Gender` enum value. Invalid values (typos, unexpected strings) fall through to `null` instead of being blindly cast.

**Test Execution Requirements:**
```bash
bun tsgo
bun run test:db
```
Expected: TypeScript compiles cleanly, all existing tests pass.

**Completion Criteria:**
- [ ] No `as Gender` cast remains in the file
- [ ] Type guard `isGender()` validates against actual enum values
- [ ] `bun tsgo` passes with 0 errors

---

## Section 2: Test Integrity Threats & Mitigations (P2)

This section was entirely missing from the original plan. Per the AGENTS guide Section 6.5, each threat must include the current gap, risk, and concrete fix.

### Threat 1: State Leakage Between Component Tests

**Current Gap:** `useUserStore.setState()` sets permissions but tests may not reset them in `afterEach`.
**Risk:** Test B inherits Test A's permissions, causing false passes for permission-gated Story 5 features (notification bell, billing section, search page).
**Fix in every component test file:**

```typescript
import { afterEach } from "bun:test";
import { useUserStore } from "@/frontend/stores/userStore";

afterEach(() => {
  useUserStore.setState({ permissions: [] }, false);
});
```

The `false` parameter prevents full state replacement — only the `permissions` field is reset.

### Threat 2: Dual-Query Mocking in NotificationPanel

**Current Gap:** `NotificationPanel` fires TWO GraphQL queries simultaneously: `notificationAlerts` (parent component) and `unpaidInvoicesAlert` (child `UnpaidInvoicesSection`). If MockedProvider only mocks one, the other silently fails with a network error.
**Risk:** Tests appear to pass but the billing section renders an error state instead of data, masking real bugs.
**Fix:** Every `NotificationPanel` test must include mocks for BOTH queries in the MockedProvider:

```typescript
const mocks = [
  { request: { query: notificationAlertsQueryDocument }, result: { data: mockAlertsData } },
  { request: { query: unpaidInvoicesAlertQueryDocument }, result: { data: mockBillingData } },
];
```

### Threat 3: Popover Timing in Notification Panel Tests

**Current Gap:** `NotificationPanel` renders inside a MUI `Popover`, which uses portals and CSS transitions. `@testing-library/react` may query the DOM before the portal renders.
**Risk:** `screen.queryByText("Notifications")` returns null even though the panel would render correctly in a real browser.
**Fix:** Use `findBy*` queries (async) instead of `getBy*` for content inside the popover, or render `NotificationPanel` directly without the Popover wrapper in component tests (test the panel content, not the portal mechanism).

### Threat 4: Missing afterEach Cleanup in E2E Tests

**Current Gap:** Browser contexts created in E2E tests may not be closed in `afterEach`.
**Risk:** Memory leaks, port exhaustion, and state contamination between tests. The notification bell's visibility depends on permissions — leaked auth cookies from a prior test could show the bell for a Teacher role.
**Fix in every E2E test file:**

```typescript
let context: BrowserContext;

afterEach(async () => {
  if (context) await context.close();
});
```

### Threat 5: Hardcoded Seed Data IDs in Billing Tests

**Current Gap:** Unpaid invoice tests may reference specific user IDs from seed data.
**Risk:** Tests break when seed data is regenerated with different UUIDs.
**Fix:** Extract user IDs dynamically from the rendered billing section rather than hardcoding them:

```typescript
const firstUserRow = screen.getByText("Ahmed Mohamed");
expect(firstUserRow).toBeVisible();
```

### Threat 6: Cross-Layer Import Contamination

**Current Gap:** No enforcement prevents component tests from importing E2E helpers or vice versa.
**Risk:** Component test accidentally imports a Playwright helper that pulls in browser globals, causing happy-dom conflicts.
**Fix:** Verified via the final verification protocol (Section 4):
```bash
rg "from.*test/ui/e2e" test/ui/components/
rg "from.*test/ui/components" test/ui/e2e/
# Expected: empty output for both
```

---

## Section 3: Manual Test Scenarios (P1)

### Task P3 — Author Notification Panel & Billing Alerts Manual Scenario

**Status:** Pending

**Objective:** Create the manual test scenario file that serves as the authoritative input source for both the `NotificationPanel` component test and the notifications E2E test.

**Input Sources (What to Read):**
- `frontend/views/dashboard/components/navbar/NotificationPanel.tsx` — component under test
- `frontend/views/dashboard/components/navbar/UnpaidInvoicesSection.tsx` — billing section
- `frontend/views/dashboard/components/navbar/NotificationButton.tsx` — bell button with popover
- `shared/messages/en.ts` — `dashboard.core.notifications.*` keys
- `test/manual/scenario/` — existing scenario files for format reference

**Target Files:**
- `test/manual/scenario/notifications/notification-panel-billing-alerts.md` (new)

**Action Plan:**

1. Create directory `test/manual/scenario/notifications/`
2. Create the scenario file with:
   - **Feature summary**: Notification bell dropdown with system alerts and unpaid invoices billing section
   - **Roles tested**: Admin (full access), Teacher (no access), Student (no access)
   - **Desktop test cases** with step/action/expected tables:
     - TC-1: Admin sees bell icon with badge
     - TC-2: Click bell opens popover with alerts list
     - TC-3: Billing section shows unpaid invoices count
     - TC-4: Click user row navigates to billing profile
     - TC-5: Empty state when no alerts and no unpaid invoices
     - TC-6: Teacher role does NOT see bell icon
   - **Mobile test cases**:
     - TC-7: Bell icon visible in mobile navbar
     - TC-8: Popover renders as full-width dropdown on mobile
   - **Mermaid flow diagram** showing: Bell click → popover → alerts section → billing section → user click → billing profile page

**Test Execution Requirements:** N/A (documentation task)

**Completion Criteria:**
- [ ] Scenario file exists with 8 test cases
- [ ] Each test case has step/action/expected table
- [ ] Mermaid flow diagram included
- [ ] Permission gates documented for each role

---

### Task P4 — Author Availability Search Manual Scenario

**Status:** Pending

**Objective:** Create the manual test scenario for the schedule availability search feature.

**Input Sources (What to Read):**
- `frontend/views/dashboard/search-schedule/SearchScheduleContainer.tsx`
- `frontend/views/dashboard/search-schedule/SearchScheduleForm.tsx`
- `frontend/views/dashboard/search-schedule/SearchScheduleView.tsx`
- `frontend/views/dashboard/search-schedule/TeacherAvailabilityGrid.tsx`
- `frontend/views/dashboard/config/navigationConfig.ts` — nav item
- `test/manual/scenario/` — existing scenario format reference

**Target Files:**
- `test/manual/scenario/admin-dashboard/availability-search.md` (new)

**Action Plan:**

1. Create the scenario file with:
   - **Feature summary**: Cross-staff availability search with weekly calendar grid results
   - **Roles tested**: Admin (access), Teacher (no access)
   - **Desktop test cases**:
     - TC-1: Nav item "Schedule Search" visible in sidebar for Admin
     - TC-2: Search form renders with From/To time inputs and Gender filter
     - TC-3: Form submission triggers query and shows loading spinner
     - TC-4: Results render per-teacher weekly grids with highlighted gap slots
     - TC-5: Gender filter narrows results to matching teachers
     - TC-6: Empty state when no matching teachers found
     - TC-7: Teacher role does NOT see nav item
   - **Mobile test cases**:
     - TC-8: Form stacks vertically on mobile
     - TC-9: Weekly grid scrolls horizontally on mobile
   - **Mermaid flow diagram**: Nav click → page render → form fill → submit → loading → results grid

**Test Execution Requirements:** N/A (documentation task)

**Completion Criteria:**
- [ ] Scenario file exists with 9 test cases
- [ ] Each test case has step/action/expected table
- [ ] Mermaid flow diagram included

---

### Task P5 — Author User Billing Profile Manual Scenario

**Status:** Pending

**Objective:** Create the manual test scenario for the user billing profile drill-down page.

**Input Sources (What to Read):**
- `frontend/views/dashboard/users/billing-profile/UserBillingProfileView.tsx`
- `app/[locale]/(dashboard)/users/[id]/billing-profile/page.tsx`
- `test/manual/scenario/` — existing scenario format reference
- `test/ui/components/UserBillingProfileView.test.tsx` — existing component test (for alignment)

**Target Files:**
- `test/manual/scenario/users/billing-profile.md` (new)

**Action Plan:**

1. Create directory `test/manual/scenario/users/`
2. Create the scenario file with:
   - **Feature summary**: User billing profile page accessed from unpaid invoices alert
   - **Desktop test cases**:
     - TC-1: Admin can access `/users/[id]/billing-profile` route
     - TC-2: Page renders with billing profile title
     - TC-3: Invalid user ID shows error message
     - TC-4: Teacher role sees access denied
   - **Mermaid flow diagram**: Notification panel → click user row → navigate → billing profile render

**Test Execution Requirements:** N/A (documentation task)

**Completion Criteria:**
- [ ] Scenario file exists with 4 test cases
- [ ] Permission gates documented
- [ ] Mermaid flow diagram included

---

## Section 4: Component Tests (P1)

### Task P6 — NotificationPanel.test.tsx

**Status:** Pending

**Objective:** Verify the notification panel dropdown renders alerts correctly, shows billing section for authorized users, and handles loading/error/empty states.

**Layer-Specific Rules (Component Tests — Flattened from Section 4.A of AGENTS guide):**
- DOM Environment: `happy-dom` registered via `bunfig.toml` preload.
- Rendering: `@testing-library/react` with `render()` and `screen` queries.
- Interactions: `@testing-library/user-event` for `click()`, `type()`.
- Apollo Mocking: `MockedProvider` from `@apollo/client/testing`. Mock ALL queries the component fires.
- Store Seeding: `useUserStore.setState()` to set permissions before rendering. Reset in `afterEach`.
- Assertions: `@testing-library/jest-dom` matchers: `toBeVisible()`, `toBeInTheDocument()`, `toHaveTextContent()`.
- Only `"use client"` components can be tested.
- Permission enums: Import from `frontend/graphql/generated/gql/graphql-types.ts`.

**Input Sources (What to Read):**
- `frontend/views/dashboard/components/navbar/NotificationPanel.tsx` — component under test
- `frontend/views/dashboard/components/navbar/UnpaidInvoicesSection.tsx` — child component
- `frontend/graphql/sharedDocuments/notification-alerts.documents.ts` — query document for mocking
- `frontend/graphql/sharedDocuments/billing-alerts.documents.ts` — query document for mocking
- `test/manual/scenario/notifications/notification-panel-billing-alerts.md` — manual scenario (created in Task P3)
- `frontend/stores/userStore.ts` — store shape for permission seeding

**Target Files:**
- `test/ui/components/NotificationPanel.test.tsx` (new)

**Action Plan:**

1. Create test file with imports: `NotificationPanel`, `AppPermission`, `MockedProvider`, `screen`, `render`, `userEvent`, `useUserStore`
2. Set up `renderWithWrapper()` helper that wraps component in `MockedProvider` + `NextIntlClientProvider` + `ThemeProvider`
3. Define mock data shapes matching the GraphQL response types
4. Write test cases:

   - **"shows loading spinner while fetching alerts"**: Mock queries with `delay: 100`, render, assert `CircularProgress` role is visible
   - **"renders alerts list when data loads"**: Mock with 2 alerts (1 complaint, 1 notification), assert alert titles visible
   - **"shows error message when query fails"**: Mock with error result, assert error text visible
   - **"renders empty state when no alerts"**: Mock with empty alerts array, assert "no alerts" text visible
   - **"renders billing section when user has BillingViewUnpaidInvoices"**: Seed store with `BillingViewUnpaidInvoices`, mock both queries, assert "Unpaid Invoices" section header visible
   - **"hides billing section when user lacks BillingViewUnpaidInvoices"**: Seed store with only `NotificationViewAlerts`, assert billing section is NOT visible
   - **"shows unread count badge when unread notifications exist"**: Mock with unreadCount > 0, assert badge number visible

5. Each test seeds permissions via `useUserStore.setState({ permissions: [AppPermission.NotificationViewAlerts, AppPermission.BillingViewUnpaidInvoices] }, false)` in setup
6. `afterEach` resets: `useUserStore.setState({ permissions: [] }, false)`

**Test Execution Requirements:**
```bash
bun run test:ui:components
```
Expected: 7 tests pass, 0 failures.

**Completion Criteria:**
- [ ] 7 test cases pass
- [ ] Both `notificationAlerts` and `unpaidInvoicesAlert` queries mocked in every test
- [ ] No hardcoded permission strings
- [ ] `afterEach` resets store state

---

### Task P7 — UnpaidInvoicesSection.test.tsx

**Status:** Pending

**Objective:** Verify the unpaid invoices section renders overdue invoice items with user names, handles empty state, and user rows navigate to billing profile when clicked.

**Layer-Specific Rules (Component Tests — Flattened from Section 4.A):**
- Same rules as Task P6.
- Router mocking: `mock.module("next/navigation")` for `useRouter`.
- User interactions: `userEvent.click()` for testing navigation on user rows.

**Input Sources (What to Read):**
- `frontend/views/dashboard/components/navbar/UnpaidInvoicesSection.tsx` — component under test
- `frontend/graphql/sharedDocuments/billing-alerts.documents.ts` — query document
- `test/manual/scenario/notifications/notification-panel-billing-alerts.md` — manual scenario
- `frontend/components/auth/RequirePermission.tsx` — permission gate behavior

**Target Files:**
- `test/ui/components/UnpaidInvoicesSection.test.tsx` (new)

**Action Plan:**

1. Create test file with proper imports
2. Mock `next/navigation` router:
   ```typescript
   const mockPush = mock.fn();
   mock.module("next/navigation", () => ({
     useRouter: () => ({ push: mockPush }),
     useParams: () => ({ locale: "en" }),
   }));
   ```
3. Write test cases:

   - **"shows loading text while fetching invoices"**: Mock with delay, assert loading text visible
   - **"shows 'no unpaid invoices' message when totalOverdueInvoices is 0"**: Mock empty summary, assert the no-invoices message visible
   - **"renders invoice items with user names and amounts"**: Mock with 2 items (different users, different amounts), assert user names and amounts visible
   - **"shows overdue count badge"**: Mock with totalOverdueInvoices > 0, assert badge with count visible
   - **"clicking user row navigates to billing profile"**: Mock with items, click first user row, assert `mockPush` called with correct path containing userId
   - **"user rows are not clickable without UserViewProfile permission"**: Seed store without `UserViewProfile`, assert `RequirePermission` hides the clickable button

4. `afterEach`: Reset store + clear mock call history

**Test Execution Requirements:**
```bash
bun run test:ui:components
```
Expected: 6 tests pass, 0 failures.

**Completion Criteria:**
- [ ] 6 test cases pass
- [ ] Router mock correctly intercepts navigation calls
- [ ] Permission gating verified for user row clickability
- [ ] No hardcoded permission strings

---

### Task P8 — SearchScheduleContainer.test.tsx

**Status:** Pending

**Objective:** Verify the search schedule container renders the form, triggers queries on submission, displays results, and gates the entire page behind `ScheduleSearchAvailability` permission.

**Layer-Specific Rules (Component Tests — Flattened from Section 4.A):**
- Same rules as Tasks P6/P7.
- Form interactions require `userEvent` for typing and clicking.
- Query skip behavior: `useQuery` with `skip: !searchInput` should not fire until form submitted.

**Input Sources (What to Read):**
- `frontend/views/dashboard/search-schedule/SearchScheduleContainer.tsx` — component under test
- `frontend/views/dashboard/search-schedule/SearchScheduleForm.tsx` — form sub-component
- `frontend/views/dashboard/search-schedule/SearchScheduleView.tsx` — results sub-component
- `frontend/views/dashboard/search-schedule/TeacherAvailabilityGrid.tsx` — grid sub-component
- `frontend/graphql/sharedDocuments/availability-search.documents.ts` — query document
- `test/manual/scenario/admin-dashboard/availability-search.md` — manual scenario

**Target Files:**
- `test/ui/components/SearchScheduleContainer.test.tsx` (new)

**Action Plan:**

1. Create test file with imports
2. Write test cases:

   - **"hides entire page when user lacks ScheduleSearchAvailability"**: Seed store empty, render, assert page title NOT visible
   - **"renders page title and search form when permission granted"**: Seed with `ScheduleSearchAvailability`, assert "Schedule Availability Search" heading and form inputs visible
   - **"does not fire query before form submission"**: Seed with permission, render, assert no loading spinner (query skipped)
   - **"shows loading spinner during query after form submit"**: Seed permission, mock query with delay, fill form, click search, assert CircularProgress visible
   - **"renders teacher results with weekly grids after query resolves"**: Mock with teacher data (1 teacher, gaps on Monday/Wednesday), assert teacher name visible and gap times visible
   - **"shows 'no results' message when query returns empty"**: Mock with empty teachers array, assert "no available time slots" text visible
   - **"shows error message when query fails"**: Mock with error, assert error text visible
   - **"gender filter passes correct value to query"**: Select "Female" from dropdown, submit form, assert mock received `gender: "FEMALE"` in variables

3. Mock data shape must match `SearchTeacherAvailabilityQuery` type:
   ```typescript
   const mockResult = {
     data: {
       searchTeacherAvailability: {
         id: "search-08:00-17:00",
         totalGaps: 3,
         teachers: [{
           id: "teacher-1",
           name: "Ahmed",
           gender: "MALE",
           timezone: "Africa/Cairo",
           gaps: [
             { id: "g1", teacherId: "teacher-1", teacherName: "Ahmed", teacherGender: "MALE", dayOfWeek: "MONDAY", gapStartTime: "09:00", gapEndTime: "11:00", timezone: "Africa/Cairo" },
           ],
         }],
       },
     },
   };
   ```

**Test Execution Requirements:**
```bash
bun run test:ui:components
```
Expected: 8 tests pass, 0 failures.

**Completion Criteria:**
- [ ] 8 test cases pass
- [ ] Form interaction uses `userEvent`, not `fireEvent`
- [ ] Query variables verified for gender filter
- [ ] No hardcoded permission strings

---

## Section 5: E2E Tests (P1)

### Task P9 — notifications-billing.test.ts

**Status:** Pending

**Objective:** Verify the full notification bell → popover → billing section → user billing profile navigation flow end-to-end in a real browser, with role-based access control.

**Layer-Specific Rules (E2E Tests — Flattened from Section 4.B of AGENTS guide):**
- Browser: `playwright` library, `chromium.launch({ headless: true })`.
- Dev Server: Reuses `setupTestServerLifecycle()` from `frontend/graphql/test/lifecycle.ts`. Port 3001.
- Context Isolation: Fresh `BrowserContext` per test. Cookies/storage isolated.
- Authentication: `loginAsDemoUser()` via `page.evaluate(fetch(...))`.
- Navigation: `page.goto()` with `page.waitForURL()`.
- Assertions: Playwright auto-waiting: `expect(locator).toBeVisible()`.
- Mobile Testing: `createMobileContext()` with `{ width: 375, height: 812, isMobile: true, hasTouch: true }`.
- Never `waitForTimeout()` — use auto-waiting assertions only.

**Input Sources (What to Read):**
- `test/ui/e2e/lifecycle.ts` — browser lifecycle (if exists) or `frontend/graphql/test/lifecycle.ts`
- `test/ui/e2e/helpers.ts` — login helpers (if exists) or `frontend/graphql/test/helpers.ts`
- `shared/demo-users.ts` — demo user credentials
- `test/manual/scenario/notifications/notification-panel-billing-alerts.md` — manual scenario
- `test/ui/e2e/admin-dashboard.test.ts` — existing E2E test for pattern reference

**Target Files:**
- `test/ui/e2e/notifications-billing.test.ts` (new)

**Action Plan:**

1. Import lifecycle and helpers from existing E2E infrastructure
2. Call `setupBrowserLifecycle()` at describe root
3. Write test cases:

   - **"Admin sees notification bell icon"**: Login as academyAdmin, goto dashboard, assert bell icon element is visible
   - **"Clicking bell opens popover with notifications section"**: Login, goto dashboard, click bell icon, assert popover content with "Notifications" heading is visible
   - **"Billing section appears in popover for Admin"**: Login, click bell, assert "Unpaid Invoices" text is visible within popover
   - **"Clicking user row in billing section navigates to billing profile"**: Login, click bell, click first user row in billing section, assert URL contains `/users/` and `/billing-profile`
   - **"Teacher does NOT see notification bell icon"**: Login as teacher, goto dashboard, assert bell icon is NOT visible (permission gate)
   - **"Mobile: bell icon visible and popover renders full-width"**: Login as academyAdmin in mobile context, goto dashboard, assert bell visible, click it, assert popover fills screen width

4. Each test creates a fresh browser context via `createContext()` or `createMobileContext()`
5. `afterEach` closes context: `if (context) await context.close()`

**Test Execution Requirements:**
```bash
bun run test:ui:e2e
bun run test:ui:components  # regression check
```
Expected: 6 tests pass (5 desktop + 1 mobile), 0 failures. Component tests still pass.

**Completion Criteria:**
- [ ] 6 E2E test cases pass
- [ ] Each test uses isolated browser context
- [ ] Teacher role verified to NOT see bell icon
- [ ] Component tests still pass (no regressions)
- [ ] No `waitForTimeout()` calls

---

### Task P10 — availability-search.test.ts

**Status:** Pending

**Objective:** Verify the schedule availability search page end-to-end: nav item visibility, form rendering, query execution with results, role-based access control, and mobile responsive layout.

**Layer-Specific Rules (E2E Tests — Flattened from Section 4.B):**
- Same rules as Task P9.

**Input Sources (What to Read):**
- `test/ui/e2e/lifecycle.ts` — browser lifecycle
- `test/ui/e2e/helpers.ts` — login helpers
- `shared/demo-users.ts` — demo user credentials
- `test/manual/scenario/admin-dashboard/availability-search.md` — manual scenario
- `test/ui/e2e/admin-dashboard.test.ts` — existing E2E pattern reference

**Target Files:**
- `test/ui/e2e/availability-search.test.ts` (new)

**Action Plan:**

1. Import lifecycle and helpers
2. Call `setupBrowserLifecycle()` at describe root
3. Write test cases:

   - **"Admin sees 'Schedule Search' nav item in sidebar"**: Login as academyAdmin, goto dashboard, assert sidebar contains nav item with "Schedule Search" text
   - **"Clicking nav item navigates to search-schedule page"**: Login, click nav item, assert URL ends with `/search-schedule` and form is visible
   - **"Search form renders with From/To time inputs and Gender dropdown"**: Login, goto `/search-schedule`, assert time inputs and gender select are visible
   - **"Submitting form shows loading then results"**: Login, goto page, fill From=08:00, To=17:00, click Search, wait for loading to disappear, assert teacher results section or "no results" message appears
   - **"Teacher does NOT see 'Schedule Search' nav item"**: Login as teacher, goto dashboard, assert nav item is NOT visible
   - **"Mobile: form stacks vertically and grid scrolls horizontally"**: Login as academyAdmin in mobile context, goto `/search-schedule`, assert form fields are stacked (not side-by-side)

4. Fresh context per test, `afterEach` closes context

**Test Execution Requirements:**
```bash
bun run test:ui:e2e
bun run test:ui:components  # regression check
```
Expected: 6 tests pass (5 desktop + 1 mobile), 0 failures.

**Completion Criteria:**
- [ ] 6 E2E test cases pass
- [ ] Each test uses isolated browser context
- [ ] Teacher role verified to NOT see nav item
- [ ] No `waitForTimeout()` calls
- [ ] Component tests still pass

---

## Section 6: Key Technical Decisions (P3)

### 6.1 Why MockedProvider for Notification Panel Component Tests?

`NotificationPanel` uses Apollo `useQuery` to fetch alerts. In component tests, we cannot rely on a running GraphQL server. `MockedProvider` from `@apollo/client/testing` intercepts the query and returns predefined data without network calls. This is faster and more deterministic than spinning up a test server for each component test.

### 6.2 Why Render NotificationPanel Directly (Without Popover)?

The `NotificationButton` wraps `NotificationPanel` in a MUI `Popover`, which uses CSS portals and transitions. Testing through the portal adds complexity with no benefit — the Popover is a MUI primitive, not our code. Component tests render `NotificationPanel` directly, testing its content and behavior. The Popover integration is tested via E2E tests in a real browser.

### 6.3 Why E2E Tests for the Search Schedule Page?

`SearchScheduleContainer` manages form state, triggers GraphQL queries conditionally (`skip: !searchInput`), and renders child components (`SearchScheduleForm` → `SearchScheduleView` → `TeacherAvailabilityGrid`). This multi-component interaction with conditional query execution is better validated end-to-end where the full React lifecycle, Apollo cache, and Next.js routing work together.

### 6.4 Why Login via GraphQL Mutation for E2E Tests?

The demo login endpoint uses a `demoLogin` GraphQL mutation that returns auth tokens. E2E tests call this via `page.evaluate(fetch(...))` to get tokens, then set them as cookies via `context.addCookies()`. This mirrors how the real login flow works and avoids bypassing auth middleware.

### 6.5 Why Shared Test Server Infrastructure?

E2E tests reuse the reference-counted dev server from `frontend/graphql/test/lifecycle.ts`. Starting a Next.js dev server takes ~60 seconds. Sharing it across all E2E test files avoids repeated startup costs and keeps the E2E suite fast.

---

## Section 7: Risks & Mitigations (P3)

| Risk | Mitigation |
|------|------------|
| `NotificationPanel` fires 2 queries simultaneously | MockedProvider must mock both `notificationAlerts` and `unpaidInvoicesAlert` in every test. Missing mock causes silent network error. |
| Billing test data depends on seed state | E2E tests assert on dynamic content (user names from rendered DOM), not hardcoded IDs. Empty state handled with "no unpaid invoices" message. |
| MUI Popover portal timing in component tests | Render `NotificationPanel` directly, bypassing Popover. E2E tests verify Popover integration in a real browser. |
| Arabic RTL layout for notification popover | E2E tests run under `/ar/` locale prefix to verify RTL rendering. Popover anchor origin may flip — tested explicitly. |
| Search form with time inputs across browsers | Use native `<input type="time">` which Playwright handles natively. No custom date picker to worry about. |
| Teacher availability gaps depend on seed data | E2E tests assert on "results OR no results" — both are valid outcomes. The test verifies the search flow works, not specific gap counts. |
| `RequirePermission` hides entire page for unauthorized roles | Component tests verify page content is NOT rendered when permission is absent. E2E tests verify Teacher cannot see the nav item or access the page. |
| happy-dom lacks full CSS layout engine | Component tests assert on DOM presence/absence, not visual layout. Visual layout is tested via E2E screenshots or manual verification. |

---

## Section 8: Final Verification Protocol — Additions (P2)

The original plan's Section 7 has 9 verification steps. Append these 6 additional steps from the AGENTS guide:

```bash
# 10. Prohibited patterns check
rg -i "TODO|FIXME|skip.*not impl|as any|: any" test/ui/ --glob "!**/*.md"
# Expected: empty output

# 11. Cross-layer import check
rg "from.*test/ui/e2e" test/ui/components/
rg "from.*test/ui/components" test/ui/e2e/
# Expected: empty output for both

# 12. Hardcoded permission strings in tests
rg '"[a-z]+\.[a-z_]+"' test/ui/ --glob "*.test.*"
# Expected: empty output (all permissions use AppPermission enum)

# 13. Legacy Playwright patterns
rg "waitForTimeout|waitForSelector|page\.waitFor" test/ui/e2e/
# Expected: empty output

# 14. fireEvent usage
rg "fireEvent" test/ui/
# Expected: empty output (only userEvent allowed)

# 15. container.querySelector usage
rg "container.querySelector" test/ui/
# Expected: empty output (only screen queries allowed)
```

---

## Section 9: Post-Task Verification Matrix

| Phase | Command After Each Task | Why |
|-------|------------------------|-----|
| Phase 1 (Code Fixes: P1, P2) | `bun tsgo` + `bun run test:db` | Code changes can break types or existing DB tests |
| Phase 2 (Manual Scenarios: P3, P4, P5) | N/A (documentation tasks) | No code changes |
| Phase 3 (Component Tests: P6, P7, P8) | `bun run test:ui:components` | Verify new tests pass and no regressions |
| Phase 4 (E2E Tests: P9, P10) | `bun run test:ui:e2e` + `bun run test:ui:components` | Verify E2E tests pass AND component tests didn't regress |
| Phase 5 (Verification) | `bun run test:ui` + `bun run test` + `bun quality-gate` | Full suite verification |

**Rule:** Do NOT proceed to the next task until the current task's verification commands pass.

---

## Appendix A: File Manifest

| Path | Purpose | Task |
|------|---------|------|
| `backend/services/notification/notification-alerts.service.ts` | Fix hardcoded strings | P1 |
| `backend/services/schedule/availability-search.service.ts` | Fix unsafe cast | P2 |
| `shared/messages/en.ts` | Add 2 i18n keys | P1 |
| `shared/messages/ar/dashboard/core/notifications.ts` | Add 2 Arabic keys | P1 |
| `shared/messages/types/dashboard/core/notifications.ts` | Add 2 type keys | P1 |
| `test/manual/scenario/notifications/notification-panel-billing-alerts.md` | Manual scenario | P3 |
| `test/manual/scenario/admin-dashboard/availability-search.md` | Manual scenario | P4 |
| `test/manual/scenario/users/billing-profile.md` | Manual scenario | P5 |
| `test/ui/components/NotificationPanel.test.tsx` | Component test | P6 |
| `test/ui/components/UnpaidInvoicesSection.test.tsx` | Component test | P7 |
| `test/ui/components/SearchScheduleContainer.test.tsx` | Component test | P8 |
| `test/ui/e2e/notifications-billing.test.ts` | E2E test | P9 |
| `test/ui/e2e/availability-search.test.ts` | E2E test | P10 |

---

## Appendix B: Manual Scenario Coverage Matrix

| Manual Scenario File | Component Tests | E2E Tests |
|---------------------|-----------------|-----------|
| `notifications/notification-panel-billing-alerts.md` | `NotificationPanel.test.tsx`, `UnpaidInvoicesSection.test.tsx` | `notifications-billing.test.ts` |
| `admin-dashboard/availability-search.md` | `SearchScheduleContainer.test.tsx` | `availability-search.test.ts` |
| `users/billing-profile.md` | `UserBillingProfileView.test.tsx` (already exists) | `notifications-billing.test.ts` (navigation flow) |

---

## Execution Order

1. **Task P1** — Fix hardcoded strings (code fix, unblocks clean test assertions)
2. **Task P2** — Fix unsafe cast (code fix, independent of P1)
3. **Task P3** — Author notifications manual scenario (documentation)
4. **Task P4** — Author availability search manual scenario (documentation)
5. **Task P5** — Author billing profile manual scenario (documentation)
6. **Task P6** — NotificationPanel component test (depends on P1 fix + P3 scenario)
7. **Task P7** — UnpaidInvoicesSection component test (depends on P3 scenario)
8. **Task P8** — SearchScheduleContainer component test (depends on P4 scenario)
9. **Task P9** — Notifications/billing E2E test (depends on P3 scenario)
10. **Task P10** — Availability search E2E test (depends on P4 scenario)
11. **Run full verification protocol** (Section 8 — all 15 steps)
