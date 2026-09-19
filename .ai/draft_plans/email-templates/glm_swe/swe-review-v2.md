# SWE Review v2 — Email Template System Design

**Reviewer:** Copilot CLI (staff/principal-level review)
**Date:** 2026-07-25
**Document reviewed**: proposed design (752 lines)
**Prior review:** `.ai/designs/email-templates/glm_swe/swe-review.md` (504 lines — findings incorporated into design)
**Method:** Every claim cross-referenced against actual codebase using grep, glob, view, and bash

---

## 1. Executive Summary

**Overall grade: C+ (Conditional Pass — requires fixes before implementation)**

The design is architecturally ambitious and mostly sound in its high-level design. The prior SWE review caught many issues that were incorporated (i18n signature fix, EmailsErrorLabels, render() async). However, this v2 review finds **new critical discrepancies** the prior review missed:

- **3 nonexistent enum values** referenced in the design's `EVENT_TO_SCOPE` mapping — the code won't compile
- **NotificationEventType count is wrong** — design says 22, actual is 24
- **10 of 24 enum values missing** from the design's dispatcher mapping, despite claiming "exhaustiveness enforced at compile-time"
- **`resetEmailChannel` signature mismatch** — design says `Promise<void>`, actual is `void`
- **`NotificationDeliveryStatus` count wrong** — design implies 3 relevant values, actual has 5
- **Missing npm dependencies** not flagged clearly enough as installation risks
- **Existing email-templates.ts uses hardcoded colors** — the design doesn't mention migrating these

**Top 3 concerns:**
1. The `EVENT_TO_SCOPE` mapping will NOT compile — it references enum members that don't exist (Severity: Critical, Probability: 100%)
2. 10 enum values are silently unmapped — the "exhaustiveness" claim is false if the mapping is `Partial<Record<...>>` or the `null` comment placeholder doesn't compile (Severity: High)
3. The design's research file `06-typed-registry-pattern.md` correctly identifies the TS correlated-union limitation (#47109) but the design doesn't surface the workaround clearly enough (Severity: Medium)

---

## 2. Codebase Verification — Design Claims vs Actual

### 2.1 Critical: Nonexistent Enum Values in EVENT_TO_SCOPE (WILL NOT COMPILE)

**DESIGN CLAIMS (design lines 529-556):**
```typescript
[NotificationEventType.COMPLAIT_RESPONSE_CREATED]: EmailScope.COMPLAINT_RESPONSE,
[NotificationEventType.STUDENT_REASSIGNED]: EmailScope.STUDENT_LIFECYCLE,
[NotificationEventType.WELCOME]: EmailScope.WELCOME,
[NotificationEventType.PASSWORD_RESET]: EmailScope.PASSWORD_RESET,
[NotificationEventType.EMAIL_VERIFICATION]: EmailScope.EMAIL_VERIFICATION,
```

**ACTUAL (verified in `backend/enum/notifications/notificationDeliveries.enum.ts`):**

| Design's Enum Member | Actual Enum Member | Status |
|---|---|---|
| `COMPLAIT_RESPONSE_CREATED` | `COMPLAINT_RESPONSE` | **WRONG — typo + suffix** |
| `STUDENT_REASSIGNED` | `STUDENT_TEACHER_REASSIGNED` | **WRONG — truncated name** |
| `WELCOME` | *(does not exist)* | **NONEXISTENT** |
| `PASSWORD_RESET` | *(does not exist)* | **NONEXISTENT** |
| `EMAIL_VERIFICATION` | *(does not exist)* | **NONEXISTENT** |

**IMPACT:** `NotificationEventType.COMPLAIT_RESPONSE_CREATED` will produce a TypeScript error: "Property 'COMPLAIT_RESPONSE_CREATED' does not exist on type 'typeof NotificationEventType'." This is a compile-time failure, not a runtime issue. The design claims "Exhaustiveness is enforced at compile-time" (line 527) — ironically, the mapping itself won't compile.

**RECOMMENDATION:** Fix all 5 entries to match actual enum values. For `WELCOME`/`PASSWORD_RESET`/`EMAIL_VERIFICATION` — these don't exist in `NotificationEventType` at all. The design's Phase 4 "account flow" scope (lines 200-201) references these as future enum additions. Either:
- (a) Add them to the enum first (Phase 1 prerequisite), or
- (b) Remove them from the mapping and scope enum until the enum is extended

### 2.2 Critical: NotificationEventType Count is 24, Not 22

**DESIGN CLAIMS (step 3a):** "22 NotificationEventType values"
**ACTUAL:** 24 values (verified by extracting enum block from `notificationDeliveries.enum.ts`)

Full list of 24 actual enum values:
```
CLASS_REMINDER, INVOICE_GENERATED, COMPLAINT_RESPONSE, PAYMENT_METHOD_CHANGED,
NEW_COMPLAINT, NEW_SUGGESTION, SUGGESTION_ACKNOWLEDGED, SUGGESTION_DUPLICATE_MARKED,
INVOICE_STATUS_CHANGED, CLASS_SCHEDULED, CLASS_ACTIVATED, CLASS_STARTED,
CLASS_COMPLETED, CLASS_MARKED_ABSENT, CLASS_MARKED_MISSED, CLASS_LEAVE_REQUESTED,
CLASS_RESCHEDULED, CLASS_CANCELLED, CLASS_RESET, STUDENT_TEACHER_REASSIGNED,
STUDENT_STATUS_CHANGED, STUDENT_QUOTA_OVERRIDDEN, LESSON_REPORT_SUBMITTED,
LESSON_REPORT_REVIEWED
```

**IMPACT:** The design's `EVENT_TO_SCOPE` mapping only explicitly covers 14 entries. The remaining 10 are covered by a comment: `// ... (null entries for remaining event types)`. This is a placeholder, not actual code. If implemented as `Partial<Record<NotificationEventType, EmailScope | null>>` but claimed as `Readonly<Record<NotificationEventType, EmailScope | null>>` (line 529), the `Readonly<Record<...>>` form REQUIRES all 24 keys — the comment placeholder won't satisfy it. If implemented as `Partial<Record<...>>`, the exhaustiveness claim is false.

