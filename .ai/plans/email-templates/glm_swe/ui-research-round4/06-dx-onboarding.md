Agent is idle (waiting for messages). agent_id: r4-dx-onboarding, agent_type: explore, status: idle, description: R4: Validate v8 §X DX, elapsed: 751s, total_turns: 1

[Turn 0]
I now have comprehensive evidence. The e2e tests use **`bun:test` + the `playwright` package directly** (not `@playwright/test`), so for X6 the spec should use `playwright`'s Axe integration pattern, not `@playwright/test`'s `test.extend`. Let me compile the final report.

---

# Round 4 Validation Report — v8 §X (Developer Experience & Onboarding)

## 1. Validation Summary Table

| Sub-§ | Topic | Status | Gaps Remaining |
|-------|-------|--------|----------------|
| X1 | Single-Command Bring-Up | **INVALID** | 5 |
| X2 | GraphQL Schema Descriptions | **PARTIAL** | 3 |
| X3 | Merge-Tag Guide | **PARTIAL** | 2 |
| X4 | Mock Email Adapter | **INVALID** | 6 |
| X5 | Adapter Authoring Guide | **PARTIAL** | 4 |
| X6 | Visual Regression / axe | **INVALID** | 5 |
| X7 | Storybook addon-a11y CI Gate | **VALID** | 1 |

**Total remaining gaps: 26**

---

## 2. Detailed Findings Per Sub-Section

### X1. Single-Command Email System Bring-Up — INVALID

**Codebase claims verified:**
- ✅ No `bun run email:setup` script exists in `package.json` (confirmed — scripts block lines 5–59).
- ❌ **Spec claim "seed default templates" is unsupported**: `backend/db/seeds/` has **no `email` seed directory** — only `auth, billing, books, classes, complaints, lms, meeting, notifications, parents, prompts, students, teachers, users`. Email templates are **not seeded yet**, and `grep` for `emailTemplate`/`email_templates` in `backend/db/seeds/` returns nothing. X1 cannot "seed default templates" until §Y3 (seed phase correction) resolves *where* email seeds live.
- ❌ **Spec claim "`bun run db seed`" is the wrong command**: `package.json` has no `db:seed` script. The actual seed is invoked via the `bun db` interactive CLI (`scripts/dbActions/index.ts` → `cli.ts`), selecting option "2. Seed Database", or non-interactively via `bun run db -- seed` / `bun run db --seed` (`cli.ts:44-52`). The seed runs `backend/db/scripts/drizzleSeed.ts`. **The spec must specify the exact non-interactive invocation, not the non-existent `bun run db seed`.**
- ✅ `dev` script exists: `next dev --turbopack -p 3000 -H [IP_REDACTED]` (line 6).

**Orchestration gaps (P0-blocking):**
1. **No `concurrently` package** in deps, and the spec doesn't say how to spawn processes. However, the codebase already has strong `Bun.spawn` precedent in `scripts/safe-dev.ts` (full lint-queue + dev-server orchestration pattern, lines 1–50). **Spec must say "mirror `scripts/safe-dev.ts` using `Bun.spawn`"** — not the dead-end `concurrently`.
2. **Spec says "Start `bun run dev` on port 3000" but doesn't handle the existing `dev:safe` / `dev:inspect` variants.** X1 should pick one (recommend `dev:safe` since it pre-starts the lint queue — a DX nicety).
3. **"Open `/en/admin/email-templates` in browser" — this admin route does not exist.** `find` for an `email-templates` directory under `app/`/`frontend/` returns nothing (only the plan dir `.ai/plans/email-templates/`). The route path must be cross-referenced to the §L/§M admin UI spec; X1 cannot assume it.
4. **`docs/email/quickstart.md` — `docs/email/` directory does not exist.** See X3.
5. **No cross-reference to §Y3 (seed phase contradiction).** X1 step 1 (`bun run db seed`) directly contradicts §Y3 which says seeds must move to Phase 2 because the table exists only in Phase 2. A developer reading X1 alone will seed before the table exists and crash. **X1 must be gated behind "Phase 2 deploy step" or carry a §Y3 forward-pointer.**

