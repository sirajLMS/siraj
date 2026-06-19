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

### Alignment with Next.js Official Testing Recommendations

Per [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing):
- **E2E Testing**: Playwright is officially recommended ✅ (we use `playwright` library within `bun:test`)
- **Component Testing**: React Testing Library recommended ✅ (we use `@testing-library/react` with `happy-dom`)
- **Async Server Components**: Next.js recommends E2E over unit testing for async components ✅ (our component tests only cover `"use client"` components; server-side layouts/auth tested via E2E)
- **Production-like testing**: Next.js recommends running E2E against `build` + `start`; we support both dev server (faster iteration) and production builds

### Why Not `@playwright/test` Runner?

User requirement: "using bun (not vitest at all)". We use `playwright` (the library) within `bun:test` to keep Bun as the test runner. This reuses the project's existing `testServer.ts` infrastructure and reference-counted server lifecycle management, rather than Playwright's `webServer` config.

### Why Not `next-devtools-mcp` for Testing?

The `next-devtools-mcp` server (configured in `.mcp.json`) is designed for **coding agent development assistance** — runtime diagnostics, browser evaluation during development, and documentation lookup. It is NOT a testing framework and is not suitable for automated test suites. Our approach uses proper test infrastructure.

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

### Next.js Testing Alignment

Per [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing):
- **Only `"use client"` components are tested here.** All components in our test scope (`RequirePermission`, `ScheduleOverviewSection`, `ScheduleOverviewDataGrid`, `AdminActionsBar`, `SessionActivateButton`, `CalendarGrid`) are client components. Server Components (layouts, page shells) are tested via E2E.
- **Use React Testing Library patterns**: prefer `screen.getByRole()`, `screen.getByText()`, `screen.queryByRole()` over `container.querySelector()`. Test what the user sees, not implementation details.
- **Use `userEvent` for interactions**: prefer `userEvent.click()`, `userEvent.type()` over `fireEvent` for more realistic user simulation.

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

All component tests follow React Testing Library best practices:
- Use `screen.getByRole()`, `screen.getByText()`, `screen.queryByRole()` for queries
- Use `userEvent.click()`, `userEvent.type()` for interactions
- Assert on visible output, not internal state or CSS classes

#### RequirePermission.test.tsx
Tests the core permission gating component:
- `screen.getByText("Protected Content")` renders when user has permission
- `screen.queryByText("Protected Content")` returns null when user lacks permission
- Handles array of permissions (`.some()` logic) — at least one permission grants access
- Works with different permission types (DashboardSearch, ScheduleViewTimezones, etc.)

**Approach:** Mock `useUserStore` directly via `useUserStore.setState()`. No Apollo needed.

#### ScheduleOverviewSection.test.tsx
Tests search input visibility:
- `screen.getByRole("textbox")` found when `DashboardSearch` permission exists
- `screen.queryByRole("textbox")` returns null when permission missing
- Desktop layout (Paper + SectionPanel) vs Mobile layout (Stack + CardList) — test each layout component independently
- `userEvent.type()` in search input triggers `onSearchChange` callback

**Approach:** Render with mock props, mock userStore for permissions.

#### ScheduleOverviewDataGrid.test.tsx
Tests timezone column visibility:
- Three timezone column headers (`screen.getByText("Your Time")`, etc.) when `ScheduleViewTimezones` permission exists
- Single time column header when permission missing
- Details button (`screen.getByRole("button", { name: /details/i })`) navigates to `/classes/[id]` (mock router)
- StatusBadge renders with correct category and status text

**Approach:** Render with mock rows data, mock userStore for permissions, mock `useRouter`.

#### AdminActionsBar.test.tsx
Tests admin override actions:
- `screen.getByRole("button", { name: /force activate/i })` rendered
- `screen.getByRole("button", { name: /stop/i })` rendered
- `screen.getByRole("button", { name: /delete/i })` rendered
- Reschedule button gated by `SessionReschedule` permission — `queryByRole` returns null without permission
- `userEvent.click()` on buttons calls correct handler props

**Approach:** Render with mock handlers, verify button presence and click behavior.

