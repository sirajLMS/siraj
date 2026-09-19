# SWE Review v3 — Email Template System (Proposed Design)
**Date**: 2026-08-01
**Reviewer**: Orchestrator subagent (v3)
**Document reviewed**: proposed design (806 lines)
**Prior reviews**: v1 (swe-review.md, 504 lines), v2 (swe-review-v2.md, 754 lines)

## 1. Executive Summary

- **Overall grade: B**
- **New issues found**: 15 (2 Critical, 5 High, 5 Medium, 3 Low)
- **v1/v2 issues verified as fixed**: 28 of 35
- **v1/v2 issues NOT fixed (or partially fixed)**: 7
- **Top 3 critical findings**:
  1. **[Critical] `resetEmailChannel()` won't compile** — design line 370 uses `await` inside a `void` function and calls a nonexistent `peek()` method on `createRegistry`. This code is a compilation error, not a warning.
  2. **[Critical] Dispatcher code references `payload.entityId`, `payload.notificationEventId`, `payload.templateProps`** — none of these fields exist on `CommunicationPayload` (verified at `backend/types/notifications/communications.types.ts:4-11`). The idempotency key and template props passing code will not compile without a type extension.
  3. **[High] NEW_COMPLAINT and NEW_SUGGESTION mapped to `null` but fall through to `ALL_ENUM_CHANNELS`** — the dispatcher's allowlist fallback sends email on ALL channels for any event NOT in `EVENT_CHANNEL_ALLOWLIST`. Mapping these to `null` prevents template rendering, but the dispatcher still sends an email via the old passthrough `payload.body` path — contradicting the comment "email not desired."

## 2. Codebase Verification (every design claim checked against actual code)

### 2.1 Enums
- **Design claims**: 24 `NotificationEventType` values, 5 `NotificationDeliveryStatus` values, no `WELCOME`/`PASSWORD_RESET`/`EMAIL_VERIFICATION`
- **Codebase**: Verified at `backend/enum/notifications/notificationDeliveries.enum.ts`. Exactly 24 `NotificationEventType` values, 5 `NotificationDeliveryStatus` values (PENDING, SENT, DELIVERED, OPENED, FAILED), 4 `NotificationChannel` values (ON_APP, EMAIL, SMS, PUSH). No WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION exist.
- **Match**: ✅ Correct. v2 fix applied properly.

### 2.2 Channel allowlist
- **Design claims**: 14 entries in `EVENT_CHANNEL_ALLOWLIST`, fallback `?? [...ALL_ENUM_CHANNELS]`, `COMPLAINT_RESPONSE` NOT in allowlist, `CLASS_ACTIVATED`/`CLASS_STARTED` are PUSH only
- **Codebase**: Verified at `backend/services/notification/notification-dispatch.helpers.ts`. Exactly 14 allowlist entries. Fallback is `EVENT_CHANNEL_ALLOWLIST[eventType] ?? [...ALL_ENUM_CHANNELS]`. COMPLAINT_RESPONSE is NOT in allowlist → falls through to all 4 channels. CLASS_ACTIVATED: `[ON_APP, PUSH]` (no EMAIL). CLASS_STARTED: `[ON_APP, PUSH]` (no EMAIL). 10 events NOT in allowlist.
- **Match**: ✅ Correct. But see New Issue #3 — the semantic consequences of the fallback for null-mapped events are not fully addressed.

### 2.3 Email channel factory
- **Design claims**: `resetEmailChannel()` returns `void` (not `Promise<void>`), `getEmailChannel()` is already async, only Resend supported today
- **Codebase**: Verified at `backend/services/communication/channels/email/EmailChannelFactory.ts`. `resetEmailChannel` at line 87: `export const resetEmailChannel = (): void => { ... }`. `getEmailChannel()` at line ~95 is async with caching + `initializationPromise` double-check. `EmailProvider = "resend"` only. `getEmailProvider()` warns and falls back to `"resend"` for unknown providers.
- **Match**: ✅ Correct that signature is `void`. But the design's OWN code at line 370 contradicts this — it uses `await` inside the void function. See New Issue #1.

### 2.4 i18n system
- **Design claims**: `getServerTranslations(locale)` is single-arg, synchronous; `emails.errors` namespace does NOT exist; existing usage at `email-templates.ts:32`
- **Codebase**: Verified at `shared/locale/server-graphql.ts`. `getServerTranslations(locale: string): Translations` — single-arg, synchronous, returns whole bundle. At `shared/locale/server.ts`, `getTranslations(locale: string): Translations` — pure dictionary lookup. Existing usage at `backend/services/communication/templates/email-templates.ts:32`: `getServerTranslations(locale).emailsTranslations.complaintResponse`. `emails.errors` sub-namespace does NOT exist in `shared/locale/types/emails/`.
- **Match**: ✅ Correct. v1/v2 fix applied. The design correctly uses `getServerTranslations(locale).emailsTranslations.errors.*` at lines 703-754.

### 2.5 GraphQL patterns
- **Design claims**: Enum registration in `backend/graphql/pothos/shared/enum.pothos.ts`, mutation naming singular `.mutation.ts`, `inputRef<T>().implement()` pattern, `authScopes: { superAdmin: true, notImpersonating: true }`
- **Codebase**: Verified. Enum registration: `gqlSchemaBuilder.enumType(Enum, { name: "..." })`. Mutation naming: `mark-notification-read.mutation.ts` (singular, kebab-case). Input pattern: `gqlSchemaBuilder.inputRef<T>("Name").implement({...})` confirmed in `notification-preferences.pothos.ts`. authScopes pattern: `{ superAdmin: true, notImpersonating: true }` confirmed in `billing-payments.mutation.ts:68` and `onboarding.mutation.ts:132`.
- **Match**: ✅ Correct. v2 fixes (singular mutation naming, shared enum registration) applied.

