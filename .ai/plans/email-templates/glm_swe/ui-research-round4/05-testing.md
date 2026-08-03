Agent is idle (waiting for messages). agent_id: r4-testing, agent_type: explore, status: idle, description: R4: Validate v8 §W testing, elapsed: 751s, total_turns: 1

[Turn 0]
I have all the information needed. Compiling the validation report now.

---

# v8 §W (Testing Depth) — Round 4 Validation Report

## 1. Validation Summary Table

| Sub-section | Status | Remaining Gaps | Core Issue |
|---|---|---|---|
| **W1** GraphQL Test Dir | **PARTIAL** | 4 | No `email/` dir; `testClient` is **integration** (server-spawning), NOT MockedProvider — spec conflates two layers |
| **W2** Mock Factory Pattern | **INVALID** | 5 | `createSearchMock` does NOT exist; precedent is inline `searchMocks` array in `.stories.tsx`, factories unjustified |
| **W3** Fixture Factory | **PARTIAL** | 3 | Precedent (`adminDashboardFixtures.ts`) uses plain `as const` arrays + `createDailyScheduleRow` with **required overrides** (not `Partial<T>`) — spec's `Partial<T>` signature diverges |
| **W4** ViewModel Hook Tests | **PARTIAL** | 3 | `renderHook` IS exported by `@testing-library/react@16.3.2` (verified in `pure.js`); working across React 19/Bun is **unproven**; wrapper pattern in spec doesn't match actual `TestWrapper` |
| **W5** Concurrent Publish | **INVALID** | 4 | Email templates schema does NOT exist yet — "already in schema: `email_templates_scope_locale_active_uq`" is a false claim; `runInRollback` handles `40P01` retry NOT constraint-collision assertion |
| **W6** Merge-Tag Tests | **PARTIAL** | 2 | `@react-email/render` confirmed (`render(node, options) → Promise<string>`); no html-assertion library (no cheerio) — string-match only specified |
| **W7** Attachment Tests | **PARTIAL** | 3 | No attachment test precedent; `Buffer.from` used only for base64 cursor decode + storage blob (not attachment flow); Bun test compat unverified |
| **W8** Error-State Matrix | **VALID** | 1 | Precedent confirmed: `SearchScheduleContainer.test.tsx:252` "shows error message when query fails" uses `MockLink` error field + `screen.findByText` — spec mostly matches, lacks import boilerplate |
| **W9** RTL + Responsive | **PARTIAL** | 2 | RTL wrapper EXISTS (`TestWrapper.tsx` default `locale="ar"` → direction=`rtl`, uses `stylis-plugin-rtl`); BUT spec duplicates it; `useViewport` confirmed via `ViewportProvider` prop-injection |
| **W10** Optimistic Rollback | **PARTIAL** | 3 | `MockLink.MockedResponse` supports `error` field for rollback path; spec doesn't specify `cache.restore`/`writeQuery` snapshot pattern; no precedent |
| **W11** DOMPurify Vectors | **PARTIAL** | 3 | `isomorphic-dompurify@3.21` installed; ZERO usage in source/tests; spec doesn't verify Happy-DOM compat (package has `browser.js` override) |

**Totals: 2 INVALID, 7 PARTIAL, 2 VALID | ~33 remaining gaps**

---

## 2. Detailed Findings Per Sub-Section

### W1 — GraphQL Integration Test Directory (PARTIAL)
**Verified facts:**
- `frontend/common/graphql/test/` exists with **18 domain subdirs** (auth, billing, classes...) — **NO `email/` subdir** (`frontend/common/graphql/test/AGENTS.md`).
- `testClient.ts` is an **integration** ApolloClient: `HttpLink` + custom fetch → `getTestGraphqlUrl()` + **dynamic Next.js dev server** (`testServer.ts`/`lifecycle.ts`). `defaultOptions.query.fetchPolicy: "no-cache"`, `errorPolicy: "all"`.
- AGENTS.md rule #10: tests interact *exclusively via GraphQL API* — never import backend repos/schemas/services.

