# SWE Review v5 — Email Template System Plan

## Executive Summary

| Metric | Value |
|---|---|
| **Overall grade** | **B+** |
| **Total NEW issues found** | 10 (0 Critical, 2 High, 4 Medium, 4 Low) |
| **Regressions introduced by v4 fixes** | 0 (zero Critical, zero High) |
| **v1/v2/v3/v4 carryover unresolved** | 0 (all prior issues fully resolved) |
| **v4 fixes that PASS regression check** | 11 of 11 |
| **Comparison with v4** | v4 found 11 issues (1C/3H/4M/3L); v5 finds 10 (0C/2H/4M/4L). Issue count is stable but severity is dropping — no Critical, no regressions. The plan is converging. |

**Bottom line.** All 11 v4 fixes were applied correctly and introduced **zero regressions**. The v4 Critical (the const reassignment in `resetEmailChannel`) is fully resolved. The v5 review finds **no Critical issues and no High regressions**. The 10 new issues are architectural mismatches and convention gaps that prior reviews missed because they focused on compile-time correctness and i18n wiring rather than dispatch runtime semantics, feature-flag type safety, and backend `.tsx` precedent.

The two new High issues (V5-1 dispatcher architecture mismatch, V5-2 boolean env-flag bug) are both fixable with targeted plan-text updates — neither requires rearchitecting the system. Once these are applied, the plan is ready for Phase 0 implementation.

---

## Codebase Verification Results

Each row was verified by an `explore` subagent against the live codebase. A ❌ means the plan's claim does not match reality; ⚠️ means technically defensible but incomplete.