### X2. GraphQL Schema Descriptions — PARTIAL

**Codebase claims verified:**
- ❌ **Spec path wrong**: `backend/graphql/pothos/email-templates/` **does not exist**. Pothos objects live in `backend/graphql/pothos/{domain}/{name}.pothos.ts` (e.g., `auth/auth.pothos.ts`, `billing/billing-alerts.pothos.ts`). Spec path needs correction; likely target is `backend/graphql/pothos/email-templates/email-template.pothos.ts` (to be created).
- ✅ **Description convention is real and strong**: 166 occurrences of `description:` across `backend/graphql/pothos/`. Example in `auth/auth.pothos.ts:24` — `description: "Input for the demo fast login mutation."`. So the spec's claim is valid AND there's a precedent to cite.
- ✅ GraphQL Playground (Apollo Sandbox) shows descriptions from schema introspection — adding `description` will surface them.

**Remaining gaps:**
1. **No mention of the codegen pipeline.** `package.json` has `generate:gqlSchema` → `backend/graphql/generateGqlSchema.ts` and `codegen`. Descriptions added in Pothos must survive the SDL generation step; spec doesn't warn that some Pothos plugins strip descriptions unless `*PrintSchemaPlugin*` is configured. Add a verification step: "regenerate SDL via `bun run generate:gqlSchema`, confirm descriptions in `schema.gql`."
2. **No enum/arg description examples given** — only a `t.field` example. The codebase adds `description` to input fields too (e.g., `auth.pothos.ts:29`). Spec should show enum + arg + interface + union description patterns.
3. **No lint/CI gate to prevent future objects without descriptions.** Spec is one-shot; without an eslint rule (`@graphql-eslint/require-description`) the convention decays. Recommend adding `require-description` rule to codegen/eslint config — currently `@graphql-eslint/eslint-plugin` is a devDep but no rule is cited.

### X3. Merge-Tag System Usage Guide — PARTIAL

**Codebase claims verified:**
- ❌ **`docs/email/` does not exist.** The docs structure is `docs/{domain}/{topic}.md` (e.g., `docs/graphql/dataloader-batching.md`, `docs/drizzle/neon-http-client.md`, `docs/services/entity-cache-service.md`). Creating `docs/email/merge-tags.md` follows the existing pattern — good — but the spec should acknowledge the directory must be created and added to any doc index.
- ⚠️ The merge-tag system itself (`EmailPropsByScope`, `EmailPropsByScope[scope]`, the picker UI) is **referenced in §P1/§P8 but not yet implemented**. X3 can only document what §P specifies; the spec should mark the doc as "write after §P1/§P8 land" with a dependency note.

**Remaining gaps:**
1. **No doc-index / sidebar registration step.** Storybook has `addon-docs`; if merge-tag docs are MDX stories, that's a different path than `docs/email/*.md`. Spec doesn't say which surface (repo `docs/` vs Storybook MDX) — pick one.
2. **No example of `{ user, invoice, items, total }` per-scope table anchored to a real `EmailScope` enum.** Spec says "e.g." — but the authoritative list is whatever `EmailScope` enum ships (§ references "13 EmailScopes" in Y5). Spec should bind X3's variable table to the actual `EmailScope` enum values, not a placeholder example.

### X4. Mock Email Adapter for Local Dev — INVALID

**Codebase claims verified:**
- ❌ **Spec path is wrong on two counts:**
  - Spec says `backend/services/communication/adapters/MockEmailAdapter.ts`. Actual adapter home is `backend/services/communication/channels/email/{provider}/{Provider}EmailAdapter.ts` (e.g., `channels/email/resend/ResendEmailAdapter.ts`). The spec path omits `channels/` and the provider subdirectory convention.
  - Spec says "Registered in `EmailProviderRegistry`" — **no such class exists**. The registry is `EmailChannelFactory.ts` (`channels/email/EmailChannelFactory.ts`). It uses a singleton + `getEmailProvider()` that hardcodes `EmailProvider = "resend"` (`IEmailChannel.ts:25`) and warns on anything else (`EmailChannelFactory.ts:19-22`).