**MISSING from design's explicit mapping (10 of 24):**
`NEW_COMPLAINT`, `NEW_SUGGESTION`, `SUGGESTION_DUPLICATE_MARKED`, `CLASS_ACTIVATED`, `CLASS_STARTED`, `CLASS_MARKED_ABSENT`, `CLASS_MARKED_MISSED`, `CLASS_LEAVE_REQUESTED`, `CLASS_RESCHEDULED`, `CLASS_RESET`, `STUDENT_QUOTA_OVERRIDDEN`

**NOTE:** Some of these (e.g., `CLASS_ACTIVATED`, `CLASS_STARTED`) are `ON_APP + PUSH` only in `EVENT_CHANNEL_ALLOWLIST` — they may legitimately map to `null` for email. But the design must explicitly enumerate them, not use a comment placeholder.

### 2.3 Critical: NotificationDeliveryStatus Has 5 Values, Not 3

**DESIGN CLAIMS (step 20a):** "NotificationDeliveryStatus has DELIVERED, OPENED, FAILED"
**ACTUAL (verified in `notificationDeliveries.enum.ts`):** 5 values:
```typescript
PENDING = "PENDING",
SENT = "SENT",
DELIVERED = "DELIVERED",
OPENED = "OPENED",
FAILED = "FAILED",
```

**IMPACT:** The design's email delivery tracking may miss `PENDING` and `SENT` states. If the design only checks for `DELIVERED`/`OPENED`/`FAILED`, it won't correctly track initial `PENDING → SENT` transitions. Minor impact since the design is adding email-specific tracking, but the design's description is factually incomplete.

### 2.4 MEDIUM: resetEmailChannel Signature Mismatch

**DESIGN CLAIMS:** `resetEmailChannel` returns `Promise<void>`
**ACTUAL (`EmailChannelFactory.ts:87`):**
```typescript
export function resetEmailChannel(): void {
```

It's synchronous `void`, not `Promise<void>`. The design's adapter design (line 355 area) shows it as async. This won't cause a compile error (returning `void` from a non-async is fine), but if the design changes it to `async`, all call sites need to be updated.

**IMPACT:** Low. The design is refactoring this file anyway, so making it `async` during the refactor is acceptable. But the design should acknowledge the current state.

### 2.5 MEDIUM: Missing npm Dependencies — Risk Assessment

**ACTUAL `package.json` verified deps:**
- `drizzle-orm`: ✅ `1.0.0-rc.4` (matches design claim)
- `react-email`: ✅ `^6.9.1` (matches design claim)
- `@react-email/editor`: ✅ `^1.1` (matches design claim)
- `@pothos/core`: ✅ `^4.13.1` (matches design claim)
- `@pothos/plugin-scope-auth`: ✅ `^4.1.7` (matches design claim)
- `resend`: ✅ `^6.18.1`
- `@aws-sdk/client-ses`: ✅ Present (but NOT `@aws-sdk/client-sesv2` — design uses sesv2)
- `postmark`: ✅ `^5.1.0`
- `mailgun.js`: ✅ `^13.3.0`
- `nodemailer`: ✅ `^9.0.3`
- `form-data`: ✅ `^4.0.6`

**MISSING from package.json (design needs to install):**
- `@aws-sdk/client-sesv2`: ❌ NOT installed. Design references SES v2 API. The installed `@aws-sdk/client-ses` is v1/v3 style, not sesv2.
- `isomorphic-dompurify`: ❌ NOT installed. Design's `safeRender` depends on it.
- `web-streams-polyfill`: ❌ NOT installed. Design says needed for Safari.

**IMPACT:** The design correctly marks step 1 as "install dependencies." However:
1. `@aws-sdk/client-ses` (installed) vs `@aws-sdk/client-sesv2` (not installed) — the design must clarify which SES SDK it targets. SES v2 is a different API surface.
2. `isomorphic-dompurify` has native dependencies in some environments — verify Bun compatibility.
3. `web-streams-polyfill` needs next.config.ts configuration (polyfill injection). No existing polyfill config exists in the codebase (verified — no `web-streams-polyfill` in next.config or anywhere).

### 2.6 Verified CORRECT Claims

The following design claims were verified as **accurate**:

| Design Claim | Verification |
|---|---|
| `getServerTranslations` is single-arg, synchronous | ✅ `shared/locale/server-graphql.ts:3` — `export function getServerTranslations(locale: string): ReturnType<typeof getTranslations>` |
| `createPgEnumFromEnum` helper exists | ✅ `backend/db/schema/enums.ts` — widely used pattern |
| `queryDb` for non-transactional reads | ✅ `backend/db/repo/billing/billing.repository.ts` — confirms pattern |
| `seedOrGet` naming convention | ✅ Used across all seed files in `backend/db/seeds/` |
| `requirePermissionForPage` pattern | ✅ Used in multiple `app/` pages |
| `ResponsiveViewSwitch` + `createLazyView` exist | ✅ `frontend/common/components/ui/container/ResponsiveViewSwitch.tsx` |
| `ScopedCssBaseline` in MUI | ✅ Exists in `node_modules/@mui/material` |
| `EmailTheming` plugin in @react-email/editor | ✅ Exported from `@react-email/editor/dist/plugins/index.d.cts:76` |
| CSS vars `--re-*` in editor | ✅ Confirmed in `node_modules/@react-email/editor/dist/ui/themes/default.css` |
| NO `.array()` columns in schema | ✅ Zero matches in `backend/db/schema/` |
| Partial unique index `.where(sql...)` pattern | ✅ Exists in meeting-config, impersonation, billing schemas |
| `authScopes: { superAdmin: true, notImpersonating: true }` | ✅ `billing-payments.mutation.ts:68`, `schedule-deletion.mutation.ts` |
| `enum.pothos.ts` central registration | ✅ `backend/graphql/pothos/shared/enum.pothos.ts` |
| `pothos/index.ts` barrel (no email entry yet) | ✅ `backend/graphql/pothos/index.ts` — confirmed no email exports |
| `EmailsLabels` only has 2 scopes, no errors namespace | ✅ `shared/locale/types/emails/index.ts` — `complaintResponse`, `suggestionAcknowledged` only |
| `emails` namespace wired via `defineNamespace` | ✅ `shared/locale/namespaces/emails/emails.namespace.ts` |
| `jsonb().$type<T>()` pattern in Drizzle | ✅ Multiple examples in meeting-providers, permissions, site-content |
| Optimistic locking via `version: integer().notNull().default(0)` | ✅ `students.ts:65`, `billing.ts:44` |
| `uuid("id").defaultRandom().primaryKey()` pattern | ✅ Used throughout schema |
| `render()` from `@react-email/render` is async | ✅ `node_modules/@react-email/render/dist/node/index.d.cts:50`: `declare const render: (node: React.ReactNode, options?: Options) => Promise<string>` |
| `pretty?: boolean` option in render | ✅ Confirmed in Options type |
| `EmailEditorRef.getEmail()` returns `{ html, text }` | ✅ `@react-email/editor/dist/index.d.cts` — confirmed async |
| `EmailEditorRef.getJSON()` returns `JSONContent` | ✅ Synchronous — returns `JSONContent` directly (not Promise) |
| `render()` re-exported from `react-email` package | ✅ `react-email/dist/index.d.mts:25`: `export * from "@react-email/render"` |
| `SYSTEM_DISPATCH_EMAIL` permission exists | ✅ `backend/enum/permissions/permission.enum.ts:68`: `SYSTEM_DISPATCH_EMAIL = "system.dispatch_email"` |
| No `EMAIL_VERIFICATION` / `WELCOME` / `PASSWORD_RESET` in NotificationEventType | ✅ Verified — these do not exist |

