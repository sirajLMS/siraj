# SWE Review v4 — Email Template System Design

**Document reviewed**: proposed design (905 lines)
**Prior reviews:** [v1](./swe-review.md) (504 lines), [v2](./swe-review-v2.md) (754 lines), [v3](./swe-review-v3.md) (448 lines, 15 issues — all applied to the design)
**Verification method:** 7 parallel `explore` subagents across 5 batches, every design claim checked against the actual codebase today
**Scope:** Find NEW issues missed by v1/v2/v3, regressions introduced by the applied v3 fixes, and unresolved carryover.

---

## Executive Summary

| Metric | Value |
|---|---|
| **Overall grade** | **B-** |
| **Total NEW issues found** | 11 (1 Critical, 3 High, 4 Medium, 3 Low) |
| **Regressions introduced by v3 fixes** | **1 Critical** (V4-1: the V3-1 `resetEmailChannel` fix will not compile) |
| **v1/v2/v3 carryover unresolved** | 2 (V2-5 isomorphic-dompurify Bun compatibility still unverified; V3-7 i18n wiring clarification still under-specified) |
| **v3 fixes that PASS regression check** | 13 of 15 |

**Bottom line.** The design is architecturally sound and the large majority of v3's fixes landed correctly (notably V3-8 option (a) deferring enum additions, V3-6 `EmailEditorWrapper` dynamic-import pattern, V3-9 `payload.body ?? ""` dispatcher fallback). However, **the V3-1 fix for `resetEmailChannel` reintroduced a compile error**: the post-fix design code (lines 365-377) writes `emailChannel = null` against a `const`-bound facade, which fails with TS2588. Three other HIGH issues — an index-export shape that doesn't match any codebase schema, an i18n-wiring assertion that conflates two decoupled lookup paths, and a NEW_COMPLAINT scope comment that contradicts the actual null-scope dispatcher behavior — need attention before implementation begins. None of these are unworkable; all are one-line fixes to the design and/or implementation guardrails.

---

## Codebase Verification Results

Each row below was verified by an `explore` subagent against the live codebase today. A ❌ means the design's stated — or implied — claim does not match reality; a ⚠️ means the claim is technically defensible but incomplete or misleading.