#### SessionActivateButton.test.tsx
Tests teacher activate button states:
- Connecting state: `screen.getByRole("button")` is disabled, contains CircularProgress
- Ready state: `screen.getByRole("button", { name: activateLabel })` is enabled
- Disabled state: `screen.getByRole("button")` has `disabled` attribute
- `userEvent.click()` fires `onActivate` prop

**Approach:** Pure presentational component, render with different props.

#### CalendarGrid.test.tsx
Tests history calendar rendering:
- Monthly grid renders with correct day numbers (`screen.getByText("15")`, etc.)
- Days with sessions have visual indicator (test via `getByRole("button")` or aria attributes)
- `userEvent.click()` on a day selects it (verify selection state)
- Month navigation buttons (`screen.getByRole("button", { name: /previous/i })`) work

**Approach:** Render with mock session data, verify grid structure and interactions.

---

## Section 4: E2E Tests (Layer 2)

### Next.js Testing Alignment

Per [Next.js Playwright Guide](https://nextjs.org/docs/app/building-your-application/testing/playwright):
- **Test against the running application**: E2E tests navigate real pages, trigger real GraphQL requests, and verify real DOM output. No mocking of Next.js internals.
- **Use `baseURL` in browser context**: Set `baseURL: "http://localhost:3001"` so tests can use relative paths (`page.goto("/ar/dashboard")`).
- **Prefer auto-waiting assertions**: Playwright's `expect(locator).toBeVisible()` automatically retries until the element appears or timeout. This avoids flaky `waitForTimeout()` calls.
- **Test user flows, not implementation**: Each E2E test should represent a user scenario from the manual test plan (e.g., "Admin searches for a student", "Teacher activates a class within time window").
- **Production-like in CI**: For CI pipelines, modify `testServer.ts` to spawn `bun run build && bun run start` instead of `bun run next dev` for production-like behavior. Dev server is used locally for faster iteration and better error messages.

### 4.1 lifecycle.ts

Manages browser and Next.js dev server lifecycle:

```ts
// test/ui/e2e/lifecycle.ts
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { afterAll, beforeAll, beforeEach } from "bun:test";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";

let browser: Browser;

export function setupBrowserLifecycle() {
  // Reuse the existing Next.js dev server lifecycle (port 3001)
  setupTestServerLifecycle();

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  }, 70000);

  afterAll(async () => {
    await browser?.close();
  });
}

/**
 * Create a fresh browser context for each test.
 * Each context has isolated cookies/storage, so tests don't interfere with each other.
 */
export async function createContext(viewport?: { width: number; height: number }): Promise<BrowserContext> {
  return browser.newContext({
    baseURL: "http://localhost:3001",
    viewport: viewport ?? { width: 1280, height: 720 },
  });
}

/**
 * Create a mobile viewport context (iPhone 14 dimensions).
 */
export async function createMobileContext(): Promise<BrowserContext> {
  return createContext({ width: 375, height: 812 });
}
```

**Key design:**
- Reuses `setupTestServerLifecycle()` from existing GraphQL tests to start Next.js dev server on port 3001
- Reference counting ensures server is shared across test suites
- **Browser launched once per test file; each test gets a fresh context** (isolated cookies/storage)
- 70-second timeout accounts for dev server startup
- Separate helper for mobile viewport testing

### 4.2 helpers.ts

Reusable login and navigation helpers:

```ts
// test/ui/e2e/helpers.ts
import type { Page, BrowserContext } from "playwright";
import { expect } from "bun:test";

export const DEMO_USERS = {
  academyAdmin: { groupSlug: "academy_admin", email: "academy@siraj.local", password: "12345678" },
  teacher: { groupSlug: "teacher_default", email: "teacher@siraj.local", password: "12345678" },
  parent: { groupSlug: "parent_default", email: "parent@siraj.local", password: "12345678" },
} as const;

/**
 * Login via GraphQL demoLogin mutation and set cookies in Playwright context.
 * 
 * Auth flow:
 * 1. demoLogin mutation returns { token, user }
 * 2. Server sets httpOnly cookies: access_token, refresh_token, session_id
 * 3. Client stores access token in memory (React context)
 * 4. Apollo sends Authorization: Bearer <token> header
 * 
 * For E2E tests, we call demoLogin via fetch, extract cookies from response,
 * and set them in the Playwright browser context.
 */
export async function loginAsDemoUser(page: Page, context: BrowserContext, groupSlug: string): Promise<void> {
  // Call the demoLogin GraphQL mutation directly
  const response = await page.evaluate(async (slug) => {
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation demoLogin($input: DemoLoginInput!) {
          demoLogin(input: $input) { token user { id name permissions role } }
        }`,
        variables: { input: { groupSlug: slug } },
      }),
    });
    return res.json();
  }, groupSlug);

  const token = response.data?.demoLogin?.token;
  if (!token) throw new Error(`demoLogin failed for ${groupSlug}`);

  // Set the access token cookie (the server also sets httpOnly cookies)
  await context.addCookies([
    {
      name: "access_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Navigate to dashboard
  await page.goto("/ar/dashboard");
  await page.waitForURL("**/dashboard");
}

export async function assertElementVisible(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeVisible();
}

export async function assertElementHidden(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).not.toBeVisible();
}

/**
 * Create a new browser context with a specific viewport for mobile testing.
 */
export async function createMobileContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    baseURL: "http://localhost:3001",
    viewport: { width: 375, height: 812 }, // iPhone 14 dimensions
    isMobile: true,
    hasTouch: true,
  });
}
```

**Login strategy:** Call the `demoLogin` GraphQL mutation directly via fetch, extract the token, and set cookies in the Playwright browser context. This is faster than going through the login form UI while still testing the actual auth system. The httpOnly cookies (`access_token`, `refresh_token`, `session_id`) are set by the server in the mutation response.

### 4.3 Test Files

All E2E tests follow Playwright best practices:
- Use `page.getByRole()`, `page.getByText()`, `page.locator()` for element selection
- Use auto-waiting assertions: `expect(locator).toBeVisible()`, `expect(locator).toHaveText()`
- Use `page.waitForURL()` for navigation assertions
- Each test creates a fresh browser context for cookie/storage isolation
- Desktop and mobile variants tested via separate contexts

#### admin-dashboard.test.ts
- Login as Academy Admin → `page.goto("/ar/dashboard")` → dashboard renders
- Search input visible: `page.getByRole("textbox")` found
- Type search term → grid filters (verify row count changes)
- Timezone columns visible: `page.getByText("Your Time")`, `page.getByText("Teacher Time")`, `page.getByText("Student Time")`
- Click details button → `page.waitForURL("**/classes/**")`
- Login as Teacher → search input hidden (`queryByRole("textbox")` null), single time column
- **Mobile**: card list renders instead of data grid (verify card elements present)

#### class-details.test.ts
- Login as Academy Admin → navigate to `/classes/[id]` → AdminActionsBar visible
- Force activate button: `page.getByRole("button", { name: /force activate/i })` → click → status badge changes
- Stop button: click → status changes to "stopped"
- Delete button: click → confirmation dialog appears (`page.getByRole("dialog")`)
- Login as Teacher → AdminActionsBar hidden, ActionsPanel visible
- Teacher activate within time window → success (status badge updates)
- Teacher activate outside time window → error message displayed (`page.getByText(/missed the class time/i)`)
- Timezone warning banner visible when timezone mismatch exists

#### student-history.test.ts
- Login as Academy Admin → navigate to `/students/[id]/history` → calendar renders
- Days with sessions highlighted (verify via CSS class or aria attributes)
- Click day → session list appears below calendar
- Click session → ClassDetailsModal opens (`page.getByRole("dialog")`)
- Modal shows session metadata: title, time, duration, status, instructor name
- Download logs button triggers file download (verify via `page.waitForEvent("download")`)
- Month navigation: click previous/next → calendar updates
- Login as Teacher → calendar not rendered (permission gate)

#### teacher-dashboard.test.ts
- Login as Teacher → `/teachers/dashboard` renders
- Metrics row displays data (verify metric cards present)
- Schedule data grid shows teacher's classes (verify row count > 0)
- Activate button within time window → click → status updates
- Activate outside time window → error displayed
- Join video button: `page.getByRole("link", { name: /join/i })` or button opens new tab
- Manual entry dialog: click button → dialog opens → fill form → submit
- Download handbook button: click → download triggered
- Contact coordinator button: click → success feedback
- Active dashboard mode (`/teachers/dashboard/active`) renders correctly

#### permissions.test.ts
- Cross-role verification: Academy Admin sees all features, Teacher sees subset, Parent sees minimal
- Permission-gated elements not in DOM: `page.locator(selector).count()` returns 0 (not just hidden)
- Navigation items filtered by permissions (verify sidebar links)
- Admin actions only visible to Academy Admin
- Teacher dashboard only accessible with `TeacherViewDashboard` permission

---

## Section 5: Desktop vs Mobile Testing

### Component Tests
- Use `@testing-library/react` which renders in happy-dom (no real viewport)
- Test both `DesktopLayout` and `MobileLayout` components separately by rendering them directly
- The components use MUI's `sx={{ display: { xs: "none", md: "block" } }}` pattern for responsive visibility
- In happy-dom, both layouts render simultaneously (no CSS media query evaluation), so tests import and test each layout component independently

### E2E Tests
- **Desktop**: Create context with `viewport: { width: 1280, height: 720 }`
- **Mobile**: Create context with `viewport: { width: 375, height: 812 }` (iPhone 14) + `isMobile: true` + `hasTouch: true`
- Each test creates its own context, so desktop and mobile tests don't interfere
- Test responsive layout changes: data grid → card list, sidebar → bottom nav, search bar placement
- Playwright's `isMobile` flag changes user agent and enables touch events

---

## Section 6: Execution Commands

All test commands use layer-specific scripts defined in `package.json`. AGENTS.md files across the repo have been updated to reference these scripts.

```bash
# All tests across all layers (db + graphql + ui)
bun run test