### 2.7 CommunicationPayload — No templateProps Field

**DESIGN CLAIMS (design line 508):** References `payload.templateProps`
**ACTUAL (`backend/types/notifications/communications.types.ts:4-11`):**
```typescript
export type CommunicationPayload = {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: CommunicationChannelType;
  readonly eventType: NotificationEventType;
  readonly metadata?: Record<string, unknown>;
};
```

No `templateProps` field exists. Design step 18 covers this addition — **correctly identified as new work**.

### 2.8 EmailPayload — Missing Fields

**ACTUAL (`backend/services/communication/channels/email/IEmailChannel.ts`):**
```typescript
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  eventType: NotificationEventType;
  userId: string;
  metadata?: NotificationMetadata | null;
}
```

Missing (design correctly identifies these need adding): `attachments`, `text`, `cc`, `bcc`, `replyTo`, `headers`.

### 2.9 CommunicationService.dispatch — Current Flow

**ACTUAL (`backend/services/communication/communication.service.ts:37`):**
```typescript
? await emailChannel.send({ ...commonFields, subject: payload.title, html: payload.body ?? "" }, locale)
```

The current dispatch passes `payload.body ?? ""` directly as HTML. No template rendering occurs. The design correctly identifies this as the migration point (step 17-19).

### 2.10 EmailProvider Type

**ACTUAL (`IEmailChannel.ts:25`):** `type EmailProvider = "resend"` — single string literal, not enum.
**DESIGN:** Introduces `EmailProviderName` with 5 values. Correctly identified as new work.

### 2.11 Orphaned email-templates.ts

**ACTUAL:** `backend/services/communication/templates/email-templates.ts` exports `renderComplaintResponseEmail` and `renderSuggestionAcknowledgedEmail`. Grep across `backend/`, `frontend/`, `shared/`, `app/` found **ZERO callers** of these functions. They are already orphaned — the design's migration path is correct.

**ISSUE:** The existing file uses hardcoded colors (`#1976d2`, `#2e7d32`, `#333333`, `#555555`, `#888888`, `#f5f5f5`, `#e0e0e0`) throughout. This violates AGENTS.md: "NO hardcoded colors — all colors from theme palette." The design doesn't mention migrating these colors. While the design replaces these templates with React Email components (which use CSS-in-JS), the design should explicitly note this violation and ensure the new React Email components source colors from the email theme config, not hardcoded values.

### 2.12 frontend/views/ Deprecation

**DESIGN CLAIMS (design line 583):** "`frontend/views/` is DEPRECATED"
**ACTUAL:** `frontend/views/AGENTS.md` exists and confirms: "Note: `frontend/views/` is DEPRECATED. Switchers, Containers, ViewModels... have been relocated to `frontend/common/views/`." The directory still contains `auth/` content and the AGENTS.md itself. The design's characterization is **correct** — per the project's own AGENTS.md, it IS deprecated, even though files remain.

---

## 3. Architecture Assessment

### 3.1 Hybrid Registry + Factory Design

The design proposes a hybrid approach:
- `createRegistry()` for compile-time typed template definition
- `EmailChannelFactory` extended for multi-provider runtime selection

**VERDICT:** Sound. The registry pattern (per-scope typed templates) and the factory pattern (provider selection) are orthogonal concerns and don't conflict. The registry handles "what template to render" while the factory handles "how to send it."

**CONCERN:** The design's `EmailChannelFactory.createResendAdapter()` method name implies it returns an adapter, but the existing factory's `getEmailChannel()` is a singleton accessor. Adding `createResendAdapter()` as a factory method that returns a new instance each time is a different pattern. The design should clarify whether `createResendAdapter()` returns a fresh instance or the cached singleton.

### 3.2 Dispatcher Migration

The design modifies `CommunicationService.dispatch` to call `renderTemplate()` before sending. This is the correct injection point (verified at line 37). The migration path:
1. Check `mapEventTypeToEmailScope(eventType)` → get scope or null
2. If scope exists, call `renderTemplate(scope, props, locale)` to get HTML
3. Pass rendered HTML to `emailChannel.send()`

**ISSUE:** The current dispatch at line 37 passes `payload.body ?? ""` as HTML. If the new template system is active, what happens to `payload.body`? The design doesn't clearly specify whether:
- (a) `payload.body` is deprecated for email (template system replaces it), or
- (b) `payload.body` is used as a fallback when no template mapping exists

This must be explicit to avoid breaking existing email-sending paths during migration.

### 3.3 Idempotency