- ✅ `MockEmailAdapter` does not exist (confirmed — no `*EmailAdapter*` match except Resend).
- ❌ **`.env.example` default is `EMAIL_PROVIDER=resend`** (`.env.example:176`), not `mock`. Spec's "default in `.env.example`" is a real, valid change — but the spec doesn't acknowledge the `EmailProvider` type union in `IEmailChannel.ts:25` is currently `type EmailProvider = "resend"`. **It MUST be widened to `"resend" | "mock"`** (and later SES/postmark/etc per ENV_KEYS_GUIDE §2.1) or the factory's `provider !== "resend"` branch will log a warning and silently fall back. Spec doesn't mention this type widening.

**Interface requirements (actionable, good news — interface is small):**
`IEmailChannel` (`IEmailChannel.ts:19-23`) requires 3 methods:
- `send(payload: EmailPayload, locale?): Promise<EmailSendResult>`
- `validateConfig(): Promise<boolean>`
- `disconnect(): Promise<void>`

`MockEmailAdapter` is trivially implementable. **Remaining gaps:**
1. **Spec says "logs HTML to `logger.info` + writes to `/tmp/email-mock-{timestamp}.html`"** but the interface's `send` returns success/failure and creates a `notificationDeliveries` row (see `ResendEmailAdapter.ts:122-131` `createEmailDelivery`). **Does MockEmailAdapter also write a delivery row?** Spec is silent. If it doesn't, the audit trail diverges between mock and real. If it does, what `providerMessageId` does it use? Spec must specify.
2. **`logger.info` will dump raw HTML into structured JSON logs** (the `logger` is a structured logger, `backend/lib/logger`). This pollutes logstreams. Spec should say "log a one-line summary + path, NOT the full HTML body." The HTML body goes only to the `/tmp/` file.
3. **No cross-reference to §W2 (mock factories).** §W2 creates Apollo GraphQL mock factories for tests; §X4 creates a *provider*-level mock adapter for local dev. These are **different mocks for different layers** but a reader will confuse them. Spec should clarify: "X4 = outbound email mocking (provider layer); W2 = GraphQL response mocking (transport layer)."
4. **No "how to view the file" DX.** After writing `/tmp/email-mock-{ts}.html`, spec should add: `email:setup` (X1) opens the latest mock file in the default browser, or a `bun run email:mock:last` helper prints the path and `xdg-open`s it.
5. **The factory's hard-coded `"resend"` fallback warning (`EmailChannelFactory.ts:19-22`) must be updated to recognize `"mock"`** — spec doesn't list this as a code change site.
6. **The `EmailChannelFactory.createEmailChannel` only calls `createResendAdapter`** (`EmailChannelFactory.ts:60-64`). Spec doesn't say to add a `createMockAdapter` branch — implicit but missing from the spec.

### X5. Adapter Authoring Guide — PARTIAL

**Codebase claims verified:**
- ✅ Gotchas live only in the plan (confirmed — no `docs/email/adapters.md` exists, no `docs/email/` at all).
- ✅ `.ai/plans/email-templates/ENV_KEYS_GUIDE.md` is comprehensive — already documents per-provider env keys (Resend §3.1, SESv2 §3.2, and presumably Postmark/Mailgun/SMTP further down). **This is a critical resource the §X5 spec completely ignores.** The adapter guide should *link to* `ENV_KEYS_GUIDE.md`, not duplicate it.