**Gaps:**
1. **No `email` subdir documented in AGENTS.md Layout** — §W must explicitly add `email/` to the Layout taxonomy block.
2. Spec lists `.mutation.test.ts` files but no rule for naming `*.test.ts` vs `*.mutation.test.ts` — convention is single-file-per-domain (see `profile.documents.test.ts`).
3. No spec for provisioning authorized test admin (`loginAndProvision(prefix)` / `provisionTestSuperAdmin`) which AGENTS rule #6 mandates.
4. No mention of `setupTestServerLifecycle()` boilerplate required in every `describe`.

### W2 — Apollo Mock Factory Pattern (INVALID)
**Verified facts:**
- `createSearchMock` does **NOT** exist anywhere (grep across frontend/).
- The actual precedent: `SearchScheduleContainer.stories.tsx` uses a **plain inline `searchMocks: MockLink.MockedResponse[]` array** — not a factory, no factory helper directory.
- `MockedProvider` import is from `@apollo/client/testing/react` (stories) — but UI tests use `MockLink` directly via `TestWrapper`.
- **No `mocks/` factory directory exists in any test/domain** — 18 subdirs contain only `*.test.ts` files (AGENTS rule: "Sub-directories contain only `*.test.ts` files").

**Gaps:**
1. Spec claims a precedent that doesn't exist — recommendation `createSearchMock()` is fabricated.
2. Spec violates AGENTS.md rule: "Sub-directories contain only `*.test.ts` files. They exist purely for organization." A `mocks/` subdir under `test/email/` is **non-conformant**.
3. Mock factories belong in `test/ui/components/email-templates/` (component-test layer), NOT `frontend/common/graphql/test/email/mocks/` (integration layer). Spec conflates the two test layers entirely.
4. No spec for the factory return type (`MockedResponse[]` is correct but the `request.query` field must be the imported `TypedDocumentNode`, not a string — not stated).
5. `createVersionMismatchMock` — no spec on the GraphQL error shape (`extensions.code: "VERSION_MISMATCH"` is correct but `result: { errors: [...] }` vs `{ error: ... }` for `MockLink`'s `error` field is left ambiguous).

### W3 — Test Data Fixture Factory (PARTIAL)
**Verified facts:**
- `test/ui/components/fixtures/adminDashboardFixtures.ts` uses `export const MOCK_SCHEDULE_SEED: readonly MockScheduleSeed[]` (plain readonly array) + `MOCK_SCHEDULE` mapped via `createDailyScheduleRow({...})`.
- The actual factory pattern in `scheduleFixture.ts:30`: `createDailyScheduleRow(overrides: DailyScheduleRowOverrides)` where `DailyScheduleRowOverrides` has **REQUIRED fields** (id, yourTime, teacherTime, scheduledStartAt, outcome...) and a few optional (`status?`, `avatarUrl?`).
- **No `Partial<T>` override pattern exists** — the existing pattern is a **dedicated `Overrides` interface with required fields**, NOT `Partial<EntityType>`.

**Gaps:**
1. Spec's `createEmailTemplateFixture(overrides?: Partial<EmailTemplateReturnType>)` diverges from the real precedent (dedicated `Overrides` interface with required + optional mix). Should mirror `DailyScheduleRowOverrides` style.
2. Fixture path `test/ui/components/fixtures/emailTemplateFixtures.ts` is correct (mirrors `adminDashboardFixtures.ts`) — but spec doesn't note that the existing file uses `createDailyScheduleRow` import composition; email fixtures may need a parallel builder.
3. Default fixture values spec (`{ id: "tpl-001", scope: "INVOICE_GENERATED", locale: "en", status: "PUBLISHED", version: 1 }`) is plausible but `EmailTemplateReturnType` type doesn't exist yet (no email schema src) — spec assumes a type that's not yet built.

### W4 — ViewModel Hook Tests (PARTIAL)
**Verified facts:**
- `@testing-library/react@16.3.2` IS installed; `renderHook` IS exported (verified `grep renderHook node_modules/@testing-library/react/dist/pure.js` → 2 matches; React 19.2.8 installed, renderHook supported).
- But **zero `renderHook` usage in codebase** (grep across frontend/backend/shared).
- Existing UI test pattern: `renderWithWrapper(ui, { mocks, locale, viewport, permissions })` from `test/ui/components/TestWrapper.tsx` — uses `MockLink`, NOT `MockedProvider`.
- §L already lists `useEmailTemplatesListViewModel.test.ts` + `useEmailTemplateEditorViewModel.test.ts`.

**Gaps:**
1. Spec's example code uses `MockedProvider` wrapper, but the codebase pattern is `renderWithWrapper` → `TestWrapper` (builds `ApolloClient`+`MockLink`). Spec diverges from convention — should show: `renderHook(() => useHook(), { wrapper: ({ children }) => <TestWrapper mocks={...}>{children}</TestWrapper> })`.
2. `renderHook`'s interaction with `ViewportProvider`/`LocaleProvider` inside `TestWrapper` is **unproven** (children propagation may differ from `render`) — spec should add a fallback "render a test component that calls the hook and exposes via ref" if `renderHook` chokes.
3. Spec doesn't note that hook tests live in `test/ui/components/email-templates/` per §L (cross-reference missing in §W).

### W5 — Concurrent Publish (Optimistic Lock) Test (INVALID)
**Verified facts:**
- `runInRollback` exists in `backend/db/test/test-utils.ts:18` — signature `runInRollback(fn: (tx: DBTransaction) => Promise<void>)` — uses `db.transaction(...)` + `tx.rollback()`.
- The `40P01`/deadlock logic in `test-utils.ts:148` (`isConcurrentConflictError`) belongs to `retryOnConcurrentConflict` for `setupRlsRole` grant statements — **NOT for assertion**. It's a retry helper, not a `DuplicateScopeLocaleError` catcher.
- **No `email_templates_*` schema exists anywhere** (grep `emailTemplate|email_template` across backend/db/ → empty). The claim "already in schema" is **false** — the schema must be created first, and the unique index asserted to exist.
- `runInRollback` swallows the drizzle rollback error but **re-throws assertion errors** — so a unique-constraint violation would propagate as a raw Postgres error, NOT a domain `DuplicateScopeLocaleError` unless the service maps it.

**Gaps:**
1. Claimed index `email_templates_scope_locale_active_uq WHERE isActive = true` does not exist in schema — spec must be rewritten to "schema must first add this partial unique index (track in §B)".
2. No mapping assertion: spec says "second throws `DuplicateScopeLocaleError`" but `runInRollback` propagates raw `23505` Postgres errors — spec must assert the service/repo translates `23505` → `DuplicateScopeLocaleError` (track in §B/S-specific spec).
3. "Two parallel publish() calls" inside a single `runInRollback` transaction is **sequentially serial** (one transaction, one connection) — true parallelism needs **two separate transactions/connections**, which `runInRollback` does NOT provide. Spec's test design is architecturally impossible.
4. Correct pattern needed: spawn two `db.transaction` blocks with `Promise.all` + expect one to reject with `23505` (precedent: `backend/db/test/logic/scheduling/class_quota_race.test.ts` — NULL).

### W6 — Merge-Tag Substitution Tests (PARTIAL)
**Verified facts:**
- `@react-email/render` installed (exports `render(node, options) → Promise<string>`, also `toPlainText`, `pretty`).
- No `cheerio` installed; existing HTML-output testing in `notification-payloads.builders.ts:149` calls `render(labels)` directly.
- HTML assertion library: none — only `node_modules` string match capability.

**Gaps:**
1. Spec doesn't specify the assertion library: string `.toContain("<p>Ahmed</p>")` works but is brittle; spec should either (a) add `cheerio` devDep, or (b) explicitly endorse string-match with normalized whitespace.
2. Spec's "Date formatting: `{ date: new Date("2026-01-01") }` → locale-formatted date" — react-email renderer does NOT apply locale formatting by default (it renders the React tree); the merge-tag substitution is driven by the user's template component, not a generic formatter. Spec needs to clarify what **the email-template renderer's** merge contract is (likely `{user.name}` interpolation in the template's JSX, NOT react-email-level date formatting).
3. No spec for handling `undefined` vs `null` vs `""` test inputs (different JSX-node rendering paths).