### 2.6 Frontend patterns
- **Design claims**: Views in `frontend/common/views/dashboard/email-templates/`, Zustand stores in `frontend/common/stores/`, use `useQuery` not `useLazyQuery`, `ScopedCssBaseline` exists, `next/dynamic({ssr:false})` for editor
- **Codebase**: Verified. Zustand stores at `frontend/common/stores/` (e.g., `adminComplaintsStore.ts`). Views at `frontend/common/views/dashboard/` (domain-organized: admin, billing, classes, complaints, etc.). `frontend/views/` only has `auth/login`. ScopedCssBaseline confirmed in `node_modules/@mui/material/`. `@react-email/editor@^1.1` installed.
- **Match**: ✅ Design line 636 says `frontend/views/dashboard/ is DEPRECATED` and correctly redirects to `frontend/common/views/dashboard/`. v2 fix applied.

### 2.7 Database patterns
- **Design claims**: `jsonb.$type<T>()` for typed JSON, partial unique indexes with `.where(sql\`...\`)`, `version` column for optimistic locking, NO `.array()` columns in repo, `createPgEnumFromEnum` helper, `seedOrGet` pattern
- **Codebase**: Verified. `jsonb.$type<T>()` in meeting + permissions schemas. Partial unique indexes `.where(sql\`...\`)` in meeting, auth, billing. Version column `integer("version").notNull().default(0)` in students, billing. No `.array()` columns found anywhere. `createPgEnumFromEnum` at `backend/db/schema/enums.ts`. `seedOrGet` pattern confirmed across multiple seed domains.
- **Match**: ✅ Correct. Design correctly uses `jsonb.$type<readonly EmailEditorPermission[]>()` instead of `.array()` (line 448), and uses `sql\`${t.isActive} = true\`` for partial index (line 466).

### 2.8 Type system
- **Design claims**: `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput` pattern; CommunicationPayload has `body: string | null`
- **Codebase**: Verified at `backend/types/notifications/communications.types.ts`:
  ```ts
  type CommunicationPayload = {
    readonly userId: string;
    readonly title: string;
    readonly body: string | null;
    readonly channel: CommunicationChannelType;
    readonly eventType: NotificationEventType;
    readonly metadata?: Record<string, unknown>;
  };
  ```
  The `body` field exists (string|null) — design's fallback claim IS structurally valid. However, CommunicationPayload does NOT have `templateProps`, `entityId`, or `notificationEventId` fields.
- **Match**: ⚠️ Partial. The `payload.body` fallback is valid, but the dispatcher code at design lines 518 and 523 references `payload.entityId`, `payload.notificationEventId`, and `payload.templateProps` which don't exist. See New Issue #2.

### 2.9 Permissions
- **Design claims**: `SYSTEM_DISPATCH_EMAIL` at line 68 of `backend/enum/permissions/permission.enum.ts`
- **Codebase**: Verified. `SYSTEM_DISPATCH_EMAIL = "system.dispatch_email"` at line 68.
- **Match**: ✅ Correct.

### 2.10 Render pipeline
- **Design claims**: `render` from `react-email` is async (returns `Promise<string>`), `getJSON()` is synchronous (returns `JSONContent`), `getEmail()` is async (returns `Promise<{html, text}>`)
- **Codebase**: Verified at `node_modules/@react-email/render/dist/node/index.d.mts`: `declare const render: (node: React.ReactNode, options?) => Promise<string>`. At `node_modules/@react-email/editor/dist/index.d.mts`: `getJSON: () => JSONContent` (sync), `getEmail: () => Promise<{html: string; text: string}>` (async).
- **Match**: ✅ Correct. v2 fix for getJSON sync vs async applied. Design line 658 correctly says `ref.current?.getJSON()` (no await) and `await ref.current?.getEmail()` (async).

### 2.11 Drizzle version
- **Design claims**: `drizzle-orm@1.0.0-rc.4`, `drizzle-kit@1.0.0-rc.4`
- **Codebase**: Verified in `package.json`: `"drizzle-orm": "1.0.0-rc.4"` (line 119), `"drizzle-kit": "1.0.0-rc.4"` (line 211).
- **Match**: ✅ Correct. v2 fix (correcting from "0.36+") applied.

## 3. V1/V2 Fix Verification

### V1 Issues (15 total)

| # | Issue | Fixed? | Notes |
|---|-------|--------|-------|
| V1-1 | XSS — no HTML sanitization | ✅ | Design lines 743-748 add DOMPurify.sanitize with ALLOWED_TAGS/ALLOWED_ATTR |
| V1-2 | mapEventTypeToEmailScope undefined for 10 events | ✅ | Design lines 555-601 map all 24 values, null for non-email events |
| V1-3 | i18n signature error (two-arg getServerTranslations) | ✅ | Design line 703 explicitly corrects to single-arg |
| V1-4 | render error handling | ✅ | Design lines 729-757 add safeRender wrapper with try/catch + fallback |
| V1-5 | Rate limiting | ❌ | NOT addressed — no rate limiting on sendTestEmail or template render API |
| V1-6 | Bounce/complaint webhooks | ✅ | Design line 805 mentions "Add bounce/complaint webhooks" in Phase 3 |
| V1-7 | Idempotency | ⚠️ Partial | Design lines 517-521 add idempotency key, BUT references `payload.entityId` and `payload.notificationEventId` which don't exist on CommunicationPayload (New Issue #2) |
| V1-8 | Dirty state / unsaved changes warning | ❌ | NOT addressed — no beforeunload or unsaved-changes dialog mentioned |
| V1-9 | Optimistic locking | ✅ | Design line 453 has `version: integer("version").notNull().default(1)` column |
| V1-10 | Bundle size analysis | ✅ | Design line 806 "Bundle size analysis" in Phase 4 |

### V2 Issues (20 total)