The design references an idempotency key for send operations. The existing `ResendEmailAdapter` doesn't implement idempotency. Adding it requires either:
- A DB-level unique constraint on `(providerMessageId, eventType)`
- A dedup cache (like the existing `redirectedTestSendKeys` Set in `ResendEmailAdapter`, but production-grade)

The design should specify which approach and where the idempotency check lives (adapter level or service level).

---

## 4. Type-System Analysis — EmailScope Enum + EmailTemplateRegistry

### 4.1 The Correlated Union Problem (TS #47109)

The design's research file `06-typed-registry-pattern.md` correctly identifies the TypeScript correlated-union limitation: when you have `Record<EmailScope, TemplateDefinition<P>>`, the per-entry `P` is widened to the union of all props, not narrowed per-key. This means `renderTemplate(scope, props)` can't statically enforce that `COMPLAINT_RESPONSE` gets `ComplaintProps` while `INVOICE_GENERATED` gets `InvoiceProps`.

**DESIGN APPROACH:** Uses `satisfies` operator + discriminated union pattern.

**VERDICT:** This is the correct workaround. The `satisfies` operator preserves literal types while checking conformance. The research file's analysis of TS #47109 is accurate (verified against TypeScript issues). The design acknowledges this isn't fully solved but provides runtime validation via Zod schemas as a backstop.

**RISK:** If a developer adds a new scope but forgets to update the registry, the `satisfies` check will catch it at compile-time. The Zod runtime validation adds defense-in-depth. This is a reasonable engineering tradeoff.

### 4.2 `Readonly<Record<NotificationEventType, EmailScope | null>>` — Compile Concern

The design declares:
```typescript
const EVENT_TO_SCOPE: Readonly<Record<NotificationEventType, EmailScope | null>> = { ... }
```

`Record<K, V>` requires ALL keys of K to be present. With 24 enum values but only 14 explicit entries (plus a comment placeholder), this will NOT compile. The comment `// ... (null entries for remaining event types)` is not code.

**FIX:** Either:
1. Explicitly list all 24 entries (with `null` for non-email events), OR
2. Use `Partial<Record<NotificationEventType, EmailScope | null>>` and add a type-level exhaustiveness check separately

### 4.3 tsgo Compatibility

The repo uses `tsgo` (TS 7.0 native preview). The design's research file confirms `satisfies` is fully supported in tsgo. No tsgo-specific issues found.

---

## 5. Provider/Adapter Design

### 5.1 Existing EmailChannelFactory

**ACTUAL (`EmailChannelFactory.ts`):**
- `getEmailChannel()`: async, returns cached adapter by provider name
- `resetEmailChannel()`: void (synchronous), clears cache
- `emailChannel`: facade object with `send`, `getProvider`, `reset`

The design extends this to support multiple providers (SES, Postmark, Mailgun, Nodemailer). The approach is sound.

**ISSUE:** The existing factory only knows `"resend"`. The design introduces `EmailProviderName` with 5 values. The factory's async `getEmailChannel(provider: EmailProviderName)` will need adapter constructors for each. The design should verify that each adapter's constructor signature is consistent (all accepting `{ apiKey?, fromEmail? }` or similar).

### 5.2 SES v2 vs SES v1

**CONCERN:** `@aws-sdk/client-ses` is installed but the design uses `@aws-sdk/client-sesv2` (not installed). These are different packages with different APIs:
- `@aws-sdk/client-ses`: `SendEmailCommand` (legacy SES API)
- `@aws-sdk/client-sesv2`: `SendEmailCommand` (SES v2 API, different client class)

The design must install `@aws-sdk/client-sesv2` and use `SESv2Client`, not `SESClient`. The existing `@aws-sdk/client-ses` may be unused or used elsewhere — the design should check before removing it.

### 5.3 Migration Path

The design's phased approach (Phase 1: deps + schema, Phase 2: registry + adapters, Phase 3: UI, Phase 4: dispatcher migration) is sound. The key risk is Phase 4: switching `dispatch()` from `payload.body` to template-rendered HTML. A feature flag or gradual rollout should be specified.

---

## 6. DB Schema Review

### 6.1 Drizzle 1.0.0-rc.4 Compatibility

Verified patterns in existing schema:
- `jsonb("col").$type<T>().notNull()` — ✅ confirms pattern works in rc.4
- `uuid("id").defaultRandom().primaryKey()` — ✅ confirmed
- `integer("version").notNull().default(0)` — ✅ confirmed (students, billing)
- Partial unique index `.where(sql\`...\`)` — ✅ confirmed
- `timestamp("created_at").defaultNow().notNull()` — standard pattern

**CONCERN with design's schema:** The design proposes `jsonb("design_json").$type<EmailDesignJson>().notNull()` for storing the editor's JSON content. This is fine for Drizzle, but:
1. JSONB columns don't support partial updates — each save rewrites the entire JSON
2. For large template designs, this could be a performance concern
3. The design should specify a size limit or compression strategy

### 6.2 Optimistic Locking

The design uses `version: integer("version").notNull().default(0)` — this matches the existing pattern in `students.ts:65` and `billing.ts:44`. The repo already has optimistic locking coverage in the backend db concurrency logic.

**VERDICT:** Correct pattern, consistent with repo conventions.

### 6.3 Partial Unique Index for Active Templates

The design proposes:
```sql
UNIQUE (scope, is_active) WHERE is_active = true
```

This ensures only one active template per scope. The `.where(sql\`...\`)` pattern is confirmed to work in rc.4 (verified in meeting-config-indexes, impersonation, billing).

**ISSUE:** The design should clarify what happens during template updates — does "activate new version" atomically deactivate the old and activate the new, or is there a window where two templates could be active? A transaction wrapping both operations is essential.

### 6.4 No `.array()` Columns — Correctly Identified

Design claims "no `.array()` columns in repo" — ✅ Verified: zero matches for `.array(` in `backend/db/schema/`. This means the design correctly avoids using Drizzle array columns and instead uses JSONB for array-like data.

---

## 7. GraphQL Surface

### 7.1 Pothos Patterns

**VERIFIED patterns:**
- `enum.pothos.ts` centrally registers enums — ✅
- `pothos/index.ts` barrel exports (no email entry yet) — ✅
- `authScopes: { superAdmin: true, notImpersonating: true }` — ✅ used in real mutations
- Object naming follows `{Entity}Object` convention — confirmed in existing Pothos files