# Database tests only (backend/db/test/)
bun run test:db
bun run test:db:coverage

# GraphQL integration tests only (frontend/graphql/test/)
bun run test:graphql
bun run test:graphql:coverage

# UI component tests only (test/ui/components/) — fast, no browser
bun run test:ui:components
bun run test:ui:components:coverage

# UI E2E tests only (test/ui/e2e/) — real browser, needs dev server
bun run test:ui:e2e

# All UI tests (components + e2e)
bun run test:ui

# Run a specific test file (any layer)
bun test test/ui/e2e/admin-dashboard.test.ts
bun test backend/db/test/repo/scheduling.repository.test.ts
```

### Timeout Strategy

| Layer | Timeout | Rationale |
|---|---|---|
| `test:db` | 60s | DB operations are fast; rollback transactions add minimal overhead |
| `test:graphql` | 120s | Next.js dev server startup takes ~60s; tests run after server is ready |
| `test:ui:components` | 30s | No server or browser; pure React rendering in happy-dom |
| `test:ui:e2e` | 120s | Dev server startup + browser launch + page navigation |
| `test` (all) | 60s per test | Global default; server startup handled in `beforeAll` with its own timeout |

---

## Section 7: Implementation Order

| Phase | Task | Files | Verification |
|---|---|---|---|
| 0 | Update `package.json` with layer-specific test scripts | `package.json` | `bun run test:db`, `bun run test:graphql` resolve correctly |
| 0 | Update all AGENTS.md files to reference layer-specific scripts | 4 AGENTS.md files | Grep confirms no stale `bun test` references |
| 1 | Create `bunfig.toml` and happy-dom preload | `bunfig.toml`, `test/ui/components/happydom-preload.ts` | `bun run test:ui:components` starts without errors |
| 2 | Create component test infrastructure | `test/ui/components/TestWrapper.tsx` | TestWrapper renders a simple component |
| 3 | Write component tests | 6 `.test.tsx` files | `bun run test:ui:components` passes |
| 4 | Create E2E test infrastructure | `test/ui/e2e/lifecycle.ts`, `test/ui/e2e/helpers.ts` | Browser launches and connects to dev server |
| 5 | Write E2E tests | 5 `.test.ts` files | `bun run test:ui:e2e` passes |
| 6 | Verify all tests pass | — | `bun run test` passes (all layers) |
| 7 | Run quality gate | — | `bun quality-gate` passes |

---

## Section 8: Key Technical Decisions

### 8.1 Why `playwright` library within `bun:test` instead of `@playwright/test` runner?
User requirement: "using bun (not vitest at all)". We use `playwright` (the library) within `bun:test` to keep Bun as the test runner while still getting real browser automation. This reuses the project's existing `testServer.ts` infrastructure and reference-counted server lifecycle management, rather than Playwright's `webServer` config.

### 8.2 Why MockedProvider for component tests?
Component tests should be fast and isolated. `MockedProvider` from Apollo allows testing component rendering and behavior without a running server. E2E tests cover the full integration.

### 8.3 Why login via UI for E2E tests?
Testing the full login flow (form submission, cookie setting, redirect, Apollo token refresh) ensures the auth system works end-to-end. The auth system uses httpOnly cookies (`access_token`, `refresh_token`, `session_id`) set by the server, so E2E tests must go through the actual login page or API.

### 8.4 How to handle RTL (Arabic) layout?
Component tests support both LTR and RTL via the TestWrapper's locale prop. E2E tests default to Arabic (`/ar/` routes) matching the app's default locale.

### 8.5 Shared test server
E2E tests reuse `setupTestServerLifecycle()` from existing GraphQL tests. The reference counting mechanism ensures the Next.js dev server is started once and shared across all test suites, with automatic cleanup. Server runs on port 3001 to avoid conflicts with development server on 3000.

### 8.6 Server Components limitation
Per Next.js documentation, async Server Components cannot be tested with unit/component testing tools. Our component tests only cover `"use client"` components. Server-side logic (auth in `app/[locale]/(dashboard)/layout.tsx`, server-side redirects) is tested via E2E tests.

### 8.7 Why not `next-devtools-mcp`?
The `next-devtools-mcp` server is a coding agent development tool (runtime diagnostics, browser eval during dev sessions). It is not designed for automated test suites and does not replace proper E2E/component testing infrastructure.

### 8.8 Dev server vs production build for E2E
Next.js recommends running E2E tests against production builds (`bun run build` + `bun run start`). For developer productivity, our E2E tests use the dev server (faster iteration, better error messages). CI pipelines can be configured to run against production builds by modifying `testServer.ts` to spawn `bun run start` instead of `bun run next dev`.

---

## Section 9: Risks & Mitigations

| Risk | Mitigation |
|---|---|
| E2E tests are slow | Use headless Chromium, share browser context across tests, parallelize test files. Dev server startup is shared via reference counting (already proven in GraphQL tests). |
| Flaky timing issues | Use Playwright's auto-waiting (`waitForURL`, `toBeVisible`, `locator().click()`). Playwright automatically retries assertions. Generous timeouts (70s for server startup). |
| Test data dependency on seeds | Use `demoLogin` which works with seeded demo users from `shared/demo-users.ts`. Don't create test data in E2E tests — rely on existing seed data. |
| Happy-dom conflicts with Playwright | Happy-dom only affects component tests via `bunfig.toml` preload. Playwright uses its own isolated browser context. No interaction between the two. |
| MUI theme/emotion cache in tests | Reuse Storybook's proven provider stack pattern (`.storybook/StoryWrapper.tsx`) in TestWrapper. Same Emotion cache setup, same theme creation, same RTL handling. |
| Apollo MockedProvider complexity | Start with simple mocks; only mock queries actually used by tested components. For complex data, use seed data shapes from `shared/demo-users.ts`. |
| Server Components can't be unit tested | Per Next.js docs, async Server Components require E2E testing. Component tests only cover `"use client"` components. Server-side auth/layout tested via E2E. |
| Auth cookies (httpOnly) not accessible to JS | E2E tests login via the actual login page, which sets httpOnly cookies via server response. Playwright automatically handles cookie persistence within a browser context. |
| Dev server vs production behavior differences | Document that E2E tests run against dev server by default. CI can be configured to use production build. Known differences: HMR, error overlays, caching behavior. |
| RTL layout testing complexity | Component TestWrapper supports both LTR/RTL via locale prop. E2E tests default to Arabic (`/ar/`). RTL-specific CSS tested via E2E screenshots or element positioning assertions. |