**Remaining gaps:**
1. **Spec mentions "Postmark base64-only, Mailgun `inline` top-level, SESv2 10MB cap"** — but these are the *only* gotchas it enumerates. The plan elsewhere describes more (inline-CID handling per-W7, retry/DLQ per-§S, `notificationDeliveries` row convention). X5 says "per-provider checklist" but doesn't enumerate the full set — a developer must re-read the plan to find them. **Spec should list every gotcha inline or have a checklist template.**
2. **`validateConfig` pattern is referenced but no signature shown.** The interface (`IEmailChannel.ts:21`) requires `validateConfig(): Promise<boolean>`. Spec should show the Resend pattern (`ResendEmailAdapter.ts:215-226`) as the template.
3. **"delivery-row convention" is mentioned but not defined.** Resend creates a delivery row via `NotificationRepository.createDelivery` and updates it on success/failure (`ResendEmailAdapter.ts:122-131, 165-182`). Every adapter must follow this. Spec should cite this as the contract.
4. **No mention that only Resend adapter currently exists.** SES/Postmark/Mailgun/SMTP adapters are *future work* per ENV_KEYS_GUIDE §2.1 (`EMAIL_PROVIDER?: "resend" | "ses" | "postmark" | "mailgun" | "smtp"`). The guide is forward-looking; spec should say so.

### X6. Visual Diff / Visual Regression — INVALID

**Codebase claims verified:**
- ❌ **`@axe-core/playwright` is NOT installed** — grep only hits plan/research files, no `package.json` match. Valid gap.
- ❌ **Spec says install `@axe-core/playwright` and write `test/ui/e2e/email-templates.a11y.test.ts` using it — but the test runner architecture is wrong.** Existing e2e tests use **`bun:test`** (`import { describe, expect, test } from "bun:test"`) + the **`playwright` package directly** (`import type { BrowserContext, Page } from "playwright"`), NOT `@playwright/test`. `@playwright/test` is **not** a devDep; `playwright` and `@playwright/test`-via-`@vitest/browser-playwright` are. **Spec must specify the bun:test + playwright integration pattern, not the `@playwright/test` `test.extend` pattern that `@axe-core/playwright` docs assume.**
- ⚠️ `@vitest/browser-playwright` IS a devDep, and there's `vitest.config.ts` — but the actual e2e suite (`test/ui/e2e/*.test.ts`) uses `bun:test`, not vitest. Two parallel test runners exist. Spec doesn't reconcile.
- ❌ **No `playwright.config.ts` at repo root** — only `chatwoot/tests/playwright/playwright.config.ts` (a vendored sub-project, irrelevant to the main app). The main app has no Playwright config because it uses the bare `playwright` package + `test/ui/e2e/lifecycle.ts` lifecycle helpers. Spec must reference `lifecycle.ts`'s `createContext()`/`setupBrowserLifecycle()`.

**Remaining gaps:**
1. **Test invocation command missing.** E2e tests run via `test:ui:e2e` (`package.json:38`) with `TEST_SERVER_MODE=production bun --env-file=.env.test test test/ui/e2e/`. Spec should cite this exact invocation.
2. **The test needs a running app server.** `lifecycle.ts` presumably starts one — spec doesn't say whether the a11y test reuses `loginAsDemoUser` (admin) + `gotoAppRoute` helpers (per `admin-dashboard.test.ts:6`). Admin auth is required for `/en/admin/email-templates`.
3. **No a11y rule selection.** axe has tagsets (`wcag2a`, `wcag2aa`, `best-practice`). Spec doesn't specify which ruleset, violating the §J/§V a11y contract.
4. **Chromatic "deferred to post-launch — specify as a Phase 5 todo" — but no Phase 5 section exists** (plan stops at Phase 3/Y8). Either add Phase 5 or move the Chromatic todo to a known backlog location. `@chromatic-com/storybook` IS a devDep (line 172) but unused.
5. **`@axe-core/playwright` API assumes `@playwright/test`'s `Page` type.** With bare `playwright` the integration is `AxeBuilder(page)` — but spec doesn't show the import/run snippet, leaving the dev to research compatibility.

### X7. Storybook addon-a11y CI Gate — VALID (1 minor gap)

