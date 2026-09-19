
# Error Handling & Edge Case Audit — Email Template System Design v7

**Scope:** Auditing the v7 email template system design against actual codebase conventions for error handling depth, retry, fallback, error boundaries, and failure recovery. Special focus on §P (State Transitions) and §Q (Data Flow), added in v7.

---

## Summary Table of Gaps

| # | Severity | Area | Gap Description |
|---|----------|------|-----------------|
| 1 | **P0** | React Error Boundary | Design never wraps the editor/runtime-only `@react-email/editor` in an error boundary despite repo precedent (`ViewSwitchErrorBoundary`). A TipTap render throw inside the iframe/editor crashes the whole page. |
| 2 | **P0** | Provider retry / fallback | Design defines a per-scope `safeRender` SQL-fallback-to-`safehtml` but no per-adapter **retry-with-backoff** for transient provider errors (429 / 5xx / network). Existing `ResendEmailAdapter` has zero retry; design adds `RetryLink` only on the *frontend* GraphQL layer, not the *outbound* send path. Resend/SES rate limits (429) are not retried. |
| 3 | **P0** | Repository constraint handling | Design defines a partial unique index `email_templates_scope_locale_active_uq` + `email_templates_scope_slug_uq` but the repo layer (`email-template.repository.ts`) definition has **no mapping of Postgres constraint violations (23505/23503/40P01 deadlocks) → typed error codes**. Repo convention today: none (no `23505` handling anywhere in `backend/db/repo/`). Design leaves DB failures as generic throws → GraphQL surfaces raw messages to admins. |
| 4 | **P0** | Concurrent editing | Optimistic locking `WHERE version = $1` is defined at the schema level, but the repo definition (`create`, `update`, `setActive`) does **not** define the zero-rows-affected-on-version-mismatch → `VERSION_MISMATCH` translation. The GraphQL mutation (`updateEmailTemplate`) has no definition for how the 0-row update result becomes the `VERSION_MISMATCH { expected, actual }` extension the UI consumes in §P2. The round-trip is asserted but not wired. |
| 5 | **P0** | Dispatcher fallback semantics | §Service: when `emailScope` is null and flag is **off**, returns `payload.body` fallback; when flag is **on** and scope null + no `payload.body`, returns `success: true, skipped: "no_email_scope"`. But there is **no handling for `renderForSend` itself throwing** (template component throws inside `safeRender` catches and returns fallback HTML — that path is covered). However if `EmailTemplateService.renderForSend` throws *before* `safeRender` (e.g., DB read of `designJson` fails), the catch is missing at the dispatcher level → unhandled rejection in the notification job. |
| 6 | **P1** | SWE review parity: retry strategies | §Q7 adds a frontend `RetryLink` (5xx only, 3 attempts, 500→5000ms jitter), but this is **new** to the repo (existing Apollo chain in `AppApolloProvider.tsx:42-57` has NO RetryLink). Design doesn't call out that this is a **codebase-wide new pattern**, nor define interaction with the existing `createConnectivityLink` (offline → `NETWORK_ERROR` synthetic error) which short-circuits *before* HTTP. Retrying a synthetic `NETWORK_ERROR` (statusCode undefined) is silently dropped by `retryIf: error.statusCode >= 500`. |
| 7 | **P1** | Session expiry vs existing auth flow | §P7 says mutation returns `SESSION_EXPIRED` → toast + redirect to /login after 2s. The actual codebase has **no `SESSION_EXPIRED` code** — `apollo/utils.ts` uses `UNAUTHENTICATED` + `FORBIDDEN` and performs `refreshToken` → fallback redirect (lines 205-296). The design invents a new code without aligning to the existing `handleAuthError` recovery (refresh-before-redirect). Risk: dual inconsistent redirect paths. |
| 8 | **P1** | Toast/notification convention | Design sprinkles `notifications.show(...)` and toasts throughout §P but never defines the underlying toast primitive. Repo uses `@toolpad/core` `useNotifications().show(...)` (with `severity`? actually toolpad `show(message, { autoHideDuration, ... })` — severity is not in the existing call signature at `useApolloConnectivity.ts:104`). Design uses `severity: "success"` / `severity: "warning"` — **this is not the repo convention**; notistack/MUI Snackbar severity via `<Alert>` inside `<Snackbar>` is the FormErrorSnackbar pattern, while toolpad notifications are severity-less. Inconsistency. |
| 9 | **P1** | File upload / attachment errors | Design defines `EmailAttachmentRules` (jsonb, max size per provider: 40MB Resend, 10MB SES, Mailgun/Postmark) and i18n key `attachmentTooLarge: (max) => string`, but **no MIME-type validation, virus-scan, or per-adapter size-limit enforcement is defined** — only an i18n string. Where is the validation executed (service layer? adapter?) and which error code surfaces (e.g., `ATTACHMENT_TOO_LARGE`, `INVALID_MIME`)? Not defined. Storage-failure path (Buffer read fail) for inline CID images is uncovered. |
| 10 | **P1** | Network / offline / backoff | §P7 offline banner via `navigator.onLine` OR `networkError`. Repo's `createConnectivityLink` already emits a synthetic `NETWORK_ERROR` and renders `<InitializingUI error>` on confirmed disconnect (`AppApolloProvider.tsx:141`). Design's offline banner duplicates this without referencing the existing module-level `isConnected` state in `apolloLinkState`. No backoff defined for the auto-reconnect HEAD poll in `useApolloConnectivity`. |
| 11 | **P1** | Render pipeline partial failures | `safeRender` catches `render()` throws → returns `<p>{fallbackText}</p>` HTML. But this means a **silently-failed send** (recipient receives a placeholder "Email render failed" body) goes out as a real email with `success: true`. No partial-failure signal, no failed-delivery row, no alerting. Should at minimum mark the delivery row as `FAILED` with reason `render_failed` rather than `SENT`. Design's `safeRender` returns `{html, text}` with no error flag — caller can't distinguish success-with-fallback from clean success. |
| 12 | **P1** | Merge-tag missing translation | `safeRender` catches missing translation keys as a generic catch, but the React Email components call `getServerTranslations(locale).emailsTranslations.<scope>` — a missing key today throws at runtime (TS catches missing keys compile-time, but dynamic `templateNotFound(scope)` for unknown scopes). Design doesn't define partial-render: e.g., subject renders but body throws. No per-section fallback. |
| 13 | **P2** | Form validation display | §H/§P3 use RHF + Zod field-level `<FormHelperText error>`. Repo convention for server-side validation errors (GraphQL `BAD_USER_INPUT` with `field` extensions) is **not defined**. Design mentions `extensions.message` for send-test errors but no field-level server validation mapping (e.g., create-template slug collision returns which field?). `duplicateScopeLocale` i18n key exists but no UI field binding. |
| 14 | **P2** | Idempotency failure modes | Design adds `idempotencyKey` (sha256 of scope+entityId+notificationEventId) and `findByIdempotencyKey`. But: (a) both `entityId` and `notificationEventId` may be `""` (V5-10 acknowledged) → identical hash for different events → **false-positive dedup** dropping legitimate emails. (b) No definition for the race window (two triggers arrive in same ms before either inserts). (c) The `idempotencyKey` column + repo method are deferred to "item 13" but the dispatcher code references it already — ordering risk. |
| 15 | **P2** | Migration flag-toggle error | §Migration documents the 5 null-scope events losing email when flag flips, but **no gradual rollout / kill-switch on failure** is defined (e.g., metrics alert when send-success rate drops, auto-rollback trigger). The flag is binary env-var. |
| 16 | **P2** | Preview tab compile error | §P6: `"Failed to compile HTML. Check your template for missing tags or invalid markup."` — but preview comes from a GraphQL query `previewEmailTemplate`, so a compile error is a GraphQL error, not a client compile. The error message wording implies client-side compilation. Definition mismatch. |
| 17 | **P2** | History restore conflict | §P5 `VERSION_RESTORE_CONFLICT` error code is invented with no backend-side definition. Restore = set version/active; conflict detection mech identical to update optimistic lock but uses a *different* error code. Why two codes (`VERSION_MISMATCH` vs `VERSION_RESTORE_CONFLICT`) for the same underlying 0-row update? Unjustified divergence. |
| 18 | **P3** | Error logging PII | Design uses `logger.error("Email render failed", { scope, error })` — but `error` may contain props/recipient PII. Repo's logger has a PII-scrubber (per `apollo/utils.ts:138-140` comment) for token keys but the design doesn't verify the scrubber covers `templateProps`/`to`/`metadata` fields in the email path. |
| 19 | **P3** | DOMPurify failure mode | `DOMPurify.sanitize` can throw on malformed input (rare). `safeRender` catches it generically → fallback. But if sanitization is the *only* XSS defense and it throws, the fallback `<p>renderFailed</p>` is safe — acceptable. No gap, but the sanitizer-throw path itself is unexercised. |
| 20 | **P3** | SES/SMTP adapter auth-failure surfacing | Design lists adapter auth failures implicitly ("throw on unknown provider") but doesn't define how a misconfigured SES key (ThrottlingException, MessageRejected) maps to `EmailSendResult.error` vs a thrown exception during `getEmailChannel()`. Existing Resend adapter records a `FAILED` delivery row + returns `success:false`; new adapters' contract re: delivery-row creation on auth failure is undefined. |

