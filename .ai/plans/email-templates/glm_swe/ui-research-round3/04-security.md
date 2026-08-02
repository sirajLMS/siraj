
I have enough. Let me compile the final security audit report.

# Email Template System (v7) — Security Audit Report

**Plan audited:** `.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md`
**Date:** 2026-08-02
**Scope:** CSP, XSS, authN/authZ edge cases, input validation, sanitization, email-specific security

---

## Summary Table

| # | Sev | Area | Gap |
|---|-----|------|-----|
| G1 | P0 | Secret mgmt | `EMAIL_TEMPLATES_ENABLED` env flag **NOT registered** in `backend/lib/env-config-keys.ts` — plan-todo (V4-9) is unexecuted; flag defaults to truthy-string bug from V5-2 |
| G2 | P0 | Input validation | `sampleProps` for send-test validated only client-side (`JSON.parse`); no server-side schema validation. Bypassable via direct GraphQL mutation |
| G3 | P0 | Input validation | Send-test recipient `to` validated only client-side `z.string().email()`; no server-side Email scalar on the mutation input |
| G4 | P0 | Authorization / IDOR | `previewEmailTemplate(templateId, sampleProps)` exposed as a query — no group-check specified; query is read-only so Pothos `superAdmin` field authScope gates it, but plan doesn't confirm authScope is applied to the preview query (line 774 just lists the file) |
| G5 | P1 | CSP | Plan sets `default-src 'none'` + `style-src 'unsafe-inline'` but **omits `script-src 'none'` explicitly** and **omits `frame-ancestors 'none'`**; `unsafe-inline` on style-src is a XSS vector for CSS-based data exfiltration |
| G6 | P1 | CSP | CSP is specified as a header on "the preview route" but the preview is a **GraphQL query returning a string**, not an HTML route — CSP on `/api/graphql` would break the whole endpoint; CSP only works if preview is served via a dedicated `text/html` route. Plan conflates the two |
| G7 | P1 | XSS | `isomorphic-dompurify` runs at render time only; **no client-side DOMPurify** for the preview iframe. iframe `sandbox=''` mitigates script execution but `style-src 'unsafe-inline'` allows CSS-injection exfil even without JS |
| G8 | P1 | XSS | DOMPurify `ALLOWED_ATTR` omits `encoding`, potentially allows mojibake, and **includes no `data:` URL control over `src`** — `img-src 'self' data:` allows `data:text/html` if browsers mis-render; should add `FORBID_TAGS: ['style']` and keep `style` attr off `src` |
| G9 | P1 | Auth edge case | `notImpersonating: true` correctly enforced (verified at `gqlSchemaBuilder.ts:108`), but plan never locks the **preview query** to `notImpersonating` — only mutations. An impersonating super-admin can preview templates (lower risk, but inconsistent) |
| G10 | P1 | Authorization | `allowedEditorGroups` check is in service layer (Pattern A, line 778) but **no check on the `updateEmailTemplate` mutation input itself** — a super-admin could pass a new `allowedEditorGroups` value escalating who can edit. No "cannot add a group higher than your own" rule |
| G11 | P1 | Email-specific | Subject line merge-tag interpolation: plan has no anti-**header-injection** spec for raw SMTP providers (nodemailer). Resend is JSON-safe today, but the multi-provider registry (todo 3) adds SES/Postmark/Mailgun/SMTP without a CRLF-stripping pass on `subject`/`to`/`defaultFromEmail` |
| G12 | P1 | SSRF | React Email `<Img>` renders server-side; plan V5-3 blocks remote images in preview CSP but **does not address SSRF at send time** — a malicious `designJson` `<img src="http://[IP_REDACTED]/...">` forces the server/recipient to hit internal IPs (cloud metadata) |
| G13 | P1 | Rate limiting | Send-test "5/min" is per-user, but implementation reuses `RateLimiter` (`backend/lib/ratelimit.ts`) whose `.limit()` uses `cacheService.pipeline` — **not atomic** (zadd count race). `limitSimple` is serial but still non-atomic. Concurrent sends can exceed 5. Plan doesn't specify atomic token-bucket |
| G14 | P1 | Rate limiting | **No rate limit on preview queries** — `previewEmailTemplate` is a query (POST GraphQL), so it's covered by the global `graphqlRateLimiter` (100/min/IP) but has **no per-call cost limit**; a crafted `sampleProps` could DoS React Email render server-side |
| G15 | P2 | GraphQL | **No query complexity analysis** — `depthLimit(7)` exists (`route.ts:46`) but no `costAnalysis` / query-complexity rule. Deep-but-wide nested email-template lists could be expensive |
| G16 | P2 | GraphQL | **No batch-attack prevention** — Apollo processes single ops, but `rdflib`/array batching isn't explicitly disabled; send-test could be parallelized across N queries in one request |
| G17 | P2 | Data sanitization | `safeRender` logs `{ scope, error }` (`safeRender` block lines 1297-1298) — error could include PII from merge-tag values. No `designJson` truncation in logs specified; no email-redaction rule in `BaseLogger` audit |
| G18 | P2 | Input validation | `subject` template (merge-tag field) has **no maxlength/no forbidden-merge-tag** rule — a malicious merge-tag `{internalSecret}` interpolated into subject could leak via email subject lines |
| G19 | P2 | Input validation | `attachmentRules` (jsonb, line 462) has **no schema/allowlist** — file-type validation (`allowedMimeTypes`, `maxSize`) is unspecified. Attachments from `sampleProps` for send-test are unvalidated |
| P20 | P2 | Secret mgmt | Provider API keys (Resend) confirmed env-stored (`env.ts:334`, `ResendEmailAdapter.ts:65`) — good. But **no rotation strategy** in plan; no `verifyProvider` health check; no audit of `logger.error(error.message)` paths that could log the key on auth failure |
| G21 | P2 | DOMPurify layering | `isomorphic-dompurify` runs both at save-compile AND send (plan line 1288) — correct. But `compiledHtml` cached in DB post-sanitize means a future DOMPurify config change (new CVE) does **not** re-sanitize cached rows until re-save. No "re-sanitize on read" pass |
| G22 | P3 | CSP `style-src 'unsafe-inline'` | Required by React Email inline styles, but enables CSS `@import`/`url()` data exfil. Acceptable trade-off if `script-src 'none'` is explicit and iframe is sandboxed |
| G23 | P3 | Auth edge case | Feature-flag (`EMAIL_TEMPLATES_ENABLED`) itself is **not auth-checked** — if consumed via `getBooleanEnv` (env.ts:71) it's server-only and not exposed to clients, but plan never confirms the flag isn't surfaced via `environment-config.pothos.ts` to unauthorized users |

