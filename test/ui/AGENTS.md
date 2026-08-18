# UI Test Rules (`test/ui/`)

All tests under `test/ui/` run with `TEST_SERVER_MODE=production`. Any test that starts the shared Next.js test harness uses **`next start`** against a pre-built production bundle — not `next dev`.

## Prerequisites

**Before E2E tests (or any UI test that hits the running app), build the test production bundle:**

```bash
bun run build:test
```

- Output directory: `.next-test-prod` (override with `TEST_SERVER_DIST_DIR`)
- Uses **only** `.env.test` — injected into the `next build` / `next start` process env (no parent shell env). Per [Next.js test env rules](https://nextjs.org/docs/app/guides/environment-variables#test-environment-variables), keys already set in `process.env` are not overridden by `.env.local` or other files on disk
- Tests do **not** run `next build` automatically; missing build fails fast with a clear error

**Rebuild `build:test` after changes to:** server code, auth/cookies, middleware, API routes, or anything that affects the running Next.js app.

## Test Layers

| Layer | Path | Server | Notes |
|-------|------|--------|-------|
| Component | `test/ui/components/` | None | Happy DOM + mocked Apollo. No browser, no network. |
| E2E | `test/ui/e2e/` | Production (`next start`) | Playwright via `bun:test`. Uses `setupBrowserLifecycle()` → `setupTestServerLifecycle()`. |
| Static checks | `test/ui/mobile-desktop-isolation.test.ts` | None | Import-boundary scans only. |

Component tests do not need `build:test`. E2E tests **do**.

## Commands

```bash
bun run build:test          # Build .next-test-prod (required before E2E)
bun run test:ui:components  # Happy DOM component tests
bun run test:ui:e2e         # Playwright E2E (production server)
bun run test:ui:static      # Mobile/desktop isolation checks
bun run test:ui             # All of the above
bun run test:ui:kill        # Kill test servers on port 3066 only (never dev:3000 or start:4000)
```

All `test:ui*` scripts preload `test/ui/test-env.ts`, which sets `TEST_SERVER_MODE=production`.

## Shared Test Server Infrastructure

E2E reuses the GraphQL test harness in `frontend/common/graphql/test/`:

- `lifecycle.ts` — `setupTestServerLifecycle()` (port allocation, start/stop)
- `testServer.ts` — spawns `next start` when mode is production
- `testPort.ts` — `getTestServerMode()` defaults to production for any run under `test/ui/`

**GraphQL integration tests** (`frontend/common/graphql/test/`) still use the **dev** server by default. Do not change that unless explicitly requested — `test-helper` mutations are blocked in production `NODE_ENV`.

## E2E Conventions

- Import lifecycle from `@/test/ui/e2e/lifecycle` — call `setupBrowserLifecycle()` at module scope
- Login helpers: `test/ui/e2e/helpers.ts` (`loginAsDemoUser` via `Bun.fetch`, not Playwright `context.request`)
- No `happydom-preload` in E2E — conflicts with Playwright
- No `waitForTimeout` / `networkidle` — use auto-waiting Playwright assertions
- Auth cookies: `AUTH_COOKIE_SECURE=false` in `.env.test` so `http://localhost` works in production mode

### E2E Translation Rules (CRITICAL — No Hardcoded Strings)

**NEVER hardcode user-facing text strings in E2E test assertions.** All text that appears in the UI must be obtained via the translation system. This is a strict requirement — no exceptions.

E2E tests are **server-side tests** (they run in Node/Bun, not the browser DOM). They use `getDefaultTranslations()` from `@/shared/locale/server` — a **no-parameter** function that returns translations for the app's default locale. The locale is determined by the app's default locale setting, not by the test.

**Never pass a specific locale to `getTranslations("ar")` or `getTranslations("en")` unless the test explicitly tests locale-switching behavior.** The default locale comes from the translation/locale provider — it's not a secret.

```typescript
import { getDefaultTranslations } from "@/shared/locale/server";

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const tr = (s: string): RegExp => new RegExp(escapeRegExp(s), "i");

const T = getDefaultTranslations().dashboardTranslations;
const dashboard = T.studentPortalDashboard;
const NEXT_CLASS = tr(dashboard.nextClass);
```

**For exact match (e.g., button text):**
```typescript
const trExact = (s: string): RegExp => new RegExp(`^${escapeRegExp(s)}$`, "i");
const JOIN_BUTTON = trExact(dashboard.joinNow);
```

**For functional translations (functions that return strings):**
```typescript
const resultsCountPattern = escapeRegExp(sched.resultsCount("\\d+", "\\d+")).replace(/\\\\d\+/g, "\\d+");
const SEARCH_OUTCOME = new RegExp(`${resultsCountPattern}|${escapeRegExp(sched.noResults)}`, "i");
```

**For `selectOption({ label })`:** Use the raw string value (not a regex):
```typescript
await attendanceSelect.selectOption({ label: lr.present });
```

**For `aria-label` selectors:** Use `escapeRegExp` on the translation value:
```typescript
page.locator(`button[aria-label="${escapeRegExp(common.notifications)}"]`)
```

**Access pattern:**
- `getDefaultTranslations()` returns the full `Translations` object
- Access via `.dashboardTranslations.<namespace>.<key>`
- Other top-level: `.commonTranslations`, `.uiTranslations.phoneInput`, `.errorsTranslations`

### What Counts as "Hardcoded" in E2E (Prohibited)

- **Arabic/English UI labels** — e.g., `"متصل"`, `"Connected"` — must come from `getDefaultTranslations()`
- **Button text, badge text, headings, descriptions** — any text rendered by the app
- **Alert/error messages** — use translated strings from the appropriate namespace

### What is Acceptable in E2E (NOT "Hardcoded")

- **Technical test data** — URLs, HTTP status codes, error codes
- **Person names in test input** — input data, not rendered translations
- **Provider names** — e.g., `"Zoom"`, `"Google Meet"` are brand names, not translatable UI text

## Component Test Conventions

- Preloads: `test/ui/test-env.ts`, `happydom-preload.ts`, `next-dynamic-mock.ts`, **`translation-preload.ts`**
- Use `TestWrapper` for Apollo mocks — never hit a real server
- See `frontend/common/components/ui/AGENTS.md` for component test structure

## Translation Rules (CRITICAL — No Hardcoded Strings)

**NEVER hardcode user-facing text strings in test assertions.** All text that appears in the UI must be obtained via the translation system. This is a strict requirement — no exceptions.

### Why This Matters

The project uses a compile-time translation system (`shared/locale/`). Arabic/English strings live in locale files, not in code. Tests must assert against the same strings the components render, which come from the translation system. Hardcoding strings creates brittle tests that break when translations change and violates the i18n architecture.

### Setup

**`translation-preload.ts`** must be in the `--preload` chain for all component tests. It preloads all meeting-related translation namespaces at module level using `readTranslation` + top-level `await` so that `readTranslation` returns synchronously during tests. Without this, Suspense returns empty bodies on the first render.

The preload file maintains an array of `NamespaceHandle` objects and calls `readTranslation(handle, locale)` for each. When you use a new translation namespace in tests, add its handle to the array in `translation-preload.ts`.

### Translation Helper — `readTranslation` (Client Path)

Tests are **client tests** — they must use the client translation path, not server translations. Use the existing `readTranslation(handle, locale)` function from `@/shared/locale/client/translation-cache-store` — the same function `useAppTranslation` calls internally. **Do NOT use `getServerTranslations` or any server-side translation helper.** **Do NOT create custom per-locale helper functions** (no `getArTranslation`, `getEnTranslation`, etc.).

```typescript
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.MeetingUrlStatus, locale);
// now use labels.urlPending, labels.urlReady, etc. in assertions
```

`readTranslation` is NOT a React hook — safe to call at module level. It returns labels synchronously after preload, or throws a Promise (Suspense) if the namespace isn't cached yet. The `translation-preload.ts` file pre-warms the cache so this never throws in tests.

### Define `locale` Once Per Test File

Define `locale` as a `const` at the top of the test file. Pass the same `locale` value to both `readTranslation` calls and the `TestWrapper`:

```typescript
const locale: AppLocale = "ar";
```

**Locale should NOT be deterministic** unless the test specifically tests locale-switching behavior. Don't single-source the locale from a central config — a simple `const locale: AppLocale = "ar"` per file is the correct approach.

### `TestWrapper` Must Receive the Same `locale`

The `TestWrapper` sets up `LocaleProvider` → `TranslationProvider`, which provides the translation context that `useAppTranslation` reads from. It must receive the same `locale` as your `readTranslation` calls:

```typescript
render(<Component />, {
  wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
});
```

Or use `renderWithWrapper` which accepts `locale` as an option:
```typescript
renderWithWrapper(<Component />, { locale });
```

### Two Test Patterns

**Pattern 1 — Component accepts `labels` prop:**
```typescript
const labels = readTranslation(Translation.Dashboard.SettingsMeetingIntegrations, locale);
render(<Component labels={labels} />, {
  wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
});
expect(screen.getByText(labels.connectedAccounts)).toBeInTheDocument();
```

**Pattern 2 — Component uses `useAppTranslation` internally:**
```typescript
const labels = readTranslation(Translation.Dashboard.MeetingGeneration, locale);
render(<Component />, {
  wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
});
expect(screen.getByText(labels.generationStatusSuccess)).toBeInTheDocument();
```

### What Counts as "Hardcoded" (Prohibited)

- **Arabic/English UI labels** — e.g., `"متصل"`, `"Connected"`, `"تمت المصادقة"` — must come from `readTranslation(handle, locale)`
- **Button text, badge text, headings, descriptions** — any text rendered by the component
- **Alert/error messages** — use translated strings from the appropriate namespace

### What is Acceptable (NOT "Hardcoded")

These are test data, not UI labels — they do NOT need translation:

- **Custom override strings** — e.g., `"Custom Copy Label"` passed as a prop to test label override behavior
- **Technical test data** — URLs (`"https://meet.example.com/abc"`), HTTP status codes (`"200 OK"`), error codes (`"AUTH_FAILED"`), response times (`"150ms"`)
- **Person names in test input** — e.g., `"أحمد محمد"`, `"سارة"` are input data, not rendered translations
- **Provider names** — e.g., `"Zoom"`, `"Google Meet"` are brand names, not translatable UI text

### MUI v9 Class Name Gotchas

When asserting on MUI component classes (e.g., Alert severity):

- `MuiAlert-colorError` / `MuiAlert-colorWarning` (NOT `standardError` / `standardWarning`)
- Check via `element.className.includes("MuiAlert-colorError")` rather than testing-library text matchers

### Text Broken Across Elements

Some components render combined text (e.g., `"{label}: {value}"`) in a single paragraph. `getByText` with exact string match will fail. Use:

- `screen.getByText(new RegExp(labels.testPanel.authSuccess))` — regex matcher
- `screen.getByText(content => content.includes(labels.someLabel))` — function matcher
- `element.textContent.includes(labels.someLabel)` — direct DOM check on a parent element

### Namespace Handle Discovery

The `Translation` constant in `@/shared/locale/namespaces/translation` provides typed access to all namespaces. Common meeting-related handles:

| Handle | Keys |
|--------|------|
| `Translation.Dashboard.MeetingUrlStatus` | `urlPending`, `urlReady`, `urlFailed`, `urlExpired`, `joinMeeting`, `copyUrl`, `retryUrlGeneration`, `urlNotGenerated`, `setupMeetingConfig` |
| `Translation.Dashboard.OAuthFlow` | `statusConnected`, `statusNotConnected`, `statusExpiring`, `statusExpired`, `expiresInDays(n)`, `statusAriaLabel` |
| `Translation.Ui.MeetingConfig` | Nested: `join.*`, `enhancements.*`, `manager.*`, `reauthNeeded.*` |
| `Translation.Dashboard.SettingsMeetingIntegrations` | Flat + nested: `connectedAccounts`, `provider.*`, `status.*`, `actions.*`, `testPanel.*` |
| `Translation.Dashboard.MeetingGeneration` | `generationStatusPending`, `generationStatusSuccess`, `generationStatusFailed`, `generationRetry`, `generationShowDetails`, `generationHideDetails` |
| `Translation.Profile.Notifications` | Nested `connectAccount.*`: `connectButton`, `connectingLabel`, `connectedAs(email)`, `disconnectButton`, `reconnectButton`, etc. |

### Apollo Mock Requirement

When a component uses `useQuery` internally (e.g., `MeetingConfigFormDialog` queries `meetingProviders`), the test must provide an Apollo mock via `renderWithWrapper`'s `mocks` option:

```typescript
import { meetingProvidersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { Operations } from "@/frontend/common/graphql/generated/gql/operations";

const mock = {
  request: { query: meetingProvidersQueryDocument, variables: { activeOnly: true } },
  result: { data: { meetingProviders: [/* ... */] } satisfies Operations.MeetingProvidersQuery },
};

renderWithWrapper(<Component />, { mocks: [mock] });
```


## Shared Test Helpers (Duplication Elimination)

Test files sharing identical mock setup (navigation, router, session activation) should import from shared helpers instead of defining inline mocks:

- **Navigation mocks:** `test/ui/components/helpers/mockNavigation.tsx` — Next.js router mock, pathname mock, router state
- **Session activate button tests:** `test/ui/components/helpers/sessionActivateButtonTests.ts` — shared test logic for activate/deactivate button
- **Student history fixtures:** `test/ui/components/fixtures/studentHistoryFixtures.ts` — shared test data shapes

See `docs/testing/mock-navigation-helpers.md` for the complete pattern reference.

## Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.