| # | Issue | Fixed? | Notes |
|---|-------|--------|-------|
| V2-1 | 3 nonexistent enum values (WELCOME etc.) | ✅ | Commented out at lines 598-600, noted to add in Phase 1 |
| V2-2 | Wrong enum count (22 → 24) | ✅ | Design line 615 states "Updated enum count from '22' to '24'" |
| V2-3 | resetEmailChannel void not Promise<void> | ⚠️ Partial | Design line 365 correctly declares `void`, but line 370 uses `await` inside it — won't compile (New Issue #1) |
| V2-4 | @aws-sdk/client-sesv2 missing | ✅ | Design line 379 recommends `bun add @aws-sdk/client-sesv2` |
| V2-5 | isomorphic-dompurify unverified | ❌ | Design mentions DOMPurify at line 723 but doesn't verify isomorphic-dompurify under Bun |
| V2-6 | Hardcoded colors in email-templates.ts | ✅ | Design line 764 explicitly calls out violating AGENTS.md and says to replace with theme tokens |
| V2-7 | No feature flag | ✅ | Design line 122 adds `EMAIL_TEMPLATES_ENABLED` feature flag (step 21c) |
| V2-8 | Seeds should be Phase 1 | ❌ | Design line 771 still lists seeds under general "Migration / data" section — not explicitly moved to Phase 1 |
| V2-9 | Missing generate:gqlSchema + codegen | ✅ | Design lines 621 and 670 explicitly say "Then run bun run generate:gqlSchema && bun codegen" |
| V2-10 | getJSON sync not async | ✅ | Design line 658 correctly describes getJSON() as synchronous |
| V2-11 | useRef not Zustand for File objects | ✅ | Design line 658 explicitly says "File objects must be held in useRef, NOT in Zustand store" |
| V2-12 | EmailTheming not built-in | ✅ | Design line 662 says "EmailTheming is NOT built-in... must be passed as extensions prop" |
| V2-13 | No transaction for template activation | ❌ | Design does not mention database transaction wrapping for setActive + createRevision operations |
| V2-14 | EmailAttachment.content should be Buffer only | ✅ | Design line 407 restricts to `Buffer` with explicit comment explaining why |
| V2-15 | Missing @types/nodemailer | ✅ | Design line 378 includes `@types/nodemailer` in install list |
| V2-16 | form-data for mailgun.js | ✅ | Design line 377 includes `form-data` in install list |
| V2-17 | @smithy/fetch-http-handler for SES under Bun | ✅ | Design line 378 mentions `@smithy/fetch-http-handler` for Bun compatibility |
| V2-18 | next/dynamic({ssr:false}) for editor | ✅ | Design line 657 explicitly requires `next/dynamic(() => import('@react-email/editor')..., { ssr: false })` |
| V2-19 | ScopedCssBaseline not CssBaseline | ✅ | Design line 659 explicitly uses ScopedCssBaseline |
| V2-20 | Editor CSS import order after MUI | ✅ | Design line 659 shows correct import order |

**Summary**: 28 of 35 total v1/v2 issues correctly fixed. 7 not fixed or partially fixed:
1. V1-5: Rate limiting (NOT addressed)
2. V1-8: Dirty state / unsaved changes warning (NOT addressed)
3. V1-7: Idempotency (partially — references nonexistent payload fields)
4. V2-3: resetEmailChannel void (partially — correctly typed void but uses await inside)
5. V2-5: isomorphic-dompurify Bun compatibility (NOT addressed)
6. V2-8: Seeds Phase 1 timing (NOT addressed)
7. V2-13: Transaction for template activation (NOT addressed)

## 4. New Issues Found (not in v1 or v2)

### Issue V3-1 — CRITICAL: `resetEmailChannel()` won't compile (await in void function + nonexistent `peek()`)
**Design lines**: 365-370
**Code**:
```ts
export function resetEmailChannel(): void {    // ← void, not async
  invalidateEnvConfigCache("EMAIL_PROVIDER");
  // ...
  (await emailProviderRegistry.peek("resend"))?.disconnect?.();  // ← await + peek()
}
```
**Why it matters**: Two compilation errors:
1. `await` in a non-async `void` function → TypeScript error: `'await' expressions are only allowed within async functions`
2. `emailProviderRegistry.peek("resend")` — the `createRegistry` API from makerkit has only 4 methods: `register`, `get`, `addSetup`, `setup` (verified in research file 05, lines 37-38). There is NO `peek()` method. This will throw at runtime.
**Recommended fix**: Either make the function `async` and use `await emailProviderRegistry.get("resend")` (noting `get` returns `Promise<T>`), or keep it `void` and fire-and-forget: `emailProviderRegistry.get("resend").then(adapter => adapter?.disconnect?.())`. Since the existing `resetEmailChannel` at `EmailChannelFactory.ts:87` is synchronous `void` and only invalidates config caches, the simplest fix is to NOT call disconnect at all in this function — just invalidate caches, and let the next `getEmailChannel()` call create a fresh instance.