---

## Detailed Findings Per Area

### 1. Content Security Policy (CSP) — G5, G6, G22

**Codebase fact:** `next.config.ts:73-93` sets existing security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS) via the `headers()` config for `source: "/(.*)"`. There is **no `Content-Security-Policy` header** project-wide and **no middleware.ts** (Glob confirmed none). CSP must be added either in `next.config.ts` headers at per-route source OR a dedicated preview HTML route.

**Plan problems:**
- (a) The plan says "preview route must set CSP headers" but `previewEmailTemplate` is a **GraphQL query returning a string** (`emailTemplatePreview.query.ts`, line 774). CSP applies to HTML responses, not JSON GraphQL payloads. Either (i) the preview client injects the CSP via a `meta` tag inside the iframe's `srcdoc`, or (ii) a dedicated `/api/email-preview/[id]` HTML route is required. Plan does neither — **G6 (P1)**.
- (b) `style-src 'unsafe-inline'` does create a vector: CSS exfiltration via `@import url('https://...')` or `background:url('data:...')` even without script. Inside `sandbox=''` + `default-src 'none'`, the `@import` fetch would be **blocked** by `default-src 'none'` unless `style-src` allows remote. So the actual risk is low IF `default-src 'none'` correctly cascades to `font-src`/`connect-src`/`frame-src` — **but the plan doesn't specify `frame-ancestors 'none'`**, leaving the iframe embeddable by any parent that can set `srcdoc`. **G5 (P1)**.
- (c) `script-src 'none'` — **not explicit in the plan**. With `default-src 'none'`, `script-src` falls back to `'none'`, BUT explicit `script-src 'none'` is defense-in-depth against future config drift. Recommend adding it. **G5 (P1)**.
- (d) `frame-ancestors 'none'` — **omitted**. `X-Frame-Options: DENY` exists globally (`next.config.ts:78`), but inside the preview iframe model the parent IS the app, so global DENY would actually block embedding. The plan's CSP should declare `frame-ancestors 'self'` (parent app) explicitly. **G5 (P1)**.
- (e) `sandbox=''` is correct — opaque origin, no script/form/storage. Good decision (V5-3).

