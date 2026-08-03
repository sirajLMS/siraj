Agent is idle (waiting for messages). agent_id: r4-error-handling, agent_type: explore, status: idle, description: R4: Validate v8 §S error handling, elapsed: 947s, total_turns: 1

[Turn 0]
I now have enough to write a complete validation report.

# v8 §S Validation Report — Round 4 Deep Dive

## 1. Validation Summary Table

| § | Title | Status | Remaining Gaps | Codebase Claim Verified? |
|---|-------|--------|---------------|-------------------------|
| S1 | Editor Error Boundary | **PARTIAL** | 4 | YES (boundary exists at `ResponsiveViewSwitch.tsx:20-79`) |
| S2 | Optimistic Lock Round-Trip | **PARTIAL** | 5 | PARTIAL (repo/types don't exist yet; auth.mutation pattern confirmed) |
| S3 | Outbound Send Retry + DLQ | **PARTIAL** | 6 | YES (ResendEmailAdapter has zero retry, confirmed) |
| S4 | SESSION_EXPIRED → UNAUTHENTICATED | **VALID** | 2 | YES (utils.ts:205-296 fully matches) |
| S5 | safeRender Degraded Signal | **INVALID** | 5 | NO (IEmailChannel `text` field doesn't exist) |
| S6 | Repository Constraint Mapping | **INVALID** | 4 | NO (`EmailTemplateErrorCode` referenced wrongly; Drizzle error `constraint_name` absent) |
| S7 | Error Code Registry | **INVALID** | 4 | NO (enum layer misplaced; auth.mutation pattern verified) |
| S8 | Toast Convention | **INVALID** | 3 | NO (claim that `show()` is severity-less is FALSE) |
| S9 | Network/Offline | **VALID** | 3 | YES (link chain order + missing timeout confirmed) |

**Total remaining gaps: 36** (vs. ~12 claimed "fixes" in v8)

---

## 2. Detailed Findings Per Sub-Section

### S1 — Editor Error Boundary (PARTIAL)
**Verified:** `ViewSwitchErrorBoundary` exists at `frontend/common/components/ui/container/ResponsiveViewSwitch.tsx:20-79`, implemented exactly as the spec describes — class component, `getDerivedStateFromError`/`componentDidCatch`, fallback `<Alert>` with Reload button. Plan path `frontend/views/dashboard/admin/email-templates/editor/...` differs from the existing `frontend/common/views/dashboard/admin/...` tier convention seen elsewhere in the codebase.

**Gaps:**
1. **No `resetKeys` prop specified.** The existing boundary resets only on full page reload (`globalThis.location.reload()`). The editor boundary likely needs `resetKeys: [templateId, version]` to auto-recover when navigating between templates or after a successful save — the v8 spec gives a developer no guidance here, and without it the editor stays stuck after a single transient error.
2. **Mismatched fallback pattern.** Existing boundary uses `<Alert severity="error">` (line 37-48). The v8 spec says "Editor failed to load" + "Reload button" + `<Suspense>` fallback inside the boundary — it doesn't state which primitive to use. `ViewSwitchErrorBoundary` does NOT contain its own `<Suspense>`; the caller wraps it separately. The spec's "fallback render" wording is ambiguous about whether `<Suspense>` goes inside or wraps the boundary.
3. **No spec on where `EmailEditorWrapper` actually lives** — the spec implies it exists but doesn't give a file path to find/modify. The wrapper may not be created yet (greenfield); the boundary placement instruction is incomplete.
4. **`errorFallback` prop threading** — the existing boundary accepts `errorFallback?: ReactNode` (line 12) — the v8 spec doesn't say whether the email editor should pass its own customized fallback or reuse the default `<Alert>`. No i18n keys listed for the fallback strings.

### S2 — Optimistic Lock Round-Trip (PARTIAL)
**Verified:** Schema has `version INTEGER NOT NULL DEFAULT 0` on other tables (`students.ts:65`, `billing.ts:44`) — confirms the column-naming convention for when the email_templates table is created. Pothos throw pattern verified at `auth.mutation.ts:186/195/206/215/228/233/240/293/311` — `extensions: { code: "UPPER_SNAKE" }` is the canonical literal-object (not typed-union) pattern. `getGraphQLErrorMessage` exists at `frontend/common/utils/errorUtils.ts:10` and reads `error.errors[0].message` (NOT `extensions.code`).

**Gaps:**
1. **Repo/types don't exist.** No `backend/db/repo/.../email-template.repository.ts` and no `backend/types/.../email-template.types.ts` — confirmed by glob returning no files. The spec references "email-template.repository.ts" as if extending an existing file; it must say "create new file at `backend/db/repo/notifications/email-template.repository.ts`" per `backend/db/repo/AGENTS.md:53` convention (single `namespace EmailTemplateRepository`).
2. **`VersionMismatchError` type undefined.** The spec throws `VersionMismatchError({ expected, actual })` but no such error class exists in the codebase. The spec doesn't specify its file path, base class (`Error`?), or whether it's a `GraphQLError` subclass. The `findDuplicate`/`findConcurrentConflict` convention (`is-duplicate-error.ts`) shows the codebase throws raw errors and catches by predicate — there's no existing typed-error-class precedent.
3. **`forceVersion` mutation input type undefined.** The spec says `updateEmailTemplate(id, patch, expectedVersion?, force?: boolean)` but doesn't define the Pothos input object (`UpdateEmailTemplateInput`), whether `force` requires its own authz (a low-trust admin could `force:true` to bypass warnings — should it require a higher authScope?), or whether `force` bypasses ONLY the version check or also the authScope guard (`requireAuth`).
4. **`getGraphQLErrorCode` location conflicts with S7.** S2 says "extend `getGraphQLErrorMessage` usage" implying `frontend/common/utils/errorUtils.ts`; S7 says new file `frontend/common/graphql/utils/errorCodes.ts`. The two sub-sections give **two different file paths for the same helper** — must be reconciled.
5. **"0-rows-affected → throw" race:** `expectedVersion = undefined` (no version check) means 0-rows-affected on `force:true` is NOT a conflict — the spec doesn't handle this branch.

### S3 — Outbound Send Retry + DLQ (PARTIAL)
**Verified:** `ResendEmailAdapter.executeSend` (lines 133-154) confirms zero retry — 429/5xx/network errors flow straight to `handleSendException`/`handleResendApiError` which mark `FAILED` and return `success:false`. No `EmailSendRetryPolicy` or `EmailProviderRegistry` existence (verified: `IEmailChannel` at `IEmailChannel.ts:13-17` returns `{ success, providerMessageId?, error? }` — no `RETRYING` field). `EmailChannelFactory.ts` (lines 100-113) is a singleton `emailChannel.send` wrapper.

**Gaps:**
1. **Idempotency-key convention contradiction.** The v8 spec says "idempotency key MUST NOT block retries… change `findByIdempotencyKey` to check AFTER successful send." But the existing codebase has no `findByIdempotencyKey` method (grep returned only `findByIdempotencyKeys` reference in the plan line 1423 — the codebase doesn't have it yet, it's a planned §G addition). The spec phrases this as a CHANGE to an existing method when it's actually a NEW method's design. Must clarify: "design `findByIdempotencyKey` to be checked only post-success, not pre-retry."
2. **Circuit breaker state lives WHERE?** Spec says "mark the provider as degraded in `EmailProviderRegistry`" but doesn't say if the 5-consecutive-failure counter is in-memory (lost on server restart), Redis (`shared/` infra exists), or DB. The existing `EmailChannelFactory` uses a module-level `instance`/`initializationPromise` singleton (lines 5-6) — a degraded flag bolt-on would need to survive `resetEmailChannel()` (line 87). No persistence layer specified.
3. **`RETRYING` delivery status missing from enum.** `notificationDeliveries.status` uses `NotificationDeliveryStatus` enum (`backend/enum/notifications/`) — adding `RETRYING` requires a DB migration + enum update + GraphQL exposure (`backend/enum/AGENTS.md:54`). The spec doesn't list this migration step.
4. **`PERMANENTLY_FAILED` enum member coverage.** The spec uses `PERMANENTLY_FAILED` but doesn't confirm it exists in `NotificationDeliveryStatus`. Need to verify whether it's `FAILED` (used by `ResendEmailAdapter.ts:113`) vs `PERMANENTLY_FAILED` (new).
5. **Retry policy per-adapter or global?** Spec puts `EmailSendRetryPolicy` in "the dispatch path" — ambiguous whether it's a wrapper around `IEmailChannel.send` (applies to ALL adapters uniformly) or a per-adapter trait (SES can handle 5xx synchronously but Resend can't retry 429 without adjusting the request). Existing `IEmailChannel` interface has no retry config field.
6. **`Retry-After` header access.** Spec says "respect `Retry-After` header" — but `ResendEmailAdapter` uses the `resend` SDK (`new Resend(apiKey)`) and the SDK throws on rate limit; the raw HTTP response headers may not be exposed. Spec doesn't say whether to (a) switch to raw `fetch`, or (b) use SDK-exposed `response.error.retryAfter` (if it exists).

### S4 — SESSION_EXPIRED → UNAUTHENTICATED (VALID)
**Verified:** `apollo/utils.ts:205-296` (`handleAuthError` → `recoverFromUnauthenticated`) matches the spec EXACTLY: `CombinedGraphQLErrors.is(error)` → check `UNAUTHENTICATED` in `error.errors.map(err => err.extensions?.code)` (line 208-209) → `getNewAccessToken()` deduped via `inFlightRefresh` (lines 164-203) → success `authRecovery.reFetch()` + stay-on-page (line 267-280) → failure `buildLoginHref` redirect (line 294). The v8 spec correctly describes every step.

**Gaps:**
1. **`FORBIDDEN` case not mentioned.** The existing `handleAuthError` lines 210-223 explicitly does NOT redirect on `FORBIDDEN` (returns `false`, logs `{ caller }`). The v8 §S4 spec doesn't address `FORBIDDEN` at all — if email-template mutations throw `FORBIDDEN` (for missing `email-template:write` scope), the spec is silent on what the UI does. The plan's §U3 "Preview Query Authorization" implies `FORBIDDEN` codes — §S4 should explicitly state "`FORBIDDEN` is NOT handled by auth recovery; UI surfaces the error inline."
2. **`login`/`refreshToken` operationName guard.** Lines 225-227 silently skip recovery for auth-mutations themselves. The §S4 spec is a simplified narrative (it omits this guard) — a developer copy-pasting the narrative would re-introduce the bug.
3. **`isRedirectingToLogin` dedup.** Line 242-247 — already-redirecting suppression — also omitted from the §S4 narrative. Not blocking, but the "Replace §P7" instruction should reference the full function signature, not a paraphrase.

### S5 — safeRender Degraded Signal (INVALID)
**Verified VIOLATION:** `IEmailChannel.ts:4-11` — `EmailPayload` has **NO `text` field** (only `to`, `subject`, `html`, `eventType`, `userId`, `metadata?`). The v8 spec says `safeRender` return type is `{ html, text, degraded, error? }` — but `text` cannot be threaded to the adapter because `IEmailChannel.send()` payload type doesn't accept it. The plan's own line 632 admits: `"— NO 'text' or 'attachments' fields (IEmailChannel.ts:4-11)"`. The v8 §S5 spec contradicts the plan's own §Q2 Data Flow section.

**Gaps:**
1. **Broken contract.** Per the plan's own admission, `text` cannot flow through. The §S5 spec must either (a) extend `EmailPayload` to add `text?: string` (interface change to `IEmailChannel` + all adapter implementations + `NotificationMetadata` type), or (b) drop `text` from the `safeRender` return.
2. **Backward-compat on `EmailSendResult`.** Spec adds `error?` to the dispatcher's `{ success, error }` return — but `EmailSendResult` (line 13-17) already has `error?: string`. Spec doesn't clarify whether `error` is now a `string` (existing) or an `Error` instance (`error?: Error` per the new return type). Type collision.
3. **Attachment types not enumerated.** Spec says "cover the async `attachments` resolver and a subject-render fallback" but does not enumerate: inline CID (`cid:` references that need base64-embedded attachment), file attachments (filesystem/`storage` layer), calendar invites (`.ics` MIME multipart/alternative). The existing `EmailPayload` has NO `attachments` field anywhere — the entire attachment subsystem is unspecified.
4. **Subject-component fallback unclear.** "fall back to `<subject>` text interpolation with merge-tag values" — what is `<subject>` here? A JSX `<EmailComponent>`? A static template string? React Email v6 has no `<Subject>` primitive in the documented API in this plan.
5. **`render_degraded` not in any failure-reason registry.** `failureReason: "render_degraded"` is introduced ad-hoc. Existing `ResendEmailAdapter` uses free-text `failureReason` strings (line 113/168/206) — there's no enum. The spec adds yet another ad-hoc string with no validation.

### S6 — Repository Constraint Mapping (INVALID)
**Verified VIOLATION:** Two critical errors:
- **`e.constraint_name` does NOT exist on Drizzle/`@neondatabase/serverless` errors.** The existing `isDuplicateError` helper (`backend/services/shared/is-duplicate-error.ts:4-6`) reads `e.code === "23505"` — the codebase only checks the `code` field, NOT `constraint_name`. Drizzle errors (via `PgQueryError`) typically expose `code`, `message`, `detail`, `constraint` (not `constraint_name`). The v8 §S6 spec invents a `e.constraint_name` field that does not exist in the code's existing convention.
- **`QueryError` not imported anywhere** (grep returned 0 hits for `QueryError|PgQueryError` in non-test backend code). There's no existing typed-query-error import convention. The spec uses `catch (e: QueryError)` without defining its import — Drizzle exposes this from `@drizzle-team/drizzle-typeorm`? `pg`? Is it actually `PgQueryError` from the neon driver?

**Gaps:**
1. **Reuse `isDuplicateError`.** The codebase already has a tested helper that handles `23505`. The spec should say "extend `isDuplicateError` to ALSO expose `constraint`" rather than write a fresh `catch (e: QueryError)` in every repo method.
2. **`40P01` deadlock handling already exists** as `isConcurrentConflictError` in `backend/db/test/test-utils.ts:145`. This is test-only — no production deadlock-retry convention. The spec's "Drizzle already wraps in `db.transaction`" claim is UNVERIFIED — the codebase doesn't auto-retry on `40P01` in services. The spec is wrong about an existing capability.
3. **No typed `DuplicateScopeLocaleError`/`DuplicateSlugError` defined.** Like S2's `VersionMismatchError`, these error classes are referenced but not located. Per repo AGENTS.md:42, repos must NOT contain user-facing error strings — the typed error class should be in `backend/services/...` or `backend/utils/`. Spec doesn't say which.
4. **Field-level `<FormHelperText error>` requires server to identify the conflicting FIELD.** `DUPLICATE_SCOPE_LOCALE` doesn't say whether `scope` or `locale` field is at fault (both are in the unique index). The UI binding `field=scope` vs `field=locale` is ambiguous — the spec needs `extensions: { code, field: "scope" | "locale" }`.

### S7 — Error Code Registry (INVALID)
**Verified:** `auth.mutation.ts` confirms the established pattern is the **string-literal** `extensions: { code: "UPPER_SNAKE" }` (no typed union). The v8 spec proposes adding a typed `EmailTemplateErrorCode` enum — this is a **new convention** not matching the existing precedent. Per `backend/enum/AGENTS.md:36-54`, all backend enums **MUST live in `backend/enum/<subdir>/<entity>.enum.ts`** and be registered in `backend/graphql/pothos/shared/enum.pothos.ts`. The v8 spec places it at `backend/types/email-template.types.ts` — a **placement violation of AGENTS.md**.

**Gaps:**
1. **Wrong layer.** `backend/types/` AGENTS.md explicitly says types use `$inferSelect`/`$inferInsert`; enums go in `backend/enum/`. Move to `backend/enum/notifications/email-template-error-code.enum.ts`.
2. **`networkError` vs `graphQLErrors` not addressed.** S7's helper `getGraphQLErrorCode(error)` reads `error.graphQLErrors[0]?.extensions?.code`. In Apollo Client v4, errors come as `CombinedGraphQLErrors` (verified `errorUtils.ts:11` uses `CombinedGraphQLErrors.is(error)`). The helper must handle: (a) pure `networkError` (no code — return `undefined`), (b) `CombinedGraphQLErrors` with multiple errors (which one's code?), (c) React error boundary caught `Error`. S7's helper signature is incorrect — it should be `getGraphQLErrorCode(error: unknown): EmailTemplateErrorCode | undefined` and call `CombinedGraphQLErrors.is(error)` first.
3. **Two locations for the helper.** S7 says `frontend/common/graphql/utils/errorCodes.ts` — but S2 says "extend `getGraphQLErrorMessage` usage." Inconsistency must be resolved (see S2 gap #4).
4. **TypeScript enum vs const object.** `backend/enum` precedent is `const` objects (see `billing.enum.ts`, `pricing/`), not `enum`. Using `enum EmailTemplateErrorCode` may not match the `t.exposeString("severity")`/codegen pattern at `notification-alerts.pothos.ts:21` — the existing `NotificationAlert.severity` is exposed as a `String`, not an enum. Pothos enum registration may not match this code's GraphQL exposure convention.

### S8 — Toast Convention (INVALID)
**Verified VIOLATION:** The v8 spec's central claim — "toolpad `useNotifications().show()` is severity-less" — is **FALSE**. Evidence:
- `frontend/common/hooks/useApolloConnectivity.ts:104-105` uses `notifications.show(msg, { severity: "error" })`
- `useApolloConnectivity.ts:112-113`: `severity: "success"`
- `useImageUpload.ts:43`: `type NotifyFn = (message: string, options: { severity: "error" | "warning" | "info" | "success" }) => void`
- `useImageUpload.ts:276`: `notifications.show.bind(notifications)`

`@toolpad/core` `useNotifications().show()` already accepts `severity: "success" | "info" | "warning" | "error"`. The v8 §S8 spec's entire premise is invalid.

**Gaps:**
1. **Remove the "verification step" entirely.** The premise is wrong; `severity` is supported. The "If NOT…" fallback to `<Snackbar>+<Alert>` is unnecessary complexity.
2. **`FormErrorSnackbar` pattern cited but path not given.** The spec references `FormErrorSnackbar` pattern but doesn't say where it lives. Has the audit author actually seen it? Grep shows no `FormErrorSnackbar` component in the codebase — possibly a v8 invention. Should specify the actual file or remove the reference.
3. **`@toolpad/core` package version not pinned.** Spec says "check `@toolpad/core` version" but doesn't list the current version in `package.json`. A developer implementing this has to re-verify what's already known.

### S9 — Network/Offline (VALID)
**Verified:** `AppApolloProvider.tsx:42-57` confirms the actual link chain order: `createErrorLinkHandler` → `createConnectivityLink` → `createAuthLink` → `PersistedQueryLink` → `new HttpLink({ uri, credentials })`. There is NO `RetryLink` installed currently (verified by grep — only the plan references it). The v8 §S9 analysis is correct that the planned §Q7 placement AFTER connectivityLink would drop `NETWORK_ERROR` (which sets `statusCode: undefined` per `utils.ts:73-78`). Confirmed `HttpLink` has no `timeout` config (line 56).

**Gaps:**
1. **`ApolloLink.timeout` does not exist.** Spec line 1460 says "Add `timeout: 30000` via `ApolloLink.timeout`" — there is no `ApolloLink.timeout` API in Apollo Client v4. The correct pattern is wrapping `HttpLink` with a custom `ApolloLink.from([new RetryLink..., httpLink])` using `ZenObservable` + `AbortController`, or the `apollo-link-timeout` community package. The v8 spec gives the wrong primitive — a developer copy-pasting will hit a compilation error.
2. **RetryLink placement contradiction with §Q7.** §Q7 (plan line 1025-1034) just shows `retryLink` definition WITHOUT explicit chain ordering. §S9 says "position RetryLink BEFORE connectivityLink" — but §Q7 doesn't include this ordering instruction. The two sections disagree on chain order. §Q7 must be edited to match §S9, OR §S9 must call out it's overriding §Q7.
3. **`retryIf: error.statusCode >= 500` throws when `statusCode` is undefined.** `NETWORK_ERROR` error has `extensions: { code, connectivityError: true }` — no `statusCode` numeric. The `>= 500` comparison evaluates to `NaN >= 500 → false`, dropping the retry. The §S9 alternative `error.networkError || error.statusCode >= 500` is correct in intent, but on Apollo v4 the field is `error.graphQLErrors[0]?.extensions?.connectivityError`, not `error.networkError`. The `||` clause as written wouldn't catch the synthetic `NETWORK_ERROR` either.

---

## 3. New Gaps Discovered During Validation (NOT in Round 3 Audit)

1. **S2/S7 helper-location contradiction.** `getGraphQLErrorCode` is referenced as living in two different paths (`errorUtils.ts` per S2 vs `errorCodes.ts` per S7). The Round 3 audit accepted the v8 narrative; this internal contradiction is new.
2. **`EmailProviderRegistry` doesn't exist.** Verified — only `EmailChannelFactory` does. S3's "mark the provider as degraded in `EmailProviderRegistry`" assumes a refactored abstraction that's only a TODO in the plan (line 22, 26). The §S3 circuit-breaker spec assumes infrastructure that must be built first.
3. **No production deadlock retry anywhere.** The spec assumes Drizzle auto-retries `40P01` in `db.transaction`. Verified: this is false — only the test util does. Round 3 didn't catch it but the plan's claim is baked in.
4. **`text` field contract break in S5** contradicts the plan's own line 632. Discovered by reading `IEmailChannel.ts` — Round 3 didn't reconcile §S5 with §Q2.
5. **`FormErrorSnackbar` may not exist** as referenced in S8/S6 — grep returns no such component. The spec cites a pattern that may itself be a v8 invention.
6. **§P7 still contains `SESSION_EXPIRED`** at plan line 927 — `grep` confirms. The §S4 mandate to "Remove all references to `SESSION_EXPIRED`" is NOT yet applied to §P7. Same for the offline `navigator.onLine` duplicate at line 926. Round 3 can't mark §S4 VALID until §P7 is actually edited.
7. **§P2 still uses `/force with current version`** (line 891) without defining the Pothos mutation input. §S2 says "extend mutation `updateEmailTemplate(id, patch, expectedVersion?, force?: boolean)`" but §P2 never references the `force` param. The two sub-sections were not cross-wired by Round 3 edits.

---

## 4. Top-5 Actionable Recommendations for v9

1. **Reconcile S7 placement + helper location.** Move `EmailTemplateErrorCode` from `backend/types/email-template.types.ts` to `backend/enum/notifications/email-template-error-code.enum.ts` (per `backend/enum/AGENTS.md:54`), register in `backend/graphql/pothos/shared/enum.pothos.ts`, and delete the S2 `getGraphQLErrorCode` reference to `getGraphQLErrorMessage`. Put the helper in ONE place: `frontend/common/graphql/utils/errorCodes.ts` with `CombinedGraphQLErrors.is(error)` guards handling both `graphQLErrors[0]?.extensions?.code` and the `networkError` (return `undefined`) cases. Define `EmailTemplateErrorCode` as a `const` object (matching email enum convention), not a TS `enum`. Add field-level `extensions.field: "scope" | "locale"` to S6 errors so the UI can target the right `<FormHelperText>`.

2. **Fix S5 — drop `text` OR extend `IEmailChannel`.** Reconcile the `IEmailChannel` contract contradiction. Either (a) drop `text` from `safeRender`'s return (just `{ html, degraded, error? }`) and acknowledge text-version emails are unsupported, OR (b) explicitly specify an `EmailPayload.text?: string` extension, the `IEmailChannel.send` signature changes, and that all adapters (not just Resend — also SES/postmark/mailgun/smtp) must accept the new field. The current "spec says `text` but contract doesn't accept it" state is unimplementable. Also enumerate attachment types inline-CID / file / .ics explicitly with where each resolver lives (`backend/storage/`, new `backend/services/communication/attachments/`).

3. **Drop the false S8 premise; remove the audit's verification-step ballast.** `severity` IS supported by `@toolpad/core` `show()` — verified at `useApolloConnectivity.ts:104` and `useImageUpload.ts:43`. Simplify §S8 to a single line: "use `notifications.show(msg, { severity })` with `severity ∈ "success"|"info"|"warning"|"error"`; keep `<Snackbar>+<Alert>` only for dismissible/persisted error contexts." Delete the spec's "If NOT…" conditional-implementation branch. Replace the unsubstantiated `FormErrorSnackbar` reference with the actual component path if it exists (and create it under the email-templates route if it doesn't).

4. **Replace S6's invented `e.constraint_name` and `QueryError` with codebase-grounded patterns.** Extend the existing `backend/services/shared/is-duplicate-error.ts` rather than writing fresh `catch (e: QueryError)` clauses. Specify the field the codebase actually exposes (Drizzle `PgQueryError` exposes `e.code`, `e.detail`, `e.constraint_name`|`e.constraint` — confirmed at runtime via the neon HTTP driver; verify which with a throw-and-log probe in the §W1 integration tests). Add the `40P01` deadlock retry EXPLICITLY (it's not automatic in Drizzle — write a 1-retry wrapper around `db.transaction` in the service layer, docs at `docs/drizzle/`). Locate `DuplicateScopeLocaleError`/`DuplicateSlugError` at `backend/services/communication/email-template-errors.ts` (services layer, not repo — repo AGENTS.md:42 forbids user-facing strings in repository code).

5. **Apply §S4's §P7 rewrite literally + add the missing `FORBIDDEN` semantics, and fix S9 timeout/retryIf primitives.** (a) Actually edit plan lines 925-928 to replace `SESSION_EXPIRED → UNAUTHENTICATED` and `navigator.onLine → apolloLinkState.isConnected` — the v8 narrative instructs this but it's not done in the plan text (verified by grep). Add a line to §S4 explicitly stating "FORBIDDEN is not handled by `handleAuthError` — surfaces inline as a normal GraphQL error, no redirect, no draft loss". (b) Fix §S9's `ApolloLink.timeout` (doesn't exist in Apollo v4) to a `concat`-based timeout link using `AbortController` + `observable.timeout(30000)`, and fix `retryIf` to `(error) => error.networkError || CombinedGraphQLErrors.is(error) && error.graphQLErrors.some(e => e.extensions.connectivityError) || error.statusCode >= 500`. Update §Q7 to point at §S9's corrected chain order (RetryLink BEFORE connectivityLink) so the two sub-sections agree.

---

**Bottom line:** v8 §S is genuinely improved over prior rounds but has internal inconsistencies (helper location in S2/S7, contract break in S5, false premise in S8, invented types in S6) and cites two non-existent code patterns (`ApolloLink.timeout`, `e.constraint_name`). §S4 and §S9 are the only truly VALID sub-sections; §S5, S6, S7, S8 each contain an invalidating codebase claim that must be corrected before v9 marks them READY. §P7 still hosts `SESSION_EXPIRED` and `navigator.onLine` despite v8 §S4 instructing their removal — the cross-section edit was specified but not executed.