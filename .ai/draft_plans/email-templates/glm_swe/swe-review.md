# Staff-Level Technical Review: Email Template System Design

**Document reviewed**: proposed design (616 lines)
**Research files**: 13 research files under the email-templates research directory
**Reviewer:** GLM (Staff SWE review)
**Date:** 2025-08-01

---

## 1. Executive Summary

This is an ambitious, well-researched design that tackles a genuinely hard problem: bringing compile-time type safety to a heterogeneous email-template registry while supporting multi-provider delivery, a visual TipTap editor, and i18n. The type-system research (TS#47109 correlated-union limitation) is correct and the >**corrected** mapped-type pattern is sound. However, the design has several critical gaps: no async render error handling, no idempotency or retry/queue, no bounce/complaint webhook handling, a two-arg `getServerTranslations` call that doesn't match the actual single-arg API, an undefined `mapEventTypeToEmailScope` function, and a risky "body-only edits preserve typed props via application-layer discipline" assumption that creates a silent type-safety hole. The phasing is reasonable but the "completed" status of steps 1-11 is premature — no end-to-end integration exists. Overall, this is a B+ design that needs targeted hardening before implementation proceeds past Phase 1.

---

## 2. Architecture Assessment

### Strengths

1. **Compile-time typed registry** (design lines 150-266): The corrected pattern using `EmailPropsByScope` + mapped type `EmailTemplateRegistry` + `defineEmailTemplate<P>` helper is the correct solution to TypeScript #47109. The research (file 06) correctly identifies why the naive `Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0]` pattern collapses to `never` for non-overlapping props. This is a rigorous, well-validated approach.

2. **Multi-provider abstraction** (design lines 274-351): The `IEmailChannel` interface already exists in the codebase (`backend/services/communication/channels/email/IEmailChannel.ts`) and the design extends it rather than re-inventing. The per-adapter research (file 04) correctly identifies provider-specific attachment encoding (Resend camelCase, Postmark base64-string-only, Mailgun top-level `inline`, SES v2 native attachments).

3. **Layer separation**: The design correctly follows the repo's existing pattern — services call repos, GraphQL calls services, types live in `backend/types/`. The `renderForSend` pipeline correctly lives in the service layer.

4. **i18n integration**: The design correctly identifies that `getServerTranslations(locale)` is synchronous (confirmed: `shared/locale/server-graphql.ts` line 3 — single-arg, returns synchronously). The existing `email-templates.ts` already uses this pattern successfully (lines 1, 32).

### Weaknesses

1. **Type-safety gap in body-only edits** (design line 377): The claim "body-only edits preserve typed props via application-layer discipline" is an architectural hole. If `designJson` (opaque TipTap JSONContent) is stored in the DB and the editor can modify it, there is no compile-time guarantee that the rendered HTML from edited `designJson` still works with the typed props contract. A malicious or careless admin could inject arbitrary HTML via TipTap's HTML import, bypassing the type system entirely. **This needs at minimum a server-side HTML sanitization step in the render pipeline, and ideally a schema validation pass on `designJson` at save time.**

2. **`getEmailChannel()` async migration is incomplete** (design line 296): The existing `getEmailChannel()` at `EmailChannelFactory.ts:67` is **already async** (`async (): Promise<IEmailChannel>`). The design claims it's making it async as a new change. However, the `emailChannel` facade object (lines 100-113) already wraps the async call. The real question the design doesn't address: does the new `createRegistry` pattern replace or coexist with this existing factory? The design should explicitly state the migration path.

3. **`mapEventTypeToEmailScope` is referenced but never defined**: The design references mapping `NotificationEventType` (which has 22 values — confirmed in `backend/enum/notifications/notificationDeliveries.enum.ts`) to `EmailScope` (design adds ~10 scopes). This mapping is not bijective (not all notification events produce emails, and some events may share a scope) and is not defined anywhere in the design or the codebase. **This is a blocking gap.**

4. **No render error handling**: The design's render pipeline (lines 554-575) shows `await render(...)` → `await pretty(...)` → `toPlainText(...)` with no try/catch. If a React Email component throws (e.g., a prop is `undefined` due to a missing entity field), the entire send pipeline crashes with no fallback. **At minimum, the render pipeline needs a try/catch that falls back to a plain-text error notification or a default template.**

---

## 3. Type-System Deep Dive

### The Registry Pattern (design lines 150-266)

The corrected pattern is sound. Research file 06 (390 lines) thoroughly validates it against tsgo 7.0.2 with TS 6.0/5.9 parity. The key insight — that `EmailPropsByScope` must be a separate base map, then re-bound through a mapped type — correctly circumvents the TS#47109 correlated-union limitation.

**Specific assessment:**

```typescript
// The corrected pattern (from research file 06, validated):
interface EmailPropsByScope {
  "complaint-response": ComplaintResponseEmailProps;
  "suggestion-acknowledged": SuggestionAcknowledgedEmailProps;
  // ...
}

type EmailTemplateRegistry = {
  [S in EmailScope]: EmailTemplateDefinition<EmailPropsByScope[S]>;
};

function defineEmailTemplate<P extends EmailPropsByScope[S], S extends EmailScope>(
  scope: S,
  def: EmailTemplateDefinition<P>
): EmailTemplateDefinition<P> {
  return def;
}
```

**Verdict:** Correct. The `as const satisfies EmailTemplateRegistry` ordering (as const first, satisfies second) is also correctly documented in research file 06.

### Exhaustiveness of `EmailPropsByScope`

**Risk:** If someone adds an `EmailScope` enum value but forgets the corresponding `EmailPropsByScope` entry, TypeScript will error at the `EmailTemplateRegistry` mapped type because `EmailPropsByScope[S]` will be `unknown` for the missing key. **This is actually good — the mapped type acts as an exhaustiveness check.** However, the design should add an explicit `// @ts-expect-error` check that verifies this compile-time guard (it mentions one at line ~260 but doesn't show the code).

**Runtime safety for unknown scope:** The `@ts-expect-error` compile-time guard catches missing entries at build time, but what happens at runtime if a scope string comes from the DB and doesn't match any registry entry? The design doesn't address this. **Recommendation: add a runtime `getDefaultTemplate(scope)` fallback or a `throw new Error(\`Unknown email scope: ${scope}\`)` in the render pipeline.**

### The "body-only edits" type-safety gap (design line 377)

> "All components import translations via `getServerTranslations` and use `Email/designJson` ONLY for body overrides (props enforce type safety cross all variants)"

This is the design's most significant type-system weakness. The claim is that because React Email components receive typed props (from the registry), and `designJson` is only used for body HTML, type safety is preserved. But:

1. **`designJson` is opaque TipTap JSONContent** — it's not type-checked against the component's prop shape.
2. **Editor edits can produce arbitrary HTML** — TipTap's HTML import/export can produce any valid HTML structure, including `<script>` tags, `<iframe>` embeds, or broken layouts that don't match the component's intended structure.
3. **The render pipeline renders the component, not the designJson** — but the design says designJson is used "for body overrides." If the body override is an arbitrary HTML string injected into the component, there's a **server-side template injection (SSTI) risk** if the HTML is not sanitized.
4. **The `compiledHtml` column** stores pre-rendered HTML — if this is served to users without CSP headers or sanitization, it's an XSS vector.

**Mitigation:** The render pipeline must sanitize `compiledHtml` / body-override HTML with DOMPurify (server-side) before storing or sending. The design does not mention sanitization anywhere. **This is a P0 security gap.**

---

## 4. Provider/Adapter Analysis

### `createRegistry` (design lines 274-296, ~30 LOC)

The `createRegistry` pattern lifted from makerkit (research file 05) provides:
- Async `get()` (returns `Promise<T>`)
- Chainable `register()`
- Throws `Unknown provider "<name>"` on unregistered names

>**Assessment:** Mildly over-engineered for 4-5 adapters, but acceptable. A simple `Record<EmailProvider, () => Promise<IEmailChannel>>` factory map would be ~10 LOC and equally functional. The async `get()` is the main value-add (supports lazy initialization). However:
>
> - **No disposal/cleanup semantics**: `createRegistry` has no `dispose()` or `cleanup()` method. The existing `resetEmailChannel()` at `EmailChannelFactory.ts:87` calls `instance.disconnect()`. The design doesn't mention how adapter cleanup works in the new registry.
> - **No connection pooling**: For SES/SMTP this matters. The design doesn't address it.
> - **Breaking change**: `createRegistry` throws on unknown providers, but the current `createEmailChannel()` (line 60) falls back to Resend with a warning. This is a behavioral change that could break production if a provider config is missing.

**Recommendation:** Either keep the existing `EmailChannelFactory` pattern (which already has async init, caching, reset) and extend it with the new providers, or explicitly document the migration path including the fallback-to-Resend behavioral change.

### Per-Adapter Attachment Correctness

Research file 04 validates each adapter's attachment strategy. Key findings:

| Provider | Design Claim | Verdict | Risk |
|----------|-----------|---------|------|
| **Resend** | camelCase fields, `contentId` for inline | ✅ Correct | None |
| **SES** | v2 `SendEmailCommand` for attachments | ✅ Sound — v2 supports 40MB native attachments, v1 needs raw MIME | MIME path not needed if staying on v2 |
| **Postmark** | base64-string only | ✅ Correct — `Content` field is base64-string, `ContentID` needs `cid:` prefix | None |
| **Mailgun** | top-level `inline` field, Content-ID from filename | ✅ Correct | None |
| **SMTP/nodemailer** | Bun flakiness (#10329) | ⚠️ **Production risk** — nodemailer on Bun has historical issues | Prefer API providers in production; SMTP for dev only |

>**`EmailAttachment.content` type:** Research file 04 recommends restricting to `Buffer` only (not `Buffer | string`) to avoid ambiguity. The design should adopt this — adapters can base64-encode internally. **The design doesn't specify this — minor gap.**

### `getEmailChannel()` Async Call Sites (design line 296)

The design says "getEmailChannel() is now async." But the existing code (`EmailChannelFactory.ts:67`) **already** has `getEmailChannel` as async. The `emailChannel` facade (lines 100-113) already wraps it. The call sites in `communication.service.ts:37` already use `await emailChannel.send(...)`.

**Verdict:** This is not a new change — it's already async. The design should acknowledge this rather than presenting it as new work. The real migration work is: if the `createRegistry` replaces `EmailChannelFactory`, all existing import sites (`index.ts`, `communication.service.ts`) need updating.

---

## 5. Database Schema Review

### `emailTemplates` table (design lines 353-419)

**Storing `designJson` + `compiledHtml` in the same table:**

- **Pro:** Simple, no joins needed for preview.
- **Con:** Cache invalidation — when `designJson` is edited, `compiledHtml` must be re-compiled. If the save flow doesn't atomically update both, you get stale HTML.
- **Recommendation:** Either (a) make the save handler re-compile `compiledHtml` in the same transaction, or (b) drop `compiledHtml` from the table and compute it on-the-fly at render time. Option (b) is simpler and avoids staleness entirely. The design doesn't explain why `compiledHtml` is persisted — **the rationale should be documented (performance? preview? offline fallback?**).

### Partial unique index (design lines ~385)

```typescript
// Design's approach:
sql`${table.isActive} = true`
```

Research file 07 (line ~140) confirms this is correct for Drizzle 1.0.0-rc.4 — partial unique indexes via raw `sql` literal are the right approach. A triple-column unique on `(scope, locale, isActive)` would false-block when multiple inactive rows exist.

**Verdict:** ✅ Correct. The partial unique index on `(scope, locale) WHERE isActive = true` is the right pattern.

### Versioning model (design lines ~400-410)

- `parentTemplateId` for locale variants: Sound — this is a simple parent-child locale linking pattern.
- `emailTemplateRevisions` table: Sound for audit trail, but the design doesn't detail:
  - **Concurrent edits:** No optimistic locking (version counter or `updated_at` comparison). Two admins editing the same template simultaneously would produce a last-write-wins condition. **Recommendation: add a `version` integer column with optimistic locking check on update.**
  - **Revision creation trigger:** When is a revision row created? On every save? On publish? On delete? The design doesn't specify.
  - **Revision cleanup:** Revisions accumulate forever. No retention policy or cleanup strategy.

### `allowedEditorGroups` as JSONB (design line ~395)

Research file 07 (lines ~100-130) recommends JSONB `$type<readonly EmailEditorPermission[]>()` over `pgEnum.array()`. The repo has zero existing `.array()` columns, so JSONB is the safer, consistent choice.

**Verdict:** ✅ Correct. JSONB is safer for a first-time array-of-enum use in this repo. Using `pgEnum.array()` introduces a new pattern without existing validation.

---

## 6. GraphQL Surface Review

### Authorization model (design lines 464-479)

Two-layer auth:
1. **GraphQL field-level:** `authScopes: { superAdmin: true }` — only super admins can access the template management API.
2. **Service-layer:** `template.allowedEditorGroups` check — restricts which editor permission groups can edit specific templates.

>**Assessment:** Sound but incomplete.
>
> - **Impersonation guards:** The design doesn't mention what happens when a super admin is impersonating another user. The repo has impersonation support (per the i18n labels). If the `authScopes: { superAdmin: true }` check doesn't account for impersonation, an impersonated session might gain or lose template management access unexpectedly. **Recommendation: verify the `superAdmin` auth scope already handles impersonation, or document why it's not needed.**
> - **`sendTestEmail` mutation:** Correct — it's a side-effect (sends an email), so it should be a mutation, not a query. ✅
> - **No rate limiting on `sendTestEmail`:** An admin could spam `sendTestEmail` and trigger dozens of provider API calls. **Recommendation: add a simple per-user rate limiter (e.g., 5 test emails per minute).**

### Preview query returning HTML for iframe (design line ~470)

The design mentions returning rendered HTML for an iframe preview. XSS implications:

- **`<iframe sandbox>` is NOT sufficient alone.** A sandboxed iframe with `allow-scripts` still allows script execution. Without `allow-scripts`, the preview can't render interactive email content. The design should specify: `<iframe sandbox="allow-same-origin"` (no `allow-scripts`) or render to a static image/screenshot.
- **Server-side sanitization:** Even in a sandboxed iframe, CSS injection is possible. The rendered HTML should be sanitized with DOMPurify before being served to the preview iframe.
- **CSP headers:** The preview route should set `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'` to prevent script execution.

**Verdict:** The preview security model is under-specified. **Recommendation: add a dedicated section on preview XSS hardening.**

---

## 7. Frontend Integration Review

### Editor mounting (design lines 481-529)

- **`next/dynamic` + `ssr: false`:** ✅ Correct — TipTap touches `window` at module load, so SSR must be disabled.
- **`ScopedCssBaseline` (not global `CssBaseline`):** ✅ Correct — global CssBaseline would break TipTap's prose styling.
- **CSS ordering claim (import editor CSS AFTER MUI):** Research file 10 confirms this. ✅ Sound. TipTap's prose styles need to override MUI's CSS reset, so they must load later.
- **Prism.js grammars causing Turbopack dev-compile slowdown:** ⚠️ Known issue (research file 10). Not a blocker but will slow dev iteration. **Recommendation: lazy-load Prism grammars only in the editor route, not globally.**
- **`@react-email/editor@^1.1` (not `^1.6`):** ✅ Correct — research file 10 confirms version 1.6 doesn't exist; latest is 1.1.2. The design correctly specifies `^1.1`.

### Tier-neutral ViewModel + switcher + Container pattern

The design describes a tier-neutral ViewModel with a switcher and Container pattern. This follows the repo's existing `frontend/views/` architecture.

>**Assessment:** Sound, but the design doesn't detail:
> - **Dirty state tracking:** No mention of unsaved-changes detection. An admin who navigates away from the editor with unsaved changes loses their work. **Recommendation: add a `isDirty` flag to the Zustand store and a `beforeunload` handler + route-change prompt.**
> - **Auto-save:** No mention. Optional but valuable for a rich text editor.

### Zustand store serialization rule (design line ~520)

The design specifies a serialization rule for the Zustand store. This is reasonable but the design doesn't show the actual store interface. Key questions:
- Is `designJson` stored in the Zustand store? (Should be — it's editor state.)
- Is the store persisted to localStorage? (Shouldn't be — designJson can be large.)
- What happens on store deserialization failure? (Should fall back to the DB-fetched template.)

### `EmailEditorRef` async save flow (design line ~525)

The design describes `getJSON()` / `getEmail()` on save via an async flow:

```typescript
const json = await editorRef.current?.getJSON();
const html = await editorRef.current?.getEmail();
```

>**Assessment:** Correct pattern. `@react-email/editor`'s `getEmail()` returns a Promise. The async save flow (get JSON → get HTML → save to DB) is correct. However:
> - **Error handling:** What if `getEmail()` throws? The design doesn't show a try/catch around the save flow.
> - **Partial save:** What if the JSON saves but the HTML save fails? The design should use a single GraphQL mutation that accepts both `designJson` and `compiledHtml` atomically.

---

## 8. Render Pipeline Review

### Async render (design lines 554-575)

```typescript
import { render } from "react-email";
import { pretty } from "react-email/dist/pretty";

const html = await pretty(await render(EmailComponent, props));
const text = toPlainText(html);
```

Research file 03 confirms:
- `render` is async, returns `Promise<string>` ✅
- `pretty` is async, wraps prettier for whitespace formatting ✅
- `toPlainText` is sync, takes rendered HTML string ✅

>**Assessment:** The API usage is correct. However:
>
> - **`pretty` necessity:** `pretty` just formats whitespace (indentation, line breaks) via prettier. It adds ~300ms to render and bundles prettier. **For production email sends, `pretty` is unnecessary — email clients don't care about whitespace.** It's useful for debugging/preview but should be skipped in the send pipeline. The design doesn't distinguish debug vs. production render paths.
> - **Client-side preview needs `web-streams-polyfill`** for Safari/iOS (research file 03, line ~80). The design doesn't mention this polyfill. **If the admin preview runs `render()` client-side on Safari, it will fail without the polyfill.**
> - **`renderAsync` was removed:** The design correctly uses `render` (not `renderAsync`). ✅
> - **Error handling:** No try/catch around the render pipeline. **If the React Email component throws (undefined prop, missing translation key), the entire send crashes.** This is a P1 gap.

### Render pipeline error handling (missing)

```typescript
// Recommended pattern:
try {
  const html = await render(EmailComponent, props);
  const text = toPlainText(html);
  return { html, text };
} catch (error) {
  logger.error("Email render failed", { scope, error });
  // Fallback: send a plain-text notification
  const fallbackText = `An email for "${scope}" failed to render. Please contact support.`;
  return { html: `<p>${fallbackText}</p>`, text: fallbackText };
}
```

---

## 9. i18n Integration Review

### `getServerTranslations` signature (design line 325, 366)

The design (line 325) shows:
```typescript
getServerTranslations(locale, "emails.errors")
```

But the actual API (confirmed in `shared/locale/server-graphql.ts:3`) is:
```typescript
function getServerTranslations(locale: string): ReturnType<typeof getTranslations>
```

**Single-arg, synchronous.** There is no second namespace parameter. The correct usage is:
```typescript
const t = getServerTranslations(locale);
const error = t.emailsTranslations.errors.someError;
```

**This is a factual error in the design.** The two-arg form will not compile. Research file 09 (line 20) explicitly flags this: "the only mandatory design edit is introducing the `emails.errors` sub-namespace — it does not exist today."

### `emails.errors` sub-namespace (design line 366)

The design correctly identifies that the `errors` sub-namespace under `emailsTranslations` needs to be created. It doesn't exist today. This requires:
1. Adding `errors` to the `EmailsLabels` type interface in `shared/locale/types/`
2. Implementing in `shared/locale/en/emails/` and `shared/locale/ar/emails/`
3. This is additional work not fully scoped in the design's steps.

### React Email components using `getServerTranslations` (design line 377)

The design says React Email components import translations via `getServerTranslations`. These components run server-side (during `render()`), so the synchronous server-side i18n call is safe. ✅

However, the existing `email-templates.ts` (line 32) already uses this pattern:
```typescript
const t = getServerTranslations(locale ?? "en").emailsTranslations.complaintResponse;
```

This confirms the pattern works. The design's approach is consistent with existing code. ✅

---

## 10. Missing Pieces & Gaps

### P0 — Must address before production:

1. **HTML sanitization** — No DOMPurify or equivalent mentioned anywhere. `designJson` can produce arbitrary HTML, and `compiledHtml` is stored/ sent without sanitization. **This is a direct XSS/SSTI vector.**

2. **Render pipeline error handling** — No try/catch. A thrown component crashes the send.

3. **`mapEventTypeToEmailScope` undefined** — Referenced in the design but never defined. The mapping from 22 `NotificationEventType` values to ~10 `EmailScope` values is not shown. This function is the linchpin connecting the notification system to the email template system. **Without it, the dispatcher can't select the correct template.**

4. **i18n signature error** — `getServerTranslations(locale, "emails.errors")` won't compile. Must be `getServerTranslations(locale).emailsTranslations.errors.*`.

### P1 — Should address before Phase 3:

5. **Rate limiting / retry / queue** — No queue, no retry strategy, no rate limiting. A burst of notification events would directly hit the provider API with no backpressure. SES has rate limits; Resend has rate limits. **Recommendation: use the existing notification dispatch pipeline (which already has `dispatchMulti`) and add a simple in-memory or Redis-backed queue.**

6. **Bounce/complaint webhook handling** — Postmark, SES, and Resend all support bounce/complaint webhooks. The design doesn't mention handling these. Without bounce handling, the `NotificationDeliveryStatus` enum (which has `DELIVERED`, `OPENED`, `FAILED` values — confirmed in `backend/enum/notifications/notificationDeliveries.enum.ts`) will never transition past `SENT`. The infrastructure for delivery status tracking already exists but is unused.

7. **Idempotency** — If the same email scope + entity ID is triggered twice (e.g., a class-reminder event fires twice due to a retry), two emails are sent. The design doesn't mention idempotency keys or deduplication. **Recommendation: add an `idempotencyKey` (scope + entityId + notificationEventId hash) to the send pipeline.**

8. **Dirty state / unsaved changes** — No `isDirty` tracking in the Zustand store. Admins will lose work on navigation.

9. **Concurrent edit conflict resolution** — No optimistic locking. Last-write-wins on concurrent edits.

### P2 — Nice to have:

10. **SPF/DKIM/DMARC setup** — Not the design's job but should be documented as a prerequisite. Templates won't render correctly in email clients if the domain isn't authenticated.

11. **Post-send tracking** — Open/click tracking via provider webhooks. The `NotificationDeliveryStatus` enum already has `OPENED` but nothing updates it.

12. **Cross-service entity data** — A template like "class-reminder" needs class + student + teacher data. The design doesn't detail how multi-entity props are assembled. The `renderForSend` pipeline needs to accept an `entityId` and fetch all related entities. The design mentions this conceptually (lines ~430-450) but doesn't show the implementation.

13. **Bundle size impact** — TipTap + Prism.js in the admin route will add significant JS. No bundle analysis mentioned. **Recommendation: verify the editor route is code-split and doesn't bloat the main bundle.**

14. **Phase 4 auth/account emails** — The design says these are "missing today" but doesn't detail them. Password-reset, email-verification, welcome emails — are they implemented outside this system? If not, they should be scoped in a Phase 4 step.

15. **`NotificationEventType → EmailScope` mapping** — Not bijective. Not all 22 event types produce emails (SMS/PUSH exist). Some events may share a scope. The mapping should be a function, not a 1:1 enum link. Where this function lives (service layer? shared?) is unspecified.

---

## 11. Sequencing & Dependency Analysis

### Phase breakdown (design lines 611-616)

- **Phase 1:** Types + enum + registry + adapters (no UI, no DB) — steps 1-8
- **Phase 2:** DB schema + repo + Pothos + GraphQL CRUD + admin views — steps 9-16
- **Phase 3:** Migrate dispatcher through renderForSend — steps 17-19
- **Phase 4:** Auth/account emails — steps 20-21

>**Assessment:** Sequencing is sound in principle (types first, DB second, integration third, new emails fourth), but:

1. **Steps 1-11 "completed" is premature.** The design marks 11 steps as "completed" but no end-to-end integration exists. "Completed" likely means "researched and code drafted" not "verified." The design should clarify what "completed" means — is the code committed? Does it pass tsgo/lint?

2. **Hidden dependencies between pending steps:**
   - Step 12 (DB schema) depends on Step 1 (EmailScope enum) — explicitly listed.
   - Step 13 (repo) depends on Step 12 — explicitly listed.
   - **Step 17 (migrate dispatcher) depends on `mapEventTypeToEmailScope` which is not a step.** This is a hidden dependency. The mapping function must be defined before the dispatcher migration can proceed.
   - **Step 15 (admin editor views) depends on `compiledHtml` sanitization which is not scoped.** If sanitization is needed, it should be a step in Phase 2.
   - **Step 16 (render pipeline) depends on `getServerTranslations` signature being correct.** The i18n signature error should be fixed before any render code is written.

3. **Phase 3 can't proceed without `mapEventTypeToEmailScope`.** This is a blocking gap that should be a Phase 1 or early Phase 2 step.

4. **No integration coverage phase.** The design mentions a verification strategy (design lines 596-606) but doesn't include an end-to-end integration check as a step. The strategy lists unit-level, repository-level, and GraphQL-level checks, but no full pipeline check (trigger event → render → send → verify). **Recommendation: add a Phase 3.5 step for end-to-end integration coverage.**

---

## 12. Risk Register

### Top 5 Risks (ranked by severity × likelihood)

| Rank | Risk | Severity | Likelihood | Risk Score |
|------|------|----------|------------|------------|
| 1 | **XSS via unsanitized `compiledHtml` / `designJson` body overrides** | Critical | High | **9** |
| 2 | **`mapEventTypeToEmailScope` not defined — dispatcher can't select templates** | High | Certain | **9** |
| 3 | **Render pipeline crashes on component throw — no fallback** | High | Medium | **6** |
| 4 | **`getServerTranslations` two-arg call won't compile** | Medium | Certain | **6** |
| 5 | **Nodemailer/SMTP on Bun — production flakiness** | Medium | Medium | **4** |

### Risk 1: XSS via unsanitized HTML

**Description:** The design stores `compiledHtml` (pre-rendered HTML from TipTap `designJson`) and sends it to users. TipTap can produce arbitrary HTML including `<script>` tags, `<iframe>` embeds, and CSS injection vectors. No DOMPurify or equivalent sanitization is mentioned.

**Mitigation:**
1. Add DOMPurify (server-side, via `isomorphic-dompurify`) to the render pipeline: `const safeHtml = DOMPurify.sanitize(html, { ALLOWED_TAGS: [...], ALLOWED_ATTR: [...] })`.
2. Sanitize at save time (before storing `compiledHtml`) and at send time (defense in depth).
3. Set CSP headers on preview iframe: `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src * data:`.
4. Add a schema validation pass on `designJson` at save time — reject nodes with disallowed types.

### Risk 2: `mapEventTypeToEmailScope` not defined

**Description:** The design references mapping `NotificationEventType` (22 values) to `EmailScope` (~10 values) but never defines the function. Without it, the dispatcher migration (Phase 3) cannot proceed.

**Mitigation:**
1. Add a new step in Phase 1 or early Phase 2: "Define `mapEventTypeToEmailScope` function in `backend/services/communication/`."
2. The function should be a simple switch or record map: `Record<NotificationEventType, EmailScope | null>` (null = no email for this event).
3. Add a compile-time exhaustiveness check: if a new `NotificationEventType` is added without a mapping entry, TypeScript should error.
4. Add a check that verifies every `NotificationEventType` has a mapping (even if `null`).

### Risk 3: Render pipeline crashes on component throw

**Description:** `await render(EmailComponent, props)` has no try/catch. If a prop is `undefined` (missing entity field), a translation key is missing, or the component has a runtime error, the send pipeline crashes with no fallback.

**Mitigation:**
```typescript
async function safeRender(scope: EmailScope, props: unknown): Promise<{ html: string; text: string }> {
  try {
    const template = EMAIL_TEMPLATES[scope];
    if (!template) throw new Error(`Unknown email scope: ${scope}`);
    const html = await render(template.component, props as any);
    return { html, text: toPlainText(html) };
  } catch (error) {
    logger.error("Email render failed", { scope, error });
    const t = getServerTranslations(locale).emailsTranslations.errors;
    const fallbackText = t.renderFailed({ scope });
    return { html: `<p>${escapeHtml(fallbackText)}</p>`, text: fallbackText };
  }
}
```

### Risk 4: `getServerTranslations` signature error

**Description:** Design line 325 shows `getServerTranslations(locale, "emails.errors")` but the actual API is single-arg: `getServerTranslations(locale).emailsTranslations.errors.*`. This will cause compile errors in every service that uses the design's pattern.

**Mitigation:** Fix all references in the design to use the correct single-arg pattern. Add the `emails.errors` sub-namespace to the type schema and locale implementations as a Phase 1 step (since service code depends on it).

### Risk 5: Nodemailer/SMTP on Bun — production flakiness

**Description:** Research file 04 and 11 flag Bun compatibility issues with nodemailer (#10329). SMTP adapter is proposed for dev but if deployed to production, it could be unreliable.

**Mitigation:** Clearly document in the adapter's JSDoc and in deployment docs: "SMTP adapter is for development only. Use Resend/SES/Postmark for production." Add a runtime warning if SMTP is selected in a production environment (`process.env.NODE_ENV === 'production'`).

---

## 13. Concrete Improvement Recommendations

### Immediate (before any implementation):

1. **Fix the i18n signature** (design line 325): Change `getServerTranslations(locale, "emails.errors")` to `getServerTranslations(locale).emailsTranslations.errors.*` throughout the design.

2. **Add `mapEventTypeToEmailScope` as a Phase 1 step:** Define the function, its location (`backend/services/communication/templates/event-to-scope.ts`), its signature (`(eventType: NotificationEventType) => EmailScope | null`), and an exhaustiveness check.

3. **Add HTML sanitization as a P0 requirement:** Add a step for DOMPurify integration in the render pipeline. Specify `isomorphic-dompurify` and allowed-tag configuration.

4. **Add render error handling as a P1 requirement:** Add a `safeRender()` wrapper with try/catch and fallback text.

5. **Clarify "completed" status:** Document whether steps 1-11 are committed, verified, or just drafted. If just drafted, change status to "drafted."

### Before Phase 2:

6. **Add optimistic locking:** Add a `version` integer column to `emailTemplates` with a `WHERE version = $1` check on update. This is ~5 LOC and prevents last-write-wins on concurrent edits.

7. **Document `compiledHtml` rationale:** Explain why `compiledHtml` is persisted (performance? offline fallback?). If it's just for preview, consider computing it on-the-fly to avoid staleness.

8. **Specify preview XSS hardening:** Document the iframe sandbox attributes (`sandbox="allow-same-origin"` without `allow-scripts`), CSP headers, and server-side sanitization for the preview route.

### Before Phase 3:

9. **Add idempotency:** Add an `idempotencyKey` to the send pipeline (hash of `scope + entityId + eventType`). Check for existing delivery rows with the same key before sending.

10. **Add rate limiting on `sendTestEmail`:** Simple per-user rate limiter (5 test emails/minute) in the GraphQL resolver or service layer.

11. **Add dirty state tracking:** `isDirty` flag in Zustand store + `beforeunload` handler + route-change prompt in the editor container.

12. **Add `web-streams-polyfill` for client-side preview:** If the admin preview renders client-side on Safari/iOS, this polyfill is required.

### Before Phase 4:

13. **Add bounce/complaint webhook endpoints:** New API routes for each provider's webhook. Update `NotificationDeliveryStatus` based on webhook events.

14. **Add end-to-end integration coverage:** Trigger a notification event → render template → send via mock adapter → verify delivery row. This validates the full pipeline.

15. **Bundle size analysis:** Verify the editor route is code-split and TipTap/Prism.js don't bloat the main bundle. Use `@next/bundle-analyzer` if available.

### Architectural improvements:

16. **Drop `pretty` from the send pipeline:** `pretty` (prettier formatting) adds ~300ms and bundles prettier. Use it only for debug/preview, not for production sends. Email clients don't care about whitespace.

17. **Consider `unemail@0.4.1` as an alternative to the custom adapter stack:** Research file 05 mentions `unemail` as a multi-provider email library. If it supports the 4 providers needed, it could save ~800 LOC of adapter code. Worth a spike.

18. **Explicitly document the `createRegistry` vs `EmailChannelFactory` migration path:** The existing factory has async init, caching, and reset semantics. The design should state whether `createRegistry` replaces it or coexists.

19. **Restrict `EmailAttachment.content` to `Buffer` only:** Per research file 04, this avoids ambiguity. Adapters base64-encode internally.

20. **Add a runtime template-scope guard:** In the render pipeline, add `if (!EMAIL_TEMPLATES[scope]) throw new Error(...)` as a runtime safety net for unknown scopes from the DB.

---

*End of review.*
