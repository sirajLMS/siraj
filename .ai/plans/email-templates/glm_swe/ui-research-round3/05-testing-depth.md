
# Email Template System Plan v7 — Testing Depth Audit Report

**Plan:** `.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md`
**Audit scope:** Test coverage completeness, test data patterns, integration & E2E, visual regression, test infrastructure
**Auditor:** GLM SWE (Round 3, UI Research)
**Date:** 2026-08-02

---

## Summary Table of Gaps

| # | Sev | Area | Gap Description |
|---|-----|------|-----------------|
| G1 | P0 | GraphQL integration tests | Plan lists **zero** test files under `frontend/common/graphql/test/email/`. Required domain sub-dir for email-template queries/mutations (§M) is never specified, despite AGENTS.md mandating per-domain organization. |
| G2 | P0 | Storybook visual baselines | §K item 15 explicitly defers React Email component stories to "Phase 2". No `.tsx` visual baseline for the ~10 React Email templates exists; `render()` smoke (component→HTML) is unverified visually. |
| G3 | P0 | ViewModel hook tests | Plan §L lists `useEmailTemplatesListViewModel.test.ts` + `useEmailTemplateEditorViewModel.test.ts` but specifies **no test patterns** (renderHook/act/waitFor). Codebase has **zero `renderHook` precedent** — new pattern unvalidated. |
| G4 | P0 | Apollo mock factory | No shared mock factory pattern for email-template GraphQL ops (e.g. `createEmailTemplatesMock()`, `createPublishMock()` mirroring `SearchScheduleContainer.test.tsx`'s `createSearchMock`). Plan §L cites `renderWithWrapper(ui, { mocks })` but no per-document mock builders. |
| G5 | P0 | Test data factory | No email-template fixture/factory. `test/ui/components/fixtures/` has only `adminDashboardFixtures.ts`. No `createEmailTemplateFixture()` for scope/locale/status/version/allowedEditorGroups coverage across 12 test files. |
| G6 | P0 | Multi-provider dispatch/fallback | Plan line 1333 mentions SES/Postmark/Mailgun/SMTP smokes but **no test for provider fallback chain** (Resend fail → SES). Fallback behavior the `EmailProviderRegistry` is meant to provide is unverified. |
| G7 | P0 | Concurrent publish (optimistic lock) | SWE v3 test #7 says "two parallel publish() calls on same scope should only succeed once" — but codebase has **no advisory-lock precedent for templates**. Pattern (PG advisory lock vs SELECT-FOR-UPDATE vs unique-index trick) not specified for repo test. |
| G8 | P1 | Component test scope | §L 12 test files list existence + parenthetical scope hints ("permission gating", "dirty state") but **no per-scenario enumeration** (loading/error/empty/access-denied). Coverage matrix missing. |
| G9 | P1 | Error-state tests | Plan §P1/P4/P5/P6 describe rich error states, but **no test file maps to them**. SearchScheduleContainer.test.tsx shows the precedent (`shows error message when query fails`) — plan should mirror that for every list/editor/history surface. |
| G10 | P1 | RTL/mirrored layout tests | §K story line 828 says "Each story provides default / empty / loading / error / RTL variants" — but §L **component tests do not specify an RTL test case**. Only stories cover mirroring; component tests must assert `dir="rtl"` DOM + i18n key fallback. |
| G11 | P1 | Responsive breakpoint tests | §R1 lists 4 breakpoints + §R2 responsive column visibility table, but §L **no responsive test case** specified (e.g. `viewport: "mobile"` mount asserting hidden columns). Switcher tests only mock `useViewport` — no actual breakpoint assertion. |
| G12 | P1 | Optimistic update rollback tests | §Q4 has a detailed optimistic response table for Save/Publish/Archive, but **no test scenario** for rollback (`optimisticResponse` + error → cache snapshot restore). First-use-of-optimistic pattern (line 1007) makes this P1. |
| G13 | P1 | Network retry / RetryLink | §Q7 specs RetryLink (3× backoff, 5xx only) — **no test scenario** asserts retry happens on 5xx and not on 4xx. New infrastructure; needs explicit `createErrorMock({ statusCode: 500 })` test. |
| G14 | P1 | Merge-tag substitution tests | React Email `<Mail>{{user.name}}</Mail>` substitution path is core to rendering, but **no test** verifies merge-tag substitution with sample props. SWE v3 list misses this. |
| G15 | P1 | Attachment handling tests | `EmailPayload.attachments` + `inline-CID` (plan line 411-423) is brand-new. **No test** that adapter encodes Buffer correctly (SES SendEmail v2, Postmark base64, Mailgun form-data, Nodemailer). |
| G16 | P2 | Slug + duplicate-scope-locale tests | SWE v3 #5 covers partial unique index on `isActive=true`, but **no test** for `email_templates_scope_slug_uq` (slug unique) or the `(scope, locale)` active semantics across locales at once. |
| G17 | P2 | History/restore flow tests | §P5 touches restore lifecycle, but §L does not entail a history drawer test file. The `useEmailTemplateEditorViewModel` test should cover restore, but no explicit scenario. |
| G18 | P2 | Search/filter/pagination tests | §P4 + §Q5 specify filter, segmented Active/Archived view, pagination "Show More" — but **no list-view test scenario** asserts pagination, filter reset-to-page-1, segmented Active/Archived. |
| G19 | P2 | Bulk archive optimistic | §P4 specifies optimistic row removal + undo toast (4s). No agent test asserts the optimistic row removal + undo action restores the row. |
| G20 | P2 | Offline/`beforeunload` tests | §P7 spec offline banner + stale-tab poll + `beforeunload` — **no test** simulates `navigator.onLine=false` or `beforeunload` event. Hard to test in Happy DOM; should at minimum spec a Storybook story + a manual-check marker. |
| G21 | P2 | E2E Playwright selectors | §L line 854 says "covers the admin happy path" but **no per-step Playwright selector strategy**. admin-dashboard.test.tsx precedent uses `getByPlaceholder`/`getByText` regexes — plan doesn't pin email-template selectors to i18n keys for resilience. |
| G22 | P2 | `build:test` prerequisite | Plan line 854 + line 1346 mention `bun run build:test` — verified AGENTS.md (test/ui/AGENTS.md:8-11) confirms path → **P2 only because plan doesn't document `.next-test-prod` rebuild triggers** (server code → E2E re-build needed after Phase 2/3 backend changes). |
| G23 | P2 | Visual regression strategy | No `@axe-core/playwright` (research file 05 line — a11y is manual). No Playwright screenshot/visual regression. No Chromatic. **No automated visual diff** despite 15 Storybook stories. |
| G24 | P2 | Storybook play functions (interaction tests) | §K 15 stories are stateless variants; `play`/interaction functions (e.g. 'create' story → assert toast) **not specified**. Research file 05 should set the precedent; plan does not call out usage. |
| G25 | P2 | Storybook addon-a11y assertions | §J line 791 says a11y is "manual per story". No CI gate via `@storybook/addon-a11y` + `@storybook/addon-vitest`. addon-a11y registered but **not asserted as fail-on-violation**. |
| G26 | P2 | mock vs live provider distinction | §20 mentions `describeLiveWhen` for smokes (verified at `test/integration/helpers/describe-live.ts`) but plan does not **enumerate** which assertions are mock-only (service test channel façade) vs live (Reach mock_list/`RESEND_*`). email-channel.test.ts shows façade-mock pattern, resend.integration.test.ts shows live — plan should map both. |
| G27 | P3 | SWE v3 test #1 (safeRender fallback) | Actionable but **missing assertion** that error is logged via logger.error with scope + details. Just "verify fallback HTML is returned and error is logged" — no mock-logger spy pattern. |
| G28 | P3 | SWE v3 test #4 (DOMPurify) | Lists script/onclick/javascript: vectors but **omits `<iframe>`, `<object>`, `data:` URLs** — known DOMPurify bypass vectors relevant to email preview iframe (§12a CSP context). |
| G29 | P3 | SWE v3 test #8 (E2E save) | Lists getJSON → save → preview iframe, but **no assertion on the iframe sandbox='' enforcement** — the CSP hardening (#12a) is unverified at E2E. |
| G30 | P3 | Service test dispatcher routing | SWE v3 #6 covers dispatcher-pipeline; plan does not specify **per-eventType** routing assertions (all 24 → expected scope/null mapping). event-to-scope.test.ts is mentioned (line 746) but only exhaustiveness, not routing-to-renderForSend. |
| G31 | P3 | Feature-flag toggle test | SWE v3 #2 references service test for both flags — but the flag check uses `getBooleanEnv` (V5-2). **No test resets env cache or re-imports the dispatcher** — `resetEnvironmentCache()` pattern (from email-channel.test.ts L4) is the precedent; not called out. |
| G32 | P3 | `runInRollback` pattern documented | Plan line 1329 mentions it but **doesn't specify the `notificationTest` helper pattern** (notification.repository.test.ts L13) that wraps `runInRollback` to assert completion=true. New email-template.repo test should adopt this wrapper. |
| G33 | P3 | Registry type-safety test file location | Plan line 1331 calls for `email-template.registry.types.test.ts` with `// @ts-expect-error` assertions but **doesn't specify path** (likely `backend/services/communication/test/`). |

---

## Detailed Findings Per Area

### 1. Test Infrastructure — `test/ui/`, `TestWrapper`, `happydom-preload.ts`, mock patterns

**Verified infrastructure:**
- `test/ui/components/TestWrapper.tsx` (L1-118): `TestWrapper` with `MockLink` Apollo, RTL cache swap, `ViewportProvider` injected viewport, `LocaleProvider`, `useUserStore.setState(permissions)`. The plan's `renderWithWrapper(ui, { mocks })` (§L line 835) is **correct** — mirror to AGENTS.md L62-64.
- `happydom-preload.ts` is just `GlobalRegistrator.register()` (3 lines) — fine.
- `next-dynamic-mock.ts` precedent exists (per AGENTS.md L62-63); plan §L853 mirrors it for `@react-email/editor`.
- Mobile/desktop isolation scan (`mobile-desktop-isolation.test.ts`) covers `no-restricted-imports` drift — but会不会 cover email-templates via path scan? Verified: walkDir covers `frontend/mobile/views` + `frontend/desktop/views` only (L20-21) → email-template tier views will be scanned automatically once they exist under those roots ✓.

**Plan gaps:**
- (G3, G4, G5) Plan does **not** specify test utilities beyond `renderWithWrapper`. For 12 email-template test files, missing:
  - GraphQL mock builders (per `documents.ts` op): `createEmailTemplatesListMock`, `createEmailTemplateQueryMock`, `createUpsertMutationMock`, `createPublishMutationMock`, `createSendTestMock`, `createPreviewQueryMock`, `createHistoryQueryMock`.
  - A `buildEmailTemplateFixture({...})` factory covering scope/locale/status/version/allowedEditorGroups/compiledHtml/designJson permutations.
  - A `mock.module` stub for `@react-email/editor` (plan §L853 mentions this but should be in a shared pre-test util, not duplicated per file).

### 2. Component Test Coverage (§L lines 831-856, 12 files)

verified against table:
| Component test file | Plan group hint |
|---------------------|-----------------|
| `EmailTemplatesListView.test.tsx` (switcher) | `(mocked useViewport)` |
| `EmailTemplatesListContainer.test.tsx` | `(permission gating)` |
| `emailTemplatesList.mobile/desktop.test.tsx` | tier-split convention |
| `EmailTemplateEditorView.test.tsx` | switcher |
| `EmailTemplateEditorContainer.test.tsx` | — |
| `emailTemplateEditor.mobile/desktop.test.tsx` | tier-split |
| `EmailEditorWrapper.test.tsx` | `(asserts ssr:false lazy import + tier views import from wrapper)` ✓ explicit |
| `emailTemplateEditorStore.test.ts` | `(dirty state, dialog open, serialization — File/Blob kept out)` ✓ explicit |

**Verified SearchScheduleContainer.test.tsx** (the precedent, L194-297) has **8 test cases** covering: permission gating, render-on-permission, skeleton-while-loading, results-on-success, no-results-on-empty, error-on-query-failure, filter-inputs-render, filter-drawer-button. This is the **implicit standard** the plan's email-template tests should match.

**Plan gaps** (G8-G11, G9, G10, G11, G13):
- (G8) Each of the 12 files has only a one-line scope hint; plan does **not** enumerate per-scenario `.test` cases like the SearchSchedule precedent does. Recommend plan append an explicit bullet list per file of "renders permission gating", "renders skeleton while loading", "renders error", "renders empty/no-results", etc.
- (G9) §P1/P4/P5/P6 (lines 882-923) outline rich error states (ErrorState, ConflictDialog, RateLimitDialog, PreviewError) but **no test file maps** to them — `EmailTemplateEditorContainer.test.tsx` should enumerate a "shows VERSION_MISMATCH conflict dialog" test, an "shows RATE_LIMITED countdown" test, etc.
- (G10) "RTL variant" appears only at line 828 (Storybook). Plan §L **never** says component tests assert RTL rendering. Codebase precedent pattern is `renderWithWrapper(ui, { locale: 'ar' })` (TestWrapper L40 default is `'ar'`!) — plan should specify both `locale: 'en'` and `locale: 'ar'` test cases asserting localized strings appear.
- (G11) §R2 has a 4-breakpoint responsive column visibility table, but no test mounts at viewport={mobile}, viewport={desktop} to assert the right `columnVisibilityModel`. Only the switcher test mocks `useViewport` (verified component test convention — `frontend/common/components/ui/AGENTS.md:227-235`, per plan L834) — but the actual mobile/desktop tier tests should assert **column hidden** + **bottom action bar** + **"Show More"** per §R3/R5.

### 3. ViewModel Hook Tests

Plan §L lists both hook test files but **never specifies** how they are mounted. Verified codebase (parallel grep over `frontend/`) has **zero `renderHook` precedent** — the only `act(` hits are in chatwoot Ruby specs (+ UI planning doc L151).

**Verified hooks pattern options from other RTL setups:**
- Mount hook via `renderHook(() => useHook(), { wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper> })` (RTL standard).
- `act()` + `waitFor()` for Apollo `useQuery` settling.

**Plan gaps:**
- (G3) Plan never specifies the hook-mount pattern. Needs explicit `// Mount: renderHook(() => useEmailTemplatesListViewModel(), { wrapper })` per hook test file.
- (W6 verified) Apollo mock consumption pattern is exemplified by SearchScheduleContainer.test.tsx L166-192 — `createTeachersMock()` factory returns `MockLink.MockedResponse[]`. Plan should require each ViewModel test file have its own mock factory for that hook's queries (g4).
- Store interaction tests: plan §Q10 (line 1051) specifies a Zustand/Apollo store delineation, but no test specifies `useEmailListStore.setState({...})` then assert snapshot → "store drives UI; Apollo drives data" boundary. Precedent: SearchScheduleContainer.test.tsx L99-109 `afterEach` resets Zustand store — recommend each email-template test file mirror this in `afterEach`.

### 4. Integration Test Scenarios (§20, line 1333)

**Verified:**
- `test/integration/AGENTS.md` (L1-117) — "one test per file, one API call". ` десcribeLiveWhen` gating pattern at `test/integration/helpers/describe-live.ts` (4 lines). Existing pattern: `resend.integration.test.ts` (L40-81) with `new ResendEmailAdapter()` direct instantiation, `NotificationRepository` `spyOn`-stubbed.
- Service tests (backend/services/AGENTS.md L17-31) require channel façade mocks, never live providers. Existing: `email-channel.test.ts` mocks `emailChannel.send` via `spyOn(emailChannel, "send")`.

**Plan gaps:**
- (G6) Plan line 99 + 1333 lists SES/Postmark/Mailgun/SMTP **smokes** but **no test** for **multi-provider fallback chain** — the `EmailProviderRegistry` is meant to fall back to Resend when a configured provider fails. No `EmailProviderRegistry.test.ts` or `email-channel.fallback.test.ts` asserting `SES fail → Resend succeeds`. This is critical — the whole point of the registry is multi-provider. P0.
- (G26) Mock vs live distinction is clean conceptually (test/integration/AGENTS.md is clear) but the plan does not specify which SES/Postmark/Mailgun test goes where — does the SES adapter test belong in `backend/services/communication/test/ses-adapter.test.ts` (mocked SES SDK via `aws-sdk-client-mock`) AND `test/integration/communication/ses.integration.test.ts` (live)? Plan must specify **both** for each provider.
- **Exact assertions** for each live smoke are not enumerated. Plan should mirror the resend pattern: `expect(result.providerMessageId).toMatch(/[a-f0-9-]{36}/)` or `expect(result.error).toBeDefined()` (resend L63-79).

### 5. E2E Coverage — `test/ui/e2e/email-templates.test.ts`

**Verified** admin-dashboard.test.tsx pattern: `setupBrowserLifecycle()`, per-test `context = createContext()` → `loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug)`, no page-object layer, text assertion via `getByText(regex)` (L8-9). `closeE2eSession()` afterEach. 7 test cases mostly "visible" assertions — broad-stroke smoke, no error-path coverage.

**Plan gaps:**
- (G22) Plan line 854 documents `build:test` requirement — but AGENTS.md (test/ui/AGENTS.md L17) requires rebuild on **server code + middleware + API route changes**. Phase 2/3 backend changes (new GraphQL resolver, new enum, new repo) will invalidate the test bundle; the plan does not note this dependency.
- (G29) Plan happy path: "login → navigate → list renders → click Create → editor opens → save mutation → publish → preview iframe". **No assertion** that the preview iframe has `sandbox=''` and CSP `img-src 'self' data:` headers (per §12a). "Preview iframe assertion" (line 854) is too vague.
- **No E2E error path** — admin-dashboard covers positive-only. Plan should add at least one negative E2E: "non-superAdmin cannot navigate to `/email-templates`" (per `requirePermissionForPage` from todo 17), mirroring dashboardContainer logic.
- (G21) Plan does not prescribe email-template Playwright selectors. Recommend per i18n key (e.g., `page.getByRole('button', { name: new RegExp(`^${t('action.create')}$`, 'i') })`). Not in plan.
- (G23) No Playwright screenshot/visual diff. `page.screenshot({ fullPage: true })` after editor saves for visual regression is absent. P2.
- Plan does not specify **mobile E2E** (`createMobileContext()` per existing admin-dashboard.test.tsx L103) — the tier-split convention requires a mobile e2e happy path per frontend/AGENTS UI test (`.ai/AGENTS_UI_TEST_PLANNNIG.md` enforces both). Plan L854 mentions only desktop happy path.

### 6. Database Test Coverage — `email-template.repository.test.ts`

**Verified** `runInRollback` + `createTestUser` patterns at `backend/db/test/test-utils.ts`. Precedent patterns verified against:
- `notification.repository.test.ts` L13-22 — `notificationTest` wrapper that asserts `completed=true` (so the `runInRollback` body actually executed, not just rolled back).
- `student.repository.test.ts` L51-59 — `testVersionMismatch` helper injects `student.version + 999` and asserts `"version mismatch"` substring.
- `concurrency.test.ts` L101-117 — `verifyOptimisticLock(firstUpdate, secondUpdate, verifyState)` helper.

**Plan gaps:**
- (G32) Plan line 1329 says `runInRollback, never rejects.toThrow inside txn` — but plan does **not** specify the `notificationTest` wrapper convention. Email repo test should adopt the same `emailTemplateTest` wrapper.
- (G7) SWE v3 #7 "two parallel publish() calls" — but **parallel** in a single transaction is impossible; the codebase precedent wraps in sequential `runInRollback`. The actual concurrency prevention is **PG-level**: either advisory lock (see `class_quota_race.test.ts` L236-253 precedent) or unique-index trick (the partial index `email_templates_scope_locale_active_uq` from line 476-478). Plan does not pick a concurrency pattern for the test. If using the unique-index trick, the test asserts that the **second** `setActive` throws a unique-constraint violation, not "publish only succeeds once". Plan must specify.
- (G16) Plan SWE v3 #5 covers `isActive=true` partial unique — but **no test** for:
  - `email_templates_scope_slug_uq` (full unique on scope+slug) — slug collision.
  - `(scope, locale, status)` semantics across multiple locales — partial index only blocks same-locale duplicates, not cross-locale (intended), but no negative assertion.
- **CRUD coverage** appears implicit via list of methods (line 515), but plan does not enumerate tested CRUD ops. Recommend one-test-per-method convention matching student.repository.test.ts (every repo method has at least one success + one error case).

### 7. Service Test Coverage — `email-template.service.test.ts`

**Verified** `email-channel.test.ts` pattern: `beforeEach` `resetEmailChannel()` + `resetEnvironmentCache()` + process.env keys, `afterEach` restore. `spyOn(emailChannel, "send")` via `mockSend` helper. `backend/services/communication/test/` is the correct path (no `*.integration.test.ts` allowed per services/AGENTS.md L33). `communication.service.test.ts` L41-46 confirms dispatcher mock pattern — `beforeEach` spies on all four channels.

**Plan gaps:**
- (G27) SWE v3 #1 (`safeRender` fallback): plan says "verify fallback HTML returned and error logged". The mock-logger spy pattern (`testLogger` at concurrency.test.ts L8) is the precedent — plan must specify `spyOn(logger, 'error')` and assert called with `scope` in message.
- (G31) SWE v3 #2 (feature flag toggle): plan tests both `true`/`false` paths — but must `resetEnvironmentCache()` between flips (precedent at email-channel.test.ts L4, L51/L138/L146). Plan does not call this out — `getBooleanEnv` memoizes env.
- **safeRender** test needs a mock that throws inside `renderEmailTemplate` — but registry throws can come from (a) React Email `render()` async throw, (b) unknown scope (registry guard) — plan only describes (a). The unknown-scope guard at todo 7 ("if (!EMAIL_TEMPLATES[scope]) throw") is reachable in service layer, no test spec.
- **Dispatcher routing** (SWE v3 #6): plan says "dispatch event → map scope → render → channel.send". Verified dispatcher mock pattern at communication.service.test.ts — `beforeEach` spies on all channels. Plan should require per-eventType routing tests (all 24 entries from EVENT_TO_SCOPE). SWE v3 #7 only covers #6, not all enums. (G30)
- **`feature flag toggle`** at the dispatcher level needs `getBooleanEnv` reset (L51 precedent) + the `payload.body` fallback (V4-5 — events with null-scope fallback to passthrough). SWE v3 #3 covers null-scope but the test must assert `payload.body` actually gets sent, not just `skipped: "no_email_scope"` when `body` is null.

### 8. GraphQL Integration Tests — `frontend/common/graphql/test/`

**Verified** `AGENTS.md` (frontend/common/graphql/test/AGENTS.md L1-130): per-domain sub-dir layout, `setupTestServerLifecycle()`, `testClient`, `authenticatedRequest` from `helpers.ts`. Authenticating per request via `loginDemoUser('teacher_default')` + `clearCookies()` patterns at notification-preferences.test.ts L1-63. Property pattern: `authenticatedRequest(token, 'mutate', doc, vars)` then `result.data?.field !== null` guard.

**Plan gaps:**
- (G1, P0) — Plan §M lines 794-801 specifies the GraphQL documents sub-dir, but the corresponding **integration test directory is never named**. Per AGENTS layout convention a new `frontend/common/graphql/test/email/` sub-dir must be created with test files matching each query/mutation document:
  - `email-templates-query.test.ts` (list + detail, including pagination/filter)
  - `email-template-mutations.test.ts` (`create`/`update`/`publish`/`archive`)
  - `send-test-email.test.ts` (mutation — side effect)
  - `preview-email-template.test.ts` (HTML returned for iframe)
  - **Auth scope tests**: unauthenticated (`clearCookies()` → `expect(result.error).toBeDefined()`, per notification-preferences.test.ts L55-62), non-superAdmin (`loginDemoUser('teacher_default')` → expect error), superAdmin success, **impersonation guard** (`ctx.authScopes: notImpersonating: true` per todo 14) → test that a superAdmin impersonating a teacher cannot call the mutation.
- (W8 verified) `testClient` pattern is well-documented; plan just needs to reference it. Currently SWE v3 tests (lines 1338-1346) do **not** reference `testClient` — they say "service test" or "integration test" without naming infra. The `previewEmailTemplate` query returns a raw HTML string — verify that GraphQL test pattern for char/scalar-String fields (notification-preferences.test.ts asserts `Array.isArray` + length, but raw-string queries need a new precedent).

### 9. The 8 SWE v3 Test Cases (lines 1338-1346) — Actionability Audit

| # | Title | Actionable? | Gaps |
|---|-------|-------------|------|
| 1 | safeRender fallback | ✓ actionable | (G27) No logger-error spy assertion stated. |
| 2 | Feature flag toggle | ✓ actionable | (G31) Missing `resetEnvironmentCache()` reset between flips. |
| 3 | Null scope fallback | ✓ actionable | (G7) Should assert that `payload.body === null` returns `skipped: "no_email_scope"` whereas `payload.body !== null` falls back to passthrough — currently says only "verify returns {success:true, skipped:...}", but the v4-5 clarification says passthrough should still send. Test should verify **both** branches. |
| 4 | DOMPurify sanitization | ✓ actionable | (G28) Vectors list omits `<iframe>`, `<object>`, `<embed>`, `data:` URLs — known DOMPurify bypass concerns specifically relevant to email preview iframe (SWE V5-3 at line 1389). |
| 5 | Partial unique index | ✓ actionable | (G16) Missing slug-unique test + cross-locale allowed-duplicates negative assertion. |
| 6 | Full pipeline | ✓ actionable | (G30) Only single event — should enumerate `EventType` per test invocation (parametized loop over EVENT_TO_SCOPE entries). |
| 7 | Concurrent publish | ✓ actionable as idea | (G7) "should only succeed once" — undefined mechanism (advisory lock vs unique-index violation). Need to specify the assertion: `Expected a thrown concurrent-update error or unique violation.`.
| 8 | E2E save flow | ✓ actionable | (G29) No iframe sandbox='' assertion (§12a hardening). |

**Summary**: All 8 exist with at least a one-sentence spec — but **all 8 are missing concrete assertion statements** (which `expect()`). They're actionable as test titles, but the implementation engineer will have to interpret intent for each. P2 — recommend plan annotate every test case with `expect(...)` snippet.

### 10. Missing Test Scenarios — What's NOT Tested

| # | Scenario | Covered? | Priority |
|---|----------|----------|----------|
| 10a | React Email component rendering (`render()` succeeds for every EmailScope component) | ❌ (G2 — deferred to Phase 2) | P0 |
| 10b | Merge-tag substitution (`{user.name}` → real value in rendered HTML for each scope's typed Props) | ❌ (G14) | P1 |
| 10c | Attachment handling (Buffer encoding per provider, inline-CID `<img src="cid:...">`) | ❌ (G15) | P1 |
| 10d | History/restore flow (list versions, restore with conflict dialog) | ❌ (G17) | P2 |
| 10e | Bulk archive (multi-row select → archive → undo toast) | ❌ (G19) | P2 |
| 10f | Search/filter (scope filter, status segmented Active/Archived/All, locale filter) | ❌ (G18) | P2 |
| 10g | Pagination (page reset on filter, "Show More" mobile, total count) | ❌ (G18) | P2 |
| 10h | Optimistic update rollback (Save/Publish/Archive optimistic + error → cache snapshot restore) | ❌ (G12) | P1 |
| 10i | Network retry (RetryLink 5xx → 3x backoff; 4xx no retry) | ❌ (G13) | P1 |
| 10j | Offline behavior (`navigator.onLine=false` banner, `beforeunload`, stale-tab version poll) | ❌ (G20) | P2 |

### 11. Storybook as Test Surface (§K lines 806-826, 15 stories)

**Verified** existing Storybook stories (grep across whole repo) use CSF3 (`Meta<typeof C>` + `StoryObj<T>`), `MockedProvider`, `StoryBookPageContainer`, decorators inline-set Zustand store via `useState`. `SearchScheduleContainer.stories.tsx` L102-127 — exact pattern the plan §K cites.

**Verified** `addon-a11y`, `jest-axe`, `axe-core` grep returns hits **only in plan files + research files** — no CI installation of `jest-axe` or `@axe-core/playwright` in actual dep tree.

**Plan gaps:**
- (G24) **Play functions** — the codebase Stories.es are stateless variants only (`Default: { args: {} }`). The Storybook `play` API exists (Storybook 7+) but is **not used in any Siraj story today** — plan does not specify adding play functions for the email-template stories (e.g. assert `'Create' button exists`, assert clicking 'Create' calls `router.push`). Recommend `import { expect, fn, userEvent, within } from '@storybook/test'` for 5+ key stories.
- (G25) **a11y scans** — §J line 791 says `addon-a11y` warnings do not fail CI — confirmed no `@storybook/addon-vitest` CI gate. Recommend `@storybook/addon-vitest` project with `axe` matcher set to **fail on serious+ critical** violations.
- (G2, G23) **Visual baselines** — §K item 15 says "optional" + "Phase 2". There is no Chromatic / Playwright snapshot baseline infrastructure — confirmed by grep (no `chromatic`, `toMatchSnapshot`, Visual tests). The 15 stories provide interactive visual surface but **no automated visual diff**.
- Story variants (line 828) — "Each story provides default / empty / loading / error / RTL variants" — that's **5 variants × 15 stories = 75 story exports**. Counting verified in §K but plan does not enumerate the export list (e.g. `Default`, `Empty`, `Loading`, `Error`, `Rtl`). Recommended: explicit `export const Empty: Story` line per file.
- (G10) Story RTL variant uses `dir="rtl"` per line 828 — verified `StoryWrapper` cache swap (storybook equivalent of TestWrapper L24-28). But **Storybook has no StoryWrapper file** in our scan — plan line 808 says "Use StoryWrapper" but the existing precedent (SearchScheduleContainer.stories.tsx) uses **inline decorator**, not a StoryWrapper component. Inconsistency between plan (mentions StoryWrapper) and the actual codebase pattern (inline decorator). P3.

---

## Top-5 Actionable Recommendations

### 1. **Add GraphQL integration test directory + author per-document test files (P0) — solves G1**
Create `frontend/common/graphql/test/email/` with at least 4 test files (`email-templates-query.test.ts`, `email-template-mutations.test.ts`, `send-test-email.test.ts`, `preview-email-template.test.ts`). Per-use-case scaffold:
```typescript
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { loginDemoUser, authenticatedRequest } from "@/frontend/common/graphql/test/helpers";
import { testClient, clearCookies } from "@/frontend/common/graphql/test/testClient";
describe("EmailTemplate GraphQL", () => {
  setupTestServerLifecycle();
  test("unauthenticated returns error", async () => {
    clearCookies();
    const r = await testClient.query({ query: EmailTemplatesQueryDocument });
    expect(r.error).toBeDefined();
  });
  test("superAdmin can list", async () => {
    const token = await loginDemoUser("super_admin_default");
    const data = await authenticatedRequest(token, "query", EmailTemplatesQueryDocument);
    expect(data.emailTemplates?.rows.length).toBeGreaterThan(0);
  });
  // + impersonation guard test, + non-superAdmin error test
});
```

### 2. **Add a test data factory + GraphQL mock builders (P0) — solves G4, G5**
Add `test/ui/components/email-templates/fixtures.ts` exporting:
```typescript
export function buildEmailTemplateFixture(overrides?: Partial<EmailTemplateReturnType>): EmailTemplateReturnType {
  return {
    id: overrides?.id ?? `template-${counter++}`,
    scope: overrides?.scope ?? EmailScope.COMPLAINT_RESPONSE,
    name: overrides?.name ?? "Complaint Response",
    slug: overrides?.slug ?? `slug-${counter++}`,
    status: overrides?.status ?? EmailTemplateStatus.DRAFT,
    version: overrides?.version ?? 1,
    locale: overrides?.locale ?? "en",
    designJson: overrides?.designJson ?? { type: "doc", content: [] },
    compiledHtml: overrides?.compiledHtml ?? "<p>hello</p>",
    compiledText: overrides?.compiledText ?? "hello",
    allowedEditorGroups: overrides?.allowedEditorGroups ?? [EmailEditorPermission.SUPER_ADMIN],
    isActive: overrides?.isActive ?? false,
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };
}
```
Plus per-document mock builders (`createEmailTemplatesListMock`, `createEmailTemplateUpsertMock`) mirroring `SearchScheduleContainer.test.tsx:166-192`. Each of the 12 component test files imports these factories — eliminates per-test inline fixtures.

### 3. **Specify hook test patterns + per-scenario assertion plan per §L file (P1) — solves G3, G8, G9, G10, G11**
Append to §L a per-file scenario enumeration table. Example for `EmailTemplateEditorContainer.test.tsx`:
```typescript
// Mount: renderHook(() => useEmailTemplateEditorViewModel({ id }), { wrapper })
const cases = [
  ["renders inspector tabs (Design/Preview/Code) — desktop", { locale: 'en', viewport: 'desktop' }],
  ["renders RTL tabs (تصميم/معاينة/الكود) — arabic", { locale: 'ar', viewport: 'desktop' }],
  ["renders InspectorSkeleton while loading", { mocks: [createLoadingQueryMock] }],
  ["renders 'Failed to load template' on query error + Retry", { mocks: [createErrorQueryMock] }],
  ["Save Draft button shows 'Saving…', toast on success, button reverts", { mocks: [createSaveMock] }],
  ["Shows VERSION_MISMATCH conflict dialog on save", { mocks: [createVersionMismatchSaveMock] }],
  ["Send Test: validates email via zod on blur", { mocks: [] }],
  ["Send Test: shows RATE_LIMITED countdown Alert", { mocks: [createRateLimitedSendMock] }],
];
```
Specify explicitly: (a) every §L file must have at least 5 scenarios; (b) error + loading + RTL required; (c) tier-split tests mount at `viewport='mobile'` AND `viewport='desktop'` per §R1 assertion.

### 4. **Add provider fallback chain test + per-provider SES/Postmark/Mailgun/SMTP smokes (P0) — solves G6, G26**
Add `backend/services/communication/test/email-provider-registry.test.ts`:
```typescript
test("SES failure falls back to Resend", async () => {
  const failingSes = { send: mock(() => ({ success: false, error: "SES down" })) };
  const workingResend = { send: mock(() => ({ success: true, providerMessageId: "r" })) };
  // registry init with [SES, Resend]
  const result = await registry.send(payload);
  expect(failingSes.send).toHaveBeenCalledTimes(1);
  expect(workingResend.send).toHaveBeenCalledTimes(1);
  expect(result.success).toBe(true);
});
```
And the four live smokes under `test/integration/communication/{ses,postmark,mailgun,smtp}.integration.test.ts` per `resend.integration.test.ts` skeleton: `new SesEmailAdapter()` + one API call + `describeLiveWhen(hasSes, ...)`. Plan §20 must enumerate theCy mock-vs-live boundary: SES adapter unit test uses `aws-sdk-client-mock` (issue lookups); SES live smoke uses real AWS endpoint with `SESIAM_*` env keys, gated.

### 5. **Clamp SWE v3 test #7 with assertion mechanism + add a `email-template.registry.render.test.ts` for templates (P0) — solves G2, G7, G14**
- For (#7 concurrent publish): specify `publisher: "Use the `email_templates_scope_locale_active_uq` partial index. Test asserts the **second** `repository.setActive(scope, locale)` after `version` mismatch throws an error containing `unique constraint` or `version mismatch`." — pin the assertion to the **mechanism** the schema will use.
- For (#1 React Email rendering): add `backend/services/communication/test/email-template.registry.render.test.ts` testing every `EmailScope` (loop over enum) → `render(<EmailScopeComponent />, { pretty: false })` resolves to a string containing expected subject + at least one content marker. This is P0 because Phase 1 ships with code-only scaffolds (no UI) — the registry is the only thing Phase 1 delivers and **must have a smoke proving every scope renders**.
- For (#14 merge-tag): add `test("substitutes sample props into rendered HTML", async () => { const { html } = await renderEmailTemplate(EmailScope.COMPLAINT_RESPONSE, { complaintTitle: "Late" }, "en"); expect(html).toContain("Late"); });` — added as SWE v3 #9 (currently unlisted).

---

**Audit complete.** Total gaps identified: **33** (6 × P0, 10 × P1, 12 × P2, 5 × P3).