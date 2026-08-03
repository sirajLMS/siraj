# 05 — Storybook & Component-Test Patterns (email-template UI plan)

Audits the existing Siraj Storybook + test conventions so the email-template UI plan can enumerate every story / test / e2e file it must add. All findings cite absolute file paths and line numbers.

---

## 1. Storybook configuration

| Item | Value | Source |
|---|---|---|
| Framework | `@storybook/nextjs-vite` | `.storybook/main.ts:18` |
| Stories glob | `../frontend/**/*.stories.@(js|jsx|mjs|ts|tsx)` | `.storybook/main.ts:9` |
| Addons | `@chromatic-com/storybook`, `@storybook/addon-vitest`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-mcp`, `msw-storybook-addon` | `.storybook/main.ts:10-17` |
| Path alias | Vite `viteFinal` → alias `@` → repo root, plus react-leaflet package.json shims | `.storybook/main.ts:20-33` |
| Static dir | `../public` | `.storybook/main.ts:19` |

Note: there is **no `@storybook/addon-interactions`** addon registered. Interactions add-on is not in use.

## 2. Story file pattern (CSF3)

Imports from `@storybook/nextjs-vite`, component via `@/` alias, `satisfies Meta` is NOT used — the repo uses the explicit `Meta<typeof C>` annotation + `StoryObj` type alias pattern. Representative files:

**`frontend/views/auth/login/LoginView.stories.tsx`** (presentational, no GraphQL):
- L1-2: import `Meta, StoryObj` from `@storybook/nextjs-vite`; import component via `@/frontend/...`.
- L6-9: a thin `*WithLabels` wrapper that pulls `useAppTranslation(Translation.Auth.Login)` for i18n labels.
- L11-34: `const meta: Meta<typeof LoginViewWithLabels> = { title, component, tags: ["autodocs"], parameters, args, argTypes }`.
- L36-37: `export default meta; type Story = StoryObj<typeof LoginViewWithLabels>;`.
- L39-43, L45-55: `export const Default: Story = { args: {...} }` and `Demo` variant.

**`frontend/common/views/dashboard/search-schedule/SearchScheduleContainer.stories.tsx`** (with GraphQL mocks + Zustand store override):
- L1: `import { MockedProvider } from "@apollo/client/testing/react";`
- L56-93: build `searchMocks` array of `{ request: { query, variables }, result: { data } }`.
- L102-127: `decorators: [Story => { useSearchScheduleStore.setState({...}); return <StoryBookPageContainer><MockedProvider mocks={searchMocks}><Story/></MockedProvider></StoryBookPageContainer>; }]` — the per-story decorator pattern for (a) resetting Zustand store state and (b) providing Apollo `MockedProvider`.

Import pattern:
- `import { Meta, StoryObj } from "@storybook/nextjs-vite";`
- `import { C } from "@/frontend/common/views/.../<C>";` (or `@/frontend/mobile|desktop/...`)
- `import { MockedProvider } from "@apollo/client/testing/react";` (when story needs GraphQL)
- `import { useXStore } from "@/frontend/common/stores/xStore";` (for store seeding in the decorator)

## 3. Mock stores

- **No `__mocks__` directory convention exists** under `frontend/` for Zustand stores — verified (`find frontend -type d -name __mocks__` returns nothing).
- Store override pattern in stories: call `useXStore.setState({...})` **inside the story decorator** before rendering — see `SearchScheduleContainer.stories.tsx:104-118`.
- In component tests the same `setState` pattern is used, plus reset in `afterEach` (see `SearchScheduleContainer.test.tsx:99-109`) — typically `useUserStore.setState({ permissions: [] }, false)` and the domain store reset.
- The Storybook global wrapper (`StoryWrapper`) **seeds the user store** with an all-permissions admin user by default — `.storybook/StoryWrapper.tsx:89-173` (`useUserStore.setState({...})` in a `useEffect`). Stories inheriting this do not need to set permissions unless they want a more restricted user.

## 4. Apollo mock

- In **stories**: `MockedProvider` from `@apollo/client/testing/react` is applied **per-story as a decorator** (NOT a global preview decorator). See §2 above. There is no global Apollo decorator in `.storybook/preview.tsx`.
- In **component tests**: Apollo is mocked via `TestWrapper`'s `mocks` prop → constructs `ApolloClient` with a `MockLink` — `test/ui/components/TestWrapper.tsx:61-80`. Pass `mocks: MockLink.MockedResponse[]` to `renderWithWrapper` — `TestWrapper.tsx:100-118`.
- Default fetch policy in tests: `query: { errorPolicy: "all", fetchPolicy: "no-cache" }` — `TestWrapper.tsx:66-77`.
- Mocks shape: `MockLink.MockedResponse[]` with `{ request: { query: <DocumentNode>, variables }, result: { data } | error: new Error(...), maxUsageCount }` — see `SearchScheduleContainer.test.tsx:166-192`, `253-263`.
- MSW addon is installed (`msw-storybook-addon`) and globally loaded (`.storybook/preview.tsx:55-63`) with handlers from `.storybook/msw-handlers.ts` (currently empty array). Stories rely on it via the loader; per-story MSW handlers go in `parameters.msw`.

## 5. i18n decorator

- Locale is a **Storybook `globalType`** with toolbar toggle (AR / EN), default `ar` — `.storybook/preview.tsx:19-30`.
- The global `StoryWrapper` reads `context.globals.locale` and wraps the story in `<LocaleProvider locale={locale}>` — `.storybook/StoryWrapper.tsx:67-68, 186`. It also sets `document.documentElement.lang = locale` and `dir` (rtl for ar) — `StoryWrapper.tsx:55-62`.
- Stories get translation labels two ways:
  1. Via a `*WithLabels` wrapper component calling `useAppTranslation(Translation.<Namespace>)` at render time (see `LoginView.stories.tsx:6-9`).
  2. Containers that internally call `useAppTranslation` get the namespace automatically since `LocaleProvider` is in the global wrapper.
- **No** dedicated `i18nDecorator` storybook decorator file exists; the locale wiring is built into `StoryWrapper` + the `locale` global.

## 6. Theme decorator

- Theme is a **`globalType`** with toolbar toggle (light/dark, default `dark`) — `.storybook/preview.tsx:32-41`.
- `StoryWrapper` reads `context.globals.theme`, builds the MUI CSS-vars theme via `createAppCssVarsTheme(direction, locale, themeMode)` — `StoryWrapper.tsx:67-75`, and bridges to MUI `useColorScheme()` + DOM `data-theme` / `data-mui-color-scheme` attrs via `StorybookColorSchemeBridge` — `StoryWrapper.tsx:38-65, 198`.
- ThemeContext is also provided (`mode`, `toggleTheme` no-op) — `StoryWrapper.tsx:78-87, 187`.
- There is **no separate theme decorator story file**; light/dark toggle is the Storybook toolbar.

## 7. Component test pattern

- **Test runner**: **`bun:test`** (`import { describe, expect, test, mock } from "bun:test"`) — NOT Vitest for component tests. (`test/ui/components/dashboardContainer.test.tsx:1`). Vitest is used **only** for the Storybook `@storybook/addon-vitest` project (`vitest.config.ts`).
- **DOM**: Happy DOM — preload via `test/ui/components/happydom-preload.ts` (`test/ui/AGENTS.md` "Component Test Conventions"; `package.json test:ui:components:coverage` script preloads it).
- **Matchers**: `@testing-library/jest-dom/matchers` extended via `expect.extend(matchers)` — `dashboardContainer.test.tsx:19-22`, `SearchScheduleContainer.test.tsx:59-63`.
- **Apollo mock**: via `TestWrapper` `mocks` prop (see §4). No real server.
- **Rendering**: `renderWithWrapper(<C />, { permissions, mocks, locale, themeMode, viewport })` from `@/test/ui/components/TestWrapper` — `TestWrapper.tsx:108-118`. `render` from `@testing-library/react`. No `renderHook` usage observed in representative tests; ViewModel hooks are unit-tested separately (per `frontend/common/components/ui/AGENTS.md:222,228-235`).
- **Interactions**: asserted via `@testing-library/react` queries (`screen.getByText`, `findByText`, `getByRole`, `getByLabelText`) + `toBeVisible()`/`toBeNull()` jest-dom matchers, and `waitFor` for async — `SearchScheduleContainer.test.tsx:204-296`. No `userEvent`/`playInteraction` imported in samples.
- **Mocking next/navigation**: `mock.module("next/navigation", ...)` and `mock.module("@/shared/i18n/...")` at top of test file before imports — `SearchScheduleContainer.test.tsx:8-55`.
- **Cleanup**: `afterEach(() => { cleanup(); useUserStore.setState({...}, false); useXStore.setState({...}); })` — `SearchScheduleContainer.test.tsx:99-109`.

Test structure convention (`frontend/common/components/ui/AGENTS.md:227-235`): mirror component dir under `test/ui/components/<domain>/` with `<Name>.mobile.test.tsx`, `<Name>.desktop.test.tsx`, `<Name>View.test.tsx`, `use<Name>ViewModel.test.ts`.

## 8. Coverage

- **No frontend 100%-coverage rule.** The 100%-coverage mandate applies only to backend `b/repo/` tests (`.agents/instructions/tests.instructions.md:75-78`).
- UI component tests use Bun's built-in coverage (`bun test --coverage`); `@vitest/coverage-v8` is a dep for the Storybook addon vitest project (`package.json:37`). Coverage scripts: `test:coverage`, `test:ui:components:coverage` (`package.json:24,37`).
- `frontend/common/components/ui/AGENTS.md:219-235` requires: test both mobile *and* desktop variants separately, unit-test the ViewModel hook, test the switcher with mocked `useViewport`, never test implementation details, use Storybook stories as visual regression baselines.

## 9. E2E (Playwright via bun:test)

- Pattern: `test/ui/e2e/*.test.ts` using **Playwright driven by `bun:test`** (production server via `next start`, requires `bun run build:test`) — `test/ui/AGENTS.md`.
- Lifecycle: `import { setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle"; setupBrowserLifecycle();` at module scope — spawns chromium + the test Next prod server (`test/ui/e2e/lifecycle.ts:7-21`).
- Per-test: `context = await createContext()` (desktop 1280×720) or `createMobileContext()`, `page = await context.newPage()` — `admin-dashboard.test.ts:21-24`.
- Login: `loginAsDemoUser(page, context, DEMO_USERS.<groupSlug>)` via `Bun.fetch` (NOT Playwright `context.request`) — `test/ui/e2e/helpers.ts:208`. Demo users defined at `helpers.ts:10`.
- Nav: `gotoAppRoute(page, "/path")` — `helpers.ts:242`. Close via `closeE2eSession(page, context)` in `afterEach` — `helpers.ts:248`.
- No `waitForTimeout`/`networkidle` — use Playwright auto-waiting (`await page.getByText(...).waitFor({ state: "visible" })`) — `admin-dashboard.test.ts:40-49`.
- **No page-object layer**: tests inline their selectors. Helpers file holds only login/nav utilities.
- Representative happy-path: `test/ui/e2e/admin-dashboard.test.ts` (login → assert visible elements → filter → assert empty state → mobile variant asserts no `.MuiDataGrid-root`).

## 10. Accessibility

- `@storybook/addon-a11y` installed and configured with `test: "todo"` (violations shown in UI only, **not** failing CI) — `.storybook/main.ts:13`, `.storybook/preview.tsx:76-82`.
- **No `@axe-core/playwright` or `jest-axe`** dependency (`package.json` lacks both). No a11y assertions in component tests or e2e. Visual a11y review is manual via the addon toolbar only.

## 11. Visual regression

- **Chromatic** is configured via `@chromatic-com/storybook` addon (`package.json:172`, `.storybook/main.ts:11`). No `chromatic.config` file present — relies on addon defaults (or `.chromaticrc`/CLI env at publish time).
- **No Percy.** **No Playwright `toHaveScreenshot`** usage in existing e2e — visual diffs are Chromatic-story-based, captured at Storybook publish.
- `frontend/common/components/ui/AGENTS.md:225` explicitly states "use Storybook stories as visual regression baselines."

---

## Existing pattern — copy-paste-ready skeleton

### Story (with GraphQL mock + Zustand store override)

```tsx
// frontend/desktop/views/dashboard/email-templates/emailTemplatesList.desktop.stories.tsx
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StoryBookPageContainer } from "@/frontend/common/components/ui/story/StoryBookPageContainer";
import { EmailTemplatesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/email";
import { useEmailTemplateEditorStore } from "@/frontend/common/stores/emailTemplateEditorStore";
import { EmailTemplatesListDesktopView } from "@/frontend/desktop/views/dashboard/email-templates/emailTemplatesList.desktop";

const mockList = [
  {
    request: { query: EmailTemplatesQueryDocument, variables: { first: 10, page: 1 } },
    result: { data: { emailTemplates: { id: "list", totalCount: 1, items: [{ id: "tpl-1", __typename: "EmailTemplate" }] } } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];

const meta: Meta<typeof EmailTemplatesListDesktopView> = {
  title: "Views/dashboard/email-templates/EmailTemplatesListDesktop",
  component: EmailTemplatesListDesktopView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    Story => {
      useEmailTemplateEditorStore.setState({ isDirty: false, selectedScope: null, dialogOpen: null });
      return (
        <StoryBookPageContainer>
          <MockedProvider mocks={mockList}>
            <Story />
          </MockedProvider>
        </StoryBookPageContainer>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof EmailTemplatesListDesktopView>;

export const Default: Story = { args: {} };

export const Empty: Story = {
  decorators: [
    Story => (
      <MockedProvider
        mocks={[{ request: { query: EmailTemplatesQueryDocument, variables: { first: 10, page: 1 } }, result: { data: { emailTemplates: { id: "list", totalCount: 0, items: [] } } } }]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
```

### Component test (bun:test + Happy DOM + mocked Apollo)

```tsx
// test/ui/components/email-templates/emailTemplatesList.desktop.test.tsx
import { mock } from "bun:test";

mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en", id: undefined }),
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), refresh: mock(() => {}), replace: mock(() => {}), prefetch: mock(() => {}) }),
  usePathname: () => "/email-templates",
  useSearchParams: () => new URLSearchParams(),
  redirect: () => {},
}));

import { afterEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { EmailTemplatesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/email";
import { useEmailTemplateEditorStore } from "@/frontend/common/stores/emailTemplateEditorStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { EmailTemplatesListDesktopView } from "@/frontend/desktop/views/dashboard/email-templates/emailTemplatesList.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  useEmailTemplateEditorStore.setState({ dialogOpen: null, isDirty: false, selectedScope: null });
});

const mockList = (overrides: Partial<MockLink.MockedResponse> = {}): MockLink.MockedResponse[] => [
  {
    request: { query: EmailTemplatesQueryDocument, variables: { first: 10, page: 1 } },
    result: { data: { emailTemplates: { id: "list", totalCount: 1, items: [{ id: "tpl-1", __typename: "EmailTemplate" }] } } },
    maxUsageCount: Number.POSITIVE_INFINITY,
    ...overrides,
  },
];

describe("EmailTemplatesListDesktopView", () => {
  test("renders list rows when permission granted and data returns", async () => {
    renderWithWrapper(<EmailTemplatesListDesktopView />, {
      locale: "en",
      permissions: [AppPermission.EmailTemplatesList], // TBD per plan todo 5
      mocks: mockList(),
    });

    expect(await screen.findByText(/email templates/i)).toBeVisible();
  });

  test("shows error state when query fails", async () => {
    renderWithWrapper(<EmailTemplatesListDesktopView />, {
      locale: "en",
      permissions: [AppPermission.EmailTemplatesList],
      mocks: [{ request: { query: EmailTemplatesQueryDocument, variables: { first: 10, page: 1 } }, error: new Error("boom"), maxUsageCount: Number.POSITIVE_INFINITY }],
    });

    expect(await screen.findByText(/failed to load/i)).toBeVisible();
  });
});
```

### E2E skeleton (Playwright via bun:test)

```ts
// test/ui/e2e/email-templates.test.ts
import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { closeE2eSession, DEMO_USERS, gotoAppRoute, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

let context: BrowserContext;
let page: Page;

afterEach(async () => {
  await closeE2eSession(page, context);
  page = undefined as unknown as Page;
  context = undefined as unknown as BrowserContext;
});

describe.serial("Email Templates admin flow", () => {
  test("admin lists templates and opens editor", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
    await gotoAppRoute(page, "/email-templates");

    await page.getByRole("heading", { name: /email templates|قوالب البريد/i }).waitFor({ state: "visible" });
    const editBtn = page.getByRole("button", { name: /edit|تحرير/i }).first();
    await editBtn.click();

    await page.getByText(/design|التصميم/i).first().waitFor({ state: "visible" });
    expect(await page.getByRole("button", { name: /save|حفظ/i }).first().isVisible()).toBe(true);
  });
});
```

---

## Plan components — required story / test / e2e files

Enumerated from `.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md:781-840` (Frontend section) and `:952-953` (test strategy: "emailTemplatesList.desktop.test.tsx, emailTemplateEditor.desktop.test.tsx" + e2e for admin flow). New files below follow the tier-switcher convention of `frontend/common/components/ui/AGENTS.md:227-235` (test both mobile + desktop + ViewModel + switcher).

| # | Component (plan ref) | Story file | Component test file(s) | E2E file |
|---|---|---|---|---|
| 1 | `useEmailTemplatesListViewModel.ts` (L786) | relevant story below | `test/ui/components/email-templates/useEmailTemplatesListViewModel.test.ts` | — |
| 2 | `EmailTemplatesListView.tsx` switcher (L787) | `frontend/common/views/dashboard/email-templates/EmailTemplatesListView.stories.tsx` | `test/ui/components/email-templates/EmailTemplatesListView.test.tsx` (mocked `useViewport`) | — |
| 3 | `EmailTemplatesListContainer.tsx` (L788) | `frontend/common/views/dashboard/email-templates/EmailTemplatesListContainer.stories.tsx` | `test/ui/components/email-templates/EmailTemplatesListContainer.test.tsx` (permission gating) | — |
| 4 | `emailTemplatesList.mobile.tsx` (L795) | `frontend/mobile/views/dashboard/email-templates/emailTemplatesList.mobile.stories.tsx` | `test/ui/components/email-templates/emailTemplatesList.mobile.test.tsx` | — |
| 5 | `emailTemplatesList.desktop.tsx` (L799, explicit in test strategy L952) | `frontend/desktop/views/dashboard/email-templates/emailTemplatesList.desktop.stories.tsx` | `test/ui/components/email-templates/emailTemplatesList.desktop.test.tsx` | covered by `test/ui/e2e/email-templates.test.ts` (list → editor) |
| 6 | `useEmailTemplateEditorViewModel.ts` (L789) | relevant story below | `test/ui/components/email-templates/useEmailTemplateEditorViewModel.test.ts` | — |
| 7 | `EmailTemplateEditorView.tsx` switcher (L790) | `frontend/common/views/dashboard/email-templates/EmailTemplateEditorView.stories.tsx` | `test/ui/components/email-templates/EmailTemplateEditorView.test.tsx` | — |
| 8 | `EmailTemplateEditorContainer.tsx` (L791) | `frontend/common/views/dashboard/email-templates/EmailTemplateEditorContainer.stories.tsx` | `test/ui/components/email-templates/EmailTemplateEditorContainer.test.tsx` | — |
| 9 | `emailTemplateEditor.mobile.tsx` (L796) | `frontend/mobile/views/dashboard/email-templates/emailTemplateEditor.mobile.stories.tsx` | `test/ui/components/email-templates/emailTemplateEditor.mobile.test.tsx` | — |
| 10 | `emailTemplateEditor.desktop.tsx` (L800, mount `@react-email/editor`; explicit in test strategy L952) | `frontend/desktop/views/dashboard/email-templates/emailTemplateEditor.desktop.stories.tsx` | `test/ui/components/email-templates/emailTemplateEditor.desktop.test.tsx` | `test/ui/e2e/email-templates.test.ts` (editor save flow — getJSON → save mutation → preview iframe; explicit todo item at plan L964) |
| 11 | `EmailEditorWrapper.tsx` (common layer, L803-815 — browser-only dynamic import) | covered by the editor view stories (mounts `EmailEditor` from wrapper) | `test/ui/components/email-templates/EmailEditorWrapper.test.tsx` (asserts `ssr:false` lazy import behavior + that tier views import from wrapper, not `@react-email/editor` directly) | — |
| 12 | `frontend/common/stores/emailTemplateEditorStore.ts` Zustand (L838) | n/a (no story) | `test/ui/components/email-templates/emailTemplateEditorStore.test.ts` (dirty state, dialog open, serialization — File/Blob kept out) | — |
| 13 | GraphQL documents sub-dir `frontend/common/graphql/sharedDocuments/email/` (L823-828) | n/a | covered by ViewModel tests via mocked `MockLink` responses | — |
| 14 | Admin routes `app/(dashboard)/email-templates/page.tsx` (list) + `app/(dashboard)/email-templates/[id]/page.tsx` (editor) (L833-836) | n/a (page is server, no story) | n/a (page tests are e2e) | `test/ui/e2e/email-templates.test.ts` (page load + permission gating) |
| 15 | React Email scaffold template components (L872+ — `ComplaintResponseEmail`, `InvoiceGeneratedEmail`, etc.) | optional `frontend/**/emails/<Email>.stories.tsx` (render-once visual baselines — useful for Chromatic but plan does not mandate) | n/a (rendered via service tests) | — |

**Single E2E file** for the whole admin happy path is sufficient (mirrors `admin-dashboard.test.ts`): `test/ui/e2e/email-templates.test.ts`. The plan explicitly calls for "E2E test under `test/ui/e2e/` for the admin email-templates flow (requires `bun run build:test`)" — plan L953, and editor-save-flow E2E at L964.

### Why editor view tests don't fully exercise the TipTap editor
`@react-email/editor` mounts TipTap which touches `window` at module load — under Happy DOM it must be dynamically imported via `EmailEditorWrapper` (`ssr:false`). Component tests render the desktop tier view; the editor itself may need to be `mock.module`-stubbed in `*.desktop.test.tsx` to avoid Happy DOM limitations (mirror the `mock.module` next/navigation pattern). The real editor save flow (getJSON → mutation → preview) is reserved for E2E per plan L964.

---

## Coverage rule — what the new files must achieve

1. **Frontend has NO 100%-coverage mandate.** The repo's 100% rule is scoped to backend `repo/` tests only (`.agents/instructions/tests.instructions.md:75-78`). Email-template UI files are not held to 100%.
2. **Mandatory UI test structure** (`frontend/common/components/ui/AGENTS.md:219-235`):
   - Write component tests under `test/ui/components/` mirroring component structure.
   - Test **both mobile and desktop variants separately** (`*.mobile.test.tsx`, `*.desktop.test.tsx`).
   - Unit-test **each ViewModel hook in isolation** (`use*ViewModel.test.ts`).
   - Test the **switcher** with mocked `useViewport` (`*View.test.tsx`).
   - Never test implementation details — assert via rendered output / behavior.
   - Provide a **Storybook story as visual regression baseline** for each tier view.
3. **Runner/DOM**: `bun:test` + Happy DOM + mocked Apollo (`TestWrapper`/`renderWithWrapper`); Vitest only for the `@storybook/addon-vitest` story smoke project.
4. **Coverage script**: `bun run test:ui:components:coverage` (`package.json:37`) — collect and review, but no enforced threshold for UI.
5. **E2E**: requires `bun run build:test` first; production server via `next start`; use Playwright auto-waiting only.
6. **i18n lockstep**: any new `EmailsLabels` extensions (plan L860) must update **both** `emailsEn` and `emailsAr` atomically — a missing impl is a compile error, so tests pass only when both ship together.
7. **a11y**: addon set to `todo` (warnings only). New components should aim zero a11y violations in the addon panel but CI will not fail; keep `test: "todo"` unless the plan upgrades to `"error"`.