| # | Claim (plan text) | Reality (codebase today) | Match | Impact if mismatched |
|---|---|---|:--:|---|
| 1 | `CommunicationPayload` extension with optional `templateProps?` is non-breaking (lines 529-543) | Type at `backend/types/notifications/communications.types.ts:4-11` has 6 readonly fields, no `templateProps`. Only `switch(payload.channel)` at `communication.service.ts:69` — channel union, unaffected by optional field. 7 consumer files; none destructure exhaustively over the type's fields. | ✅ | None — safe extension |
| 2 | `NotificationEventType` has 24 values; WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION absent (lines 169-203) | Exactly 24 at `backend/enum/notifications/notificationDeliveries.enum.ts:16-41`. Three deferred events confirmed absent. | ✅ | None |
| 3 | `EVENT_CHANNEL_ALLOWLIST` has 14 entries; 10 events fall through to `ALL_ENUM_CHANNELS` (lines 620-635) | 14 entries at `notification-dispatch.helpers.ts:39-62`. Fallback is `?? [...ALL_ENUM_CHANNELS]` at line 389 in `getEventChannels()`. 10 non-allowlisted events confirmed. | ✅ | None |
| 4 | Typed registry pattern (`EmailPropsByScope` + mapped type + `defineEmailTemplate`) matches research file 06 (lines 207-325) | Research file 06 (`06-typed-registry-pattern.md`) documents the corrected pattern at lines 189-300 — exactly matches the plan. `backend/lib/registry.ts` does NOT exist; `createRegistry` is net-new (~30 LOC). | ✅ (design) / ⚠️ (file existence) | Plan implies existing API; implementer must author it. Already flagged in v4. |
| 5 | `resetEmailChannel` now operates on `let instance` + `initializationPromise` (lines 371-381, V4-1 fix) | `let instance` at `EmailChannelFactory.ts:5` ✅. `let initializationPromise` at line 6 ✅. Plan's `instance?.disconnect?.(); instance = null; initializationPromise = null;` matches actual variable names. Actual code calls `instance.disconnect()` (required, non-optional) inside `if (instance)` guard. Plan's `?.` is harmless. | ✅ | None — fix is correct |
| 6 | `emailChannel.send()` accepts `{...commonFields, subject, html, text, attachments}` (lines 575-577) | `EmailPayload` at `IEmailChannel.ts:4-11` has only `to, subject, html, eventType, userId, metadata?` — **NO `text`, NO `attachments`**. `send()` accepts `locale` as 2nd arg ✅. | ❌ | **HIGH** — see V5-1/V5-2 |
| 7 | Dispatcher has a standalone `case "email"` branch that can be refactored (lines 549-578) | `communication.service.ts:72-73` shows `case "email": case "sms": return await dispatchRecipientChannel(payload, locale)` — email FALLS THROUGH to a shared `dispatchRecipientChannel` function. There is NO standalone email case. `commonFields` lives in `dispatchRecipientChannel:28-33`, not in `dispatch`. | ❌ | **HIGH** — see V5-1 |
| 8 | `idempotencyKey` on 6 tables (V4-4 fix) | All 6 citations verified: `students.ts:69`, `scheduling.ts:192`, `lesson-reports.ts:53`, `billing.ts:49`, `billing.ts:100`, `credit-transactions.ts:25`. `notificationDeliveries` does NOT have it. | ✅ | None — fix is correct |
| 9 | `NotificationRepository` is namespace export; `findByIdempotencyKey` absent (V4-4/V4-8) | `notification.repository.ts:31` → `export namespace NotificationRepository`. No `findByIdempotencyKey`. Existing repos use plural/batch `find...ByIdempotencyKeys` with `inArray` (e.g., `billing.repository.ts:1172`). | ✅ | None — plan author must add single-key variant |
| 10 | `emailTemplateRevisions` indexes inlined into pgTable array form (V4-2 fix, lines 487-495) | All 60+ schema files use inline `(t) => [...]` form. No separate named-object index exports anywhere. `index` (non-unique) is imported from `drizzle-orm/pg-core` in existing files. Plan's pattern matches exactly. | ✅ | None — fix is correct |
| 11 | i18n two-path wiring: client `defineNamespace` vs server `Translations` type (V4-3 fix, lines 789-793) | Client: `defineNamespace` at `emails.namespace.ts:1-9`, handle at `translation.ts:86`. Server: `getServerTranslations` → `getTranslations` → pre-built `messagesByLocale` objects (`server.ts:6-9`) that import the SAME leaf modules (`emailsEn`/`emailsAr`). The `Translations` type at `message.ts:260` is TS-only; runtime uses static leaf imports, not the type or a registry lookup. | ⚠️ | **LOW** — see V5-7. The coupling is correct but the mechanism description is inaccurate. |
| 12 | `EmailsLabels` has 2 fields; adding `errors` breaks both `emailsEn` and `emailsAr` (V4-3 fix) | `shared/locale/types/emails/index.ts:28-31` — exactly 2 fields. Both `emailsEn` (`en/emails/index.ts:3`) and `emailsAr` (`ar/emails/index.ts:3`) are explicitly `: EmailsLabels`. Adding `errors` forces both to update. | ✅ | None — lockstep requirement is correctly documented |
| 13 | `as const satisfies EmailTemplateRegistry` is valid TS (lines 284-287) | Already used in repo: `onboardingMetricsOverview.desktop.tsx:15`, `ClassAvatar.tsx:14`. tsgo = `@typescript/native-preview ^7.0.0-dev.20260707.2` (`package.json:211`). `tsconfig.json` does NOT enable `isolatedDeclarations` (only `isolatedModules:13`). | ✅ | None |
| 14 | `EmailTheming` exported from `@react-email/editor/plugins` (V4-7 fix, line 747) | `dist/plugins/index.d.mts:139` exports `EmailTheming`, `extendTheme`, `useEmailTheming`, `createTheme`. Package root `dist/index.d.mts:37` exports only `EmailEditor`, `EmailEditorProps`, `EmailEditorRef`. Import path pinned correctly. | ✅ | None — fix is correct |
| 15 | `react-email@^6` and `@react-email/editor@^1.1` installed (todo 1) | `package.json:151` → `react-email@^6.9.1`, `package.json:95` → `@react-email/editor@^1.1`. `@aws-sdk/client-sesv2`, `isomorphic-dompurify`, `dompurify`, `jsdom`, `web-streams-polyfill` are **NOT** installed. `@smithy/fetch-http-handler` IS installed (`^5.6.13`). | ✅ (deps present) / ⚠️ (missing deps) | Missing deps flagged in v4 (V4-6). |
| 16 | Feature flag `EMAIL_TEMPLATES_ENABLED` registered via `resolveEnvConfig` (todo 21c, line 122) | `resolveEnvConfig` returns `Promise<string \| undefined>` — NOT boolean (`env-config-resolver.ts:125`). `IS_DEMO` is consumed via `getBooleanEnv("IS_DEMO")` at `env.ts:70-71` (returns `true` only when string === "true"), NOT via `resolveEnvConfig`. Using `if (resolveEnvConfig("EMAIL_TEMPLATES_ENABLED"))` would be truthy for the string `"false"`. | ❌ | **HIGH** — see V5-2 |
| 17 | ViewModel + Container + switcher pattern matches existing code (lines 713-728) | `frontend/common/views/dashboard/complaints/` has `useAdminComplaintsViewModel.ts`, `AdminComplaintsView.tsx` (switcher using `createLazyView` + `ResponsiveViewSwitch`), `AdminComplaintsContainer.tsx`. Mobile/desktop tier files mirror in `frontend/{mobile,desktop}/views/dashboard/complaints/`. | ✅ | None |
| 18 | `next/dynamic({ ssr: false })` for browser-only editor import (lines 731-739) | `next/dynamic` used in 5 files, but `ssr: false` is used in **zero** files. `createLazyView` (`createLazyView.ts:20`) defaults `ssr: options?.ssr ?? true`. The plan's `{ ssr: false }` is a **new pattern** with no precedent. | ⚠️ | **MEDIUM** — see V5-5 |
| 19 | Zustand store at `frontend/common/stores/emailTemplateEditorStore.ts` (line 765) | Stores use `*Store.ts` suffix, `create()` from `zustand`. `persist` is optional, not universal. No separate Storybook mock-store pattern found. No API-slice/implementation separation in existing stores. | ✅ (naming) / ⚠️ (mock-store assumption) | **LOW** — see V5-8 |
| 20 | Repo has zero `.array()` columns; `jsonb.$type<readonly EmailEditorPermission[]>()` is established (line 430) | Zero `.array()` usages in `backend/db/schema/`. `jsonb.$type<readonly string[]>()` used at `supported-payment-links.ts:13` and `meeting-providers.ts:13`. Pattern matches exactly. | ✅ | None |
| 21 | `createPgEnumFromEnum` used for pgEnum creation (lines 428-429) | Defined at `backend/db/schema/enums.ts:84-91` (called via `backend/utils/db.utils.ts:3`). All pgEnums centralized in `enums.ts`. Plan imports `emailScopeEnum` from `@/backend/db/schema/enums` — correct. | ✅ | None |
| 22 | `describeLiveWhen` gates integration tests (line 878) | Defined at `test/integration/helpers/describe-live.ts:4` as `(enabled: boolean, _label: string)`. First arg is boolean (computed `Boolean(...)`), not a label. Used in `resend.integration.test.ts:10,12`. `resend.integration.test.ts` already exists. | ✅ | None — but note boolean-first signature |
| 23 | `runInRollback` pattern for repo tests (lines 872-874) | Defined at `backend/db/test/test-utils.ts:18`. Used at `impersonation.repository.test.ts:7` (import) + `:26` (`await runInRollback(async tx => {`). Pattern matches plan convention. | ✅ | None |
| 24 | `bun run generate:gqlSchema && bun codegen` (lines 696, 755) | `generate:gqlSchema` at `package.json:19` → `bun run backend/graphql/generateGqlSchema.ts`. `codegen` at `package.json:21` → `graphql-codegen`. `bun codegen` (bare) works as Bun shorthand. | ✅ | None |
| 25 | `email-templates.ts` is orphaned with no callers (lines 803-806) | File EXISTS at `backend/services/communication/templates/email-templates.ts` (5836 bytes). Contains `renderComplaintResponseEmail` and `renderSuggestionAcknowledgedEmail`. Plan says "migrating it is greenfield" — but the file exists and must be migrated, not overwritten. | ⚠️ | **MEDIUM** — see V5-4 |
| 26 | Zero `.tsx` files in `backend/` (registry uses `.tsx`) | `find backend -name "*.tsx"` returns 0 files. `tsconfig.json:14` enables `jsx: "react-jsx"`, `:38` includes `**/*.tsx` — compiles, but no precedent. `backend/services/AGENTS.md` does not explicitly ban `.tsx` but says services must be SSR-safe. | ⚠️ | **MEDIUM** — see V5-6 |
| 27 | `@react-email/render`'s `render` is async, uses `react-dom/server` internally | `render` returns `Promise<string>` (`@react-email/render/dist/browser/index.d.mts:47`). Internally does `await import("react-dom/server")` then **synchronous** `renderToStaticMarkup` (CPU-bound, event-loop-blocking). No existing SSR/renderToString usage anywhere in backend/frontend/app (excluding node_modules). | ⚠️ | **MEDIUM** — see V5-3 |
| 28 | `@react-email/editor` is a large package; use `@next/bundle-analyzer` (todo 20b) | `dist/` is ~1.8 MB. Editor bundles TipTap 3.17.x + `@floating-ui/react-dom` + `@radix-ui/*`. `@next/bundle-analyzer` is **NOT** installed. | ⚠️ | **LOW** — see V5-9 |
| 29 | CSP `img-src * data:` on preview route (todo 12a, line 66) | No existing CSP headers anywhere in the codebase (zero `Content-Security-Policy` hits in Siraj TS code). No `iframe sandbox=` usage. No existing HTML sanitization. | ⚠️ | **MEDIUM** — see V5-3 (security section) |
| 30 | `@react-email/editor` plugins path `/plugins` subpath exists | `package.json:52` of `@react-email/editor` confirms `"./plugins"` export map maps to `dist/plugins/index.d.mts`. Both `EmailTheming` and `extendTheme` exported. | ✅ | None |

---

## New Issues Found (v5)

### V5-1 — Dispatcher has no standalone `case "email"` branch; plan's refactored code is architecturally wrong (HIGH)

- **Severity:** High
- **Plan lines affected:** 549-578 (dispatcher refactor code)
- **Why it matters:** The plan presents a refactored `case "email": { ... }` block as if it replaces an existing standalone email case. In reality, the current dispatcher at `communication.service.ts:72-73` has `case "email": case "sms": return await dispatchRecipientChannel(payload, locale)` — email **falls through** to a shared `dispatchRecipientChannel` function that handles BOTH email and SMS. `commonFields` is a local variable inside `dispatchRecipientChannel` (line 28-33), NOT inside `dispatch`. There is no `tx` (transaction) in the dispatch scope. The plan's refactored code:
  ```ts
  case "email": {
    const emailScope = mapEventTypeToEmailScope(payload.eventType);
    // ...
    const existingDelivery = await NotificationRepository.findByIdempotencyKey(idempotencyKey, tx);
    // ...
    return await emailChannel.send({ ...commonFields, subject, html, text, attachments }, locale);
  }
  ```
  references `commonFields`, `tx`, and `text`/`attachments` that are not in the actual function scope. An implementer following this verbatim would need to either (a) extract email from the shared `dispatchRecipientChannel` into a standalone case (a structural refactor, not a patch), or (b) modify `dispatchRecipientChannel` to accept email-specific branching — but the plan doesn't describe either approach.