**Codebase claims verified:**
- ✅ `.storybook/preview.tsx:76-82` confirms `a11y: { test: "todo" }` with comments explaining `"todo"` vs `"error"` vs `"off"`. Spec's line reference is exact.
- ✅ Plan §J "warnings do not fail CI" claim is consistent with `test: "todo"`.
- ✅ `@storybook/addon-a11y@^10.5.5` is installed (devDep line 190).
- ✅ `@storybook/addon-vitest@^10.5.5` IS installed (devDep line 195) — so X7's prerequisite "(b) `@storybook/addon-vitest` wired" is partially satisfied (installed); the spec should verify it's *wired into `.storybook/main.ts`*, not just installed.

**Remaining gap:**
1. **Spec says "after all email-template stories pass axe" but doesn't give a triage step for existing violations.** Flipping `"todo"` → `"error"` globally will break CI for *any* pre-existing story with violations, not just email-template stories. **Spec should scope the gate** — e.g., `a11y.test = "error"` only when `tags.includes("email-template")` (Storybook supports `a11y.test` per-story via parameters, or via the `tags`-based `test` override in newer addon-a11y). Global flip is too risky.

---

## 3. New Gaps Discovered During Validation (NOT in original audit)

| # | Gap | §X | Evidence |
|---|-----|----|----|
| N1 | **Email seed directory does not exist in `backend/db/seeds/`** — X1 step 1 cannot run; spec contradicts §Y3. | X1 | `ls backend/db/seeds/` shows no `email` dir; §Y3 lines 1815-1818 |
| N2 | **`bun run db seed` is not a valid command** — actual path is `bun db` interactive CLI or `bun run db -- seed`. | X1 | `package.json:57` (`"db": "bun --no-env-file run scripts/dbActions/index.ts"`), `cli.ts:44-52` |
| N3 | **`EmailProvider` type is hardcoded to `"resend"` only** — widening to `"mock"` is a required code change not listed in X4. | X4 | `IEmailChannel.ts:25`: `export type EmailProvider = "resend";`; `EmailChannelFactory.ts:19-22` warns on non-resend |
| N4 | **"EmailProviderRegistry" class does not exist** — real name is `EmailChannelFactory`; spec uses a phantom symbol. | X4 | `EmailChannelFactory.ts` |
| N5 | **Adapter directory layout is `channels/email/{provider}/`** — spec's `adapters/` path is wrong. | X4 | `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts` |
| N6 | **E2e tests use `bun:test` + bare `playwright`, not `@playwright/test`** — X6 must use `bun:test` pattern. | X6 | `test/ui/e2e/admin-dashboard.test.ts:1-2` |
| N7 | **No repo-root `playwright.config.ts`** — e2e lifecycle managed by `test/ui/e2e/lifecycle.ts`, not a config file. | X6 | glob matches only `chatwoot/...` |
| N8 | **`.ai/plans/email-templates/ENV_KEYS_GUIDE.md` already documents per-provider env keys** — X5 ignores this existing resource (duplication risk). | X5 | `ENV_KEYS_GUIDE.md` §3.1-3.2 |
| N9 | **Admin route `/en/admin/email-templates` does not exist yet** — X1's browser-open step is forward-looking without a §L/§M cross-ref. | X1 | `find` for `email-templates` dir returns only the plan dir |
| N10 | **Pothos description SDL-survival through codegen not verified** — `generate:gqlSchema` may strip descriptions; spec has no verify step. | X2 | `package.json:19` `generate:gqlSchema` |
| N11 | **No `@graphql-eslint/require-description` lint rule cited** — without enforcement, the X2 convention decays. | X2 | `@graphql-eslint/eslint-plugin` is devDep but no rule listed |

---

## 4. Cross-Reference Audit (§X ↔ §W/§Y)