### 2. XSS Prevention — G7, G8, G12, G21

- (a) **No client-side DOMPurify** for the preview iframe. Justification in plan: `sandbox=''` + `default-src 'none'` blocks script. This holds for script but NOT for the `style-src 'unsafe-inline'` CSS exfil vector and NOT for `data:text/html` accidental rendering. Recommend also setting `base-uri 'none'` and `form-action 'none'`. **G7 (P1)**.
- (b) **TipTap editor output (`getJSON()`)** is validated server-side (todo 7a, allowlist) before storage — good. But the `getEmail()` HTML output from `@react-email/editor` (used for `compiledHtml`) is **only sanitized via server-side DOMPurify at render**, not at the point `getEmail()` returns. If `compiledHtml` is sent over the wire from the client to the server (atomic save), client-side sanitization is missing. **G8 (P1)**.
- (c) **Merge-tag insertions** (`{scope, variable}`) — not sanitized as content; they're data keys resolved server-side. TS type-checking gives compile safety but a malicious `designJson` (a JSON blob) can include arbitrary `variable` strings. The schema validation (todo 7a) covers TipTap node *types* but **not the merge-tag payload schema** — `variable` strings need an allowlist against `EmailPropsByScope`. **G7/G18 (P1-P2)**.
- (d) **`designJson` from DB — XSS payloads?** Yes — `compiledHtml` is cached post-DOMPurify, but if a future DOMPurify bypass CVE exists, the cached sanitized HTML is NOT re-sanitized on read. And the save-time TipTap allowlist doesn't constrain attribute values like `href="javascript:..."`. DOMPurify at render catches `javascript:` URLs but `compiledHtml` cache short-circuits render. **G21 (P2)**.

### 3. Authentication Edge Cases — G9, G23

- (a) **Impersonating super-admin** — verified `authScopes.notImpersonating` = `!ctx.isImpersonating` (`gqlSchemaBuilder.ts:108`). A super-admin under impersonation is correctly DENIED on all authScoped mutations. ✅ Resolved.
- (b) **Feature-flag check authenticated?** The flag (`EMAIL_TEMPLATES_ENABLED`) is server-side only per V4-9 (`excludeFromDb: true, serverOnly: true`). However, plan **never confirms the flag is NOT exposed** to clients via `environment-config.pothos.ts` (which has DB-managed display). If `excludeFromDb` is honored, the client env-config query omits it — **but the plan doesn't add the explicit "filter out EMAIL_TEMPLATES_ENABLED"**. Hosting config in `environment-config.pothos.ts` could leak it. **G23 (P3)**.
- (c) **Unauthenticated endpoints** — the `previewEmailTemplate` query (line 774). Next.js `app/api/graphql/route.ts` requires POST + cookie auth + per-IP rate limit. The query will be a Pothos object field — IF it has field-level `authScope: { loggedIn: true }` or { superAdmin }, it's authed. Plan line 777 says "field-level authScopes is set to `{ superAdmin, notImpersonating }` on all email-template **mutations**" — the **query** (`previewEmailTemplate`) is not explicitly listed, leaving risk that it's accidentally unauthenticated (default = no auth). **G4 (P0)**.

### 4. Authorization Edge Cases — G4, G10

- (a) **Race-safety** — `allowedEditorGroups` is jsonb, read in service layer before write. No explicit row lock (`SELECT ... FOR UPDATE`) specified. A check-then-write without lock has a TOCTOU window where group membership changes between read and update. Plan's optimistic-locking (version+1, `WHERE version = $1`, line 465) partially mitigates but on a **different field** — group escalation could ship on unchanged `version`. **G10 (P1)**.
- (b) **Privilege escalation via `allowedEditorGroups`** — the `updateEmailTemplate` mutation accepts `allowedEditorGroups` as an input. A super-admin (the only actor who can write) can add any `EmailEditorPermission` to the array, including ones they don't hold. There is **no "cannot grant a group higher than own"** constraint. Since `superAdmin` is allowed, this is mostly low-impact but cross-group escalation ("editor" group can be granted "manager" edit access) is possible. **G10 (P1)**.
- (c) **Minimum permission for CRUD** — GraphQL layer is `superAdmin: true` for mutations (line 777). Service layer adds `allowedEditorGroups` per-template. But `createEmailTemplate` (no existing template) has no `allowedEditorGroups` to check — it's purely superAdmin-gated. Acceptable.
- (d) **IDOR** — `previewEmailTemplate(templateId, sampleProps)` takes a raw `templateId`. If the preview query is only superAdmin-authed, IDOR is mitigated (super-admin sees all). But if the preview query's authScope is misconfigured (see G4), any logged-in user could read any template's rendered HTML including internal URLs/props. Evidence: plan line 774 lists the file but **does not show the authScope directive**. **G4 (P0)**.