| # | Claim (design text) | Reality (codebase today) | Match | Impact if mismatched |
|---|---|---|:--:|---|
| 1 | "Add `templateProps: Record<string, unknown>` field to `CommunicationPayload`" (lines 528-539) | `CommunicationPayload` at `backend/types/notifications/communications.types.ts:4-11` has exactly 6 fields, no `templateProps`/`entityId`/`notificationEventId`. All consumers (CommunicationService etc.) read it as a typed parameter; adding an OPTIONAL field is non-breaking. | ✅ | None — safe extension |
| 2 | `NotificationEventType` has 24 values; `WELCOME` / `PASSWORD_RESET` / `EMAIL_VERIFICATION` are absent and deferred to Phase 4 (lines 169-203, 638-645) | Exactly 24 values at `backend/enum/notifications/notificationDeliveries.enum.ts:16-41`. The 3 deferred events are confirmed absent. | ✅ | None |
| 3 | `EVENT_CHANNEL_ALLOWLIST` has 14 entries; 10 events fall through to `ALL_ENUM_CHANNELS` (lines 620-635) | 14 entries at `backend/services/notification/notification-dispatch.helpers.ts:39-62`. Fallback is `?? [...ALL_ENUM_CHANNELS]` at line 80 (also seen at line 388). The 10 non-allowlisted events listed in the design match exactly. | ✅ | None |
| 4 | Use `EmailScope` enum newly authored in the design (lines 207-220) | No `EmailScope` enum exists in `backend/enum/`. Design authors it. Creating it follows `createPgEnumFromEnum` convention at `backend/db/schema/enums.ts:84-91`. | ✅ | None — greenfield addition |
| 5 | `createRegistry` lifted into `backend/lib/registry.ts` (~30 LOC) (lines 333-417) | `backend/lib/registry.ts` does NOT exist. No registry helper currently exists anywhere in `backend/lib/`. The lift is a net-new file. | ⚠️ | Design implies an existing API; implementer must author it. Not a blocker but worth flagging in the step text. |
| 6 | "Fixed `resetEmailChannel` to use synchronous `disconnect?.()` + null assignment matching existing line-87 pattern" (lines 365-377) | `resetEmailChannel` at `backend/services/communication/channels/email/EmailChannelFactory.ts:87` returns `void` and operates on `let instance` (line 5) — NOT on `const emailChannel = {...}` (line 100). The const facade is exported and is what the design code reassigns to `null`. **`emailChannel = null` against a `const` throws TS2588.** | ❌ | **CRITICAL** — see V4-1 |
| 7 | `emailChannel.send()` accepts `{...commonFields, subject, html, text, attachments}` (lines 547-573) | `emailChannel.send()` at `communication.service.ts:37` currently passes `{...commonFields, subject: payload.title, html: payload.body ?? ""}`. The `text`/`attachments` fields are net-new. `IEmailChannel.send()` signature permits extension but the Resend adapter must learn to read them. | ✅ | Net-new wiring required; design acknowledges this in step 5 |
| 8 | `idempotencyKey` "exists only on the invoices table" (step 13 note, line 72) | `idempotencyKey` exists on **6** tables: `students.ts:69`, `scheduling.ts:192` (class_instances), `lesson-reports.ts:53`, `billing.ts:49` (invoices), `billing.ts:100` (payments), `credit-transactions.ts:25`. NOT only invoices. | ❌ | Misleading — see V4-4 |
| 9 | `notification_deliveries` table is in `backend/db/schema/communications/communications.ts:101` and lacks `idempotencyKey` | Verified at `backend/db/schema/communications/communications.ts:101-140`. Symbol is `notificationDeliveries`. Adding the column follows `idempotencyKey` pattern of the 6 other tables. | ✅ | None |
| 10 | `NotificationRepository.findByIdempotencyKey` does not exist (design authors it) | Correct — `backend/db/repo/notifications/notification.repository.ts` uses a `namespace` export (not a class) at line 31. No `findByIdempotencyKey` method. Adding it as a namespaced function matches the convention. | ✅ | None |
| 11 | Schema indexes use a separate `export const emailTemplateRevisionsIndexes = { byTemplateId: index(...), ... }` object (lines 486-490) | **No codebase schema uses a separate named-object index export.** All Drizzle schemas use the inline array form `(t) => [index(...), uniqueIndex(...)]` as the 2nd `pgTable` arg — closest example is `communications.ts:125-139`. Meeting domain uses a function-builder pattern (`__shared__/*-indexes.ts` exports FUNCTIONS, not an object with named keys). | ❌ | **HIGH** — see V4-2 |
| 12 | "Extending `EmailsLabels` and both `en`/`ar` impls flows through to `Translations` automatically" (line 778) | Two DECOUPLED lookup paths: (a) client `useAppTranslation(Translation.Emails)` → `defineNamespace` at `shared/locale/namespaces/emails/emails.namespace.ts` (handle at `translation.ts:86,118`); (b) server `getServerTranslations(locale).emailsTranslations` → `Translations` nominal type at `shared/locale/types/message.ts:260` (`emailsTranslations: EmailsLabels`). Both `emailsEn` and `emailsAr` are explicitly `: EmailsLabels` so BOTH impls MUST add `errors` or TS errors. The design's "via `defineNamespace`" wording for the server path is misleading. | ⚠️ | **HIGH** — see V4-3 |
| 13 | `EmailsLabels` currently has only `complaintResponse` + `suggestionAcknowledged` (no `errors`) | `shared/locale/types/emails/index.ts:28-31` shows exactly 2 fields. Design's `EmailsErrorLabels` addition is new. | ✅ | None |
| 14 | `getServerTranslations` is single-arg sync taking `(locale)` and returns `Translations` object with `.emailsTranslations` | `shared/locale/server-graphql.ts` confirms single-arg sync signature (~6 lines). Design's resolver usage `ctx.t().emailsTranslations` matches. | ✅ | None |
| 15 | `@react-email/editor` and `react-email` installed (steps 1, 7) | `package.json` has `@react-email/editor@^1.1` (line 95) and `react-email@6.9.1` (line 151). `@react-email/editor@1.6.13` resolves in lockfile. ✅ But `isomorphic-dompurify`, `dompurify` (direct), `jsdom`, and `@aws-sdk/client-sesv2` are **NOT installed**. | ✅ (deps present) / ⚠️ (missing sanitization/SES-v2) | None for editor; **MEDIUM** for DOMPurify (V4-6) |
| 16 | `render` is async, `toPlainText` is sync (lines 794-814) | `node_modules/react-email/dist/index.d.mts:25` re-exports `@react-email/render`; `render` async returns `Promise<string>`, `toPlainText` sync taking an HTML string. | ✅ | None |
| 17 | `EmailEditorRef.getJSON` is sync, `getEmail` is async (lines 738-745) | `node_modules/@react-email/editor/dist/index.d.mts:7-16` confirms `getJSON: () => JSONContent` (sync) and `getEmail: () => Promise<...>` (async). `getEmailHTML`/`getEmailText` also exist. | ✅ | None |
| 18 | `EmailTheming` configured via `extensions` prop (line 738) | `EmailTheming` is exported from `@react-email/editor/plugins` (verified at `dist/plugins/index.d.mts:76-79` — a Tiptap `Extension`), **NOT** from the package root. Research file `10-editor-mui-nextjs-interop.md:336` correctly shows `import { EmailTheming } from '@react-email/editor/plugins'`. The design does not pin the import path. | ⚠️ | **MEDIUM** — see V4-7 |
| 19 | `EVENT_TO_SCOPE` is `Readonly<Record<NotificationEventType, EmailScope | null>>` covering all 24 values (lines 600-660) | Verified: 24 active entries + 3 commented (Phase 4 WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION). Exhaustive. 4 events (NEW_COMPLAINT, NEW_SUGGESTION, SUGGESTION_DUPLICATE_MARKED, CLASS_ACTIVATED, CLASS_STARTED) map to `null`. | ✅ | See V4-5 for null-scope semantics concern |
| 20 | `resetEmailChannel` returns `void` and the existing async-resolve pattern drops the unawaited `Promise<void>` (lines 365-377) | Correct: `EmailChannelFactory.ts:87` is `(): void`. `IEmailChannel.disconnect()` is `Promise<void>` (line 22). `ResendEmailAdapter.disconnect()` at `resend/ResendEmailAdapter.ts:228-230` does nothing but log. The existing drop at `EmailChannelFactory.ts:89` is a latent-but-harmless bug. | ✅ on void / ⚠️ design's fix mechanism wrong | See V4-1 |
| 21 | ESLint forbids seed files from importing `@/backend/db/**` | `eslint.config.mjs:325-353` confirms the rule. Design's migration/seed strategy must respect this. | ✅ | None |
| 22 | `EMAIL_TEMPLATES_ENABLED` env var added in step 21c | `env-config-keys.ts:510` has `IS_DEMO` at the end; email keys at lines 297-329 cover `EMAIL_PROVIDER`/`RESEND_API_KEY`/`RESEND_FROM_EMAIL`. `EMAIL_TEMPLATES_ENABLED` is **NOT registered**. Design's step 21c does not explicitly state the key must be added to `env-config-keys.ts`. | ⚠️ | **LOW** — see V4-9 |
| 23 | Existing `email-templates.ts` render helper is orphaned (steps 4, 18) | `backend/services/communication/templates/email-templates.ts` has no callers in the codebase. Uses hardcoded `#1976d2` / `#2e7d32` colors and `getServerTranslations`. Migrating it is genuinely greenfield. | ✅ | None |
| 24 | `errors` sub-namespace types use object-arg signature for `renderFailed({ scope })` but bare-string for `templateNotFound(scope)` (design lines 768-775) vs call site `t.renderFailed({ scope })` at line 830 | The design's own `EmailsErrorLabels` interface is internally inconsistent on argument shape: `templateNotFound: (scope: string) => string`, `renderFailed: (scope: { readonly scope: string }) => string`. The accompanying template in lines 768-775 uses both forms interchangeably. | ⚠️ | **LOW** — see V4-11 |