### W7 — Attachment + Inline-CID Tests (PARTIAL)
**Verified facts:**
- Zero attachment tests in backend/ (grep).
- `Buffer.from` precedent: `student-pagination-stability.test.ts:118` (base64 cursor decode), `vercel-blob.integration.test.ts:17` (`Buffer.from(fileContent)` for storage) — NOT attachment flow precedent.
- Per-adapter encoding assertions unverified — adapters don't exist in test surface.

**Gaps:**
1. Spec doesn't specify the test runner: attachment encoding is pure-JS (no DOM), so `bun:test` is appropriate, but spec never says where these files live (`backend/services/notification/<adapter>.test.ts`?).
2. No `Buffer` serialization test assertion pattern in Bun — does `JSON.stringify(Buffer)` produce `{"type":"Buffer","data":[...]}` (would break Resend JSON API)? Spec must assert `content` is base64-string before JSON serialization.
3. No spec for inline-CID assertion: how to assert the `Content-ID: <cid>` header is set per provider is missing.

### W8 — Error-State Test Matrix (VALID)
**Verified facts:**
- Precedent CONFIRMED: `test/ui/components/SearchScheduleContainer.test.tsx:252` — `test("shows error message when query fails")` uses `MockLink.MockedResponse` with `error: new Error("Server error")` + `await screen.findByText("Failed to load availability data.")`.
- Pattern: `bun:test` import, `afterEach(cleanup)`, `mock.module(...)` Next/navigation stubs, `renderWithWrapper(ui, { mocks: [...], permissions: [...] })`.
- `data-testid` convention NOT used in precedent — it relies on `findByText`/`screen.getByText` against **i18n-resolved strings**.

