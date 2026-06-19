# Automated UI Tests Implementation Plan

**Source:** Manual test scenarios in `test/manual/scenario/` (13 files, 5 categories)
**Goal:** Create two-layer automated UI test suite using Bun test runner

---

## Section 1: Architecture Overview

### Two-Layer Strategy

| Layer | Technology | Purpose | Speed |
|---|---|---|---|
| **Component Tests** | `happy-dom` + `@testing-library/react` + `bun:test` | Test permission gates, component rendering, isolated behavior | Fast (no browser) |
| **E2E Tests** | `playwright` library + `bun:test` | Full user flows, responsive layout, cross-page navigation, real browser | Slower (real browser) |

### Test Directory Structure

```
test/
├── manual/scenario/                    # Existing manual test scenarios (unchanged)
└── ui/
    ├── components/                     # Component tests (Layer 1)
    │   ├── TestWrapper.tsx             # Provider stack wrapper (theme, intl, apollo mock)
    │   ├── RequirePermission.test.tsx  # Permission gate tests
    │   ├── ScheduleOverviewSection.test.tsx
    │   ├── ScheduleOverviewDataGrid.test.tsx
    │   ├── AdminActionsBar.test.tsx
    │   ├── SessionActivateButton.test.tsx
    │   └── CalendarGrid.test.tsx
    └── e2e/                            # E2E tests (Layer 2)
        ├── lifecycle.ts                # Browser + dev server lifecycle management
        ├── helpers.ts                  # Login, navigation, assertion helpers
        ├── admin-dashboard.test.ts     # Admin dashboard scenarios
        ├── class-details.test.ts       # Class details scenarios
        ├── student-history.test.ts     # Student history scenarios
        ├── teacher-dashboard.test.ts   # Teacher dashboard scenarios
        └── permissions.test.ts         # Cross-role RBAC scenarios
```

---

## Section 2: Dependencies & Configuration

### 2.1 Already Installed
- `happy-dom` + `@happy-dom/global-registrator`
- `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event`
- `playwright` + `@playwright/test`

### 2.2 Create `bunfig.toml`

```toml
[test]
timeout = 60000
preload = ["./test/ui/components/happydom-preload.ts"]

[test]
coverageSkipTestFiles = true
```

### 2.3 Create `test/ui/components/happydom-preload.ts`

```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();
```

This registers happy-dom globals (`document`, `window`, etc.) before all tests run. E2E tests won't be affected since they use Playwright's browser context.

---

## Section 3: Component Tests (Layer 1)

### 3.1 TestWrapper.tsx

A reusable wrapper component that provides the full provider stack for component tests, modeled after `.storybook/StoryWrapper.tsx`:

```tsx
// test/ui/components/TestWrapper.tsx
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { MockedProvider } from "@apollo/client/testing";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ThemeContext } from "@/frontend/context/ThemeContext";
import { createAppTheme } from "@/frontend/providers/theme/theme";
import { useUserStore } from "@/frontend/stores/userStore";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";

// Creates a test wrapper with:
// - NextIntlClientProvider (ar or en)
// - ThemeContext.Provider
// - CacheProvider (Emotion, RTL support)
// - ThemeProvider (MUI)
// - CssBaseline
// - MockedProvider (Apollo, optional mocks)
// Seeds userStore with specified permissions via useUserStore.setState()
```

**Key design decisions:**
- Uses `MockedProvider` from `@apollo/client/testing` for Apollo mocking (no real network)
- Seeds `useUserStore` with specific permissions via `useUserStore.setState()` before rendering
- Supports locale toggle (ar/en) and theme mode (light/dark)
- Reuses `createAppTheme` from the actual project for consistent theming

### 3.2 Test Files

#### RequirePermission.test.tsx
Tests the core permission gating component:
- Renders children when user has permission
- Renders fallback (null) when user lacks permission
- Handles array of permissions (`.some()` logic)
- Works with different permission types (DashboardSearch, ScheduleViewTimezones, etc.)

**Approach:** Mock `useUserStore` directly via `useUserStore.setState()`. No Apollo needed.

#### ScheduleOverviewSection.test.tsx
Tests search input visibility:
- Search `TextField` rendered when `DashboardSearch` permission exists
- Search `TextField` not rendered when permission missing
- Desktop layout (Paper + SectionPanel) vs Mobile layout (Stack + CardList)
- Search input accepts user input and calls `onSearchChange`