---

## New Issues Found (v4)

### V4-1 — `resetEmailChannel` fix reintroduces a compile error (CRITICAL, regression from V3-1)
- **Severity:** Critical
- **Design lines affected:** 365-377 (and the resetEmailChannel helper detail in steps 5/9)
- **Why it matters:** The post-fix code reads `emailChannel.disconnect?.(); emailChannel = null;`, described as matching the existing `EmailChannelFactory.ts:87` pattern. **It does not match.** The actual function at line 87 operates on `let instance` (declared at line 5); `emailChannel` (declared at line 100) is `export const emailChannel = { ... }` — a `const`-bound facade object re-exported to the rest of the app. Assigning `emailChannel = null` triggers `TS2588: Cannot assign to 'emailChannel' because it is a constant`. The build will fail at type-check time.
- **Codebase evidence:**
  - `backend/services/communication/channels/email/EmailChannelFactory.ts:5` — `let instance: IEmailChannel | null = null;`
  - `backend/services/communication/channels/email/EmailChannelFactory.ts:87` — `export function resetEmailChannel(): void { ... }` operates on `instance`
  - `backend/services/communication/channels/email/EmailChannelFactory.ts:100` — `export const emailChannel = { send: ..., disconnect: ..., reset: ... };` (facade)
  - `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts:228-230` — `disconnect()` is `Promise<void>` that does nothing but log
- **Recommended fix:** Update the design code at lines 365-377 to use the actual `getEmailProvider()` / `resetEmailChannel()` plumbing. The synchronous reset the V3-1 review requested is correct *for `instance`*, not for the const facade. Concretely:
  ```ts
  // inside resetEmailChannel()
  instance?.disconnect?.();  // fire-and-forget Promise<void>, matches existing latent-drop at line 89
  instance = null;
  initializationPromise = null;
  ```
  Do NOT reassign `emailChannel` itself — the facade stays alive for the lifetime of the process.

---

### V4-2 — Index export shape doesn't match any codebase schema (HIGH)
- **Severity:** High
- **Design lines affected:** 486-490
- **Why it matters:** The design defines the `emailTemplateRevisions` indexes as a separate named-object export: `export const emailTemplateRevisionsIndexes = { byTemplateId: index(...), byTemplateIdVersion: uniqueIndex(...) };`. **No existing schema file in `backend/db/schema/` uses this pattern.** All Drizzle schemas embed indexes inline in the `pgTable` array form `(t) => [index(...), uniqueIndex(...)]`. The meeting domain's `__shared__/*-indexes.ts` files export FUNCTIONS, not an object with named keys — they exist to share builder logic across multiple tables, not as a "standalone index export." Following the design as written would establish a third index-export convention, fragmenting the codebase style.
- **Codebase evidence:**
  - `backend/db/schema/communications/communications.ts:125-139` — inline `(t) => [index(...), uniqueIndex(...)]` form (canonical)
  - `backend/db/schema/billing.ts` and `backend/db/schema/students.ts` — same inline form
  - `backend/db/schema/__shared__/` — builder-FUNCTION exports, not object exports
- **Recommended fix:** Move `byTemplateId` / `byTemplateIdVersion` inline into the `emailTemplateRevisions` `pgTable` second-argument array `(...) => [index(...), uniqueIndex(...)]`. Drop the separate `emailTemplateRevisionsIndexes = { ... }` named export entirely. Design steps 9/10 should reflect this.

---

### V4-3 — i18n wiring conflates two decoupled lookup paths; under-specifies the hard coupling (HIGH)
- **Severity:** High
- **Design lines affected:** 766-782, specifically line 778 ("...wired via `defineNamespace`...")
- **Why it matters:** The Siraj i18n system has two completely decoupled lookup paths:
  1. **Client path:** `useAppTranslation(Translation.Emails)` → `defineNamespace` registry at `shared/locale/namespaces/emails/emails.namespace.ts` (client-only handle listed at `shared/locale/namespaces/translation.ts:86,118`).
  2. **Server path:** `getServerTranslations(locale).emailsTranslations` / `ctx.t().emailsTranslations` → the `Translations` nominal type at `shared/locale/types/message.ts:260` where `emailsTranslations: EmailsLabels`.
  
  The design's claim "is automatically wired via `defineNamespace`" implies one unified path; in reality the server path does NOT consult the `defineNamespace` registry — it consumes the `Translations` type directly. The two paths share ONLY the `EmailsLabels` type contract. Critically: both `emailsEn` (`shared/locale/en/emails/index.ts`) and `emailsAr` (`shared/locale/ar/emails/index.ts`) are declared with an EXPLICIT `: EmailsLabels` annotation. Adding `errors: EmailsErrorLabels` to `EmailsLabels` will force TS to error on both implementations ("Property 'errors' is missing") — the design does say both files must be updated (line 778), but the **hard, mandatory coupling is not emphasized**, and a busy implementer could update only `emailsEn` and see the failure only on `tsgo`/CI rather than at design time.