**CONCERN:** The design says to add `EmailTemplateObject` to Pothos. The design should verify it follows the exact object definition pattern:
```typescript
builderObject.objectRef<EmailTemplateReturnType>("EmailTemplateObject")
```
This matches the repo convention (verified in billing-payments.mutation.ts and notification-preferences.mutation.ts).

### 7.2 Permission System

**ACTUAL:** `SYSTEM_DISPATCH_EMAIL = "system.dispatch_email"` exists in `permission.enum.ts:68`. This is the correct permission for email dispatch.

The design should verify whether a NEW permission (e.g., `MANAGE_EMAIL_TEMPLATES`) is needed for the admin UI, or if `SYSTEM_DISPATCH_EMAIL` suffices. The AGENTS.md says to use `requirePermissionForPage` for page-level access and `RequirePermission` for component-level. The design should specify which permissions guard which operations.

---

## 8. Frontend Integration

### 8.1 ViewModel Pattern

The design correctly identifies the tier-neutral ViewModel pattern:
- `frontend/common/views/dashboard/<domain>/useXxViewModel.ts` — hook
- `frontend/common/views/dashboard/<domain>/XxView.tsx` — switcher
- `frontend/common/views/dashboard/<domain>/XxContainer.tsx` — container
- `frontend/mobile/views/dashboard/<domain>/xx.mobile.tsx` — mobile tier
- `frontend/desktop/views/dashboard/<domain>/xx.desktop.tsx` — desktop tier

**VERIFIED:**
- `ResponsiveViewSwitch` exists in `frontend/common/components/ui/container/`
- `createLazyView` exists in same file
- Switcher pattern uses `createLazyView<T>()` at module top level
- Mobile/desktop views are lazy-loaded via dynamic `import()`

The design's email-template-editor page should follow this exactly. **CONCERN:** The `@react-email/editor` component is a heavy dependency (TipTap + prosemirror). Lazy loading it only in the desktop tier (or both tiers) needs careful bundle analysis. The design should specify whether the editor is desktop-only or available on both tiers.

### 8.2 @react-email/editor API

**VERIFIED (`node_modules/@react-email/editor/dist/index.d.cts`):**

```typescript
interface EmailEditorRef {
  getEmail: () => Promise<{ html: string; text: string }>;
  getEmailHTML: () => Promise<string>;
  getEmailText: () => Promise<string>;
  getJSON: () => JSONContent;  // SYNCHRONOUS — returns JSONContent directly
  editor: Editor | null;
}

interface EmailEditorProps {
  content?: Content;
  onUpdate?: (ref: EmailEditorRef) => void;
  onReady?: (ref: EmailEditorRef) => void;
  theme?: EditorThemeInput;
  editable?: boolean;
  // ... more props
}
```

**IMPORTANT:** `getJSON()` is SYNCHRONOUS (returns `JSONContent`, not `Promise<JSONContent>`). The design should use `getEmail()` for async HTML/text extraction and `getJSON()` for synchronous design JSON save.

**ISSUE:** The design references `getEmail()` for rendering but the `onReady` callback provides the ref. The design must ensure the ref is stored (e.g., via `useRef`) before calling `getEmail()`. The `onUpdate` callback fires on every content change — using it for autosave is fine but should be debounced.

### 8.3 EmailTheming Plugin API

**VERIFIED:** `EmailTheming` is exported from `@react-email/editor/dist/plugins`. It's a TipTap Extension. The `getEmailTheming(editor)` function returns `{ styles, css, theme }`. CSS variables use `--re-*` prefix (confirmed in `default.css`).

The design should verify whether `EmailTheming` needs to be passed as an `extensions` prop to `<EmailEditor>` or is built-in. From the types, `extensions?: Extensions` is an optional prop — suggesting `EmailTheming` is NOT built-in and must be explicitly added.

### 8.4 ScopedCssBaseline

**VERIFIED:** `ScopedCssBaseline` exists in `@mui/material`. This is the correct MUI component for isolating CSS reset to the editor container. The design's approach of wrapping the editor in `<ScopedCssBaseline>` is sound — it prevents MUI's CSS baseline (CssBaseline) from interfering with the email editor's TipTap styles.

### 8.5 Zustand Store

The design proposes a Zustand store for editor state (dirty flag, current design, version). This aligns with the AGENTS.md pattern: "Zustand for all state" so it survives viewport tier switching. The store should be in `frontend/common/stores/` per convention.

**CONCERN:** The design mentions storing `File` objects (for image uploads) in the Zustand store. AGENTS.md explicitly says: "Non-serializable values (File, Blob, FormData, Promise) must NOT be stored in `persist`-enabled Zustand stores. Use `partialize` to exclude them or keep in a `useRef` in the ViewModel hook." The design should use `useRef` for File objects, not the store.

---

## 9. Render Pipeline

### 9.1 render() is Async — Correctly Identified

**VERIFIED:** `@react-email/render` exports `render` as:
```typescript
declare const render: (node: React.ReactNode, options?: Options) => Promise<string>;
```

The design correctly identifies this. The prior SWE review caught this and the design incorporated the fix.

### 9.2 pretty:false Option

**VERIFIED:** `Options` type has `pretty?: boolean`. Setting `pretty: false` in `safeRender()` is valid and will produce minified output (smaller email size). Correct approach.

### 9.3 DOMPurify for HTML Sanitization

**ACTUAL:** `isomorphic-dompurify` is NOT installed. The design's `safeRender()` depends on it.

**RISK:** `isomorphic-dompurify` wraps `dompurify` with `jsdom` for server-side use. In a Bun runtime, `jsdom` may have compatibility issues. The design's research file `11-bun-compatibility.md` doesn't specifically verify `isomorphic-dompurify` with Bun. This should be verified before committing to this dependency.

**ALTERNATIVE:** Consider using `dompurify` directly with a custom `DOMParser` polyfill, or use Bun's built-in HTML parsing capabilities if available.

### 9.4 TipTap Schema Validation