---

## Detailed Findings by Area

### 1. React Error Boundaries
**Repo:** `frontend/common/components/ui/container/ResponsiveViewSwitch.tsx:20-79` implements `ViewSwitchErrorBoundary` (getDerivedStateFromError + fallback). This is the **only** ErrorBoundary pattern. `frontend/AGENTS.md:209` documents that `ResponsiveViewSwitch` wraps lazy views in `Suspense` + `ErrorBoundary`.
**Design:** NO mention of `ErrorBoundary` anywhere. The editor embeds a third-party runtime (`@react-email/editor` / TipTap 3.17) inside `EmailEditorWrapper` (ssr:false) — a TipTap schema-extension throw or `getJSON()` on corrupted `designJson` would bubble to the nearest boundary (none) and blank the page.
**Gap:** P0 — design must define an `EmailEditorErrorBoundary` wrapping `EmailEditorWrapper` with a "Editor failed to load — reload" fallback (mirroring `ViewSwitchErrorBoundary`).

### 2. GraphQL Error Handling
**Repo:** `defaultOptions.errorPolicy: "none"` (`AppApolloProvider.tsx:59-63`). Error link (`utils.ts:299-325`) handles `UNAUTHENTICATED`/`FORBIDDEN` + network errors only. No `RetryLink`. Error messages extracted via `getGraphQLErrorMessage(error, fallback)` (`errorUtils.ts:10-21`) which reads `CombinedGraphQLErrors.errors[0].message`.
**Design:** §Q7 introduces `RetryLink` (new), §P3 reads `extensions.message` for send-test errors. But design's `VERSION_MISMATCH { expected, actual }`, `RATE_LIMITED { retryAfter }`, `SESSION_EXPIRED`, `VERSION_RESTORE_CONFLICT` are new extension shapes — the existing `getGraphQLErrorMessage` only reads `.message`, so consuming `extensions.expected`/`extensions.retryAfter` requires new helpers the design doesn't define.