**Approach:** Render with mock props, mock userStore for permissions.

#### ScheduleOverviewDataGrid.test.tsx
Tests timezone column visibility:
- Three timezone columns (yourTime, teacherTime, studentTime) when `ScheduleViewTimezones` permission exists
- Single time column when permission missing
- Details button navigates to `/classes/[id]` (mock router)
- StatusBadge renders with correct category and status

**Approach:** Render with mock rows data, mock userStore for permissions, mock `useRouter`.

#### AdminActionsBar.test.tsx
Tests admin override actions:
- Force Activate button rendered
- Stop button rendered
- Delete button rendered
- Reschedule button gated by `SessionReschedule` permission
- Buttons call correct handlers on click

**Approach:** Render with mock handlers, verify button presence and click behavior.

#### SessionActivateButton.test.tsx
Tests teacher activate button states:
- Connecting state: outlined, disabled, with CircularProgress
- Ready state: contained, clickable
- Disabled state: button disabled
- Click handler fires onActivate

**Approach:** Pure presentational component, render with different props.

#### CalendarGrid.test.tsx
Tests history calendar rendering:
- Monthly grid renders with correct days
- Days with sessions are highlighted
- Clicking a day selects it
- Month navigation works

**Approach:** Render with mock session data, verify grid structure and interactions.

---

## Section 4: E2E Tests (Layer 2)

### 4.1 lifecycle.ts

Manages browser and Next.js dev server lifecycle:

```ts
// test/ui/e2e/lifecycle.ts
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { afterAll, beforeAll } from "bun:test";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";

let browser: Browser;
let context: BrowserContext;

export function setupBrowserLifecycle() {
  // Reuse the existing Next.js dev server lifecycle
  setupTestServerLifecycle();

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      baseURL: "http://localhost:3001",
      viewport: { width: 1280, height: 720 },
    });
  }, 70000);

  afterAll(async () => {
    await context?.close();
    await browser?.close();
  });
}

export async function createPage(): Promise<Page> {
  return context.newPage();
}
```

**Key design:**
- Reuses `setupTestServerLifecycle()` from existing GraphQL tests to start Next.js dev server on port 3001
- Reference counting ensures server is shared across test suites
- Browser launched once per test file, context shared across tests
- 70-second timeout accounts for dev server startup

### 4.2 helpers.ts

Reusable login and navigation helpers:

```ts
// test/ui/e2e/helpers.ts
import type { Page } from "playwright";
import { expect } from "bun:test";

export const DEMO_USERS = {
  academyAdmin: { groupSlug: "academy_admin", email: "academy@siraj.local", password: "12345678" },
  teacher: { groupSlug: "teacher_default", email: "teacher@siraj.local", password: "12345678" },
  parent: { groupSlug: "parent_default", email: "parent@siraj.local", password: "12345678" },
} as const;

export async function loginAsDemoUser(page: Page, groupSlug: string): Promise<void> {
  // Navigate to login page
  await page.goto("/ar/login");

  // Use demo login via GraphQL mutation (set cookies directly)
  // Or use the login form UI
  await page.fill('input[name="email"]', DEMO_USERS[groupSlug].email);
  await page.fill('input[name="password"]', DEMO_USERS[groupSlug].password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard");
}

export async function assertElementVisible(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeVisible();
}

export async function assertElementHidden(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).not.toBeVisible();
}
```

**Login strategy:** Use the actual login form UI to authenticate. This tests the full auth flow including cookie setting, redirect, and Apollo token management.

### 4.3 Test Files

#### admin-dashboard.test.ts
- Login as Academy Admin → dashboard renders
- Search input visible and functional (type → grid filters)
- Timezone columns visible (yourTime, teacherTime, studentTime)
- Click details button → navigates to `/classes/[id]`
- Login as Teacher → search input hidden, single time column
- Mobile viewport: card list renders instead of data grid

#### class-details.test.ts
- Login as Academy Admin → navigate to `/classes/[id]` → AdminActionsBar visible
- Force activate button works (click → status changes)
- Stop button works
- Delete button shows confirmation dialog
- Login as Teacher → AdminActionsBar hidden, ActionsPanel visible
- Teacher activate within time window → success
- Teacher activate outside time window → error message displayed
- Timezone warning banner visible when timezone mismatch exists