**Gaps:**
1. Spec implies `data-testid` convention ("shows version mismatch UI") but precedent uses **text-based assertions** on i18n strings — spec must reconcile: either assert via the localized text or document a `data-testid` convention NEW for email templates.

### W9 — RTL + Responsive Component Tests (PARTIAL)
**Verified facts:**
- `TestWrapper.tsx` defaults `locale="ar"` → `direction = "rtl"` → uses `createAppTheme(themeMode, "rtl", locale)` + `stylis-plugin-rtl` cache. **RTL wrapper already exists** and is the default.
- `useViewport` exists at `frontend/common/hooks/useViewport.ts:6` + `ViewportProvider` accepts a `viewport` prop (verified in `TestWrapper` → `<ViewportProvider viewport={viewport}>`).
- MUI auto-flips layout via RTL theme + emotion `rtlPlugin`.
- `useDirection` hook: NONE found — the theme direction is set on the `ThemeProvider`, not via a hook for the app.

**Gaps:**
1. Spec says "Add `dir="rtl"` mount with `<ThemeProvider dir="rtl">`" — but the existing `TestWrapper` already handles this via `locale="ar"`; spec should just say `renderWithWrapper(ui, { locale: "ar" })` — **duplicative/contradictory** with the existing helper.
2. Spec says "mock `useViewport`" — but the actual pattern is to **pass `viewport` prop** to `TestWrapper` → `ViewportProvider`, NOT to `mock.module` the hook. Spec mis-prescribes the mechanism.

### W10 — Optimistic Update Rollback Tests (PARTIAL)
**Verified facts:**
- `MockLink.MockedResponse` interface (from `@apollo/client/testing`) supports `error` field for rollback path simulation.
- `TestWrapper` ApolloClient config: `defaultOptions.watchQuery.errorPolicy: "all"`, no `optimistic` config — optimistic responses require the **mutation** to set `optimisticResponse` (not MockLink).
- Zero precedent of optimistic-response testing in repo (grep `optimisticResponse` → 0 in tests).