The design mentions validating the editor's JSON output against a schema before storing. This is correct — `JSONContent` from TipTap is freeform and should be validated. The design should use Zod (already in the repo) for this validation.

### 9.5 web-streams-polyfill

**ACTUAL:** No polyfill configuration exists in `next.config.ts`. The design needs to add:
```typescript
// next.config.ts
import { Stream } from 'web-streams-polyfill/ponyfill';
globalThis.Stream = Stream as any;
```

Or use a dynamic import approach. The design should specify the exact next.config modification.

---

## 10. i18n Integration

### 10.1 getServerTranslations Signature — Correctly Fixed

**PRIOR REVIEW:** Caught that the design originally used two-arg `getServerTranslations(locale, "namespace")` — this was WRONG. The actual function is single-arg: `getServerTranslations(locale): Translations`.

**DESIGN FIX (verified design lines 46, 650):** The design now correctly states: "Use CORRECT call signature: `getServerTranslations(locale).emailsTranslations.errors.*` (NOT two-arg `getServerTranslations(locale, 'emails.errors')` — that signature does not exist and won't compile)." ✅ Fixed.

### 10.2 EmailsErrorLabels — Correctly Added

**DESIGN (design lines 639-649):** Introduces `EmailsErrorLabels` interface with `renderFailed: (scope: { scope: string }) => string`. This is new work — the existing `EmailsLabels` type (verified) only has `complaintResponse` and `suggestionAcknowledged` scopes, no errors sub-namespace.

**VERIFIED:** The `emails` namespace is wired via `defineNamespace` in `shared/locale/namespaces/emails/emails.namespace.ts` and referenced in `shared/locale/namespaces/translation.ts:86`. Adding `errors` to the type + en/ar implementations is sufficient — no separate registration needed. The design correctly identifies this.

### 10.3 SubjectArgs Pattern

The research file `09-i18n-react-email-interop.md` verifies the existing `SubjectArgs` pattern (interpolation via typed function signatures). The design extends this for all email scopes. This is consistent with the compile-time i18n system design.

### 10.4 Pluralization Pattern

The design should verify that pluralization rules (if any in email subjects/bodies) follow the `(count: number) => string` pattern defined in the i18n type schema. No email-specific pluralization issues identified, but the design should check each scope's subject for pluralized content (e.g., "You have N new complaints").

---

## 11. Dispatcher Migration — Detailed Analysis

### 11.1 EVENT_CHANNEL_ALLOWLIST

**ACTUAL (`backend/services/notification/notification-dispatch.helpers.ts:39`):**
```typescript
export const EVENT_CHANNEL_ALLOWLIST: Partial<Record<NotificationEventType, NotificationChannel[]>> = {
  [NotificationEventType.CLASS_SCHEDULED]: [ON_APP, EMAIL],
  [NotificationEventType.CLASS_ACTIVATED]: [ON_APP, PUSH],   // NO EMAIL
  [NotificationEventType.CLASS_STARTED]: [ON_APP, PUSH],     // NO EMAIL
  // ... 14 total entries
};
```

Key insight: `CLASS_ACTIVATED` and `CLASS_STARTED` are `ON_APP + PUSH` only — they have NO EMAIL channel. The design's `EVENT_TO_SCOPE` should map these to `null` (no email template needed). But the design's mapping doesn't explicitly list them.

**CONCERN:** If the design adds these to `EmailScope` (e.g., `CLASS_LIFECYCLE`) and maps them, it would create email templates for events that `EVENT_CHANNEL_ALLOWLIST` says should never produce emails. The design must align `EVENT_TO_SCOPE` with `EVENT_CHANNEL_ALLOWLIST` — if an event has no EMAIL in its allowlist, its scope mapping should be `null`.

### 11.2 Idempotency Key

The design mentions an idempotency key for send operations. The existing `ResendEmailAdapter` uses a `redirectedTestSendKeys` Set for Send-Test-mode dedup, but this is limited to Send-Test mode, not production idempotency.

**RECOMMENDATION:** Use a composite key of `(eventType, userId, entityId)` as the idempotency key, stored in a `email_send_log` table with a unique constraint. This ensures the same event for the same user/entity doesn't trigger duplicate emails.

### 11.3 Design's EVENT_TO_SCOPE vs Actual Allowlist Cross-Reference

| Event | Allowlist Has EMAIL? | Design Maps to Scope? | Correct? |
|---|---|---|---|
| CLASS_SCHEDULED | ✅ | ✅ CLASS_LIFECYCLE | ✅ |
| CLASS_COMPLETED | ✅ | ✅ CLASS_LIFECYCLE | ✅ |
| CLASS_CANCELLED | ✅ | ✅ CLASS_LIFECYCLE | ✅ |
| CLASS_ACTIVATED | ❌ (PUSH only) | Not listed | Should be null |
| CLASS_STARTED | ❌ (PUSH only) | Not listed | Should be null |
| CLASS_MARKED_ABSENT | ✅ | Not listed | **Missing** |
| CLASS_MARKED_MISSED | ✅ | Not listed | **Missing** |
| CLASS_LEAVE_REQUESTED | ✅ | Not listed | **Missing** |
| CLASS_RESCHEDULED | ✅ | Not listed | **Missing** |
| CLASS_RESET | ✅ | Not listed | **Missing** |
| STUDENT_STATUS_CHANGED | ✅ | ✅ STUDENT_LIFECYCLE | ✅ |
| STUDENT_QUOTA_OVERRIDDEN | ✅ | Not listed | **Missing** |
| STUDENT_TEACHER_REASSIGNED | ❌ (not in allowlist) | ❌ (design says STUDENT_REASSIGNED) | **Wrong name + not in allowlist** |
| LESSON_REPORT_SUBMITTED | ✅ | ✅ | ✅ |
| LESSON_REPORT_REVIEWED | ✅ | ✅ | ✅ |
| COMPLAINT_RESPONSE | ❌ (not in allowlist) | ❌ (design says COMPLAIT_RESPONSE_CREATED) | **Wrong name + not in allowlist** |