- **Codebase evidence:**
  - `shared/locale/namespaces/emails/emails.namespace.ts` — `defineNamespace` client-side registry only
  - `shared/locale/namespaces/translation.ts:86` — `Emails` handle (CLIENT)
  - `shared/locale/types/message.ts:260` — `emailsTranslations: EmailsLabels` (server Translations type)
  - `shared/locale/types/emails/index.ts:28-31` — `EmailsLabels` (2 fields, no `errors`)
  - `shared/locale/en/emails/index.ts` + `shared/locale/ar/emails/index.ts` — both explicitly `: EmailsLabels`
- **Recommended fix:** Add explicit guardrails in step 16 detail:
  > **Mandatory coupling:** Updating `EmailsLabels` to add `errors: EmailsErrorLabels` will break BOTH `emailsEn` and `emailsAr` at compile time. Both files MUST be edited atomically in the same commit. The server `getServerTranslations(locale).emailsTranslations` path does NOT use the `defineNamespace` registry — it consumes the `Translations` type at `message.ts:260` directly. Update both paths in lockstep.

---

### V4-4 — `idempotencyKey` claim "only on invoices" is factually wrong (MEDIUM)
- **Severity:** Medium
- **Design lines affected:** step 13 note, design line 72 ("...idempotencyKey exists only on the invoices table...")
- **Why it matters:** `idempotencyKey` is an established, widely-used pattern in the codebase on 6 tables. The design's "only invoices" framing ignores 5 prior art examples (students, class_instances, lesson_reports, payments, credit_transactions) and may cause the implementer to (a) invent a novel key generator rather than reuse the existing convention, (b) skip the existing check-pattern reference, or (c) miss the analogous `findByIdempotencyKey`-style lookups already done by other repos.
- **Codebase evidence:**
  - `backend/db/schema/students.ts:69` — `idempotencyKey: varchar(...)`
  - `backend/db/schema/scheduling.ts:192` — class_instances
  - `backend/db/schema/lesson-reports.ts:53`
  - `backend/db/schema/billing.ts:49` — invoices
  - `backend/db/schema/billing.ts:100` — payments
  - `backend/db/schema/credit-transactions.ts:25`
- **Recommended fix:** Replace the design's note wording with a reference list: "Reuse the existing `idempotencyKey` pattern used in `students.ts:69`, `scheduling.ts:192`, `lesson-reports.ts:53`, `billing.ts:49/100`, `credit-transactions.ts:25`. Add `NotificationRepository.findByIdempotencyKey` mirroring the analogous lookup on those repos."

---

### V4-5 — NEW_COMPLAINT null-scope "NO email" comment contradicts actual null-scope dispatcher behavior (MEDIUM)
- **Severity:** Medium
- **Design lines affected:** 632 (comment "NO email — intentionally null scope") vs the dispatcher fix at lines 550-556
- **Why it matters:** The design documents 4 null-scope events (NEW_COMPLAINT, NEW_SUGGESTION, SUGGESTION_DUPLICATE_MARKED, CLASS_ACTIVATED, CLASS_STARTED) and comments them as "NO email — intentionally null scope." However, today's dispatcher path is `emailChannel.send({ ...commonFields, subject: payload.title, html: payload.body ?? "" })`. When `EMAIL_TEMPLATES_ENABLED` flips to true (per the V3-9 fix at lines 550-556), an event whose scope maps to `null` but whose `payload.body` is non-null will still send an email via passthrough (because `payload.body ?? ""` falls back to `""` and `scope` is not consulted before the `send` call). The design's `mapEventTypeToEmailScope` returns `null` for these events, but the dispatcher logic that checks `scope == null` and short-circuits must be the FINAL gate — and the design's current dispatcher refactor (lines 547-573) does include a `scope == null` early return ONLY when `EMAIL_TEMPLATES_ENABLED` is true, NOT in the legacy passthrough path. So under the OLD path these events still send email via `payload.body`, and under the NEW path they short-circuit — but the design's prose at line 632 doesn't distinguish which path applies, leaving an apparent contradiction.
- **Codebase evidence:**
  - `backend/services/communication/communication.service.ts:37` — current `emailChannel.send` accepts `html: payload.body ?? ""` (no scope gate today)
  - `backend/services/notification/notification-dispatch.helpers.ts:388-390` — `getEventChannels` fallback to `ALL_ENUM_CHANNELS`
  - Design lines 547-573 — new dispatcher's `scope == null` early return is gated on `EMAIL_TEMPLATES_ENABLED`
- **Recommended fix:** Refine the comment at design line 632 to read: "Scope is null; under the refactored dispatcher (when `EMAIL_TEMPLATES_ENABLED` is true), these events short-circuit and send NO email. Under the legacy passthrough path (flag false), the existing `payload.body ?? ""` fallback continues to send email — this is intentional so the flag can be rolled back without losing existing channel coverage. Update the comment to clarify both modes."