### 5. Input Validation — G2, G3, G18, G19

- (a) **`designJson` server-side validation?** Plan todo 7a specifies an allowed-node-types allowlist at save time. NOT YET IMPLEMENTED (plan only). Critically, the **JSON itself is `jsonb` without a server-side JSON-schema/zod validate** — the schema-validation is described as @tiptap/core "schema enforcement or a custom JSONContent validator". Without explicit zod schema for `designJson` shape, type-checking is loose. **G19 (P2)**: recommend a strict zod schema mirroring TipTap JSONContent, validated before DB write.
- (b) **`sampleProps` for send-test validated?** Client-side only — `JSON.parse` (G3 §H line 896). **Server-side missing** — a direct `sendTestEmail` mutation call passes unvalidated `sampleProps` into `safeRender()`'s React Email `render()`. A crafted `sampleProps` with huge payloads causes render DoS. **G2 (P0)**.
- (c) **Email addresses for send-test validated?** Client-side `z.string().email()` (line 895). Server-side, the mutation uses **plain `String`**, not the `Email` scalar (which exists at `backend/graphql/scalars/emailScalar.ts` and is wired into Pothos). Without `Email` scalar on the mutation input, `\n`/CRLF `\r\n` in `to` can pass through to the provider. For Resend this is JSON-safe, but for SMTP providers (registry todo 3) this is **header injection**. **G3 (P0) + G11 (P1)**.
- (d) **Subject merge-tag injection** — no maxlength, no forbidden-variable allowlist. If `subject` template is `"Order {{user.secret}}"` and `user.secret` resolves to internal data, it leaks via the subject line (which is also rendered in email clients, logs, delivery rows). **G18 (P2)**.
- (e) **Attachment file types** — `attachmentRules` jsonb has no validated schema (line 462). No `mimeType` allowlist, no `maxSize`. **G19 (P2)**.

### 6. Email-Specific Security — G11, G12

- (a) **SMTP / header injection** — Resend adapter (`ResendEmailAdapter.ts:139-144`) sends `from`/`to`/`subject`/`html` as JSON to Resend API → no CRLF injection at present. But the plan's multi-provider registry (todo 3, SES/Postmark/Mailgun/**SMTP/nodemailer**) will expose `subject`/`to`/`defaultFromEmail` to raw SMTP header construction. nodemailer is installed (`deps`). **No CRLF-stripping / `sanitizeHeader` pass is specified** for the SMTP path. **G11 (P1)**.
- (b) **Email header injection via subject** — same as above. Recommend stripping `[\r\n]` from all envelope/header fields before any SMTP send, and enforcing `Email` scalar server-side (G3).
- (c) **SSRF via `<img src>`** — Plan V5-3 blocks remote images in the PREVIEW iframe CSP. But at **send time**, React Email `<Img>` renders the URL into the email HTML and the recipient's mail client fetches it (legit). The threat is the **server-side preview/send pipeline React Email render** — `render(<Img src="http://[IP_REDACTED]/...">)` does NOT fetch the image itself (React Email only outputs `<img>` tags), so no server-side SSRF at render. However, an admin testing a template can include an internal URL that recipients fetch. Acceptable but worth a warning in UI. **G12 (P1, low)**.
- (d) **Tracking pixel privacy** — well handled by V5-3 (`img-src 'self' data:`). ✅
- (e) **Email content leaking internal URLs** — `subject` templates with merge-tags + `defaultFromEmail` could leak internal hosts. Recommend validation rules on URL fields.

### 7. Secret Management — G1, G20