### 3. Service-Layer Error Patterns
**Repo:** `useClassMutations.ts:47-50` shows the convention: `logger.error(context, {err})` + `onError?.(getGraphQLErrorMessage(err, fallback))`. Backend services throw `new Error("...")` with plain messages (e.g., `EmailChannelFactory.ts:46`).
**Design:** `safeRender` follows the throw+log pattern but **swallows** errors into fallback HTML (see gap #11). The dispatcher has no try/catch around `renderForSend` (gap #5). No typed error-code envelope (`EmailServiceError` union) is defined — GraphQL mutations will re-throw raw service errors.

### 4. Repository-Layer Error Patterns
**Repo:** `grep` for `23505`/`23503`/`40P01`/`constraint` in `backend/db/repo/` returns **zero matches**. There is currently no constraint-violation mapping convention.
**Design:** Introduces two unique indexes with real concurrent-edit risk but the repository method definitions (`getById`, `update`, `setActive`) don't define how `QueryError` with code `23505` becomes `duplicateScopeLocale` (UI key exists at §i18n but no plumbing). Optimistic-lock 0-row update → `VERSION_MISMATCH` mapping is undefined end-to-end (gap #4). This is the most under-defined layer.

### 5. Network Errors
**Repo:** `createConnectivityLink` (`utils.ts:51-100`) short-circuits with synthetic `NETWORK_ERROR` extension when offline; `useApolloConnectivity` polls `/api/...` HEAD. No `RetryLink`. No exponential backoff (HEAD poll is fixed-interval).
**Design:** §Q7 RetryLink is incompatible-positioned after a connectivity link that never calls `forward` offline (so RetryLink never sees those). §P7 offline banner duplicates `isConnected` without reusing module state. No timeout config on `HttpLink` (existing `HttpLink({ uri, credentials })` has no timeout — design doesn't add one; a hung request never retries).

### 6. Provider Error Handling
**Repo:** `ResendEmailAdapter.ts:138-213` — single attempt, catches `response.error` + exceptions, records `FAILED` delivery row, returns `{success:false, error}`. **No retry. No 429 handling. No rate-limit backoff. No multi-recipient partial-failure** (Resend returns aggregate). `validateConfig` throws on missing env.
**Design:** Adapters listed (~200 LOC each) with API specifics but **no retry policy, no 429 recognition, no exponential backoff, no circuit breaker**. Resend 429 / SES `ThrottlingException` / Postmark 429 will all surface as one-shot `success:false` and the email is lost (no DLQ, no scheduled retry). Design's idempotency key would then *block* a legitimate retry by the job runner (same key → deduped). This is a serious architectural gap.

### 7. Concurrent Editing
**Repo:** No existing optimistic-lock pattern (grep `version = $1` / `WHERE version` in `backend/db/repo/` → none).
**Design:** Schema has `version` integer + comment "WHERE version = $1 check on update." §P2 UI handles `VERSION_MISMATCH { expected, actual }` with Overwrite/Reload. But:
- Repo `update` signature (`backend/db/repo/email/email-template.repository.ts` definition) lists `update` with no version param or 0-row handling.
- No GraphQL mutation schema for the `expected`/`actual` extension fields (just asserted in UI text).
- §P5 `VERSION_RESTORE_CONFLICT` is a redundant parallel code (gap #17).
- The "Overwrite (force)" path needs a `forceVersion` mutation variant — not in `createEmailTemplate`/`updateEmailTemplate` mutation list (§GraphQL surface).

### 8. Template Rendering Errors
**Repo:** N/A (new code).
**Design:** `safeRender` (`§Render pipeline:1264-1306`) catches render throw, missing scope (`Unknown email scope`), DOMPurify in try. Returns fallback `<p>renderFailed(scope)</p>`.
**Gaps:** (a) Fallback HTML is **sent as a real email** — no `FAILED` delivery row, no alert (gap #11). (b) `toPlainText(safeHtml)` on fallback `<p>` is fine, but `subject` is not in the `safeRender` return — `renderEmailTemplate` returns `{html, text, subject, attachments}` (line 311); if subject-component throws, no subject fallback defined. (c) `attachments` async fn (`def.attachments(props, locale)`) throwing is uncaught — `safeRender` wraps only `render(<component/>)`, not the attachments resolver.

### 9. File Upload / Attachment Errors
**Repo:** `useImageUpload.ts` (frontend) + `backend/storage/disk/...` exist for general uploads. Backend has `onError` patterns in storage helpers.
**Design:** `EmailAttachmentRules` jsonb + `attachmentTooLarge` i18n key. **No:** MIME validation logic, max-size enforcement location (service vs adapter), per-adapter limit differences surfaced to user, storage failure for inline image Buffer resolution, attachment fetch timeout. §EmailAttachment `content: Buffer` only — but where do admin-uploaded attachments live? No upload endpoint/mutation defined. This is an open hole.

### 10. Form Validation Display
**Repo:** RHF + Controller + Zod established (e.g., `SubmitPaymentProofDialog`). Server errors via `getGraphQLErrorMessage` → `onError` callback → `FormErrorSnackbar` (form-level snackbar, not field-level).
**Design:** §P3 field-level `<FormHelperText error>` for send-test (email + JSON). But server-side field-level errors (e.g., slug collision → `duplicateScopeLocale`) have an i18n key but no field-binding definition; existing convention is form-level snackbar, not field-level. Inconsistency between send-test (field-level) and create-template (presumably form-level).

### 11. Toast / Notification Patterns
**Repo:** Two distinct systems: (a) `@toolpad/core` `useNotifications().show(msg, {...})` — **no severity arg** in existing calls (`useApolloConnectivity.ts:104-121`, `useImageUpload.ts`). (b) `FormErrorSnackbar` + `<Alert severity>` inside `<Snackbar>` for form errors.
**Design:** Uses `notifications.show(t(...), { severity: "success" })` and `severity: "warning"` throughout §P. Severity may not be a supported toolpad arg in this version — needs verification. Also mixes `<Alert severity>` inline (§P3) and toasts — pattern not consolidated.

### 12. Session Expiry / Auth
**Repo:** `utils.ts:205-296` `handleAuthError` → `UNAUTHENTICATED` → `getNewAccessToken()` (deduped) → refresh succeeds → `reFetch()` stay-on-page; refresh fails → `buildLoginHref` + `window.location.href` redirect. FORBIDDEN logged but no redirect. Dedicated `logAuthRedirectEvent` with force-logging.
**Design:** §P7 invents `SESSION_EXPIRED` code (doesn't exist) + 2s delay + sessionStorage draft save. The existing recovery is **refresh-first**, not immediate redirect. Design's "redirect to /login after 2s" **bypasses the refresh attempt** regressing the production bug the recovery was built to fix (`utils.ts:103-108` comment). Must align to `UNAUTHENTICATED` + reuse `authRecovery`.

---

## §P and §Q Coverage Assessment

**§P (State Transitions):** Comprehensive happy + error + empty states per surface (P1-P9). Strongest coverage in the design. Gaps: P7 `SESSION_EXPIRED` code mismatch (#7); P2 conflict definition lacks backend wiring (#4); P6 preview error wording mismatch (#16); P5 redundant restore-conflict code (#17); **no editor-runtime error boundary** (#1).

**§Q (Data Flow):** Q1-Q10 are cache/fetch-policy heavy. Q7 covers retry but only frontend GraphQL layer, not outbound provider sends (#2). Q4 optimistic responses cover rollback-on-error for 4 mutations but **no SendTest rollback** (correctly) yet SendTest error display relies on `extensions.message` with no helper (#2/13). Missing: network timeout config, retry↔connectivityLink ordering (#6), and **no error envelope definition for the new extension codes**.

---

## Top-5 Actionable Recommendations

1. **P0 — Add `EmailEditorErrorBoundary`** wrapping `EmailEditorWrapper`. Mirror `ViewSwitchErrorBoundary` (`ResponsiveViewSwitch.tsx:20-79`) with a "Editor failed to load" + Reload button fallback. This is the single highest-impact missing guard given the third-party TipTap runtime inside the editor iframe is the most likely throw source.

2. **P0 — Define the optimistic-lock round-trip end-to-end.** Specify: repo `update(id, expectedVersion, patch)` → 0-rows-affected → throw `VersionMismatchError({expected, actual})` → service catches → re-throws as GraphQL error with `extensions: { code: "VERSION_MISMATCH", expected, actual }` → frontend `getGraphQLErrorMessage` extended to read `extensions`. Add `forceVersion` mutation variant for the "Overwrite" UI action. Collapse `VERSION_RESTORE_CONFLICT` into the same `VERSION_MISMATCH` code.

3. **P0 — Add outbound send retry with backoff + DLQ.** Define an `EmailSendRetryPolicy` applied in the dispatch path (NOT the frontend): retry 429/5xx/network up to 3× with exponential backoff (1s→4s→16s), respect `Retry-After` header, record `RETRYING` delivery status, and on final failure enqueue to a dead-letter mechanism (retry job or `notificationDeliveries.status='PERMANENTLY_FAILED'` + alert). Critically, the idempotency key must NOT block retries of the same logical send when the failure was transient — key should only dedup *successful* sends, not attempts.

4. **P0 — Align `SESSION_EXPIRED` to the existing `UNAUTHENTICATED` recovery flow.** Replace §P7 with: mutation returns `UNAUTHENTICATED` → existing `handleAuthError` attempts `refreshToken` (deduped via `inFlightRefresh`) → on success `reFetch()` (stay on page, no draft loss) → on failure, save draft to `sessionStorage` then `buildLoginHref` redirect. Do not invent a new code or a 2s-delay redirect that skips refresh.

5. **P1 — Consolidate error separation in the render/send pipeline.** (a) `safeRender` should return `{ html, text, degraded: boolean, error?: Error }` so the caller (dispatcher) marks the delivery row `FAILED` with `failureReason: "render_degraded"` rather than `SENT` when fallback was used — preventing silently-sent broken emails. (b) Wrap the dispatcher's `EmailTemplateService.renderForSend` call in try/catch returning `{success:false, error}` to avoid unhandled rejection in the notification job. (c) Extend `safeRender`'s try to cover the async `attachments` resolver and a subject-render fallback.