- **§X ↔ §W2 (mock factories): ABSENT.** §X4 (provider mock) and §W2 (GraphQL mock factories) are different layers but never disambiguated. A dev will confuse "MockEmailAdapter" (X4) with "email-template GraphQL mocks" (W2). **Add explicit "X4 ≠ W2" note.**
- **§X ↔ §Y3 (seed phase): ABSENT and CONTRADICTORY.** X1 step 1 seeds templates; §Y3 says seeds must move to Phase 2 because the table doesn't exist until Phase 2. **X1 must either be a Phase-2 deploy step or carry a hard §Y3 dependency.** Currently a dev following X1 in Phase 1 will crash.
- **§X ↔ §Y8 (deployment order): ABSENT.** Y8 defines Phases 0-3; X1's bring-up belongs in Phase 2 (DB schema + seeds + UI). Not referenced.
- **§X ↔ §K (Storybook stories): PARTIAL.** X6 says "15 Storybook stories" but doesn't cross-ref §K's story inventory or confirm that count. X7's "all email-template stories pass axe" needs the §K story list as a checklist.

---

## 5. Top-5 Actionable Recommendations for v9

1. **Fix all filesystem paths in §X4 and §X1.** Replace `backend/services/communication/adapters/MockEmailAdapter.ts` → `backend/services/communication/channels/email/mock/MockEmailAdapter.ts`; replace `EmailProviderRegistry` → `EmailChannelFactory`; replace "`bun run db seed`" → "`bun run db -- seed` (option 2 of `scripts/dbActions`), which runs `backend/db/scripts/drizzleSeed.ts`". These phantom symbols make §X4 and §X1 unbuildable without guessing. Cite `scripts/safe-dev.ts` as the `Bun.spawn` orchestration precedent (no `concurrently` dependency needed).

2. **Add an "Email Seeds Do Not Exist Yet" precondition block to X1**, cross-referencing §Y3. X1 step 1 should read: "Once §Y3 moves email seeds into Phase 2 and `backend/db/seeds/email/` is created, this step runs `bun run db -- seed`. Until then, X1 is blocked by §Y3." Gate X1 behind Phase 2 per §Y8 deployment order (line 1849).

3. **Widen the `EmailProvider` type union in X4 as an explicit code change**: `export type EmailProvider = "resend" | "mock"` (file `IEmailChannel.ts:25`), and update `EmailChannelFactory.getEmailProvider()` (lines 15-25) to recognize `"mock"` without the "Invalid EMAIL_PROVIDER" warning. Specify that `MockEmailAdapter.send()` writes a `notificationDeliveries` row with `providerMessageId: "mock-{timestamp}"` (matching the Resend delivery-row contract, `ResendEmailAdapter.ts:122-131`) and logs only a one-line summary (NOT the full HTML body) to `logger.info` — full HTML goes to `/tmp/email-mock-{timestamp}.html` only.

4. **Rewrite X6 for the actual test runner** (`bun:test` + bare `playwright` package, per `test/ui/e2e/admin-dashboard.test.ts:1-2` and `test/ui/e2e/lifecycle.ts`). Specify: import `AxeBuilder` from `@axe-core/playwright`, call `await new AxeBuilder(page).withTags(["wcag2a","wcag2aa"]).analyze()` inside a `bun:test` `test()` block, run via `bun run test:ui:e2e` — NOT `@playwright/test`. Include the admin-auth setup (`loginAsDemoUser` + admin demo user) since `/en/admin/email-templates` is gated. Resolve the Chromatic "Phase 5" forward-pointer to a concrete backlog location (no Phase 5 section exists yet).

5. **Add a cross-reference matrix to §X header** mapping each subsection to its dependencies and downstream consumers: X1→§Y3 (seed phase), §Y8 (Phase 2), §L/§M (admin route); X2→`generate:gqlSchema` codegen + add `@graphql-eslint/require-description` lint rule; X3→§P1/§P8 (merge-tag impl), §K (story inventory); X4→§W2 (disambiguate mock layers); X5→`ENV_KEYS_GUIDE.md` (link, don't duplicate) + `notificationDeliveries` row contract; X6→§K (15 stories) + `test/ui/e2e/lifecycle.ts`; X7→§J (CI gate policy) + scope the `"error"` flip to email-template stories only.