- (a) **API keys env-stored, not DB** — confirmed. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are env (`env.ts:334-335`), read by `getEnvironmentConfig()`. Resend adapter (`ResendEmailAdapter.ts:64-77`) takes optional override but defaults to env. `validateNoPlaceholderSecrets` (env.ts:260-288) catches placeholder values. ✅ Good.
- (b) **Env key registration completeness** — **INCOMPLETE**. Plan todo 21c (line 122-124) mandates registering `EMAIL_TEMPLATES_ENABLED` in `env-config-keys.ts` with `excludeFromDb: true, serverOnly: true`. **Verified ABSENT** in `backend/lib/env-config-keys.ts` (grepped — only `IS_DEMO` at line 510 matches; no `EMAIL_TEMPLATES_ENABLED` entry). Without registration, the V5-2 truthy-string bug fires: `resolveEnvConfig('EMAIL_TEMPLATES_ENABLED')` returns `'false'` which is truthy → dispatcher routes through new pipeline even when admin intends off. **G1 (P0)**.
- (c) **Keys logged?** — `ResendEmailAdapter.handleResendApiError` logs `error.name`/`error.message` not the key. ✅ But other providers (SES) log AWS SDK errors which may include request IDs; verify on SES addition.
- (d) **Key rotation** — plan silent. No rotation/`verifyProvider` health check. **G20 (P2)**.

### 8. Rate Limiting — G13, G14

- (a) **Server-side enforced?** Plan todo 12 specifies "5 test emails/minute per user" inside `sendTestEmail`. Existing infra is `RateLimiter` (`ratelimit.ts`) backed by cacheService (Redis/Postgres). The plan would wire it in `sendTest`. NOT YET IMPLEMENTED — it's a plan intent.
- (b) **Per-user or global?** — Per-user per plan. But the existing `RateLimiter` `limit()` uses `cacheService.pipeline` with 4 commands that are **not atomic** (no MULTI/EXEC, no Lua script). Under concurrency, the `zadd`+`zcard` race lets >5 through in a window. **G13 (P1)**. Use `limitSimple` with `incr` or a Lua atomic script.
- (c) **Bypassed via concurrency?** — Yes (G13). Two simultaneous `sendTestEmail` mutations both read count<5 before either increments.
- (d) **Preview query rate limit?** — `previewEmailTemplate` is a GraphQL query → covered by global `graphqlRateLimiter` (100/min/IP, `route.ts:165`) and depthLimit(7). BUT preview does a server-side React Email render per call with caller-supplied `sampleProps` → CPU DoS vector if `sampleProps` is large/recursive. No per-operation complexity limit on the preview resolver. **G14 (P1)**.

### 9. Data Sanitization in Logs — G17

- (a) **Email addresses redacted?** — `safeRender` (plan line 1298) logs `{ scope, error }`. The catch path doesn't include the recipient. But `sendTest` flows log `deliveryId`→`providerMessageId` (`ResendEmailAdapter.ts:184`) — recipient not logged directly. HOWEVER `ResendEmailAdapter.handleEmptyRecipient` logs `eventType` and `userId` (line 104-107), not the address. ✅ Address itself not in logs in the existing path. **No explicit redaction policy** exists, so future logging additions could leak. **G17 (P2)**.
- (b) **`designJson` truncated?** — Not specified anywhere in plan. A thrown render error could log `error` containing large React tree dumps. Add explicit truncation (e.g., first 200 chars) in `safeRender` catch.
- (c) **API keys logged?** — No (see 7c). `BaseLogger` (`backend/lib/logger.ts` → `shared/lib/logger/base-logger`) audit recommended.

### 10. GraphQL-Specific Security — G15, G16

- (a) **Query depth limiting** — ✅ `depthLimit(7)` enforced (`app/api/graphql/route.ts:46`).
- (b) **Query complexity analysis** — ❌ NOT configured. No `CostAnalysis`/`createComplexityRule`. A query that selects the emailTemplate entity with N nested relations up to depth 7 can be expensive. **G15 (P2)**. Recommend `graphql-query-complexity` with a max-cost.
- (c) **Introspection disabled in prod** — ✅ `introspection: !isProduction` (`route.ts:53`); `ApolloServerPluginLandingPageDisabled` in prod; `hideSchemaDetailsFromClientErrors: isProduction`. Good.
- (d) **Batch attack prevention** — `POST`-only (route.ts:235) prevents GET CSRF. Apollo processes a single operation per request by default; **array batching (multiple ops in one body) is part of the GraphQL-over-HTTP spec** and not explicitly disabled. `sendTestEmail` could be packed into one request N times. Recommend explicitly disabling batched queries (Apollo has `allowBatchedQueries: false`). **G16 (P2)**.
- ✅ **CSRF prevention** configured (`route.ts:50-52`) — `x-apollo-operation-name`/`apollo-require-preflight` headers required.
- ✅ **Persisted queries** with TTL null backed by `ApolloCacheAdapter` — safer than APQ-only.