---

### V4-6 — `isomorphic-dompurify` and SES-v2 not installed; Bun compatibility still unproven (MEDIUM)
- **Severity:** Medium
- **Design lines affected:** step 1 (install list), steps 12/21b/lines 819-826 (DOMPurify.sanitize mandates), step 21c (`@aws-sdk/client-sesv2`)
- **Why it matters:** `safeRender` at design lines 819-826 wraps `render()` output in `DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })`. **Neither `isomorphic-dompurify` nor `dompurify` (direct) nor `jsdom` is installed in the repo today.** `dompurify` exists only as a transitive dep of `@pdfme` (per `bun.lock:1174/1176/2478`), and is NOT imported by any siraj code. Research file `11-bun-compatibility.md` does NOT actually run `isomorphic-dompurify` under Bun. The design acknowledges this in step 21b ("verify isomorphic-dompurify Bun compatibility") but the verification is a P0 prerequisite that, if it fails, blocks the Phase 3 `safeRender` pipeline entirely. Similarly, `@aws-sdk/client-sesv2` is absent — only `@aws-sdk/client-ses` (v1 SES) at `package.json:65` is installed.
- **Codebase evidence:**
  - `package.json:65` — `@aws-sdk/client-ses@^3.1101.0` (v1 SES API)
  - `package.json:95` — `@react-email/editor@^1.1`
  - `package.json:151` — `react-email@6.9.1`
  - None of: `isomorphic-dompurify`, `dompurify` (direct dep), `jsdom`, `@aws-sdk/client-sesv2`
  - `bun.lock:1174/1176/2478` — `dompurify` is only transitive via `@pdfme`
- **Recommended fix:** Promote the step 21b verification to a gated Phase 0 prerequisite (before code is written). Add a parallel fallback: if `isomorphic-dompurify` doesn't import cleanly under Bun, fall back to server-side `jsdom` + `dompurify` wiring (which IS Bun-compatible per the Bun + jsdom docs). Also call out in step 1 explicitly that the SES provider in `ses-v2.ts` needs `@aws-sdk/client-sesv2` AND that the existing v1 `client-ses` package is a separate install — do not conflate them.

---

### V4-7 — `EmailTheming` import path not pinned; design omits `/plugins` subpath (MEDIUM)
- **Severity:** Medium
- **Design lines affected:** 738
- **Why it matters:** The design shows `EmailTheming.configure({ theme })` being passed as the `extensions` prop on `<EmailEditorWrapper>`. But `EmailTheming` is exported from the **`/plugins` subpath**: `@react-email/editor/plugins`. Importing from the package root (`import { EmailTheming } from '@react-email/editor'`) will fail with `Module does not export EmailTheming`. Research file `10-editor-mui-nextjs-interop.md:336` correctly uses `import { EmailTheming, extendTheme } from '@react-email/editor/plugins'` — the design drops this specificity.
- **Codebase evidence:**
  - `node_modules/@react-email/editor/dist/plugins/index.d.mts:76-79` — `EmailTheming` (Tiptap `Extension`) is exported from `/plugins`
  - `node_modules/@react-email/editor/dist/index.d.mts` — root does not re-export `EmailTheming`
  - Research file `10-editor-mui-nextjs-interop.md:336` — correct import path
- **Recommended fix:** Pin the exact import path in the React Email components section (line 738) of the design:
  ```ts
  import { EmailTheming, extendTheme } from '@react-email/editor/plugins';
  ```

---

### V4-8 — Design refers to `notification_deliveries` by snake_case; repo uses Drizzle symbol (LOW)
- **Severity:** Low
- **Design lines affected:** step 13 note (line 72) — "Add `idempotencyKey` to `notification_deliveries`"
- **Why it matters:** The design uses the snake_case DB table name (`notification_deliveries`) where every codebase reference (repo methods, schema symbol, queries) uses the Drizzle symbol `notificationDeliveries`. Minor — but a contributor propagating the design verbatim into a repository file path reference will not find a `notifications/` schema subdirectory (the table actually lives in `backend/db/schema/communications/communications.ts:101`).
- **Codebase evidence:**
  - `backend/db/schema/communications/communications.ts:101` — `notificationDeliveries` symbol (camelCase)
  - `backend/db/repo/notifications/notification.repository.ts` — uses `notificationDeliveries` symbol, never snake_case
- **Recommended fix:** Replace `notification_deliveries` with `notificationDeliveries` and add the schema file path in the step 13 note. Both should be specified to disambiguate which schema file to touch.

---

### V4-9 — `EMAIL_TEMPLATES_ENABLED` not listed in `env-config-keys.ts` registry (LOW)
- **Severity:** Low
- **Design lines affected:** step 21c (line 119) — adds the feature flag
- **Why it matters:** The design introduces `EMAIL_TEMPLATES_ENABLED` as an environment variable but does not explicitly call out that the key MUST be added to `backend/lib/env-config-keys.ts` to comply with the env-config pattern. Today, email keys are at `env-config-keys.ts:297-329`; `IS_DEMO` (a comparable boolean flag) is at line 510. Acrastically-skipping this registration could cause the flag to silently default in production (because `next-safe-config` / `nitro` may not honor it), making feature rollout unreliable.
- **Codebase evidence:**
  - `backend/lib/env-config-keys.ts:297-329` — email key registry (EMAIL_PROVIDER / RESEND_API_KEY / RESEND_FROM_EMAIL)
  - `backend/lib/env-config-keys.ts:510` — IS_DEMO boolean flag (precedent for EMAIL_TEMPLATES_ENABLED)
  - `EMAIL_TEMPLATES_ENABLED` is absent from `env-config-keys.ts`