**CRITICAL:** `COMPLAINT_RESPONSE` is NOT in `EVENT_CHANNEL_ALLOWLIST` at all — meaning it currently doesn't produce any channel dispatch (falls through to `ALL_ENUM_CHANNELS`). The design maps `COMPLAIT_RESPONSE_CREATED` (wrong name) to `COMPLAINT_RESPONSE` scope. This needs investigation: does complaint response actually send emails today?

Also: 5 events that DO have EMAIL in their allowlist are missing from the design's explicit mapping.

---

## 12. Sequencing & Dependencies

### 12.1 Phase Ordering

The design's 4 phases:
1. **Phase 1:** Dependencies + schema + enums
2. **Phase 2:** Registry + adapters + render pipeline
3. **Phase 3:** Admin UI
4. **Phase 4:** Dispatcher migration + seed data

**ASSESSMENT:** The ordering is mostly correct. Schema before registry (Phase 1 → Phase 2) is right. UI before dispatcher (Phase 3 → Phase 4) allows verifying templates before wiring them into the live dispatch path.

### 12.2 Missing Dependencies

1. **EMAIL_VERIFICATION / WELCOME / PASSWORD_RESET enum values** — Design's Phase 4 maps these but they DON'T EXIST in the enum. Either add them in Phase 1 (schema + enum changes) or remove them from the scope enum.

2. **Feature flag** — No mention of a feature flag for the dispatcher migration. Phase 4 switches from `payload.body` to template-rendered HTML. Without a flag, this is a big-bang migration. Recommend adding `EMAIL_TEMPLATES_ENABLED` env var checked in `dispatch()`.

3. **Seed data** — Design's Phase 4 includes seed data, but seeds should be Phase 1 (alongside schema) to have seed data available during Phase 2-3 development.

4. **GraphQL schema generation** — After adding new Pothos objects/enums, `bun run generate:gqlSchema` and `bun codegen` must run. The design doesn't explicitly call this out as a step.

5. **Migration SQL** — After schema changes, `drizzle-kit generate` must produce a migration. The design should verify the migration SQL for the partial unique index works correctly.

---

## 13. Risk Register

| # | Risk | Severity | Probability | Mitigation |
|---|---|---|---|---|
| R1 | `EVENT_TO_SCOPE` won't compile — 3 nonexistent enum values + missing entries | Critical | 100% | Fix enum references, enumerate all 24 entries |
| R2 | `isomorphic-dompurify` incompatible with Bun runtime | High | 35% | Verify before committing; have `dompurify` + polyfill fallback |
| R3 | `@react-email/editor` bundle size bloats desktop tier | Medium | 60% | Dynamic import the editor component; code-split |
| R4 | `web-streams-polyfill` config missing from next.config | Medium | 100% | Add polyfill in Phase 1; verify on Safari |
| R5 | JSONB template storage performance for large designs | Medium | 30% | Add size limit; monitor query performance |
| R6 | Two active templates during version switch (race condition) | High | 20% | Wrap activate/deactivate in transaction |
| R7 | `payload.body` fallback behavior undocumented | Medium | 50% | Define clear fallback strategy + feature flag |
| R8 | SES v2 vs SES v1 API mismatch | Medium | 40% | Verify which AWS SDK package; install correct one |
| R9 | `STUDENT_TEACHER_REASSIGNED` not in EVENT_CHANNEL_ALLOWLIST | Low | 100% | Add to allowlist or map to null in scope |
| R10 | `COMPLAINT_RESPONSE` not in EVENT_CHANNEL_ALLOWLIST | High | 100% | Investigate current email path for complaints |
| R11 | File objects in Zustand store (violates AGENTS.md) | Low | 40% | Use useRef for File objects |
| R12 | Missing `generate:gqlSchema` + `codegen` step | Medium | 100% | Add as explicit step after Pothos changes |
| R13 | Idempotency not production-grade | Medium | 30% | Add `email_send_log` table with unique constraint |
| R14 | `@aws-sdk/client-sesv2` not installed — adapter will fail to import | Critical | 100% | Install in Phase 1 |

---

## 14. Concrete Recommendations

### R1: Fix EVENT_TO_SCOPE (CRITICAL — Blocker)
```typescript
// Fix these 3 entries to match actual enum:
[NotificationEventType.COMPLAINT_RESPONSE]: EmailScope.COMPLAINT_RESPONSE,  // was COMPLAIT_RESPONSE_CREATED
[NotificationEventType.STUDENT_TEACHER_REASSIGNED]: EmailScope.STUDENT_LIFECYCLE,  // was STUDENT_REASSIGNED

// Remove these 3 — they don't exist in the enum:
// [NotificationEventType.WELCOME]: EmailScope.WELCOME,
// [NotificationEventType.PASSWORD_RESET]: EmailScope.PASSWORD_RESET,
// [NotificationEventType.EMAIL_VERIFICATION]: EmailScope.EMAIL_VERIFICATION,

// Add these 10 missing entries (null for non-email events):
[NotificationEventType.NEW_COMPLAINT]: null,  // check allowlist
[NotificationEventType.NEW_SUGGESTION]: null,  // check allowlist
[NotificationEventType.SUGGESTION_DUPLICATE_MARKED]: null,
[NotificationEventType.CLASS_ACTIVATED]: null,  // PUSH only
[NotificationEventType.CLASS_STARTED]: null,  // PUSH only
[NotificationEventType.CLASS_MARKED_ABSENT]: EmailScope.CLASS_LIFECYCLE,
[NotificationEventType.CLASS_MARKED_MISSED]: EmailScope.CLASS_LIFECYCLE,
[NotificationEventType.CLASS_LEAVE_REQUESTED]: EmailScope.CLASS_LIFECYCLE,
[NotificationEventType.CLASS_RESCHEDULED]: EmailScope.CLASS_LIFECYCLE,
[NotificationEventType.CLASS_RESET]: EmailScope.CLASS_LIFECYCLE,
[NotificationEventType.STUDENT_QUOTA_OVERRIDDEN]: EmailScope.STUDENT_LIFECYCLE,
```

### R2: Add Feature Flag
```typescript
// In dispatch(), before template rendering:
const useTemplates = process.env.EMAIL_TEMPLATES_ENABLED === "true";
if (useTemplates && mapEventTypeToEmailScope(payload.eventType)) {
  // render template
} else {
  // fallback to payload.body (current behavior)
}
```