### 11. `isomorphic-dompurify` Usage — G7, G8, G21

- (a) **Right layer?** — Plan runs it at **render time (both save-compile and send)** (`safeRender`, plan line 1288). Good: defense-in-depth. The save-time TipTap allowlist blocks at the source; DOMPurify at sink. BUT for a template loaded from DB at preview/send, the `compiledHtml` CACHED column is already sanitized — the render path may short-circuit and serve cache, skipping DOMPurify. **Re-sanitize on every read** of `compiledHtml` for send, or invalidate cache on config bump. **G21 (P2)**.
- (b) **`ALLOWED_TAGS` complete for email clients?** — Plan list (lines 1290-1292) includes elements but OMITS: `pre`, `code`, `caption`, `col`, `colgroup`, `b`, `i`, `u`, `mark`, `sub`, `sup`, `small`, font-family tags email clients accept. Not security-critical (too permissive vs too strict), but renders preview inaccurate. Recommend adding `b`, `i`, `u`, `pre`, `code`. **G8 (P1)** implies missing `pre`/`style` handling.
- (c) **`data:` URLs safely?** — `ALLOWED_ATTR` has `src` allowing `src="data:..."`. `img-src 'self' data:` CSP permits `data:` for images. The risk: `data:text/html` in `<a href>` or `<img src>` if a parser mis-classifies. DOMPurify strips `javascript:` URIs by default but **`data:` is allowed by default** unless `UriSchemeAllowlist`/`FORBID_ATTR` config. Recommend adding `ALLOWED_URI_REGEXP: /^(?:https?|data:image\/|mailto:|tel:)/i` to DOMPurify config. **G8 (P1)**.

---

## Top-5 Actionable Recommendations

1. **[P0] Register `EMAIL_TEMPLATES_ENABLED` in `backend/lib/env-config-keys.ts`** with `{ excludeFromDb: true, serverOnly: true }` alongside `IS_DEMO` (line 510), and consume it ONLY via `getBooleanEnv('EMAIL_TEMPLATES_ENABLED')` (`env.ts:71`). This unblocks the V5-2 truthy-string gate bug and prevents unsafe dispatcher cutover. (G1)

2. **[P0] Server-side-validate ALL send-test mutation inputs** — coerce `to` to the Pothos `Email` scalar (already wired, `gqlSchema.ts:40`), and add a strict zod schema for `sampleProps` (max N keys, max string length, depth limit, key-name allowlist per scope). Pass them through `schema.parse()` in `sendTest` service before `safeRender`. (G2, G3)

3. **[P0] Confirm authScope on the preview query** — explicitly set `authScopes: { superAdmin: true, notImpersonating: true }` (or at minimum `{ loggedIn: true }` + service-layer group check) on the `previewEmailTemplate` query field, and serve preview HTML via a **dedicated `text/html` route** (e.g. `/api/email-preview/[templateId]`) where the CSP actually applies — not inside the GraphQL JSON response. Add `script-src 'none'; frame-ancestors 'self'` explicitly to that route's CSP. (G4, G6, G5)

4. **[P1] Atomic token-bucket rate limit for `sendTestEmail`** — replace the non-atomic `pipeline` path with a Lua atomic script or `INCR`+`EXPIRE` first-write pattern (reusing `limitSimple` correctly), keyed by `userId`, 5/min, with `failOpen: false`. Add a separate per-IP cost cap on the preview resolver (cap render invocations/min). (G13, G14)

5. **[P1] SMTP/header-injection guard for the multi-provider registry** — before adding any non-Resend provider (SES/Postmark/Mailgun/SMTP/nodemailer, todo 3), introduce `sanitizeEmailHeader(s)` that strips `[\r\n]` and NUL from `subject`, `to`, `from`, `cc`, `bcc`, `replyTo`, and enforce the `Email` scalar server-side on every envelope field passed to a raw-SMTP adapter. Also enforce a merge-tag allowlist on `subject` templates (no internal/secret keys). (G11, G18)

---

**Reporter's note:** Items G5/G6 (CSP layering), G7/G8 (DOMPurify gaps), G10 (group escalation), G12 (SSRF), G15/G16 (GraphQL cost/batch), G17 (log truncation), G21 (cache re-sanitize) are real but lower-severity hardening, not blockers. The four P0 items (G1–G4) should be resolved before implementation begins — each is a concrete, low-effort code change in already-existing files (`env-config-keys.ts`, scalar wiring, preview route split).