#### student-history.test.ts
- Login as Academy Admin → navigate to `/students/[id]/history` → calendar renders
- Days with sessions highlighted
- Click day → session list appears
- Click session → ClassDetailsModal opens
- Modal shows session metadata (title, time, duration, status, instructor)
- Download logs button triggers file download
- Month navigation works (previous/next)
- Login as Teacher → calendar not rendered (no permission)

#### teacher-dashboard.test.ts
- Login as Teacher → `/teachers/dashboard` renders
- Metrics row displays data
- Schedule data grid shows teacher's classes
- Activate button works within time window
- Activate outside time window → error displayed
- Join video button opens Zoom URL
- Manual entry dialog opens and submits
- Download handbook button works
- Contact coordinator button works
- Active dashboard mode (`/teachers/dashboard/active`) renders correctly

#### permissions.test.ts
- Cross-role verification: Academy Admin sees all features, Teacher sees subset, Parent sees minimal
- Permission-gated elements not in DOM (not just hidden via CSS)
- Navigation items filtered by permissions
- Admin actions only visible to Academy Admin
- Teacher dashboard only accessible with `TeacherViewDashboard` permission

---

## Section 5: Desktop vs Mobile Testing

### Component Tests
- Use `@testing-library/react` which renders in happy-dom (no viewport)
- Test both `DesktopLayout` and `MobileLayout` components separately
- Verify CSS media query breakpoints via `window.matchMedia` mock

### E2E Tests
- Desktop: default viewport `1280x720`
- Mobile: create separate browser context with `viewport: { width: 375, height: 812 }` (iPhone dimensions)
- Test responsive layout changes (data grid → card list, sidebar → bottom nav)

---

## Section 6: Execution Commands

```bash
# Run all UI tests
bun test test/ui/

# Run component tests only
bun test test/ui/components/

# Run E2E tests only
bun test test/ui/e2e/

# Run specific test file
bun test test/ui/e2e/admin-dashboard.test.ts

# Run with coverage
bun test --coverage test/ui/components/
```

---

## Section 7: Implementation Order

| Phase | Task | Files |
|---|---|---|
| 1 | Create `bunfig.toml` and happy-dom preload | `bunfig.toml`, `test/ui/components/happydom-preload.ts` |
| 2 | Create component test infrastructure | `test/ui/components/TestWrapper.tsx` |
| 3 | Write component tests | 6 `.test.tsx` files |
| 4 | Create E2E test infrastructure | `test/ui/e2e/lifecycle.ts`, `test/ui/e2e/helpers.ts` |
| 5 | Write E2E tests | 5 `.test.ts` files |
| 6 | Verify all tests pass | `bun test test/ui/` |
| 7 | Run quality gate | `bun quality-gate` |

---

## Section 8: Key Technical Decisions

### 8.1 Why not `@playwright/test` runner?
User requirement: "using bun (not vitest at all)". We use `playwright` (the library) within `bun:test` to keep Bun as the test runner while still getting real browser automation.

### 8.2 Why MockedProvider for component tests?
Component tests should be fast and isolated. `MockedProvider` from Apollo allows testing component rendering and behavior without a running server. E2E tests cover the full integration.

### 8.3 Why login via UI for E2E tests?
Testing the full login flow (form submission, cookie setting, redirect, Apollo token refresh) ensures the auth system works end-to-end. Using `demoLogin` GraphQL mutation directly would skip the UI auth flow.

### 8.4 How to handle RTL (Arabic) layout?
Component tests support both LTR and RTL via the TestWrapper's locale prop. E2E tests default to Arabic (`/ar/` routes) matching the app's default locale.

### 8.5 Shared test server
E2E tests reuse `setupTestServerLifecycle()` from existing GraphQL tests. The reference counting mechanism ensures the Next.js dev server is started once and shared across all test suites, with automatic cleanup.

---

## Section 9: Risks & Mitigations

| Risk | Mitigation |
|---|---|
| E2E tests are slow | Use headless Chromium, share browser context, parallelize test files |
| Flaky timing issues | Use Playwright's auto-waiting (`waitForURL`, `toBeVisible`), generous timeouts |
| Test data dependency on seeds | Use `demoLogin` which works with seeded demo users; don't create test data in E2E tests |
| Happy-dom conflicts with Playwright | Happy-dom only affects component tests; Playwright uses its own browser context |
| MUI theme/emotion cache in tests | Reuse Storybook's proven provider stack pattern in TestWrapper |
| Apollo MockedProvider complexity | Start with simple mocks; only mock queries actually used by tested components |