**Gaps:**
1. Spec doesn't specify HOW to snapshot the cache pre-optimistic and verify restore — `client.cache.extract()` is the Apollo API for this; spec just says "assert `result.current.designJson` matches pre-save snapshot" without the cache.read/write mechanism.
2. "Mock mutation returns error" via `MockLink` — but with `errorPolicy: "all"`, the hook still receives `data` shadowed by optimistic state; spec doesn't clarify the assertion against `result.current.error` vs cache state.
3. No spec on `onQueryUpdated` or cache-gc interaction during rollback.

### W11 — DOMPurify Extended Test Vectors (PARTIAL)
**Verified facts:**
- `isomorphic-dompurify@3.21` installed (devDep). Has `browser.js` override for browser field.
- ZERO usages/tests in codebase (no sanitize fixture file, no vector test).
- Happy-DOM compat: `isomorphic-dompurify` historically needs `jsdom`-style `window` — Happy DOM provides `window` via `GlobalRegistrator.register()` (`happydom-preload.ts`). Compatibility is **NOT verified empirically** here; spec asserts it works.

**Gaps:**
1. Spec doesn't specify the test runner target (`bun:test` with Happy DOM preload, per §L rule). If DOMPurify fails in Happy DOM, fallback is Playwright (`@vitest/browser-playwright`) — spec needs a runner-decision.
2. Vectors list (`<iframe>`, `<object>`, `data:` URLs) is reasonable but spec doesn't assert against DOMPurify `ALLOWED_TAGS`/`ALLOWED_ATTR` config — the email-system plan's sanitizer config should be referenced.
3. No spec on the input method: parse-sting-then-sanitize (`DOMPurify.sanitize(html, { ... })`) returns string — assert `not.toContain("<iframe")` or DOM-parsed assertion (`DOMPurify.sanitize` does strip these by default, so custom config risk).

---

## 3. New Gaps Discovered During Validation (NOT originals)

**G1. §W conflates two distinct test layers.** The plan's W1 (GraphQL integration dir) targets server-spawning `testClient` tests, but W2/W4/W8 mock factories/renderHook belong in the `test/ui/components/email-templates/` **component-test layer** (per §L). The plan never reconciles this — a developer would be unsure where `createEmailTemplatesListMock` lives. The two layers use different runners, different Apollo (`MockLink` vs `HttpLink`), and different AGENTS rules.

**G2. §L vs §W overlap is unspecified.** §L (plan line 831+) already lists 12 required UI test files including `useEmailTemplatesListViewModel.test.ts` and `useEmailTemplateEditorViewModel.test.ts`. §W W4 re-specifies the same hook tests with a 10+ scenario matrix. Neither section references the other — risk of duplicative, contradictory instructions.

**G3. Interaction tests (`play` functions) absent.** §K (Storybook stories around line 806) has NO `play()` interaction-test spec; §W W8/W10 cover the same scenarios as Storybook interaction tests would. The Storybook runner (`@storybook/addon-vitest` Vitest project, `vitest.config.ts:11-26`) supports `play` but §W never says whether the error-state matrix is covered via Storybook `play` or `bun:test` component tests. This duplication / coverage split is unaddressed.

**G4. Test runner matrix never reconciled.** Three runners coexist: (a) `bun:test` backend/GraphQL/UI, (b) Vitest Storybook (`@storybook/addon-vitest` + `@vitest/browser-playwright`), (c) Playwright E2E (`test/ui/e2e/`). §W W6/W7/W11 have ambiguous runner owners; only W8 (component) and W1 (GraphQL) are runner-clear.

**G5. Email schema SRC doesn't exist at all.** Grep across backend/db/ for `emailTemplate`/`email_template` returns **zero hits**. The entire §W testing plan depends on schema, types (`EmailTemplateReturnType`, `EmailTemplateRevisionReturnType`), documents (`emailTemplatesQueryDocument`), sharedDocuments subdir — none of which exist. §W tests cannot be written until §B/S schema/services land.

**G6. `sharedDocuments/email/` subdir doesn't exist.** 23 subdirs under `frontend/common/graphql/sharedDocuments/` (auth, billing, ...) — **no `email/`**. W1 implicitly depends on it; spec should cross-reference the schema-creation work.