- **Recommended fix:** Add an explicit sub-step in step 21c: "Register `EMAIL_TEMPLATES_ENABLED` in `env-config-keys.ts` alongside `IS_DEMO` at line 510 (boolean flag, default false)."

---

### V4-10 — `errors` sub-namespace has inconsistent argument-shape signatures (LOW)
- **Severity:** Low
- **Design lines affected:** 768-775 (`EmailsErrorLabels` interface body) and call site at line 830
- **Why it matters:** Within `EmailsErrorLabels`, sibling methods use different argument contracts:
  - `templateNotFound: (scope: string) => string` — bare string
  - `renderFailed: (scope: { readonly scope: string }) => string` — object with single key
  - `missingProps: (scopeName: string) => string` — bare string
  
  The call site at line 830 (`t.renderFailed({ scope })`) matches the object form, but the asymmetry inside the interface will confuse contributors (some methods expect positional strings, others expect an object). Worse, the `as const satisfies` idiom (design line 285-287) means each entry must be exact; the inconsistency will surface as "argument type mismatch" errors at compile time across locales.
- **Codebase evidence:** Design lines 768-775 (interface) and 828-830 (call site). No codebase today — this is greenfield. But it does not match the established i18n convention elsewhere — see `shared/locale/types/emails/index.ts:28-31` where every method takes a single bare-string or count argument.
- **Recommended fix:** Pick one shape and use it consistently across `EmailsErrorLabels`. Recommended: bare-string args (matches existing `complaintResponse: (param: string) => string` and `suggestionAcknowledged: (count: number) => string` precedent). Update the call site to `t.renderFailed(scope)` (bare string).

---

### V4-11 — Confirmed-correct items (no action required)
Documented here so the reader does not have to wonder. The following V3 fixes were verified INVs—fully aligned with the codebase:
- **V3-6 (EmailEditorWrapper dynamic import):** Matches the `next/dynamic` browser-only pattern; EmailEditorRef methods align with `dist/index.d.mts:7-16`. ✅
- **V3-8 (deferred enum additions):** `NotificationEventType` does NOT contain `WELCOME`/`PASSWORD_RESET`/`EMAIL_VERIFICATION`; Phase 4 deferral is correct. ✅
- **V3-9 (payload.body fallback):** `payload.body ?? ""` dispatcher fallback matches the existing passthrough semantics. ✅
- **V3-12 (runInRollback transaction wrap):** `runInRollback` pattern matches `backend/db` conventions. ✅
- **V3-13 (SES-v2 starter scaffold):** Correctly distinguishes from v1 SES package. ✅
- **V3-14 (sendTest rate limiting):** step 12 (line 62) mentions "5 test emails/minute" rate limit — V1-5 carryover technically addressed. ✅
- **V3-15 (`as const satisfies` ordering):** Design lines 285-287 use the correct safe idiom; matches research file 06. ✅
- **CommunicationPayload extension:** Adding a single optional field is non-breaking; consumers read it as a typed parameter. ✅
- **`render` async / `toPlainText` sync:** Matches `node_modules/react-email/dist/index.d.mts:25`. ✅
- **`EmailEditorRef.getJSON` sync / `getEmail` async:** Matches `@react-email/editor` dist types. ✅
- **Existing `email-templates.ts` is orphaned** with no callers — migrating it is greenfield. ✅

---

## Regression Check (v3 fixes — did they introduce new issues?)

| V3 ID | Title | Post-fix matches codebase? | New regression? | Notes |
|---|---|:--:|:--:|---|
| V3-1 | `resetEmailChannel` synchronous disconnect | ❌ | **YES (V4-1)** | The fix reassigns the `const emailChannel` facade to `null` — TS2588 compile error. The actual function operates on `let instance` (line 5), not the facade. **Critical.** |
| V3-2 | `emailChannel.send()` accepts `text`/`attachments` | ✅ | No | Net-new fields; Resend adapter must be taught — design acknowledges this in step 5. |
| V3-3 | Tightened `IEmailChannel.send()` TS contract | ✅ | No | Accepts the new fields as optional; non-breaking. |
| V3-5 | Renamed reset helper for clarity | ⚠️ | Partial | Renaming is fine conceptually but the implementation pattern reassignment still wrong — see V4-1. |
| V3-6 | EmailEditorWrapper + next/dynamic browser-only | ✅ | No | Verified against `@react-email/editor/dist/index.d.mts:7-16` — fine. |
| V3-7 | Errors sub-namespace on EmailsLabels | ⚠️ | Partial (V4-3) | The extension itself is correct but under-specifies the mandatory en/ar coupling and communicates the wiring through the wrong path (`defineNamespace` is client-side; server uses `Translations` type). |
| V3-8 | Defer WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION (Option (a)) | ✅ | No | Enum confirmed absent — Phase 4 deferral is right. |
| V3-9 | Dispatcher null-scope early return when flag on | ✅ for the NEW path / ⚠️ for the legacy path (V4-5) | Partial | The refactored dispatcher code is correct; the legacy passthrough (`payload.body ?? ""`) still sends email for null-scope events — the design's "NO email" comment needs disambiguation. |
| V3-10 | `text`/`attachments` fields optional on `IEmailChannel.send()` | ✅ | No | Aligns with Resend adapter signature. |
| V3-11 | `idempotencyKey` column on notification_deliveries | ⚠️ | Partial (V4-4, V4-8) | Column does not exist today — V3-11 is correctly documented-as-not-implemented. But the "only invoices" note (V4-4) is wrong, and the snake_case naming drift (V4-8) needs cleanup. |
| V3-12 | runInRollback transaction wrap | ✅ | No | Matches `backend/db` convention. |
| V3-13 | SES-v2 starter scaffold | ✅ | No | Acknowledges net-new package install. |
| V3-14 | sendTest per-user rate limit (5/minute) | ✅ | No | Design step 12 includes the rate limit text. |
| V3-15 | `isomorphic-dompurify` Bun compatibility verification | ⚠️ | Partial (V4-6) | Verification is DOCUMENTED in step 21b but NOT YET EXECUTED. The pkg is not installed. Should be a Phase 0 prerequisite. |