- **Codebase evidence:**
  - `backend/services/communication/communication.service.ts:72-73` — `case "email": case "sms": return await dispatchRecipientChannel(payload, locale);` (fall-through, no standalone email case)
  - `backend/services/communication/communication.service.ts:23-46` — `dispatchRecipientChannel` is where `commonFields` (line 28-33) and the `emailChannel.send()` call (line 37) actually live
  - `backend/services/communication/communication.service.ts:67-104` — `dispatch()` function has only `try/catch`, no transaction (`tx`) in scope
- **Recommended fix:** Rewrite the plan's dispatcher section to reflect the actual architecture:
  1. The refactored code belongs inside `dispatchRecipientChannel` (or a new `dispatchEmailChannel` extracted from it), not inside `dispatch()`'s switch.
  2. Introduce a standalone `case "email":` that breaks the fall-through with SMS, routing to a new `dispatchEmailChannel(payload, locale)` function — OR modify `dispatchRecipientChannel` to branch email-specific logic (scope mapping, idempotency, template rendering) before the shared `emailChannel.send()` call.
  3. Remove the `tx` reference (no transaction exists in dispatch scope) — idempotency must use a non-transactional `queryDb()` read or introduce a transaction wrapper explicitly.
  4. Note that `commonFields` is scoped to `dispatchRecipientChannel`, not `dispatch`.

---

### V5-2 — `EMAIL_TEMPLATES_ENABLED` flag would be truthy for `"false"` string if using `resolveEnvConfig` (HIGH)

- **Severity:** High
- **Plan lines affected:** todo 21c (line 122-124), dispatcher gating logic (lines 549-578)
- **Why it matters:** The plan introduces `EMAIL_TEMPLATES_ENABLED` as a boolean feature flag gated via `resolveEnvConfig("EMAIL_TEMPLATES_ENABLED")` (the plan uses `resolveEnvConfig` throughout for env reads, including EMAIL_PROVIDER at line 355). However, `resolveEnvConfig` returns `Promise<string | undefined>` — never a boolean (`env-config-resolver.ts:125`). In JavaScript, the string `"false"` is **truthy**. So:
  ```ts
  if (await resolveEnvConfig("EMAIL_TEMPLATES_ENABLED")) { /* flag ON */ }
  ```
  would be `true` whenever the env var is set to `"false"` — the exact opposite of "default false." This is a classic env-flag inversion bug. The codebase's existing boolean flag pattern (`IS_DEMO`) uses the separate `getBooleanEnv("IS_DEMO")` helper at `env.ts:70-71`, which returns `true` only when the value is literally `=== "true"`. `IS_DEMO` is consumed exclusively via `getBooleanEnv`, never via `resolveEnvConfig`.
- **Codebase evidence:**
  - `backend/lib/env-config-resolver.ts:125` — `export async function resolveEnvConfig(key: string): Promise<string | undefined>`
  - `backend/lib/env.ts:70-71` — `export function getBooleanEnv(name: string): boolean { return process.env[name]?.toLowerCase() === "true"; }`
  - `backend/lib/env.ts:354` — `isDemo: getBooleanEnv("IS_DEMO")` (the canonical consumption pattern)
  - `backend/lib/env-config-keys.ts:510-520` — `IS_DEMO` entry has `excludeFromDb: true, serverOnly: true` (no type/default field; type coercion happens at consumption site)
- **Recommended fix:** In todo 21c, explicitly specify:
  1. Register `EMAIL_TEMPLATES_ENABLED` in `env-config-keys.ts` with `excludeFromDb: true, serverOnly: true` (matching `IS_DEMO` at line 510).
  2. Gate the dispatcher using `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` from `@/backend/lib/env` — NOT `resolveEnvConfig`. If the gate must be async (e.g., for DB-overridable flags), use `resolveEnvConfig` then coerce: `const flagStr = await resolveEnvConfig("EMAIL_TEMPLATES_ENABLED"); const enabled = flagStr?.toLowerCase() === "true";`. But `excludeFromDb: true` means `resolveEnvConfig` just reads `process.env` anyway — so `getBooleanEnv` is the correct, simpler pattern.
  3. Add explicit guidance: "Do NOT use `resolveEnvConfig('EMAIL_TEMPLATES_ENABLED')` as a truthy gate — it returns a string, and the string `'false'` is truthy in JS."

---

### V5-3 — CSP `img-src * data:` is overly permissive for a security-hardened preview iframe (MEDIUM)

- **Severity:** Medium
- **Plan lines affected:** todo 12a (line 66) — CSP header specification
- **Why it matters:** The plan sets `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src * data:` on the preview route. The `img-src *` directive allows the iframe to load images from **any** remote host. This is a tracking-pixelPrivacy leak: a malicious or attacker-controlled template can embed `<img src="https://attacker.com/track.png">` and the viewer's browser will make the request, leaking their IP address and User-Agent to arbitrary third-party hosts. For a preview iframe that the plan explicitly hardens with `sandbox` and `default-src 'none'`, the `img-src *` directive contradicts the security goal. Additionally, the `allow-same-origin` sandbox permission (without `allow-scripts`) retains storage/cookie access for the framed content — while not directly exploitable without scripts, it's an unnecessary permission for a pure HTML preview.
- **Codebase evidence:** No existing CSP headers anywhere in the codebase (zero `Content-Security-Policy` hits in Siraj TS code). No `iframe sandbox=` usage. The plan introduces the first CSP header in the repo — it should set a strong precedent.
- **Recommended fix:**
  1. Tighten CSP to `img-src 'self' data:` (or a known image-host allowlist) instead of `img-src *`. Remote images in email templates should be loaded server-side (via the React Email `<Img>` component which renders absolute URLs in the HTML output) — the preview iframe doesn't need to fetch arbitrary remote images.
  2. Drop `allow-same-origin` from the iframe sandbox unless the preview route demonstrably requires same-origin access (e.g., for react-email CSS assets). For a pure HTML string preview, `sandbox` with **no permissions** (`sandbox=""`) is the strongest default — it renders the iframe in a unique opaque origin with no script execution, no form submission, no same-origin access.
  3. If `allow-same-origin` is determined to be necessary (e.g., for asset loading), document the justification explicitly.

---

### V5-4 — Existing `email-templates.ts` must be migrated, not overwritten (MEDIUM)