**G7. `MockLink.MockedResponse` is the actual type, not `MockedResponse<EmailTemplatesQueryDocument>[]`.** The codebase imports `MockLink.MockedResponse` (see `TestWrapper.tsx`). `@apollo/client/testing`'s `MockedResponse` generic differs; spec's generic annotation may not type-check.

**G8. W5 deadlock handling mis-attribution.** The `40P01` deadlock retry in `test-utils.ts:148` belongs to `setupRlsRole`'s `executeGrantWithRetry`, NOT to assertion of concurrent-publish collisions. Spec misreads the codebase.

---

## 4. Top-5 Actionable Recommendations for v9

1. **Reconcile test-layer split in W2/W4/W8 — eliminate conflated guidance.** W1 covers GraphQL **integration** tests (`testClient`, `frontend/common/graphql/test/email/*.test.ts`, server-spawning). W2/W4/W8/W9/W10 cover **component** tests (`renderWithWrapper` + `MockLink` in `test/ui/components/email-templates/*.test.tsx`). State explicitly which runner + Apollo layer each §W subsection targets, and forbid the §W-suggested `frontend/common/graphql/test/email/mocks/` subdir (violates AGENTS.md "sub-dirs hold only `*.test.ts`"). Put the mock factories in `test/ui/components/email-templates/mocks/` instead.

2. **Mark W5 INVALID and rewrite it.** (a) Add the schema prerequisite — `email_templates_scope_locale_active_uq` partial unique index must land in §B first. (b) Replace `runInRollback(fn)`-single-transaction design with true-parallel: two `db.transaction` blocks in `Promise.all` expecting one `23505` rejection (precedent needed — check `class_quota_race.test.ts` for pattern). (c) Add explicit assertion that the service maps Postgres `23505` → domain `DuplicateScopeLocaleError` — separate from the constraint-trick itself.

3. **Fix W2 precedent citation; rewrite mock-factory spec on `MockLink.MockedResponse` not `MockedResponse<X>[]`.** Replace fabricated `createSearchMock()` reference with the real precedent: inline `searchMocks: MockLink.MockedResponse[]` (`SearchScheduleContainer.stories.tsx`) and `TestWrapper`'s `MockLink` plumbing. Specify factory return type as `MockLink.MockedResponse[]` with `request: { query: TypedDocumentNode, variables }` + `result: { data }` or `error: new Error(...)`. Give concrete factory implementations (1-2 examples) for `createEmailTemplatesListMock` and `createVersionMismatchMock` so devs don't guess the error shape.

4. **Unify W4/W9 against existing `TestWrapper` convention.** W4's `renderHook` example must use `renderWithWrapper`'s wrapper (`<TestWrapper mocks={...} locale="ar" viewport="desktop">`) not raw `<MockedProvider>`. W9 must say "pass `{ locale: "ar" }` to the existing `renderWithWrapper` and `viewport: "mobile" / "desktop"` prop" — NOT "mock `useViewport`" or "add `<ThemeProvider dir="rtl">`" (those already exist in `TestWrapper.tsx:30,77`). Add the `renderHook` fallback recipe (render a `<TestComponent>` that calls the hook) given zero `renderHook` precedent in the repo.

5. **Specify runner + HTML-assertion lib for W6/W11 and add missing W11 Happy-DOM compat guarantee.** (a) W6: explicitly choose string-match (`expect(html).toContain("Ahmed")`) with normalized-whitespace helper, OR add `cheerio` devDep — don't leave devs guessing. (b) W11: state that `isomorphic-dompurify@3.21` + Happy DOM (`happydom-preload.ts`) must run under `bun:test` (single `[test]` section per `bunfig.toml`); if DOMPurify fails there, fallback to Vitest browser project. Add a `data:`-URL-on-`<img>` vector AND `<svg><script>` AND CSS `expression()` vectors to the list. (c) Remove `data-testid` from W8 — precedent is text-based i18n assertions; either commit to text-only or explicitly introduce `data-testid` as a NEW email-templates convention.