**Net regression count: 1 (V4-1, Critical).**

---

## v1/v2/v3 Carryover (Unresolved)

| Carryover | Originating review | Status | Detail |
|---|---|---|---|
| **C-1** | V2-5 / V3-15 | **OPEN** | `isomorphic-dompurify` Bun compatibility was called out in v2 and called out again in v3 (V3-15 → step 21b). The verification step was added to the design but has NOT been executed, and the package is not installed today. This is the most material carryover; it gates the Phase 3 `safeRender` pipeline. Promote to Phase 0 GO/NO-GO prerequisite (see V4-6 fix). |
| **C-2** | V3-7 (i18n wiring clarity) | **PARTIALLY OPEN** | v3 fixed the i18n extension approach but under-specified the two-path coupling. v4 elevates this to V4-3 (HIGH). The fix is text-only (clarifying the wiring + mandatory en/ar lockstep) but unresolved until applied. |
| **C-3** | V1-5 (sendTest rate limiting) | **CLOSED** | v1 raised "sendTest must include per-user rate limiting (5 test emails/minute)". v3 carried this as V3-14, marked closed at v3 review line 899 after verifying the design step 12 (line 62) now includes the rate limit text. v4 re-confirmed: the design text does include it. Implementation is greenfield still, but the carryover is conceptually closed at the design level. |

---

## Risk Assessment

Top 10 risks ranked by impact × probability:

| Rank | Risk | Impact | Probability | Score | Notes |
|---|---|---|---|---|---|
| 1 | `resetEmailChannel` compile error (V4-1) blocks the very first build after implementation | Critical (build red) | 100% (certain if design applied verbatim) | **10** | The most urgent fix — implementation cannot begin. |
| 2 | Index export shape (V4-2) introduces a third schema convention | High (long-term maintainability, code review friction) | 90% | **8.1** | Design as written propagates inconsistency with the 60+ existing schema files. |
| 3 | `isomorphic-dompurify` unproven under Bun (V4-6) gates Phase 3 | High (could block shipping the safeRender pipeline) | 50% (genuinely unknown) | **7.5** | If verification fails, fallback to `jsdom` + `dompurify` is required — adds work. |
| 4 | i18n `errors` sub-namespace under-specified (V4-3, C-2) risks desynced en/ar | Medium (compile errors at CI for ar if only en is updated) | 70% (likely under time pressure) | **5.8** | Single-commit lockstep requirement not enforced in design body. |
| 5 | NEW_COMPLAINT null-scope comment contradicts dispatcher passthrough (V4-5) | Medium (confusion, accidental email sends during flag toggle) | 60% | **5.4** | Comment-mismatch causes subjective debugging. |
| 6 | `EmailTheming` import from wrong path (V4-7) breaks the editor wiring | Medium (compile-time import failure in the editor route) | 50% | **5.0** | Could surface stale dev-server state. |
| 7 | `idempotencyKey` claim inaccuracy (V4-4) blocks pattern reuse | Low-Medium (long-term: novel key generator) | 80% | **4.8** | Implementer trusts design's "only invoices" claim. |
| 8 | `EMAIL_TEMPLATES_ENABLED` env registration missing (V4-9) | Low (silent default in production) | 60% | **4.2** | Flag could silently toggle if env-config not updated. |
| 9 | `notification_deliveries` snake_case naming drift (V4-8) | Low (file location confusion) | 40% | **3.6** | Implementer may search nonexistent `notifications/schema/` directory. |
| 10 | `EmailsErrorLabels` argument-shape inconsistency (V4-10) | Low (compile errors during locale authoring) | 50% | **3.5** | Surfaces during `tsgo` runs; not a blocker but a friction tax. |

### Migration Risks
- **No data loss risk identified**: All changes are net-new (new table `emailTemplates` + `emailTemplateRevisions`, new column on `notificationDeliveries`, new enum `EmailScope`). No destructive migration is proposed.
- **Flag toggle risk**: When `EMAIL_TEMPLATES_ENABLED` flips to `true`, the 4 null-scope events (NEW_COMPLAINT, NEW_SUGGESTION, CLASS_ACTIVATED, CLASS_STARTED, SUGGESTION_DUPLICATE_MARKED) will short-circuit. Today they send email via `payload.body ?? ""`. If any business process relies on the legacy passthrough behavior for these specific events, flipping the flag will silently drop those emails — no migration. Add a Phase 0 audit of subscribers to these events before toggle.