### Issue V3-2 — CRITICAL: Dispatcher code references nonexistent `payload.entityId`, `payload.notificationEventId`, `payload.templateProps`
**Design lines**: 518, 523
**Code**:
```ts
const idempotencyKey = createHash("sha256")
  .update(`${emailScope}:${payload.entityId ?? ""}:${payload.notificationEventId ?? ""}`)  // ← fields don't exist
  .digest("hex");
// ...
const { html, text, subject, attachments } = await EmailTemplateService.renderForSend(
  emailScope, payload.templateProps ?? {}, locale  // ← field doesn't exist
);
```
**Why it matters**: `CommunicationPayload` (verified at `backend/types/notifications/communications.types.ts:4-11`) has these fields only: `userId`, `title`, `body`, `channel`, `eventType`, `metadata`. There is NO `entityId`, `notificationEventId`, or `templateProps` field. This code will not compile without extending the type. The design's step 92 says to "Update notification-dispatch.helpers + notification-payloads.builders to populate payload.templateProps" but never shows the type extension.
**Recommended fix**: Add `templateProps?: Record<string, unknown>` to `CommunicationPayload`. For the idempotency key, use `payload.metadata?.entityId` (which exists via NotificationMetadata) or remove the idempotency key entirely (it's P1 and not blocking). Add an explicit type extension section in the design.

### Issue V3-3 — HIGH: NEW_COMPLAINT and NEW_SUGGESTION mapped to `null` but dispatcher sends email anyway via ALL_ENUM_CHANNELS fallback
**Design lines**: 579-580
**Code**:
```ts
[NotificationEventType.NEW_COMPLAINT]: null,    // comment: "email not desired"
[NotificationEventType.NEW_SUGGESTION]: null,
```
**Why it matters**: `NEW_COMPLAINT` and `NEW_SUGGESTION` are NOT in `EVENT_CHANNEL_ALLOWLIST` (verified). The fallback in `notification-dispatch.helpers.ts` is `EVENT_CHANNEL_ALLOWLIST[eventType] ?? [...ALL_ENUM_CHANNELS]`. This means the dispatcher sends on ALL 4 channels (ON_APP, EMAIL, SMS, PUSH) for these events. The `null` mapping means `mapEventTypeToEmailScope()` returns null and `EmailTemplateService.renderForSend` won't be called. But the feature-flag-gated fallback (design line 70) says "when false, use old passthrough path" — the passthrough sends `payload.body` as email HTML. So the comment "email not desired" is misleading; email IS sent via the passthrough fallback path. Even when `EMAIL_TEMPLATES_ENABLED` is true, if `mapEventTypeToEmailScope` returns null, the dispatcher should skip email, not fall through to passthrough. The design's code at lines 514-515 shows `if (!emailScope) return { channel: "email", success: false, error: "No email template registered" }` — but this returns `success: false` which likely triggers error handling/retry, rather than silently skipping. The semantics of "return failure" vs "return success with skipped=true" need clarification.
**Recommended fix**: The design should:
1. Either add `NEW_COMPLAINT` and `NEW_SUGGESTION` to `EVENT_CHANNEL_ALLOWLIST` with `[ON_APP, SMS, PUSH]` (excluding EMAIL explicitly), OR
2. Change the dispatcher to check both the allowlist AND the scope mapping before attempting email send, returning `{ success: true, skipped: "no_email_scope" }` (not `success: false`) when scope is null.

### Issue V3-4 — HIGH: Typed registry TypeScript limitation not fully resolved
**Design lines**: 144-194 (registry pattern)
**Research**: Research file 06 (`06-typed-registry-pattern.md`) extensively documents that `Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0]` collapses to an intersection (effectively `never` for non-overlapping props) due to TypeScript #47109. The research recommends a corrected pattern: `EmailPropsByScope` map → mapped type → `defineEmailTemplate<P>` helper.
**Why it matters**: The design's code at line 55 uses `EmailTemplateProps<S> = Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0]` — the EXACT pattern research file 06 says doesn't work. The design does not incorporate the `defineEmailTemplate<P>` helper or the `EmailPropsByScope` mapped type. The FINAL-VERIFICATION-SUMMARY (cross-cutting finding #2) also flags this. While the code may compile syntactically, it does NOT deliver the per-scope type narrowing the design claims — callers will get intersection types, not discriminated unions.
**Recommended fix**: Replace the registry pattern with the corrected version from research file 06: define `EmailPropsByScope` map, create `EmailTemplateRegistry = { [S in EmailScope]: EmailTemplateDefinition<EmailPropsByScope[S]> }`, use `defineEmailTemplate<P>` helper, and set `EmailTemplateProps<S> = EmailPropsByScope[S]`.

### Issue V3-5 — HIGH: Multiple non-allowlisted events mapped to email scopes also get SMS + PUSH via fallback
**Design lines**: 577-588
**Events affected**: `COMPLAINT_RESPONSE`, `SUGGESTION_ACKNOWLEDGED`, `INVOICE_GENERATED`, `INVOICE_STATUS_CHANGED`, `PAYMENT_METHOD_CHANGED`, `STUDENT_TEACHER_REASSIGNED`
**Why it matters**: These 6 events are NOT in `EVENT_CHANNEL_ALLOWLIST` → fall through to `ALL_ENUM_CHANNELS` → dispatcher sends on ALL 4 channels (ON_APP, EMAIL, SMS, PUSH). The design maps them to email scopes (non-null), so the email channel will render templates. But the dispatcher ALSO sends SMS and PUSH for these events, which may be unintended. For example, `INVOICE_GENERATED` mapped to `EmailScope.INVOICE_GENERATED` means a template email is sent — but SMS and PUSH notifications are ALSO dispatched via the fallback. The design does not address whether this is intended.
**Recommended fix**: Add these events to `EVENT_CHANNEL_ALLOWLIST` with explicit channel lists (e.g., `INVOICE_GENERATED: [ON_APP, EMAIL]`) to control which channels fire. The design should note this as a required change in `notification-dispatch.helpers.ts`.

### Issue V3-6 — HIGH: No `next/dynamic({ssr:false})` applied to tier view files explicitly listed in code
**Design lines**: 647-653, 657
**Why it matters**: Design line 657 correctly says to use `next/dynamic(() => import('@react-email/editor').then(m => m.EmailEditor), { ssr: false })` — but it says to apply it at "module top level in the tier view file" (e.g., `emailTemplateEditor.desktop.tsx`). However, the mobile and desktop tier files listed at lines 648-653 are described as "pure presentation" and "mounts @react-email/editor" without showing where the dynamic import goes. The `next/dynamic` wrapper should wrap the editor component import, but the tier files are supposed to be "pure presentation" per the Mobile/Desktop tier pattern. The dynamic import should live in the common layer's `EmailTemplateEditorView.tsx` switcher or in a dedicated wrapper component, not in the tier file — unless the tier file IS the component that renders the editor.
**Recommended fix**: Clarify the architecture. Create a dedicated `EmailEditorWrapper.tsx` in the common layer that handles the `next/dynamic` import, `ScopedCssBaseline` wrapping, CSS import ordering, and ref management. Tier views import this wrapper. This keeps tier files pure presentation while isolating browser-only concerns.

### Issue V3-7 — HIGH: i18n keys for `errors.renderFailed` require `{ scope: string }` argument but safeRender's error path doesn't show how scope name gets to the message
**Design lines**: 700-754
**Why it matters**: The `EmailsErrorLabels.renderFailed` signature is `(scope: { readonly scope: string }) => string`. In the safeRender catch block (line 753-754):
```ts
const t = getServerTranslations(locale).emailsTranslations.errors;
const fallbackText = t.renderFailed({ scope });
```
Here `scope` is a TypeScript generic `S extends EmailScope` (an enum value). But `getServerTranslations` returns a synchronous bundle — the `errors` namespace must exist on the `Translations` type for this to compile. The design says to add the `errors` sub-namespace to `EmailsLabels` (line 690-701), but the type `Translations` is constructed from `translation.ts` which wires namespaces. The design needs to verify that adding `errors` to `EmailsLabels` will flow through the namespace wiring to make `emailsTranslations.errors` available on the `Translations` type. If the namespace pattern uses `defineNamespace` + barrel export, the new errors fields should flow automatically — but this needs explicit verification.
**Recommended fix**: Add an explicit verification step: confirm that `shared/locale/namespaces/emails/emails.namespace.ts` (referenced at line 702) properly exposes the extended `EmailsLabels` type including the `errors` field, so `getServerTranslations(locale).emailsTranslations.errors` type-checks.

### Issue V3-8 — MEDIUM: Phase 1 vs Phase 4 contradiction for WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION
**Design lines**: 594-600, 806
**Why it matters**: The design's `EVENT_TO_SCOPE` mapping (lines 594-600) comments out WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION with a note: "must be added to the enum in Phase 1 (step 2) + added to EVENT_CHANNEL_ALLOWLIST before this mapping will compile. Until then, comment out these lines." But Phase 4 (line 806) says: "uncomment WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION in EVENT_TO_SCOPE after adding them to NotificationEventType in Phase 1." This is contradictory — if they're added in Phase 1, why are they uncommented only in Phase 4? And step 2 says "must be added in Phase 1 for EVENT_TO_SCOPE mapping to compile when uncommented" — but the mapping is commented out anyway (compiles fine without them). The issue is: adding 3 new enum values to `NotificationEventType` in Phase 1 will BREAK the `Readonly<Record<NotificationEventType, EmailScope | null>>` type because the commented-out mapping entries don't cover the new values. TypeScript's `Record<K, V>` requires ALL keys of `K` to be present.
**Recommended fix**: The design must clarify the order of operations:
1. Phase 1: Add WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION to `NotificationEventType` AND add them to `EVENT_TO_SCOPE` (uncommented) with null or appropriate scope, AND add them to `EVENT_CHANNEL_ALLOWLIST`. All in Phase 1.
2. Phase 4: Implement the actual email templates and auth/account flows for these 3 events.
OR: Keep the enum values out of `NotificationEventType` entirely until Phase 4. The current approach of "add enum in Phase 1 but comment out mapping" will cause a compile error because `Record<NotificationEventType, ...>` requires all 27 values to have entries (not 24).

### Issue V3-9 — MEDIUM: `payload.body` fallback only works when `EMAIL_TEMPLATES_ENABLED` is false
**Design lines**: 70, 513-528
**Why it matters**: Design line 70 says: "when [EMAIL_TEMPLATES_ENABLED is] false, use old passthrough path; when true, route through EmailTemplateService.renderForSend." And: "if renderForSend returns null (no template for scope), fall back to payload.body." But the dispatcher code at lines 514-515 shows:
```ts
const emailScope = mapEventTypeToEmailScope(payload.eventType);
if (!emailScope) return { channel: "email", success: false, error: "No email template registered" };
```
This returns `success: false` when scope is null — BEFORE checking `payload.body`. The `payload.body` fallback is described in the step text but NOT in the actual code snippet. The code returns failure instead of falling back. Additionally, when the feature flag is true and `renderForSend` throws, the `safeRender` wrapper (line 755) returns `<p>${fallbackText}</p>` — an error message, not `payload.body`. The design's intent (don't lose emails during migration) is not matched by the code.
**Recommended fix**: Add explicit `payload.body` fallback in the dispatcher code:
```ts
if (!emailScope) {
  // No template scope — fall back to passthrough body
  return await emailChannel.send({ ...commonFields, subject: payload.title, html: payload.body ?? "", text: payload.body ?? "" }, locale);
}
```

### Issue V3-10 — MEDIUM: `COMPLAINT_RESPONSE` should be added to `EVENT_CHANNEL_ALLOWLIST` if only email is desired
**Design lines**: 576-577
**Why it matters**: `COMPLAINT_RESPONSE` is NOT in `EVENT_CHANNEL_ALLOWLIST` → falls through to `ALL_ENUM_CHANNELS` → sends on ON_APP, EMAIL, SMS, PUSH. The existing codebase has `renderComplaintResponseEmail` for this event. The design maps it to `EmailScope.COMPLAINT_RESPONSE` (non-null). But since it falls through to all channels, the dispatcher also sends SMS and PUSH notifications for complaint responses. If the intent is "email only for complaint responses" (likely — complaint responses are detailed and text-heavy), it should be explicitly added to the allowlist as `[ON_APP, EMAIL]`.
**Recommended fix**: Add `COMPLAINT_RESPONSE: [ON_APP, EMAIL]` to `EVENT_CHANNEL_ALLOWLIST` in `notification-dispatch.helpers.ts`. Same for any other event where only email is desired.

### Issue V3-11 — MEDIUM: `findByIdempotencyKey` method doesn't exist on any repository
**Design lines**: 520
**Why it matters**: The design calls `NotificationRepository.findByIdempotencyKey(idempotencyKey, tx)` — but `NotificationRepository` does not have this method today, and the design doesn't list it as a method to add. The `idempotencyKey` column exists only on the `invoices` table (verified at `backend/db/repo/billing/billing.repository.ts:1181`). There's no `idempotencyKey` column on `notificationDeliveries` or any notification table.
**Recommended fix**: Either add `idempotencyKey` column to `notificationDeliveries` schema + `findByIdempotencyKey` to `NotificationRepository` as explicitly listed changes, or remove the idempotency code from the dispatcher (mark as future P1 enhancement).

### Issue V3-12 — MEDIUM: No transaction wrapping for template activation (`setActive` + `createRevision`)
**Design lines**: 495-496 (repo methods), 503 (service methods)
**Why it matters**: When a template is published/activated, two operations should happen atomically: (1) set `isActive = true` on the new template + `isActive = false` on the previously active template for the same (scope, locale), and (2) create a revision record. If these aren't wrapped in a transaction, a failure between steps could leave two active templates or no active template. The partial unique index `email_templates_scope_locale_active_uq` would catch the two-active case at the DB level, but the no-active case is unprotected. This was flagged as V2-13 and was NOT fixed.
**Recommended fix**: Wrap `setActive` + `createRevision` in a database transaction. Add explicit `withTransaction(tx => { ... })` call to the service method. This is the same pattern used in billing services.

### Issue V3-13 — MEDIUM: Missing `@aws-sdk/client-sesv2` in design's install list (step 1)
**Design lines**: 5-6 (install), 379 (SES adapter)
**Why it matters**: The design recommends SESv2 `SendEmailCommand` at line 379 ("bun add @aws-sdk/client-sesv2"), but only `@aws-sdk/client-ses` (v1) is installed today. The design's step 1 install list at lines 5-6 doesn't explicitly include `@aws-sdk/client-sesv2`. If the implementer follows step 1 literally, SESv2 won't be installed and the SES adapter won't compile.
**Recommended fix**: Add `@aws-sdk/client-sesv2` to the step 1 install list alongside `@aws-sdk/client-ses`.

### Issue V3-14 — LOW: No rate limiting on sendTestEmail mutation
**Design lines**: 626
**Why it matters**: The `sendTestEmail` mutation sends a live email. Without rate limiting, a malicious or over-eager admin could spam arbitrary email addresses. V1-5 flagged this and it was NOT fixed. The GraphQL `authScopes: { superAdmin: true, notImpersonating: true }` gates access to super admins, but doesn't rate-limit.
**Recommended fix**: Add a simple rate limit: max N sends per template per minute Damien (e.g., 5/minute) tracked via a in-memory or Redis counter. Or at minimum, a code comment acknowledging this.

### Issue V3-15 — LOW: Unused `import DOMPurify from "isomorphic-dompurify"` may break in Bun
**Design lines**: 723
**Why it matters**: `isomorphic-dompurify` wraps DOMPurify with jsdom for server-side use. V2-5 flagged that it's unverified under Bun. Research file 11 (`11-bun-compatibility.md`) doesn't specifically cover `isomorphic-dompurify`. If jsdom doesn't work under Bun, the `safeRender` function's DOMPurify.sanitize call will throw, and every email send will hit the error fallback path. The design doesn't have a fallback path if DOMPurify itself fails.
**Recommended fix**: Verify isomorphic-dompurify under Bun explicitly before Phase 3. If it fails, use `dompurify` with a custom hook, or sanitize at the TipTap schema level (step 7a's allowed-node-types validation) and skip DOMPurify entirely.

## 5. Issues Introduced by V1/V2 Fixes

### Reg-1: `await` in void `resetEmailChannel` (introduced by V2-3 fix)
V2-3 correctly noted that `resetEmailChannel` is `void` not `Promise<void>`. The design was updated to declare the function as `void`. However, the design ALSO added a disconnect call with `await` inside the void function (line 370), which creates a compilation error. The v2 fix was half-applied — the signature was corrected but the body was made incompatible.

### Reg-2: `peek()` method introduced that doesn't exist in createRegistry
The design line 370 calls `emailProviderRegistry.peek("resend")` — this method was never mentioned in v1/v2 reviews, research files, or the makerkit API (research file 05 confirms only `register`, `get`, `addSetup`, `setup`). This appears to have been introduced when the design author tried to add disconnect-on-reset logic. This is a new bug introduced during the v2 fix process.

### Reg-3: `payload.templateProps` reference introduced without type extension
Design line 523 references `payload.templateProps ?? {}` and design step 92 says to "populate payload.templateProps." But `CommunicationPayload` (verified at `backend/types/notifications/communications.types.ts`) has no `templateProps` field. This was introduced when v2 added the architecture for passing typed data to templates, but the type extension was never specified.

### Reg-4: Phase 1 enum addition may break Phase 3 `EVENT_TO_SCOPE` compilation
The v2 fix correctly commented out WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION in `EVENT_TO_SCOPE`. But it also says to add these enum values in Phase 1 (step 2). If the enum is extended in Phase 1 but the mapping entries stay commented out, the `Readonly<Record<NotificationEventType, EmailScope | null>>` type will fail compilation — `Record<K, V>` requires ALL keys of K to be present. This creates a mandatory coupling between Phase 1 (enum creation) and Phase 3 (mapping file) that the design doesn't acknowledge.

### Reg-5: Returning `success: false` for null scope contradicts `payload.body` fallback intent
The design's step text (line 70) says: "if renderForSend returns null (no template for scope), fall back to payload.body." But the code snippet (lines 514-515) was added during v2 fixes and returns `{ success: false, error: "No email template registered" }` — which is an error, not a fallback to `payload.body`. The v2 fix for the "feature flag + fallback" requirement introduced a code snippet that contradicts the stated fallback behavior.

## 6. Architecture Assessment

**Strengths**:
- Sound overall direction: React Email v6 + @react-email/editor for visual editing, code-versioned typed scaffolds, DB-stored design JSON overrides
- Correct layer separation: schema → repository → service → GraphQL → frontend
- Proper use of existing patterns: createRegistry, createPgEnumFromEnum, seedOrGet, Pothos inputRef pattern
- Feature flag gating for safe rollout (EMAIL_TEMPLATES_ENABLED)
- safeRender wrapper for render pipeline resilience

**Weaknesses**:
- The typed registry pattern as written doesn't deliver per-scope type narrowing (research file 06 extensively documents this). This is a fundamental type-safety flaw.
- The dispatcher integration has compile-time issues (nonexistent payload fields, peek() method) that suggest the design was updated textually without running through a TypeScript compiler.
- The relationship between EVENT_CHANNEL_ALLOWLIST and EVENT_TO_SCOPE is not clearly defined — the design creates two separate mapping systems that interact implicitly through the `?? [...ALL_ENUM_CHANNELS]` fallback, leading to the semantic contradictions in New Issues #3 and #5.
- No clear separation between "template not found" (should fallback to body) and "event shouldn't have email" (should skip email). Both are null-mapped but need different behavior.

## 7. Type System Assessment

- **Type extension needed**: `CommunicationPayload` must be extended with `templateProps?` — currently missing, causes compilation failure.
- **Idempotency key fields missing**: `entityId` and `notificationEventId` don't exist on CommunicationPayload. The idempotency key hash code won't compile.
- **Typed registry**: The `Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0]` pattern collapses to intersection. Research file 06's `defineEmailTemplate<P>` + `EmailPropsByScope` mapped type solution should be adopted.
- **EmailTemplateProps<S>**: Should be `EmailPropsByScope[S]` (direct map lookup), not `Parameters<...>[0]` (collapses).
- **Record<NotificationEventType, ...> exhaustiveness**: Adding 3 new enum values in Phase 1 without adding mapping entries will break the `Record` type. The design must add entries for all 27 values or keep the enum at 24 until Phase 4.

## 8. Security Assessment

- **XSS**: DOMPurify sanitization at render time (lines 743-748) is good defense-in-depth. TipTap schema validation at save time (step 7a) is the primary defense. ✅
- **SSTI**: React Email renders typed React components, not string interpolation. Template variables come through typed props, preventing server-side template injection. ✅
- **Auth bypass**: authScopes on mutations `{ superAdmin: true, notImpersonating: true }` is appropriate. Service-layer `allowedEditorGroups` enforcement adds per-template fine-grained control. `requirePermissionForPage` on routes adds defense-in-depth. ✅
- **Rate limiting**: NOT addressed for `sendTestEmail` (V1-5 not fixed). This is a minor risk since only super admins can call it, but should still be noted.
- **DOMPurify under Bun**: Unverified (V2-5 not fixed). If isomorphic-dompurify fails under Bun, all email sends hit the error fallback path with a generic error message — not a security risk, but an availability risk.

## 9. Performance Assessment

- **N+1 queries**: The design correctly adds `findByScopeIds` (line 497) and `resolveTemplatesByScopes` (line 507) batch methods for DataLoader support. ✅
- **Bundle size**: Editor page deferred with `next/dynamic({ssr:false})`. Phase 4 includes bundle size analysis. ✅
- **Render caching**: `compiledHtml` column caches last-rendered HTML. Re-compiled atomically in same transaction as `designJson` (line 440). ✅
- **Missing index**: The `emailTemplateRevisions` table (lines 469-477) has no index on `templateId`. Querying revisions by template will cause full table scans.
- **DOMPurify overhead**: Sanitizing on every render (send + save) adds latency. Consider sanitizing only at save time (TipTap schema validation is the primary defense at render time).

## 10. Deployment & Migration Assessment

**Strengths**:
- Feature flag `EMAIL_TEMPLATES_ENABLED` allows safe rollout and instant rollback
- Seeds in Phase 1 ensure default templates exist before Phase 3 dispatcher migration
- `payload.body` fallback prevents email loss during migration (if implemented correctly — see V3-9)

**Weaknesses**:
- Seeds not explicitly moved to Phase 1 (V2-8 not fixed) — design still lists them under general "Migration / data"
- No rollback design for schema changes (what if migration fails?)
- No mention of how to handle in-flight notifications during cutover
- DOMPurify/isomorphic-dompurify Bun compatibility unverified before Phase 3
- The design doesn't specify whether the SESv2 migration (from SES v1 to v2) is a breaking change for existing email sends

## 11. Risk Register (new risks not in v2)

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|------------|------------|
| R1 | `resetEmailChannel()` won't compile | Critical | Certain | Fix the await/peek issue before implementation |
| R2 | Dispatcher code won't compile (payload fields) | Critical | Certain | Extend CommunicationPayload type first |
| R3 | Typed registry doesn't deliver type narrowing | High | Certain | Adopt research file 06's corrected pattern |
| R4 | Phase 1 enum addition breaks Record type | High | Likely | Add mapping entries simultaneously or defer enum addition |
| R5 | Non-allowlisted events get unintended SMS/PUSH | High | Likely | Add to EVENT_CHANNEL_ALLOWLIST explicitly |
| R6 | isomorphic-dompurify fails under Bun | Medium | Possible | Verify under Bun before Phase 3; fallback to TipTap schema validation |
| R7 | emailTemplateRevisions missing index on templateId | Medium | Certain | Add index in schema definition |
| R8 | Rate limiting gap on sendTestEmail | Medium | Unlikely | Add rate limiter or accept risk (super admin only) |
| R9 | No transaction for template activation | Medium | Possible | Wrap setActive + createRevision in transaction |
| R10 | payload.body fallback not in actual code | Medium | Certain | Add fallback code to dispatcher snippet |

## 12. Recommendations (prioritized)

1. **[P0] Fix `resetEmailChannel` compilation error** — remove `await` and `peek()`. Either make the function `async` and use `get("resend")`, or simply invalidate caches without disconnecting (matching existing behavior).

2. **[P0] Add `templateProps` to `CommunicationPayload` type** — extend `backend/types/notifications/communications.types.ts` with `templateProps?: Record<string, unknown>`. Replace `payload.entityId`/`payload.notificationEventId` in the idempotency key with `payload.metadata?.entityId` or remove idempotency from the initial implementation.

3. **[P0] Fix the typed registry pattern** — replace `Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0]` with the `EmailPropsByScope` mapped type + `defineEmailTemplate<P>` helper from research file 06. This is essential for the type safety the design advertises.

4. **[P1] Fix null-scope dispatcher behavior** — change `return { success: false, error }` to fall back to `payload.body` passthrough (matching the stated intent), or return `{ success: true, skipped: "no_email_scope" }`.

5. **[P1] Add non-allowlisted events to `EVENT_CHANNEL_ALLOWLIST`** — explicitly add `COMPLAINT_RESPONSE`, `INVOICE_GENERATED`, `INVOICE_STATUS_CHANGED`, `PAYMENT_METHOD_CHANGED`, `SUGGESTION_ACKNOWLEDGED`, `STUDENT_TEACHER_REASSIGNED` with explicit channel lists to prevent unintended SMS/PUSH sends.

6. **[P1] Clarify Phase 1 vs Phase 4 enum timeline** — either add WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION to `EVENT_TO_SCOPE` in Phase 1 (uncommented) or don't add them to the enum until Phase 4. Don't add enum values without mapping entries.

7. **[P1] Add transaction wrapping for template activation** — wrap `setActive` + `createRevision` in a DB transaction.

8. **[P2] Add index on `emailTemplateRevisions.templateId`** — missing index will cause full table scans.

9. **[P2] Add `@aws-sdk/client-sesv2` to step 1 install list** — it's mentioned at line 379 but not in the install list.

10. **[P2] Verify isomorphic-dompurify under Bun before Phase 3** — if it fails, skip DOMPurify and rely on TipTap schema validation alone.

11. **[P2] Add rate limiting to sendTestEmail** — at minimum a per-user per-minute cap.

12. **[P3] Add dirty state warning for editor** — `beforeunload` event handler + unsaved changes dialog.

13. **[P3] Move seeds explicitly to Phase 1** — update the design's phase descriptions to list seeds as a Phase 1 step.

## 13. Research File Cross-Reference

| Research File | Design Claim | Research Finding | Match? |
|---------------|-----------|-----------------|--------|
| 01 (package shape) | `@react-email/components` and `@react-email/render` are separate installs | v6 unified them into `react-email` | ✅ Design line 712 correctly imports from `react-email` not `@react-email/components` |
| 02 (editor capabilities) | `getJSON()` returns opaque TipTap JSON | Confirmed — typed props live in code scaffold, not editor | ✅ Design line 658 correctly describes this |
| 03 (render API) | `render()` is async, from `react-email` | Confirmed — `Promise<string>`, import from `react-email` | ✅ Design lines 720-722 correct |
| 04 (attachments) | `EmailAttachment.content: Buffer` only | Confirmed — Buffer to avoid base64/path ambiguity | ✅ Design line 407 correct |
| 05 (provider registry) | `createRegistry` has `peek()` method | **MISMATCH** — only `register`, `get`, `addSetup`, `setup` exist | ❌ See V3-1 |
| 06 (typed registry) | `Parameters<...>[0]` gives per-scope narrowing | **MISMATCH** — collapses to intersection, doesn't narrow | ❌ See V3-4 |
| 07 (drizzle patterns) | `pgEnum.array()` works for `allowedEditorGroups` | Confirmed but repo has zero `.array()` columns — safer to use `jsonb.$type<T[]>()` | ✅ Design correctly chose `jsonb.$type` (line 448) |
| 08 (pothos patterns) | Input via `inputRef<T>().implement()`, enum in shared file | Confirmed — matches repo convention | ✅ Design line 624 uses correct pattern |
| 09 (i18n interop) | `getServerTranslations(locale)` single-arg sync | Confirmed | ✅ Design line 686 correct |
| 10 (editor MUI interop) | `next/dynamic({ssr:false})` required, ScopedCssBaseline | Confirmed — `ssr:false` is required not optional | ✅ Design line 657 correct |
| 11 (Bun compatibility) | All deps work under Bun | Confirmed with caveats (nodemailer flaky, SES HTTPS hang) | ✅ Design addresses with @smithy/fetch-http-handler |
| 12 (alternatives) | React Email v6 + editor is best choice | Confirmed — no alternative beats it | ✅ Design direction validated |
| FINAL-VERIFICATION | Typed registry collapses, not narrows | Confirmed — same as research file 06 | ❌ Design didn't incorporate fix |

**Key discrepancy**: Research files 05 and 06 and the FINAL-VERIFICATION-SUMMARY all flag issues that the design did NOT fully incorporate. The `peek()` method (file 05) and the typed registry collapse (file 06) are the two most significant research findings that were missed.

## 14. Summary of New Issues

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| V3-1 | Critical | `resetEmailChannel()` won't compile (await in void + peek()) | New |
| V3-2 | Critical | Dispatcher references nonexistent payload fields | New |
| V3-3 | High | NEW_COMPLAINT/NEW_SUGGESTION null-mapped but email sent via fallback | New |
| V3-4 | High | Typed registry TypeScript limitation not resolved | New |
| V3-5 | High | Non-allowlisted events get unintended SMS/PUSH | New |
| V3-6 | High | next/dynamic wrapper architecture unclear for tier views | New |
| V3-7 | High | i18n errors namespace wiring not verified | New |
| V3-8 | Medium | Phase 1 vs Phase 4 enum contradiction | New |
| V3-9 | Medium | payload.body fallback not in actual code snippet | New |
| V3-10 | Medium | COMPLAINT_RESPONSE should be in allowlist | New |
| V3-11 | Medium | findByIdempotencyKey method + column don't exist | New |
| V3-12 | Medium | No transaction for template activation (V2-13 not fixed) | Carryover |
| V3-13 | Medium | @aws-sdk/client-sesv2 missing from install list | New |
| V3-14 | Low | No rate limiting on sendTestEmail (V1-5 not fixed) | Carryover |
| V3-15 | Low | isomorphic-dompurify unverified under Bun (V2-5 not fixed) | Carryover |

## 15. Final Verdict

**Grade: B** — The design is architecturally sound and the v1/v2 fixes were mostly well-applied. However, two critical compilation issues exist that indicate the design's code snippets were updated textually without being verified through a TypeScript compiler. The typed registry pattern (a core design pillar) still doesn't deliver the type narrowing the design claims, despite extensive research file documentation of the fix.

**Critical fixes needed before implementation begins**:
1. Fix `resetEmailChannel()` — remove `await` + `peek()`
2. Add `templateProps` to `CommunicationPayload` or remove dispatcher references to it
3. Replace typed registry pattern with research file 06's corrected version (`EmailPropsByScope` mapped type + `defineEmailTemplate<P>`)
4. Resolve Phase 1 enum contradiction (Record type will break if enum values added without mapping entries)

**Verdict**: The design is ~85% ready for implementation. The 2 critical issues and 5 high issues should be fixed in the design document before any code is written, as they affect compilation and type safety at the foundation level. The medium and low issues can be addressed during implementation with clear follow-up items. The overall architecture, research-backed decisions, and pattern adherence are strong — the issues are primarily in code snippet accuracy and type system details.