### R3: Move Seeds to Phase 1
Seed data should be available during Phase 2-3 development. Move seed creation to Phase 1 alongside schema creation.

### R4: Add GraphQL Codegen Step
After all Pothos changes in Phase 2, add:
```bash
bun run generate:gqlSchema
bun codegen
```
as explicit steps.

### R5: Specify `payload.body` Fallback
Clearly document: when `EMAIL_TEMPLATES_ENABLED=false` OR `mapEventTypeToEmailScope()` returns null, use `payload.body ?? ""` as HTML (current behavior). This ensures zero regression during migration.

### R6: Transaction for Template Activation
```typescript
await db.transaction(async (tx) => {
  await tx.update(emailTemplates).set({ isActive: false }).where(and(eq(scope, s), eq(isActive, true)));
  await tx.update(emailTemplates).set({ isActive: true }).where(eq(id, newId));
});
```

### R7: Verify isomorphic-dompurify with Bun
Before committing to `isomorphic-dompurify`, run:
```bash
bun add isomorphic-dompurify
bun -e "import DOMPurify from 'isomorphic-dompurify'; console.log(DOMPurify.sanitize('<b>hello</b>'))"
```
If it fails, fall back to `dompurify` + `linkedom` or Bun's built-in APIs.

### R8: Clarify WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION
These 3 event types don't exist in `NotificationEventType`. Either:
- Add them to the enum in Phase 1 (requires updating `EVENT_CHANNEL_ALLOWLIST` too), or
- Remove them from `EmailScope` and the registry until a future phase adds them

### R9: Investigate COMPLAINT_RESPONSE Email Path
`COMPLAINT_RESPONSE` is not in `EVENT_CHANNEL_ALLOWLIST`. Check `notification-dispatch.helpers.ts` line 389: `return EVENT_CHANNEL_ALLOWLIST[eventType] ?? [...ALL_ENUM_CHANNELS]` — if not in allowlist, ALL channels are used (including email). This means complaints DO currently send emails, but through the fallback path. The design's mapping should account for this.

### R10: File Uploads — Use useRef
For image uploads in the editor, use `useRef` in the ViewModel hook to store `File` objects, not the Zustand store. This complies with AGENTS.md serialization rules.

---

## 15. Research File Assessment

The design references 13 research files under the email-templates research directory. Key findings:

### 15.1 Research File 06 (typed-registry-pattern.md)
- Correctly identifies TS #47109 correlated-union limitation
- Correctly identifies `satisfies` operator as workaround
- Correctly notes `isolatedDeclarations` is not enabled (verified — not in tsconfig)
- **STALE CLAIM:** None found — analysis is accurate

### 15.2 Research File 09 (i18n-react-email-interop.md)
- Correctly identifies `getServerTranslations` as single-arg, synchronous
- Correctly identifies that `emails.errors` sub-namespace must be created
- Correctly identifies `render()` as async
- **STALE CLAIM:** None found — analysis is accurate and matches codebase

### 15.3 Research File 11 (bun-compatibility.md)
- Correctly identifies nodemailer Bun compatibility issues (open Bun ticket #10329)
- Does NOT verify `isomorphic-dompurify` with Bun — **GAP**
- Correctly identifies `form-data` as needed for Mailgun.js

### 15.4 Research Files — General Assessment
The research files are well-researched and mostly accurate. The main gap is the `isomorphic-dompurify` + Bun compatibility check, which is critical for the render pipeline.

---

## 16. Summary of NEW Issues (Not in Prior Review)

| # | Issue | Severity | Prior Review Caught? |
|---|---|---|---|
| 1 | `COMPLAIT_RESPONSE_CREATED` — wrong enum member name (typo + suffix) | Critical | No |
| 2 | `STUDENT_REASSIGNED` — wrong enum member name (truncated) | Critical | No |
| 3 | `WELCOME`, `PASSWORD_RESET`, `EMAIL_VERIFICATION` — don't exist in enum | Critical | No |
| 4 | NotificationEventType count is 24, not 22 | High | No |
| 5 | 10 of 24 enum values missing from EVENT_TO_SCOPE explicit mapping | High | No |
| 6 | `resetEmailChannel` actual signature is `void`, not `Promise<void>` | Medium | No |
| 7 | `NotificationDeliveryStatus` has 5 values, design mentions 3 | Low | No |
| 8 | `@aws-sdk/client-sesv2` not installed (only `client-ses` is) | High | No |
| 9 | `isomorphic-dompurify` unverified under the Bun runtime | High | No |
| 10 | `web-streams-polyfill` has no config in next.config.ts | Medium | No |
| 11 | Existing email-templates.ts uses hardcoded colors (AGENTS.md violation) | Medium | No |
| 12 | `COMPLAINT_RESPONSE` not in `EVENT_CHANNEL_ALLOWLIST` — falls through to ALL channels | High | No |
| 13 | 5 email-enabled events missing from design's mapping (CLASS_MARKED_ABSENT, etc.) | High | No |
| 14 | No feature flag for dispatcher migration | Medium | No |
| 15 | Seeds should be Phase 1, not Phase 4 | Low | No |
| 16 | Missing `generate:gqlSchema` + `codegen` step | Medium | No |
| 17 | `getJSON()` is synchronous — design should use it for saves, `getEmail()` for renders | Low | No |
| 18 | File uploads should use useRef, not Zustand store | Low | No |
| 19 | `EmailTheming` is NOT built-in — must be passed as `extensions` prop | Medium | No |
| 20 | No transaction specified for template activation/deactivation | Medium | No |

---

## 17. Final Verdict

The design is **architecturally sound** but has **critical implementation-level errors** that must be fixed before coding begins. The most severe issues are:

1. **3 nonexistent enum values** in the dispatcher mapping — code won't compile
2. **10 missing enum mappings** — exhaustiveness claim is false
3. **`isomorphic-dompurify` + Bun compatibility** — unverified, could block the render pipeline

Fix these issues, add a feature flag for the dispatch migration, and the design is ready for implementation.

**Grade: C+ → B+ after fixing R1 (enum mapping) and R2 (feature flag)**