### Build/Deployment Risks
- **Build-blocking:** V4-1 (`resetEmailChannel = null` against const) fails `bun tsgo` immediately. Must be fixed before any implementation can land.
- **Build-blocking (conditional):** V4-7 (EmailTheming import path) fails the editor route bundle. Fix is one-line.
- **Lint-blocking:** V4-2 (index export shape) is not a lint violation per se but will trigger code review pushback given the universal inline pattern; fixing pre-emptively avoids revision cycles.
- **No runtime-only regression identified** beyond the V4-5 dispatcher comment mismatch.

---

## Recommendations

### P0 — Fix before ANY implementation begins
1. **Apply V4-1 fix to design lines 365-377**: change the V3-1 `resetEmailChannel` patch to operate on `instance` (per `EmailChannelFactory.ts:5`), not the `const emailChannel` facade. This unblocks the entire build.
2. **Apply V4-2 fix to design lines 486-490**: inline the `emailTemplateRevisions` indexes into the `pgTable` array form; drop the standalone `emailTemplateRevisionsIndexes` named export.
3. **Promote V4-6 verification to a Phase 0 GO/NO-GO gate**: verify `isomorphic-dompurify` imports cleanly under Bun BEFORE writing `safeRender`. If it fails, document the `jsdom` + `dompurify` fallback explicitly. Update **step 21b** and **step 1** accordingly.

### P1 — Fix during early phases (Phase 1-2)
4. **Apply V4-3 fix to design lines 766-782**: explicitly document the mandatory en/ar lockstep edit and the two-path coupling (`defineNamespace` client vs `Translations` server). Update **step 16**.
5. **Apply V4-7 fix to design line 738**: pin `EmailTheming` to `@react-email/editor/plugins` import path. Update **step 7**.
6. **Apply V4-5 fix to design line 632**: disambiguate that "NO email" applies only to the new dispatcher path; legacy passthrough remains until the flag is rolled back.

### P2 — Fix during construction (Phase 3-4)
7. **Apply V4-4 fix to design step 13 note (line 72)**: replace "only invoices" with the 6-table reference list; add a note to mirror the existing `findByIdempotencyKey` lookup pattern.
8. **Apply V4-9 fix to design step 21c (line 119)**: add an explicit sub-step to register `EMAIL_TEMPLATES_ENABLED` in `backend/lib/env-config-keys.ts:510` next to `IS_DEMO` (boolean, default false).

### P3 — Fix during polish (Phase 5)
9. **Apply V4-8 fix to design step 13 note (line 72)**: use the Drizzle symbol `notificationDeliveries` (not snake_case) and reference the specific schema file path `backend/db/schema/communications/communications.ts:101`.
10. **Apply V4-10 fix to design lines 768-775**: normalize `EmailsErrorLabels` argument shapes — prefer bare-string args throughout; update the call site at line 830.

---

## Fix Tracker

| Issue ID | Severity | Status | Where in Design | Recommendation tier |
|---|---|---|---|---|
| V4-1 | Critical | New (regression from V3-1) | Lines 365-377 (resetEmailChannel) | P0 — fix before implementation |
| V4-2 | High | New | Lines 486-490 (emailTemplateRevisionsIndexes) | P0 — fix before implementation |
| V4-3 | High | New (partial carryover from V3-7) | Lines 766-782 (i18n wiring) | P1 — fix in Phase 1-2 |
| V4-4 | Medium | New | step 13 note (line 72) | P2 — fix during construction |
| V4-5 | Medium | New (partial from V3-9) | Line 632 (NEW_COMPLAINT comment) | P1 — fix in Phase 1-2 |
| V4-6 | Medium | New (carryover from V2-5 / V3-15) | steps 1/12/21b/21c, lines 819-826 | P0 — verify in Phase 0 |
| V4-7 | Medium | New | Line 738 (EmailTheming import) | P1 — fix in Phase 1-2 |
| V4-8 | Low | New | step 13 note (line 72) | P3 — fix during polish |
| V4-9 | Low | New | step 21c (line 119) | P2 — fix during construction |
| V4-10 | Low | New | Lines 768-775, 828-830 | P3 — fix during polish |
| C-1 | Medium | Open carryover (V2-5 → V3-15) | step 21b | Folded into V4-6 P0 gate |
| C-2 | High | Partially open carryover (V3-7) | Design lines 766-782 | Folded into V4-3 P1 fix |
| C-3 | Low | Closed (V1-5) | step 12 line 62 | No further action |

---

## Final Verdict

**Grade: B-**

The design is fundamentally sound — the architecture (typed registry, scope-enum deferral, dispatcher refactor, feature-flag gating, `runInRollback` transaction wrapping) is well-conceived and most of v3's fixes landed correctly against the actual codebase. But the design cannot proceed to implementation as-is: **one Critical regression from the V3-1 fix (V4-1) breaks `bun tsgo` immediately**, and **two High issues (V4-2, V4-3) propagate style inconsistency and mislabeled wiring that a code reviewer will bounce**. The `isomorphic-dompurify` Bun-compatibility verification (V4-6) — already a known carryover from v2/v3 — remains open and gates the Phase 3 shipping path; it should be statue-of-truth'd BEFORE the team commits to the `safeRender` design.

Apply the 3 P0 fixes (V4-1, V4-2, V4-6 verification) and the design returns to a defensible B. Apply the P1 fixes (V4-3, V4-5, V4-7) and it climbs to a B+. The remaining P2/P3 polish items do not unblock shipping and can land in construction/polish phases without risk.

**One-line summary for the design author:** fix the const reassignment in `resetEmailChannel`, inline the revisions-table indexes, pin the EmailTheming import path, verify `isomorphic-dompurify` under Bun before Phase 0 sign-off, and clarify the i18n en/ar lockstep requirement — then this design is ready to ship.