- **Severity:** Medium
- **Plan lines affected:** lines 799-806 (React Email component scaffolds), line 870 ("Remove orphaned `renderXxxEmail` helpers")
- **Why it matters:** The plan says the existing `backend/services/communication/templates/email-templates.ts` is "orphaned with no callers" and frames the migration as "greenfield." While the file has no callers (confirmed: no imports found via `find`/`grep`), it DOES exist (5836 bytes) and contains the `renderComplaintResponseEmail` and `renderSuggestionAcknowledgedEmail` render helpers with hardcoded HTML + hardcoded hex colors (`#1976d2`, `#2e7d32` — violating AGENTS.md's no-hardcoded-colors rule). The plan's new `email-template.registry.tsx` and `templates/components/*.tsx` would be created UNDER the same `templates/` directory. If the plan's scaffold files use similar names or the implementer creates the new directory structure without explicitly removing the old file, there will be two parallel render paths — the old one with hardcoded colors and the new one with theme tokens. The plan says "Remove orphaned `renderXxxEmail` helpers after migration" (line 870) but doesn't schedule WHEN — it should be an explicit Phase 3 task (after the dispatcher migration), not a afterthought.
- **Codebase evidence:**
  - `backend/services/communication/templates/email-templates.ts` — EXISTS (5836 bytes), contains `renderComplaintResponseEmail` + `renderSuggestionAcknowledgedEmail`
  - `backend/services/communication/templates/` — already contains `email-templates.ts` + `sms-templates.ts`
  - No callers found (grep for `renderComplaintResponseEmail` + `renderSuggestionAcknowledgedEmail` in imports)
- **Recommended fix:** Add an explicit Phase 3 task: "Delete `backend/services/communication/templates/email-templates.ts` after dispatcher migration to `EmailTemplateService.renderForSend` is complete and all existing notification payloads route through the new template registry. Verify zero callers before deletion."

---

### V5-5 — `next/dynamic({ ssr: false })` has zero precedent in the codebase (MEDIUM)

- **Severity:** Medium
- **Plan lines affected:** lines 731-739 (EmailEditorWrapper), line 742 (tier view `next/dynamic`)
- **Why it matters:** The plan's `EmailEditorWrapper.tsx` uses `dynamic(() => import('@react-email/editor').then(m => m.EmailEditor), { ssr: false })`. The codebase uses `next/dynamic` in only 5 files, and the repo's canonical lazy-loading helper (`createLazyView` at `createLazyView.ts:15-26`) defaults to `ssr: options?.ssr ?? true` — meaning **no file in the codebase passes `ssr: false`**. The plan introduces a new pattern that bypasses `createLazyView` entirely, using raw `next/dynamic` with `ssr: false`. This is functionally correct (TipTap touches `window` at module load), but it:
  1. Creates a second lazy-loading convention (`createLazyView` vs raw `next/dynamic` with `ssr: false`) — future contributors may not know when to use which.
  2. Has no precedent for the repo to validate against — `createLazyView`'s `ssr: true` default has never been overridden.
  3. The plan says "both mobile and desktop tier views import `EmailEditor` from this wrapper" — but it ALSO says (line 742) to add `next/dynamic` "at **module top level** in the tier view file." This is contradictory: does the dynamic import live in `EmailEditorWrapper.tsx` (common layer) or in the tier view file? The plan says both.
- **Codebase evidence:**
  - `frontend/common/components/ui/container/createLazyView.ts:20` — `ssr: options?.ssr ?? true` (default true)
  - `grep "ssr: false"` over frontend → "No matches found" (zero usages)
  - Plan line 731-738 says wrapper in common layer; line 742 says dynamic import in tier view file
- **Recommended fix:**
  1. Consolidate: the `next/dynamic({ ssr: false })` import should live ONLY in `EmailEditorWrapper.tsx` (common layer). Tier views import `EmailEditor` from the wrapper, never directly from `@react-email/editor`. Remove the contradictory text at line 742 about adding `next/dynamic` in the tier view file.
  2. Add a note that `EmailEditorWrapper.tsx` uses raw `next/dynamic` (not `createLazyView`) because `ssr: false` is required for TipTap browser-only access — this is an intentional deviation from the `createLazyView` default, documented in the wrapper file's header comment.

---

### V5-6 — `.tsx` in backend services is a new pattern with zero precedent (MEDIUM)

- **Severity:** Medium
- **Plan lines affected:** lines 209, 801 (file path `email-template.registry.tsx`), lines 801-804 (`components/*.tsx`)
- **Why it matters:** The plan creates `backend/services/communication/templates/email-template.registry.tsx` and `backend/services/communication/templates/components/*.tsx`. A `find backend -name "*.tsx"` returns **zero** files — no `.tsx` file exists anywhere in the backend. `tsconfig.json:14` enables `jsx: "react-jsx"` and `:38` includes `**/*.tsx`, so it compiles. `backend/services/AGENTS.md` says services must be "SSR Usage" safe and "must not rely on GraphQL-specific contexts" — it doesn't ban `.tsx` but also doesn't establish a precedent. Introducing `.tsx` into the backend service layer adds:
  1. A JSX dependency surface — `email-template.registry.tsx` will import React Email components (`.tsx`) and use JSX syntax, requiring `react-jsx` runtime in the backend bundle.
  2. A potential lint/biome configuration gap — rules for `.tsx` in `backend/` may not be calibrated (existing ESLint configs may have `.ts`-only overrides).
  3. A conceptual question: should React component scaffolds live in `backend/` (compiled by tsgo for type checking) or in a `shared/` layer that both frontend and backend import? The `shared/` layer is explicitly designed for cross-frontend-backend usage but bans `backend → frontend` imports — a `.tsx` component used only by the backend email pipeline is a new category.
- **Codebase evidence:**
  - `find backend -name "*.tsx"` → zero results
  - `tsconfig.json:14` — `"jsx": "react-jsx"` ✅ (compiles)
  - `tsconfig.json:38` — `"include": ["**/*.ts", "**/*.tsx", ...]` ✅
  - `backend/services/AGENTS.md:3-5` — SSR safety requirement (no explicit `.tsx` ban)
- **Recommended fix:** Either:
  1. **Accept the precedent** — document in the plan that `email-template.registry.tsx` and `components/*.tsx` are the first `.tsx` files in `backend/`, and verify that ESLint/Biome configs handle `.tsx` in `backend/` correctly (run `bun lint` on the new files as a Phase 1 verification step).
  2. **Or avoid `.tsx` entirely** — use `createElement` calls instead of JSX in `.ts` files (the registry can construct React elements via `React.createElement(ComplaintResponseEmail, props)` instead of `<ComplaintResponseEmail {...props} />`). This keeps the backend in `.ts` only. The registry file becomes `email-template.registry.ts` (not `.tsx`).
  3. **Or move to `shared/`** — if React Email components are cross-layer, place them in `shared/email/components/` (but verify `shared/AGENTS.md` permits React imports — it bans only `backend → frontend`, not `shared → react`).

---

### V5-7 — i18n server path description is mechanically inaccurate (LOW)

- **Severity:** Low
- **Plan lines affected:** lines 789-793 (V4-3 fix text)
- **Why it matters:** The V4-3 fix documents the i18n two-path coupling:
  > "Server path: `getServerTranslations(locale).emailsTranslations` / `ctx.t().emailsTranslations` → the `Translations` nominal type at `shared/locale/types/message.ts:260` where `emailsTranslations: EmailsLabels`."
  
  This implies the server path consults the `Translations` type at runtime. In reality, `getServerTranslations` (`server-graphql.ts:1-6`) calls `getTranslations(locale)` from `server.ts:15-17`, which returns `messagesByLocale[locale]` — **pre-built static message objects** assembled at `en/messages.ts:81,127` and `ar/messages.ts:81,127` that import the SAME leaf modules (`emailsEn`/`emailsAr`) the `defineNamespace` loaders reference. The `Translations` type is **TypeScript-only** (compile-time type checking); the runtime path uses static imports of leaf modules. The net effect (two-path coupling, shared leaves) is correctly described — both paths consume the same `emailsEn`/`emailsAr` leaf modules — but the mechanism described ("consults the `Translations` type directly") is inaccurate. A contributor reading the v4 text may look for a type-driven runtime lookup that doesn't exist.
- **Codebase evidence:**
  - `shared/locale/server-graphql.ts:1-6` — calls `getTranslations(locale)` from `shared/locale/server.ts`
  - `shared/locale/server.ts:6-9,15-17` — `messagesByLocale` is statically assembled; `getTranslations` returns `messagesByLocale[locale]`
  - `shared/locale/en/messages.ts:81,127` — `enMessages` imports `emailsEn` (the same leaf module `defineNamespace` loads)
  - `shared/locale/types/message.ts:260` — `emailsTranslations: EmailsLabels` (TS-only nominal type; not consulted at runtime)
- **Recommended fix:** Correct the v4-3 text to: "Server path: `getServerTranslations(locale).emailsTranslations` → `getTranslations(locale)` → returns a pre-built message object (`messagesByLocale[locale]`) that statically imports the SAME leaf modules (`emailsEn`/`emailsAr`) the client `defineNamespace` loaders reference. The `Translations` type at `message.ts:260` is TS-only — it validates the shape at compile time but is not consulted at runtime."

---

### V5-8 — No "separate Storybook mock store" pattern exists in the codebase (LOW)

- **Severity:** Low
- **Plan lines affected:** todo 16 note (line 83) — "Zustand store at `frontend/common/stores/emailTemplateEditorStore.ts`"
- **Why it matters:** The AGENTS.md mentions "frontend/stores/ - Zustand stores (mock stores for Storybook)" which implies a separate mock-store convention. The v3 review's frontend exploration confirmed stores at `frontend/common/stores/` use `create()` directly with no separated mock factory. No `__mocks__/store` mock files were found; the complaints Container story (`AdminComplaintsContainer.stories.tsx`) renders with `args: {}` and no store override. If the plan assumes a mock-store pattern for the email-template editor's Storybook stories, that pattern doesn't exist — the implementer would need to either (a) create a new mock-store convention, or (b) use the existing "render container with args" approach. This is a minor friction point, not a blocker.
- **Codebase evidence:**
  - `frontend/common/stores/adminComplaintsStore.ts:34` — `export const useAdminComplaintsStore = create<...>(...)` (inline, no separation)
  - No `__mocks__` directives or store mocks in `find`
  - `frontend/common/views/dashboard/complaints/AdminComplaintsContainer.stories.tsx` — renders with `args: {}`
- **Recommended fix:** Acknowledge in the plan that the email-template store follows the existing inline `create()` pattern (no separated mock factory). For Storybook, use the existing "render container with args" approach (no store override needed if the ViewModel hook is self-contained).

---

### V5-9 — `@next/bundle-analyzer` is not installed (LOW)

- **Severity:** Low
- **Plan lines affected:** todo 20b (line 107-108) — "Add bundle size analysis: verify editor route is code-split and TipTap + Prism.js don't bloat the main bundle. Use `@next/bundle-analyzer` if available."
- **Why it matters:** The plan qualifies the analyzer with "if available" — but `@next/bundle-analyzer` is **not** in `package.json` devDependencies. The implementer would need to install it as a dev dependency before running the analysis. The editor's `dist/` is ~1.8 MB on disk (not shipped bundle size); without the analyzer, the plan cannot verify whether the `next/dynamic({ ssr: false })` code-splitting actually keeps the editor out of the main bundle. The analyzer is a dev-only dependency and the analysis is a P2 polish task, so this is a minor gap.
- **Codebase evidence:** `grep "bundle-analyzer"` in `package.json` → no matches. `@react-email/editor/dist/` is ~1.8 MB.
- **Recommended fix:** Add to todo 20b: "Install `@next/bundle-analyzer` as a dev dependency (`bun add -D @next/bundle-analyzer`) before running the bundle size analysis. Verify the editor route's JS chunk is code-split from the main bundle via `NEXT_BUNDLE_ANALYZER=enabled bun run build`."

---

### V5-10 — `notificationEventId` is a brand-new runtime key with zero precedent (LOW)

- **Severity:** Low
- **Plan lines affected:** lines 564-565 (idempotency key hash), lines 545-547 (metadata access)
- **Why it matters:** The plan's idempotency key hashes `${emailScope}:${payload.metadata?.entityId ?? ""}:${payload.metadata?.notificationEventId ?? ""}`. While `entityId` is an established key in `NotificationMetadataBase` (`notification-alerts.metadata.types.ts:15` — `entityId: string`), `notificationEventId` is a **brand-new runtime key** that does not appear anywhere in the codebase (grep for `notificationEventId` returns zero hits). The plan uses `payload.metadata?.notificationEventId ?? ""` (optional chaining + fallback) which is type-safe (`Record<string, unknown>` allows any key), but the key is never populated by any helper or builder. Without an explicit task to populate `notificationEventId` in `notification-payloads.builders.ts` (todo 18), the idempotency key would always use the `""` fallback for this component — making the hash a 2-field hash (`scope:entityId`) rather than a 3-field hash. This doesn't break the idempotency mechanism but reduces its precision (two events with the same scope and entityId but different notificationEventId would collide).
- **Codebase evidence:**
  - `backend/types/notifications/notification-alerts.metadata.types.ts:13-16` — `NotificationMetadataBase` has `entityId: string` but NO `notificationEventId`
  - `grep "notificationEventId"` across the codebase → zero results (brand-new key)
  - `backend/services/notification/notification-payloads.builders.ts` — does not set `notificationEventId` in any builder (confirmed via grep)
- **Recommended fix:** Either:
  1. **Add `notificationEventId` to the metadata type + populate it** in todo 18 — update `NotificationMetadataBase` to include `notificationEventId?: string`, and have each builder set it from the notification event record's ID.
  2. **Or remove it from the hash** — use a 2-field hash `scope:entityId` (and document that same-scope, same-entity events triggered twice in the same window will dedup — which is the intended idempotency semantics anyway).

---

## Regression Check (v4 fixes — did they introduce new issues?)

All 11 v4 fixes were verified against the codebase. **Zero regressions introduced.**

| V4 ID | Title | Post-fix matches codebase? | New regression? | Notes |
|---|---|:--:|:--:|---|
| V4-1 | `resetEmailChannel` operates on `instance` not const facade | ✅ | No | `let instance` at `EmailChannelFactory.ts:5`, `let initializationPromise` at line 6. Plan's `instance?.disconnect?.(); instance = null; initializationPromise = null;` matches actual variable names. `disconnect` is required (not optional) in `IEmailChannel.ts:22`, but `?.` is harmless. |
| V4-2 | `emailTemplateRevisions` indexes inlined into pgTable array form | ✅ | No | All 60+ schema files use inline `(t) => [...]`. No separate named-object index exports. `index` imported from `drizzle-orm/pg-core`. Plan's pattern matches exactly. |
| V4-3 | i18n two-path coupling documented + en/ar lockstep | ✅ | No | Both paths confirmed. `emailsEn`/`emailsAr` are `: EmailsLabels`. Adding `errors` breaks both until updated. Lockstep requirement is correct. (Mechanism description slightly inaccurate — see V5-7, but that's a pre-existing wording issue, not a v4-fix regression.) |
| V4-4 | `idempotencyKey` 6-table reference corrected | ✅ | No | All 6 citations verified: `students.ts:69`, `scheduling.ts:192`, `lesson-reports.ts:53`, `billing.ts:49`, `billing.ts:100`, `credit-transactions.ts:25`. |
| V4-5 | Null-scope events comment disambiguated (legacy vs new path) | ✅ | No | Comment at lines 643-646 correctly distinguishes: flag=true → no email; flag=false → passthrough. Matches actual `dispatchRecipientChannel` behavior. |
| V4-6 | isomorphic-dompurify verification promoted to Phase 0 GO/NO-GO gate | ✅ | No | Todo 21b + Phase 0 gate correctly specified. Package not installed (must install in todo 1 first). |
| V4-7 | EmailTheming import path pinned to `@react-email/editor/plugins` | ✅ | No | `dist/plugins/index.d.mts:139` exports `EmailTheming` + `extendTheme`. Package root does NOT export them. Import path correct. |
| V4-8 | `notification_deliveries` → `notificationDeliveries` (Drizzle symbol) | ✅ | No | Symbol is camelCase at `communications.ts:101`. Plan now uses the correct symbol. |
| V4-9 | `EMAIL_TEMPLATES_ENABLED` env registration in `env-config-keys.ts` | ✅ (registration) / ❌ (consumption) | **No regression** (but reveals V5-2) | The registration location is correct (`excludeFromDb: true, serverOnly: true` matching `IS_DEMO`). But the plan doesn't specify using `getBooleanEnv` — see V5-2 for the consumption bug. This is a gap the v4 fix didn't cover, not a regression from the fix. |
| V4-10 | `EmailsErrorLabels` argument shapes normalized to bare-string | ✅ | No | All 7 methods now take bare-string/primitive args. Call site at line 845 uses `t.renderFailed(scope)`. Consistent. |

**Net regression count: 0.** The v4 fixes are clean.

---

## v1/v2/v3/v4 Carryover (unresolved issues)

| Carryover | Originating review | Status | Detail |
|---|---|---|---|
| C-1 (isomorphic-dompurify Bun compatibility) | V2-5 → V3-15 → V4-6 | **CLOSED (plan-level)** | Promoted to Phase 0 GO/NO-GO gate (todo 21b). Verification step is scheduled. Package installation in todo 1. The verification itself must be executed during Phase 0 — but the plan correctly gates on it. No further plan-text changes needed. |
| C-2 (i18n en/ar lockstep requirement) | V3-7 → V4-3 | **CLOSED** | V4-3 fix applied: explicit lockstep requirement documented (line 787). Both `emailsEn` and `emailsAr` confirmed as `: EmailsLabels`. |
| C-3 (sendTest rate limiting) | V1-5 → V3-14 | **CLOSED** | Todo 12 (line 62) includes "per-user rate limiting (5 test emails/minute)." |
| V3-1 (resetEmailChannel compile error) | V3 → V4-1 | **CLOSED** | V4-1 fix applied: operates on `let instance` (line 5), not `const emailChannel` facade (line 100). Verified correct. |
| V3-4 (typed registry TS limitation) | V3 → plan lines 207-325 | **CLOSED** | Plan now uses `EmailPropsByScope` + mapped type + `defineEmailTemplate`. Matches research file 06's corrected pattern. |
| V3-12 (transaction wrapping for template activation) | V3 → V2-13 | **CLOSED** | Todo 12 (line 62) includes transaction wrapping for publish/archive status transitions. |

**All prior carryover issues are resolved.** No open carryover remains.

---

## Architecture & Design Review (NEW for v5)

### Circular Dependency Risks

**Import graph analysis:**
```
dispatch() → dispatchRecipientChannel() → EmailTemplateService.renderForSend()
    → renderEmailTemplate() → EMAIL_TEMPLATES[scope].component (React Email .tsx)
    → @react-email/render → react-dom/server (dynamic await import)
    
EmailTemplateService.renderForSend() → email-template.repository.ts → drizzleDb
EmailTemplateService.sendTest() → emailChannel facade → getEmailChannel() → EmailProviderRegistry → Adapters
```

**Finding: Low circular dependency risk.** The import graph is a clean DAG:
- `communication.service.ts` → `email-template.service.ts` (one-directional)
- `email-template.service.ts` → `email-template.registry.tsx` → `components/*.tsx` → `react-email` (terminal, no back-import to services)
- `email-template.service.ts` → `email-template.repository.ts` → `drizzle-orm` (terminal)
- `email-template.service.ts` → `emailChannel` facade (terminal — the facade already exists and is used by `communication.service.ts`)

No cycle detected. The registry does NOT import back into the service layer. The React Email components are leaf nodes.

**However:** `@react-email/render`'s `render()` does `await import("react-dom/server")` — this is a dynamic import (not top-level static), so it does not create a module-init-time circular dependency. The `react-dom/server` import is resolved lazily on first render call.

### File Organization Alignment

| Plan path | Convention | Match |
|---|---|:--:|
| `backend/enum/email/emailTemplates.enum.ts` | One file per domain under subdir, `<entity>.enum.ts` | ✅ |
| `backend/types/email/email.types.ts` | Types by domain subdir | ✅ |
| `backend/types/email/emailChannel.types.ts` | Same | ✅ |
| `backend/db/schema/communications/emailTemplates.ts` | Domain subdirs; `communications/` already exists | ✅ |
| `backend/db/repo/email/email-template.repository.ts` | Domain subdirs with `index.ts` barrel | ✅ |
| `backend/services/communication/email-template.service.ts` | Domain service files | ✅ |
| `backend/services/communication/templates/email-template.registry.tsx` | `templates/` already exists | ⚠️ `.tsx` is new — see V5-6 |
| `backend/services/communication/channels/email/EmailProviderRegistry.ts` | `channels/email/` already exists | ✅ |
| `backend/lib/registry.ts` | `backend/lib/` for utils | ✅ (net-new) |
| `backend/graphql/pothos/email/` | Domain subdirs in pothos | ✅ |
| `backend/graphql/query/email/` + `mutation/email/` | Same convention | ✅ |
| `frontend/common/views/dashboard/email-templates/` | Domain-organized views | ✅ |
| `frontend/mobile/views/dashboard/email-templates/` | Tier mirror | ✅ |
| `frontend/desktop/views/dashboard/email-templates/` | Tier mirror | ✅ |
| `frontend/common/stores/emailTemplateEditorStore.ts` | `*Store.ts` suffix | ✅ |
| `frontend/common/graphql/sharedDocuments/email/` | Domain subdirs | ✅ |
| `app/(dashboard)/email-templates/` | `(dashboard)` group pattern | ✅ |
| `frontend/common/views/dashboard/email-templates/EmailEditorWrapper.tsx` | Domain wrappers in `views/` | ✅ (confirmed: no domain wrappers in `common/components/`) |

**New files that already exist (overwrite risk):**
- `backend/services/communication/templates/email-templates.ts` — **EXISTS**, must migrate, not overwrite (see V5-4)

**New directories needed (none exist):**
- `backend/enum/email/` — new
- `backend/types/email/` — new
- `backend/db/repo/email/` — new
- `backend/graphql/pothos/email/`, `query/email/`, `mutation/email/` — new
- `frontend/common/views/dashboard/email-templates/` — new
- `frontend/mobile/views/dashboard/email-templates/` — new
- `frontend/desktop/views/dashboard/email-templates/` — new
- `frontend/common/graphql/sharedDocuments/email/` — new

### Performance Concerns

**Server-side React rendering blocks the event loop.**

The plan's `safeRender()` calls `await render(<template.component {...props} />, { pretty: false })`. While `render` is async (returns `Promise<string>`), it internally does `await import("react-dom/server")` then **synchronously** calls `renderToStaticMarkup` (CPU-bound, event-loop-blocking). For each email send, the event loop is blocked for the duration of the JSX→HTML conversion.

Under high volume (e.g., a batch notification to 100 users), `dispatchMulti` (`communication.service.ts:114`) uses `Promise.allSettled(payloads.map(p => dispatch(p, locale)))` — the `Promise.allSettled` schedules the dispatches concurrently, but each `render()` call internally blocks the event loop. The CPU-bound `renderToStaticMarkup` calls will serialize on the single-threaded JS event loop, creating a bottleneck.

**No existing SSR precedent:** The codebase has zero `renderToStaticMarkup`/`renderToString`/`react-dom/server` usage outside `node_modules`. The plan introduces the first server-side React rendering.

**Mitigation options (not blocking — flag for Phase 3 optimization):**
1. Batch-render templates in a worker thread (Bun supports `Worker`).
2. Cache rendered HTML by (scope, props-hash, locale) — the DB already stores `compiledHtml` which can be served directly for unchanged templates.
3. Accept the blocking for Phase 1-2 (low volume) and optimize in Phase 3 when the dispatcher migration increases throughput.

### Bundle Size Analysis

- `@react-email/editor/dist/` is ~1.8 MB on disk (not shipped bundle size).
- Editor bundles TipTap 3.17.x + `@floating-ui/react-dom` + `@radix-ui/react-popover` + many `@tiptap/*` extensions.
- The plan's `next/dynamic({ ssr: false })` in `EmailEditorWrapper.tsx` correctly code-splits the editor into a lazy-loaded client chunk — this keeps the editor out of the main bundle.
- **Caveat:** `dynamic({ ssr: false })` must live in a `"use client"` file. The plan's `EmailEditorWrapper.tsx` has `'use client'` at line 734 ✅.
- `@next/bundle-analyzer` is NOT installed — needed to verify actual shipped chunk size (see V5-9).

### Security Review

| Layer | Plan approach | Assessment |
|---|---|---|
| TipTap schema validation (save-time) | Allowed-node-types allowlist; reject `script`, `iframe` | ✅ Strong — blocks attacks at the source |
| DOMPurify sanitization (render-time) | `isomorphic-dompurify` with `ALLOWED_TAGS`/`ALLOWED_ATTR` | ✅ Defense-in-depth — but untested under Bun (Phase 0 gate) |
| CSP header on preview route | `default-src 'none'; style-src 'unsafe-inline'; img-src * data:` | ⚠️ `img-src *` too permissive — see V5-3 |
| iframe sandbox | `sandbox='allow-same-origin'` without `allow-scripts` | ⚠️ `allow-same-origin` unnecessary for pure HTML preview — see V5-3 |
| Auth scope checks | `superAdmin: true, notImpersonating: true` on mutations | ✅ Match existing pattern at `billing-payments.mutation.ts:68`, `onboarding.mutation.ts:132` |

---

## Risk Assessment

Top 10 risks ranked by impact × probability:

| Rank | Risk | Impact | Probability | Score | Notes |
|---|---|---|---|---|---|
| 1 | Boolean flag inversion: `resolveEnvConfig("EMAIL_TEMPLATES_ENABLED")` is truthy for `"false"` (V5-2) | High (flag ON when it should be OFF; sends templated emails when admin intended passthrough) | 80% (if implementer follows plan's `resolveEnvConfig` convention) | **8.0** | One-line fix: use `getBooleanEnv`. |
| 2 | Dispatcher architecture mismatch (V5-1) — no standalone email case; `commonFields`/`tx` not in scope | High (implementer must restructure `dispatchRecipientChannel`, not patch `dispatch`) | 60% (plan presents a patch, reality requires a refactor) | **7.2** | Rewrite dispatcher section to reflect actual architecture. |
| 3 | `.tsx` in backend — no precedent, uncalibrated lint/SSR-safety (V5-6) | Medium (lint failures, conceptual confusion, potential SSR-incompatibility) | 50% | **5.0** | Verify lint/biome on new `.tsx` files; or use `createElement` instead of JSX. |
| 4 | CSP `img-src *` tracking-pixel leak (V5-3) | Medium (privacy leak in admin preview) | 100% (as written) | **6.0** → mitigated to **3.0** after fix | Tighten to `img-src 'self' data:`. |
| 5 | `email-templates.ts` overwrite risk (V5-4) | Medium (loss of render helpers if not migrated) | 30% (plan says "migrate" but doesn't schedule deletion) | **3.9** | Add explicit deletion task in Phase 3. |
| 6 | CPU-bound `renderToStaticMarkup` blocks event loop (V5-3 perf) | Medium (throughput bottleneck under high volume) | 50% (only in high-volume Phase 3 dispatch) | **4.0** | Cache `compiledHtml` + accept for Phase 1-2. |
| 7 | `next/dynamic({ ssr: false })` no precedent; contradictory placement (V5-5) | Low-Medium (double lazy-loading convention, contributor confusion) | 40% | **3.2** | Consolidate to wrapper-only. |
| 8 | `notificationEventId` never populated (V5-10) | Low (reduced idempotency precision) | 100% (as written) | **3.0** | Add to metadata type + builders, or remove from hash. |
| 9 | i18n server mechanism description inaccurate (V5-7) | Low (contributor confusion, not a runtime bug) | 70% | **2.8** | Correct wording in plan text. |
| 10 | `@next/bundle-analyzer` not installed (V5-9) | Low (cannot verify bundle size) | 100% | **3.0** | Install as dev dep in todo 20b. |

### Migration Risks
- **No data loss risk identified:** All changes are net-new (new tables, new enum, new column, new files). No destructive migration.
- **Flag toggle risk (v4 carryover — still valid):** When `EMAIL_TEMPLATES_ENABLED` flips to `true`, the 5 null-scope events (NEW_COMPLAINT, NEW_SUGGESTION, SUGGESTION_DUPLICATE_MARKED, CLASS_ACTIVATED, CLASS_STARTED) short-circuit. Today they send email via `payload.body ?? ""` passthrough. The plan documents this at lines 643-646 and adds a Phase 0 audit task at line 862. ✅ Correctly mitigated.

### Build/Deployment Risks
- **No build-blocking issue found in v5.** The v4 Critical (V4-1 const reassignment) is fully resolved.
- **Conditional build risk:** V5-6 (`.tsx` in backend) may surface lint/SSR-safety rules that haven't been calibrated for `.tsx` in `backend/`. Verify via `bun tsgo` + `bun biome:check` on the new `.tsx` files in Phase 1.
- **No runtime-only regression identified.**

---

## Recommendations

### P0 — Fix before ANY implementation begins
1. **Apply V5-2 fix to todo 21c (line 122-124):** specify `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` for the gate, NOT `resolveEnvConfig`. Add explicit warning that `resolveEnvConfig` returns a string and `"false"` is truthy in JS. This prevents the flag-inversion bug.
2. **Apply V5-1 fix to dispatcher section (lines 549-578):** rewrite to reflect that email falls through to `dispatchRecipientChannel` (not a standalone `case "email"` in `dispatch`). Note that `commonFields` and `tx` are not in `dispatch()` scope. Either extract a new `dispatchEmailChannel()` function or branch within `dispatchRecipientChannel`.

### P1 — Fix during early phases (Phase 1-2)
3. **Apply V5-3 fix to todo 12a (line 66):** tighten CSP to `img-src 'self' data:` and drop `allow-same-origin` from iframe sandbox (use `sandbox=""` unless same-origin is justified).
4. **Apply V5-6 fix (lines 209, 801):** decide whether `.tsx` in `backend/` is acceptable (verify lint/biome/tsgo on the new files) or use `createElement` in `.ts` files to avoid JSX in the backend. Add a Phase 1 verification step for the chosen approach.
5. **Apply V5-5 fix (lines 731-742):** consolidate `next/dynamic({ ssr: false })` to `EmailEditorWrapper.tsx` ONLY. Remove contradictory text about adding it in tier view files.

### P2 — Fix during construction (Phase 3)
6. **Apply V5-4 fix (line 870):** add explicit Phase 3 task to DELETE `email-templates.ts` after dispatcher migration.
7. **Apply V5-10 fix (lines 564-565):** either add `notificationEventId` to `NotificationMetadataBase` + populate in builders (todo 18), or remove it from the idempotency hash.

### P3 — Fix during polish (Phase 5)
8. **Apply V5-7 fix (lines 789-793):** correct the i18n server-path mechanism description to reflect pre-built message objects (not type-driven runtime lookup).
9. **Apply V5-9 fix to todo 20b (line 107-108):** add `@next/bundle-analyzer` as a dev dependency before running bundle size analysis.
10. **Apply V5-8 fix to todo 16 note (line 83):** acknowledge that the email-template store follows the inline `create()` pattern (no separated mock-store factory). Connect with V5-5 note: if tier-view files are "pure presentation", they should NOT contain `next/dynamic` imports.

### Risk Tier Mapping
- P0 = blocks safe rollout (V5-1, V5-2)
- P1 = prevents production bugs/security issues (V5-3, V5-6, V5-5)
- P2 = prevents maintenance/correctness issues (V5-4, V5-10)
- P3 = polish/doc clarity (V5-7, V5-9, V5-8)

---

## Fix Tracker

| Issue ID | Severity | Status | Where in Plan | Recommendation tier |
|---|---|---|---|---|
| V5-1 | High | New | Lines 549-578 (dispatcher refactor) | P0 — fix before implementation |
| V5-2 | High | New | todo 21c (line 122-124), dispatcher gating | P0 — fix before implementation |
| V5-3 | Medium | New | todo 12a (line 66) — CSP + sandbox | P1 — fix in Phase 1-2 |
| V5-4 | Medium | New | Lines 799-806, 870 (email-templates.ts migration) | P2 — fix during construction |
| V5-5 | Medium | New | Lines 731-742 (EmailEditorWrapper vs tier view) | P1 — fix in Phase 1-2 |
| V5-6 | Medium | New | Lines 209, 801 (`.tsx` in backend) | P1 — fix in Phase 1-2 |
| V5-7 | Low | New | Lines 789-793 (i18n mechanism description) | P3 — fix during polish |
| V5-8 | Low | New | todo 16 note (line 83) — mock-store assumption | P3 — fix during polish |
| V5-9 | Low | New | todo 20b (line 107-108) — bundle analyzer | P3 — fix during polish |
| V5-10 | Low | New | Lines 564-565 (notificationEventId) | P2 — fix during construction |

| Carryover | Originating review | Status |
|---|---|---|
| C-1 (isomorphic-dompurify Bun compatibility) | V2-5 → V3-15 → V4-6 | **CLOSED** — Phase 0 gate scheduled |
| C-2 (i18n en/ar lockstep) | V3-7 → V4-3 | **CLOSED** — lockstep requirement documented |
| C-3 (sendTest rate limiting) | V1-5 → V3-14 | **CLOSED** — todo 12 includes rate limit |
| V3-1 (resetEmailChannel compile error) | V3 → V4-1 | **CLOSED** — V4-1 fix verified correct |
| V3-4 (typed registry TS limitation) | V3 → plan 207-325 | **CLOSED** — corrected pattern applied |
| V3-12 (transaction for activation) | V3 → V2-13 | **CLOSED** — todo 12 includes transaction wrap |

---

## Convergence Assessment

### Issue Count Trend

| Review | Total Issues | Critical | High | Medium | Low | Regressions |
|---|---|---|---|---|---|---|
| v1 | ~15 | ~3 | ~5 | ~5 | ~2 | N/A (first) |
| v2 | ~20 | ~3 | ~5 | ~8 | ~4 | N/A (v1 fixes not yet applied) |
| v3 | 15 | 2 | 5 | 5 | 3 | 1 (V3-1, from v2 fix) |
| v4 | 11 | 1 | 3 | 4 | 3 | 1 (V4-1, from v3 fix) |
| **v5** | **10** | **0** | **2** | **4** | **4** | **0** |

### Analysis

**The review process is converging.** The trend shows:
- **Total issues:** 15 → 20 → 15 → 11 → 10 (declining)
- **Critical issues:** 3 → 3 → 2 → 1 → **0** (fully eliminated)
- **Regressions:** N/A → N/A → 1 → 1 → **0** (fully eliminated)
- **High issues:** 5 → 5 → 5 → 3 → **2** (declining)
- **v4 fix quality:** 11 of 11 v4 fixes passed regression check (100% clean)

### Areas Now Stable (no issues found in v5)

- **Typed registry pattern** — `EmailPropsByScope` + mapped type + `defineEmailTemplate` is correctly designed per research file 06. No issues.
- **`as const satisfies` idiom** — valid TS, used in repo, tsgo 7.0 supports it. No issues.
- **`resetEmailChannel` V4-1 fix** — operates on `instance` + `initializationPromise`. Compiled, verified. No issues.
- **Drizzle schema conventions** — inline indexes, `jsonb.$type<>`, `createPgEnumFromEnum`, partial unique indexes. All match. No issues.
- **`EmailTheming` import path** — pinned to `@react-email/editor/plugins`. Verified. No issues.
- **i18n en/ar lockstep** — explicit mandatory coupling documented. No issues.
- **NotificationEventType enum count** — 24 values, 3 deferred. Verified. No issues.
- **`CommunicationPayload` extension** — optional `templateProps?` non-breaking. Verified. No issues.
- **`idempotencyKey` pattern** — 6-table reference correct. No issues.
- **Test conventions** — `runInRollback`, `describeLiveWhen`, test directory structure. All match. No issues.
- **File organization** — all new file paths match codebase conventions. No issues (except `.tsx` precedent — V5-6).
- **GraphQL codegen workflow** — `bun run generate:gqlSchema && bun codegen` is valid. No issues.

### Areas Still Needing Attention

- **Dispatcher architecture** (V5-1) — the plan's refactored code doesn't match the actual `dispatchRecipientChannel` fall-through structure. Needs rewrite.
- **Feature flag consumption** (V5-2) — `resolveEnvConfig` returns string, not boolean. Needs `getBooleanEnv`.
- **Security hardening** (V5-3) — CSP and sandbox can be tightened.
- **Backend `.tsx` precedent** (V5-6) — zero `.tsx` in backend; needs verification or alternative approach.

### Recommendation

**The plan is ready for implementation after the 2 P0 fixes (V5-1, V5-2) are applied.**

The v5 review found **zero Critical issues and zero High regressions**. The 10 new issues are architectural mismatches and convention gaps — the two High issues (V5-1 dispatcher structure, V5-2 boolean flag) are both plan-text corrections, not design rethinks. The plan's core architecture (typed registry, scope-enum deferral, feature-flag gating, transaction wrapping, `runInRollback` tests, DOMPurify defense-in-depth) is sound and has been stable across 4 review rounds.

**Apply the 2 P0 fixes → begin Phase 0 (dependency installation + isomorphic-dompurify verification).** The remaining 8 issues can be resolved during implementation phases per the tier mapping.

**No further review round is needed.** The convergence trend (15→20→15→11→10, critical 3→3→2→1→0, regressions 1→1→0) confirms the plan is approaching asymptotic stability. A v6 review would likely find ≤5 issues, all Low — diminishing returns. The plan should move to implementation.
