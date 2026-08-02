---
name: Email Template System (React Email + Editor)
overview: Adopt React Email + @react-email/editor as the typed, scoped, attachments-aware email template library. Multi-provider registry (Resend primary, SES/Postmark/Mailgun/SMTP swappable via env). Per-service EmailScope enum with discriminated-union registry of typed templates. Admin UI with @react-email/editor for body editing, frontend/common/views/dashboard email template management (tier-neutral ViewModel + mobile/desktop views), GraphQL CRUD + preview + send-test-email. DB-stored templates (Drizzle) with versioning, localization, permission-group gating per template.
todos:
  - id: "1"
    content: "Install dependencies: react-email, @react-email/editor@^1.1, @aws-sdk/client-ses, @aws-sdk/client-sesv2, postmark, mailgun.js, form-data, nodemailer, @types/nodemailer, isomorphic-dompurify, web-streams-polyfill (dev: @react-email/ui optional for preview server only)"
    status: pending
    note: "SWE review v2: was 'completed' but no code exists in codebase. Added isomorphic-dompurify (P0 sanitization) and web-streams-polyfill (Safari client-side preview). Added @aws-sdk/client-sesv2 for SES v2 attachment support. ✅ INSTALLED 2026-08-02: @aws-sdk/client-sesv2@3.1101.0 + isomorphic-dompurify@3.21.0 (runtime), @next/bundle-analyzer@16.2.12 (dev). Already installed: react-email@6.9.1, @react-email/editor@^1.1, @aws-sdk/client-ses, postmark, mailgun.js, form-data, nodemailer, @types/nodemailer, web-streams-polyfill (transitive), @smithy/fetch-http-handler. Remaining to install: none (deferring @react-email/ui until standalone preview server is needed). See .ai/plans/email-templates/reserch_node/15-newly-installed-packages-verification.md for per-package API verification + Bun smoke test results."
  - id: "2"
    content: Create EmailScope / EmailEditorPermission / EmailTemplateStatus enums + Drizzle pgEnums in backend/enum/email + backend/db/schema/enums.ts. Register new enums in backend/graphql/pothos/shared/enum.pothos.ts. NOTE: Do NOT add WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION to NotificationEventType in Phase 1 — defer to Phase 4 to avoid breaking Readonly<Record<NotificationEventType, ...>> compile-time exhaustiveness (see V3-8).
    status: pending
    note: "SWE review v2: was 'completed' but no code exists. Added 3 new NotificationEventType values (WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION) — they don't exist today but are required for account-flow email scopes. Must be added in Phase 1 for EVENT_TO_SCOPE mapping to compile when uncommented. SWE review v3: Adding these enum values WITHOUT uncommenting their EVENT_TO_SCOPE entries will break `Readonly<Record<NotificationEventType, EmailScope | null>>` — the Record type requires ALL enum values to have a mapping. Two options: (a) defer adding these enum values until Phase 4 when their mapping entries are also uncommented, OR (b) add them to the enum in Phase 1 AND uncomment their EVENT_TO_SCOPE entries (pointing to EmailScope.WELCOME etc.) in the same PR. Option (a) is safer — don't touch the enum until Phase 4."
  - id: "3"
    content: Move EmailPayload/EmailSendResult/IEmailChannel types to backend/types/email/emailChannel.types.ts and extend with attachments/inline-CID/text fields. Restrict EmailAttachment.content to Buffer only (not Buffer|string) to avoid base64-vs-path ambiguity across adapters.
    status: pending
    note: "SWE review: was 'completed' but no code exists. Added Buffer-only restriction per research file 04."
  - id: "3a"
    content: "Define mapEventTypeToEmailScope function in backend/services/communication/templates/event-to-scope.ts: (eventType: NotificationEventType) => EmailScope | null. Add compile-time exhaustiveness check via Readonly<Record<NotificationEventType, EmailScope | null>> + test verifying every NotificationEventType has a mapping (even if null). This is a P0 blocking dependency for Phase 3 dispatcher migration. Must enumerate all 24 NotificationEventType values (verified against backend/enum/notifications/notificationDeliveries.enum.ts + cross-referenced against EVENT_CHANNEL_ALLOWLIST in notification-dispatch.helpers.ts:39)."
    status: pending
    note: "SWE review v2: P0 gap — function is referenced in plan but never defined. 24 NotificationEventType values (not 22) → ~10 EmailScope values; not bijective. 3 account-flow enum values (WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION) don't exist in NotificationEventType — deferred to Phase 4 (V3-8: option (a)) to avoid breaking Readonly<Record<NotificationEventType, ...>>. 5 email-enabled events (CLASS_MARKED_ABSENT/MISSED/LEAVE_REQUESTED/RESCHEDULED/RESET + STUDENT_QUOTA_OVERRIDDEN) were missing from original mapping."
  - id: "4"
    content: "Build EmailProviderRegistry: extend existing EmailChannelFactory (hybrid approach) — adopt createRegistry pattern internally while preserving existing async init, caching, disconnect/cleanup semantics, and fallback-to-Resend behavior. Adapters: resend, SES (v2 SendEmailCommand), postmark, mailgun, smtp (production-grade — see V5-post-SMTP note)."
    status: pending
    note: "SWE review: was 'completed' but no code exists. Changed from pure createRegistry to hybrid — existing factory has cleanup/disposal semantics that createRegistry lacks. SMTP adapter must log runtime warning in production. SES adapter must use @aws-sdk/client-sesv2 for native attachment support. **V5-post-SMTP (2026-08-02): SMTP production restriction LIFTED.** Prior 'dev/test only' caveat was driven solely by Bun #10329 (nodemailer TLS socket flakiness under Bun). Confirmed deployment target is **Vercel + Node.js** (see next.config.ts serverExternalPackages: '@vercel/functions'), where nodemailer is the industry-standard SMTP library with zero caveats. SMTP is elevated to a first-class production provider alongside Resend/SES/Postmark/Mailgun. Remove the production warning log + the 'dev/test only' deployment-doc note. Adapter-level `encoding` literal-union cast (V1 nodemailer finding) still applies — `@types/nodemailer@8.0.1` types `encoding` as bare `string`."
  - id: "5"
    content: Refactor EmailChannelFactory to read EMAIL_PROVIDER from env-config-resolver and resolve channel via EmailProviderRegistry.get(provider). Acknowledge getEmailChannel() is ALREADY async in existing code — this is extending, not creating new async behavior.
    status: pending
    note: "SWE review: was 'completed' but no code exists. Plan incorrectly presented getEmailChannel() async as new work — it's already async at EmailChannelFactory.ts:67."
  - id: "6"
    content: Create React Email template component scaffolds under backend/services/communication/templates/components/* for each EmailScope
    status: pending
    note: "SWE review: was 'completed' but no code exists in codebase."
  - id: "7"
    content: "Build the discriminated-union EmailTemplateRegistry in email-template.registry.tsx: scope → typed-Props → component → subject fn → attachments fn → defaultEditorPermissions. Add RUNTIME scope guard: if (!EMAIL_TEMPLATES[scope]) throw new Error(`Unknown email scope: ${scope}`) in renderEmailTemplate before accessing registry."
    status: pending
    note: "SWE review: was 'completed' but no code exists. Added runtime scope guard for unknown scopes from DB."
  - id: "7a"
    content: "Add TipTap JSONContent schema validation at save time: validate designJson against an allowed-node-types allowlist before storing. Reject nodes with disallowed types (script, iframe, etc.). Use @tiptap/core schema enforcement or a custom JSONContent validator. This is the P0 XSS/SSTI mitigation — blocks attacks at the source (editor → save) instead of sanitizing at the sink."
    status: pending
    note: "SWE review: P0 security gap. User chose stricter schema-validation approach over post-hoc DOMPurify."
  - id: "7b"
    content: "Add safeRender() wrapper in email-template.registry.tsx: try/catch around await render(EmailComponent, props) with fallback plain-text notification on component throw. Log error via logger.error with scope + error details. Fallback text from getServerTranslations(locale).emailsTranslations.errors.renderFailed(scope). V4-10: renderFailed takes a bare-string argument (not an object)."
    status: pending
    note: "SWE review: P1 gap — no try/catch around render(). Component throw (undefined prop, missing translation key) crashes entire send. SWE review v3 (V3-7): Must verify that adding `errors` sub-namespace to `EmailsLabels` flows through `defineNamespace` in `shared/locale/namespaces/emails/emails.namespace.ts` → barrel export in `shared/locale/namespaces/translation.ts` → `Translations` type. If `defineNamespace` auto-wires extended types, `getServerTranslations(locale).emailsTranslations.errors.renderFailed(scope)` will compile. Add a compile-time `satisfies` assertion test to verify the namespace wiring."
  - id: "8"
    content: Extend shared/locale/types/emails/index.ts (en + ar) with labels for all EmailScopes including subject fn args + errors namespace. Use CORRECT call signature: getServerTranslations(locale).emailsTranslations.errors.* (NOT two-arg getServerTranslations(locale, 'emails.errors') — that signature does not exist and won't compile).
    status: pending
    note: "SWE review: was 'completed' but no code exists. Plan line 325 had factual i18n signature error — two-arg form won't compile. Added renderFailed(scope) to EmailsErrorLabels interface. V4-10: normalized to bare-string arg (was object form)."
  - id: "9"
    content: Run drizzle-hints + drizzle-generate skill workflow to create the email_templates + email_template_revisions migration. Include optimistic locking: version integer column with WHERE version = $1 check on update.
    status: pending
    note: "SWE review: was 'completed' but no migration exists. Added optimistic locking to prevent last-write-wins on concurrent edits."
  - id: "10"
    content: Create backend/types/email/email.types.ts with EmailTemplate{Select,Insert,Return,Submit}Type, EmailAttachmentInput, EmailAttachmentRules following canonical pattern. Include id field for Apollo cache normalization.
    status: pending
    note: "SWE review: was 'completed' but no code exists in codebase."
  - id: "11"
    content: Implement backend/db/repo/email/email-template.repository.ts with queryDb reads, findByScopeIds for DataLoader batching, and coverage tests under runInRollback. Add version increment + optimistic locking check on update.
    status: pending
    note: "SWE review: was 'completed' but no code exists. Added version increment on update for optimistic locking."
  - id: "12"
    content: "Implement backend/services/communication/email-template.service.ts: list/get/create/update/publish/archive/renderForSend/sendTest/previewHtml with authz against template.allowedEditorGroups. renderForSend must: (1) run runtime scope guard, (2) call safeRender() with try/catch, (3) sanitize compiledHtml with DOMPurify (isomorphic-dompurify) as defense-in-depth even after TipTap schema validation, (4) re-compile compiledHtml atomically in the same transaction as designJson save. sendTest must include per-user rate limiting (5 test emails/minute). publish/archive (status transitions DRAFT→PUBLISHED→ARCHIVED) must be wrapped in a database transaction: (a) set old active template to ARCHIVED, (b) set new template to PUBLISHED, (c) commit atomically — so there is never a window with zero or two active templates for the same scope+locale."
    status: pending
    note: "SWE review v2: added DOMPurify defense-in-depth, atomic re-compile, rate limiting per user, and transaction wrapping for template activation/deactivation. Without the transaction, a crash between steps (a) and (b) would leave the scope with no active template."
  - id: "12a"
    content: "Add preview XSS hardening: previewEmailTemplate query must set CSP headers (Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:) on the preview route. SWE review v5 (V5-3): img-src MUST be 'self' (NOT '*') to prevent tracking-pixel privacy leaks — a malicious template could embed <img src='https://attacker.com/track.png'> and leak viewer IP/UA. Remote email images are rendered server-side via React Email <Img> component; the preview iframe doesn't need to fetch arbitrary hosts. Use iframe sandbox='' (NOT 'allow-same-origin') — pure HTML preview needs NO same-origin access; sandbox='' creates a unique opaque origin with no script execution, no form submission, no storage access. If same-origin is later proven necessary (e.g., for react-email CSS assets), document the justification explicitly. Server-side sanitize rendered HTML before serving to preview iframe."
    status: pending
    note: "SWE review: preview iframe XSS model was under-specified. sandbox alone is insufficient."
  - id: "13"
    content: Refactor CommunicationService.dispatch email branch (communication.service.ts:37) to call EmailTemplateService.renderForSend(mapEventTypeToEmailScope(payload.eventType), templateProps, locale) and pass html and subject — renderForSend returns `{ html, subject, degraded, error? }` (NO text, NO attachments; the channel EmailPayload per IEmailChannel.ts is `{ to, subject, html, eventType, userId, metadata? }`). Add idempotency key (hash of scope + entityId + notificationEventId) to dedup duplicate sends. Gate behind EMAIL_TEMPLATES_ENABLED feature flag (todo 21c) — when false, use old passthrough path; when true, route through EmailTemplateService. Specify payload.body fallback: if renderForSend returns null (no template for scope), fall back to payload.body (the existing notification body) so no emails are lost during migration.
    status: pending
    note: "SWE review v2: added idempotency key + feature flag gating + payload.body fallback. Depends on todo 3a (mapEventTypeToEmailScope) — blocking dependency. Without the fallback, events without a mapped scope would silently drop emails. SWE review v3 (V3-11): `findByIdempotencyKey` method does NOT exist on NotificationRepository and `idempotencyKey` column does NOT exist on notificationDeliveries table. Must add: (1) `idempotencyKey: text('idempotency_key')` column to notificationDeliveries schema in backend/db/schema/communications/communications.ts:101, (2) `findByIdempotencyKey(key: string, tx)` method to NotificationRepository (namespaced function, not class — matches convention at backend/db/repo/notifications/notification.repository.ts:31), (3) unique partial index on idempotencyKey where status='sent'. SWE review v4 (V4-4): `idempotencyKey` is an established pattern on 6 tables — reuse the existing convention: students.ts:69, scheduling.ts:192, lesson-reports.ts:53, billing.ts:49 (invoices), billing.ts:100 (payments), credit-transactions.ts:25. Mirror the analogous findByIdempotencyKey lookup pattern from those repos. SWE review v4 (V4-8): use the Drizzle symbol `notificationDeliveries` (camelCase), not snake_case `notification_deliveries` — the table is defined in backend/db/schema/communications/communications.ts:101. SWE review v5 (V5-10): `notificationEventId` is a brand-new metadata key — it does NOT exist in `NotificationMetadataBase` (notification-alerts.metadata.types.ts:13-16, which has `entityId` but NOT `notificationEventId`) and is never set by any builder in notification-payloads.builders.ts. The idempotency hash uses `payload.metadata?.notificationEventId ?? ''` (optional chaining, falls back to ''). Without populating it, the hash degrades to 2-field (`scope:entityId`). Choose one: (a) add `notificationEventId?: string` to `NotificationMetadataBase` and have each builder in todo 18 set it from the notification event record ID, or (b) remove it from the hash and use `scope:entityId` only (document that same-scope+sentity events in the same window will dedup — which is the intended idempotency semantics). SWE review v5 (V5-1): no `tx` in dispatch scope — `findByIdempotencyKey` must be callable WITHOUT a transaction parameter (non-transactional `queryDb()` read). The call signature should be `findByIdempotencyKey(key: string)` NOT `findByIdempotencyKey(key: string, tx)`."
  - id: "14"
    content: Add Pothos object + queries + mutations for emailTemplates and emailTemplatePreview under backend/graphql/pothos/email + backend/graphql/{query,mutation}/email. Verify superAdmin authScope handles impersonation (add notImpersonating: true to authScopes). sendTestEmail is a mutation (side-effect).
    status: pending
    note: "SWE review: added notImpersonating: true to authScopes. Plan already had this at line 477 but should be explicit in todo."
  - id: "15"
    content: Add GraphQL documents under frontend/common/graphql/sharedDocuments/email/documents.ts + index.ts barrel; export from sharedDocuments/index.ts; include id on all selection sets; run generate:gqlSchema && codegen
    status: pending
  - id: "16"
    content: "Build frontend/common/views/dashboard/email-templates/* (ViewModel + Container + switcher) + frontend/mobile|desktop/views/dashboard/email-templates/* tier views; Zustand store at frontend/common/stores/emailTemplateEditorStore.ts with isDirty flag + beforeunload handler + route-change prompt; Storybook stories. Do NOT persist designJson to localStorage (can be large). Lazy-load Prism.js grammars only in editor route (Turbopack dev slowdown)."
    status: pending
    note: "SWE review: added dirty state tracking (isDirty + beforeunload), localStorage exclusion, Prism.js lazy-loading. SWE review v5 (V5-8): the codebase has NO separate Storybook mock-store convention — existing stores (e.g. adminComplaintsStore.ts:34) use `create()` inline. Storybook stories render containers with `args: {}` and no store override (see AdminComplaintsContainer.stories.tsx). Follow this existing pattern: use inline `create()` for the store; for Storybook, render the editor container with args (no mock-store factory needed if the ViewModel hook is self-contained)."
  - id: "16a"
    content: "Add error handling on EmailEditorRef async save flow: wrap getJSON() + getEmail() in try/catch. Use a single GraphQL mutation that accepts both designJson and compiledHtml atomically (not separate saves). Handle getEmail() throw gracefully with user-visible error message. SWE review v2: getJSON() is synchronous (returns JSONContent directly, no Promise) — use it for designJson save. getEmail() is async (returns Promise<{html, text}>) — use it for compiled HTML/text output. Do NOT await getJSON()."
    status: pending
    note: "SWE review: no error handling on async save flow. Partial save (JSON saves, HTML fails) must be atomic."
  - id: "17"
    content: Add admin routes app/(dashboard)/email-templates/page.tsx and [id]/page.tsx with requirePermissionForPage + RequirePermission defense-in-depth
    status: pending
  - id: "18"
    content: Update notification-dispatch.helpers + notification-payloads.builders to populate payload.templateProps for each event so the email channel render path has typed data
    status: pending
  - id: "19"
    content: Write seedOrGet in backend/db/seeds/notifications/seed-email-templates.ts (one row per EmailScope per locale via EmailTemplateService bootstrap); add to notifications/index.ts + master seeds/index.ts
    status: pending
    note: "v9 §Y3 correction: seeds are Phase 2 (after schema migration creates the email_templates table), NOT Phase 1. The v2 note saying 'Phase 1' was wrong — Phase 1 has no DB schema, so seeds would have no table to write to. The registry defines scopes in Phase 1 (code-only); the seeds create initial DB rows in Phase 2 once the schema exists."
  - id: "20"
    content: Add integration smokes for SES/Postmark/Mailgun/SMTP in test/integration/communication/*.integration.test.ts gated by describeLiveWhen. Add end-to-end integration test: trigger notification event → mapEventTypeToEmailScope → render template → send via mock adapter → verify delivery row.
    status: pending
    note: "SWE review: added E2E integration test covering full pipeline."
  - id: "20a"
    content: "Add bounce/complaint webhook endpoints for each provider (Resend, SES, Postmark). Update NotificationDeliveryStatus based on webhook events (BOUNCED, COMPLAINED). The infrastructure for delivery status tracking already exists (NotificationDeliveryStatus enum has 5 values: PENDING, SENT, DELIVERED, OPENED, FAILED) but is unused."
    status: pending
    note: "SWE review: P1 gap — without bounce handling, delivery status never transitions past SENT."
  - id: "20b"
    content: "Add bundle size analysis: verify editor route is code-split and TipTap + Prism.js don't bloat the main bundle. ✅ INSTALLED 2026-08-02: @next/bundle-analyzer@16.2.12 added as devDependency. Verify the editor route's JS chunk is code-split from the main bundle via `NEXT_BUNDLE_ANALYZER=enabled bun run build`. See .ai/plans/email-templates/reserch_node/15-newly-installed-packages-verification.md for API + wiring pattern."
    status: pending
    note: "SWE review: P2 — TipTap + Prism.js in admin route adds significant JS."
  - id: "21"
    content: Run bun quality-gate:fresh and resolve any tsgo/biome/lint/codescene/sonar issues; verify per-file via scripts/health/sub-loop.ts
    status: pending
  - id: "21a"
    content: "Run generate:gqlSchema && codegen after all Pothos + GraphQL document changes are complete (after todos 14-15). This MUST be done before any frontend code that imports generated types."
    status: pending
    note: "SWE review v2: missing explicit codegen step — plan references generated types but never schedules the generation."
  - id: "21b"
    content: "Phase 0 GO/NO-GO gate: verify isomorphic-dompurify Bun compatibility BEFORE writing safeRender. Create a minimal test script that imports and uses DOMPurify.sanitize() under Bun runtime. If it fails, fall back to server-side jsdom + dompurify wiring (Bun-compatible per Bun+jsdom docs) and update todo 1 + 12. If it passes, proceed with isomorphic-dompurify."
    status: pending
    note: "SWE review v2: research file 11 does not test isomorphic-dompurify with Bun — unverified runtime compatibility. SWE review v4 (V4-6): promoted to Phase 0 GO/NO-GO gate — this verification MUST happen before any implementation of safeRender. ✅ VERIFIED 2026-08-02: isomorphic-dompurify@3.21.0 installed + Bun 1.3.14 smoke test PASSED (strips <script> + onerror, isSupported=true). Phase 0 gate is GREEN — proceed with isomorphic-dompurify directly; jsdom fallback (V4-6) is NOT required. See .ai/plans/email-templates/reserch_node/15-newly-installed-packages-verification.md."
  - id: "21c"
    content: "Add EMAIL_TEMPLATES_ENABLED feature flag (env var) to gate dispatcher migration in Phase 3. When false, dispatcher uses old passthrough email path; when true, dispatcher routes through EmailTemplateService.renderForSend. This allows safe rollout + instant rollback."
    status: pending
    note: "SWE review v2: no feature flag for dispatcher migration — risky cutover without rollback path. SWE review v4 (V4-9): MUST register `EMAIL_TEMPLATES_ENABLED` in backend/lib/env-config-keys.ts alongside IS_DEMO (line 510) as a boolean flag, default false. SWE review v5 (V5-2 CRITICAL BUG): `resolveEnvConfig(key)` returns `Promise<string | undefined>` — NEVER a boolean. The string `'false'` is TRUTHY in JS, so `if (await resolveEnvConfig('EMAIL_TEMPLATES_ENABLED'))` would be true even when admin sets it to 'false' — the exact opposite of the intended default-off behavior. CONSUMPTION MUST use `getBooleanEnv('EMAIL_TEMPLATES_ENABLED')` from `@/backend/lib/env` (env.ts:70-71), which returns `true` only when the value is literally `=== 'true'` — the same pattern IS_DEMO uses at env.ts:354. Registration: `excludeFromDb: true, serverOnly: true` (matching IS_DEMO at env-config-keys.ts:510). Do NOT use `resolveEnvConfig('EMAIL_TEMPLATES_ENABLED')` as a truthy gate under any circumstances."
  - id: "22"
    content: "§S — Error handling infrastructure: create safeRender degraded-mode signal (S5), services-layer error classes for constraint mapping (S6), const-object error code registry in backend/enum/ (S7). Probe Drizzle constraint field name via throw-and-log test in §W1."
    status: pending
    note: "Phase 1 (registry/errors) + Phase 2 (GraphQL error mapping)."
  - id: "23"
    content: "§T — Performance: implement memoization for all editor components (T1, React Compiler OFF), dynamic fetchPolicy based on isDirty ref (T2), AbortSignal-less Promise.race render timeout (T10)."
    status: pending
    note: "Phase 2. T6 bundle analysis deferred to Phase 4."
  - id: "24"
    content: "§U — Security: Email scalar with CRLF rejection + code mapping (U2), authScopes with explicit boolean flags (U3), atomic rate limiter using Lua/Redis or pg_advisory_xact_lock/Postgres (U7)."
    status: pending
    note: "Phase 1 (U1 Email scalar) + Phase 2 (U3 authScope, U7 rate limit)."
  - id: "25"
    content: "§V — Accessibility & RTL: CSS srOnly pattern (not sx shorthand) for aria-live regions (V3), dnd-kit Accessibility announcements object + onDragCancel + defaultAnnouncements merge (V7), spread DraggableAttributes on inner div (V8)."
    status: pending
    note: "Phase 2 — ships with UI."
  - id: "26"
    content: "§W — Testing: inline MockLink.MockedResponse in stories (W2), TestWrapper for component tests (W4), two db.transaction in Promise.all for concurrency test (W5)."
    status: pending
    note: "Phase 1 (W1 probe) + Phase 2 (W2-W4) + Phase 3 (W5 concurrency)."
  - id: "27"
    content: "§X — DX: single-command bring-up using Bun.spawn (X1), mock email adapter at backend/services/communication/channels/email/mock/ (X4), visual regression with bun:test + AxeBuilder (X6)."
    status: pending
    note: "Phase 1 (X1) + Phase 2 (X4) + Phase 4 (X6)."
  - id: "28"
    content: "§Y — Migration: custom .custom-migrations.json manifest via bun run db (Y1), seed default templates in Phase 2 (Y3), getEnvArray helper (Y6), logger.error + Vercel log drain monitoring (Y7 — no Slack)."
    status: pending
    note: "Phase 1 (Y1) + Phase 2 (Y3 seeds) + Phase 3 (Y5 rollback)."
  - id: "29"
    content: "§Z — Implementation patterns: EmailLabels in shared/locale/types/emails/ (Z1), ComplaintReturnType.title via body.slice(0,50)+'…' option c (Z3), EmailAttachmentEncoding enum via createPgEnumFromEnum (Z4), messages.ts path + @/ alias (Z8)."
    status: pending
    note: "Phase 1 (Z1-Z4) + Phase 2 (Z6-Z8)."
  - id: "30"
    content: "§G — Accessibility & Interaction Patterns: usePrefersReducedMotion hook in frontend/common/stores/preferencesStore.ts (G1), button loading convention governance (G2), idempotencyKey in all mutations (G3), keyboard shortcuts table (G4)."
    status: pending
    note: "Phase 2 — ships with editor UI."
  - id: "31"
    content: "§H — Validation schemas in shared/lib/validations/emailTemplate.ts: SaveDraftSchema (H1), PublishSchema (H2), SendTestSchema (H3), MergeTagSchema (H4), DesignJsonSchema (H5)."
    status: pending
    note: "Phase 1 (H1-H2 type-level) + Phase 2 (H3-H5 UI-level)."


## Email Template System — Implementation Plan

### Library decision (rooted in research + your decisions; verified deep online research 2026-08-01)

**Adopt [React Email v6](https://react.email) (`react-email@^6`) paired with [`@react-email/editor@^1.1`](https://react.email/docs/editor/overview).**

Install set (corrected after v6 research — `react-email@6` unified `@react-email/components` + `@react-email/render` INTO itself; only the editor and the dev-only preview-server package remain separate):
```sh
bun add react-email @react-email/editor@^1.1 @aws-sdk/client-ses postmark mailgun.js form-data nodemailer @types/nodemailer
# recommended for SES attachments (SES API v2 — simpler than v1 SendRawEmailCommand MIME):
bun add @aws-sdk/client-sesv2
# optional, only if running the standalone `react-email dev` preview server:
bun add -D @react-email/ui
```
Drop from the previous draft: `@react-email/components`, `@react-email/render`, `@react-email/ui` runtime, `@tiptap/*` (bundled transitively by `@react-email/editor`).

This is the **only** library that simultaneously delivers all four user requirements:

1. **Type-safe template params**: React Email templates are React components with typed props (`EmailProps` interface). The registry is a hand-rolled discriminated-union mapped type keyed by a backend `EmailScope` enum (see [TypeScript#47109](https://github.com/microsoft/TypeScript/pull/47109) pattern below) — compile-time exhaustiveness, no string unions, never collapses to `never`.
2. **Per-template scopes**: We define a backend `EmailScope` enum (one entry per sending service). Each scope key in the registry carries its `Props` type referencing existing `backend/types/{entity}.types.ts` selection types (`InvoiceReturnType`, `ClassReturnType`, etc.).
3. **Images + attachments**: `react-email` `<Img>` for remote/inline images; Resend/Nodemailer/SES adapter attachments API supports `contentId` for `cid:` inline images and buffered/base64 attachments (max 40 MB per Resend; **10 MB outbound cap for SES**; Mailgun uses top-level `inline` field with `Content-ID` derived from filename; Postmark is base64-string-only). Resend: named export `import { Resend } from "resend"`; send payload type is `CreateEmailOptions` with camelCase attachment fields (`contentType`, `contentId` — inline images set via `contentId`, no `inline` boolean). Existing `ResendEmailAdapter.ts` does NOT yet plumb `attachments`/`text`/`cc`/`bcc`/`replyTo`/`headers` — extend it when building the multi-provider registry.
4. **Config/edit/create/update/view in admin UI**: `@react-email/editor` is the embeddable TipTap-based visual editor. Important: the editor edits an **opaque TipTap `JSONContent` blob** carrying no per-template type information — typed props live in the code scaffold (`backend/services/communication/templates/components/*`); the DB override re-renders body regions only and typed props are still passed from the registry at render time. Templates are stored in DB with `designJson` + compiled `htmlBody`, edited via GraphQL mutations, previewed before send. `EmailEditorRef` API (verified in `node_modules`): `getJSON(): JSONContent`, `getEmail(): Promise<{ html, text }>`, `getEmailHtml()`, `getEmailText()`, `editor: Editor | null`.

Rejected alternatives (rationale):
- **MJML** — untyped XML, breaks "no text union types, only enums + TS types" requirement; lacks in-app visual editor.
- **Unlayer `react-email-editor`** — freemium SaaS-dependent, dumps JSON+HTML not React Email typed components; violates "typesafe registry" goal.
- **`@devhiteshk/email-template-editor`** — MUI-themed but unmaintained fork; does not produce React Email output.
- **`react-email-handlebars`** — only needed if you want DB-stored dynamic content with runtime variable substitution. Our `EmailScope` enum + typed-props registry gets type safety **at the registry layer**; for body-only edits we store the visual editor's serialized HTML separately (template scaffolding stays typed in code).

```mermaid
flowchart LR
ServiceCall["Domain Service<br/>(Billing, Class, Complaint)"] -->|templateScope: EmailScope.INVOICE_GENERATED + entity data| Registry["EmailTemplateRegistry<br/>(discriminated union: scope → Component → Props)"]
Registry --> Component["React Email Component (typed props)"]
Component --> EditorJson["designJson from DB?<br/>yes: @react-email/editor<br/>re-renders body with typed props"]
Component --> Render["@react-email/render → html + text"]
Registry --> Attachments["Attachment resolver<br/>(per-scope attachment fn)"]
Render --> ProviderRegistry["EmailProviderRegistry<br/>(resend | ses | postmark | mailgun | smtp)"]
Attachments --> ProviderRegistry
ProviderRegistry -->|send| NotificationRepo["NotificationRepository.createDelivery"]
```

### Scope enum design (your "template must correspond to one service enum" + "register defines entities per template")

New: [`backend/enum/email/emailTemplates.enum.ts`](backend/enum/email/emailTemplates.enum.ts)

```ts
export enum EmailScope {
  // one entry per sending service / event that wants email
  COMPLAINT_RESPONSE = "COMPLAINT_RESPONSE",
  SUGGESTION_ACKNOWLEDGED = "SUGGESTION_ACKNOWLEDGED",
  INVOICE_GENERATED = "INVOICE_GENERATED",
  INVOICE_STATUS_CHANGED = "INVOICE_STATUS_CHANGED",
  PAYMENT_METHOD_CHANGED = "PAYMENT_METHOD_CHANGED",
  CLASS_LIFECYCLE = "CLASS_LIFECYCLE",        // class scheduled/completed/cancelled/...
  STUDENT_LIFECYCLE = "STUDENT_LIFECYCLE",     // reassigned/status-changed/quota
  LESSON_REPORT_SUBMITTED = "LESSON_REPORT_SUBMITTED",
  LESSON_REPORT_REVIEWED = "LESSON_REPORT_REVIEWED",
  CLASS_REMINDER = "CLASS_REMINDER",
  // account flows (NEW — currently missing)
  WELCOME = "WELCOME",
  PASSWORD_RESET = "PASSWORD_RESET",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
}

export enum EmailEditorPermission {
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  SUPERVISOR = "SUPERVISOR",
}

export enum EmailTemplateStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}
```

Note: `EmailScope` differs from existing `NotificationEventType` ([backend/enum/notifications/notificationDeliveries.enum.ts](backend/enum/notifications/notificationDeliveries.enum.ts)). The notification event carries the *trigger*; the email scope carries the *template family*. Many events map to one scope (e.g., all class lifecycle events share `EmailScope.CLASS_LIFECYCLE` because they share one template layout that branches on event kind).

### Typed template registry (the heart of type safety)

New: [`backend/services/communication/templates/email-template.registry.tsx`](backend/services/communication/templates/email-template.registry.tsx)

> **SWE review v5 (V5-6):** There are ZERO `.tsx` files anywhere in the backend today (`find backend -name "*.tsx"` → empty). This file establishes the first `.tsx` precedent in the backend service layer. `tsconfig.json:14` enables `jsx: "react-jsx"` and `:38` includes `**/*.tsx`, so it compiles. However, ESLint/Biome rule overrides for `.tsx` in `backend/` may not be calibrated. **Phase 1 verification: run `bun tsgo` + `bun biome:check` + lint-queue-client on the new `.tsx` files immediately after creation.** Alternative if lint/build issues surface: use `React.createElement()` calls in `.ts` files instead of JSX (keeps backend `.ts`-only). The registry file would become `email-template.registry.ts`.

The original draft used `EmailTemplateProps<S> = Parameters<(typeof EMAIL_TEMPLATES)[S]["component"]>[0]` inside an `as const` literal with per-entry `satisfies`. Research ([TypeScript#47109](https://github.com/microsoft/TypeScript/pull/47109), validated against tsgo 7.0.2) shows this collapses to the **intersection of all prop interfaces** — effectively `never` for non-overlapping props. The corrected pattern requires a declarative `EmailPropsByScope` base map + an explicit mapped type + a `defineEmailTemplate<P>` helper, then re-binds through the mapped type. Adding an `EmailScope` case requires adding an entry to both `EmailPropsByScope` and the literal — that's the exhaustiveness guarantee.

```tsx
import type { ComponentType } from "react";
import { EmailScope, EmailEditorPermission } from "@/backend/enum/email";
import type { AttachmentInput } from "@/backend/types/email/email.types";
import type { ComplaintReturnType, InvoiceReturnType } from "@/backend/types";
// React Email components imported with the v6 single-package import path:
import { ComplaintResponseEmail, InvoiceGeneratedEmail } from "./components";

// 1. Per-scope typed props (only enums + TS types — no string unions)
export interface ComplaintResponseEmailProps {
  parentName: string;
  complaint: ComplaintReturnType;        // related entity
  responseText: string;
  respondedAt: Date;
}
export interface InvoiceGeneratedEmailProps {
  invoice: InvoiceReturnType;            // related entity
  recipientName: string;
}
// …one interface per remaining EmailScope case…

// 2. Shape of every registry entry, generic in its own props P.
export interface EmailTemplateDefinition<P> {
  readonly component: ComponentType<P>;
  readonly subject: (props: P, locale: string) => string;
  readonly defaultEditorPermissions: readonly EmailEditorPermission[];
  readonly attachments?: (props: P, locale: string) => Promise<readonly AttachmentInput[]>;
  readonly defaultLocaleTexts: (locale: string) => { readonly greeting: string; readonly footer: string };
}

// 3. THE KEY STEP — declarative map from EmailScope case to its props interface.
//    This is the "base mapping" that #47109 needs. Adding an EmailScope case
//    REQUIRES an entry here — that's the exhaustiveness guarantee.
export interface EmailPropsByScope {
  readonly [EmailScope.COMPLAINT_RESPONSE]: ComplaintResponseEmailProps;
  readonly [EmailScope.INVOICE_GENERATED]: InvoiceGeneratedEmailProps;
  // …one mapping per remaining EmailScope case…
}

// 4. Mapped-type view of the registry. Indexing this with generic S yields
//    EmailTemplateDefinition<EmailPropsByScope[S]> — the correlated narrowing
//    TS could NOT see from a structural literal alone.
export type EmailTemplateRegistry = {
  readonly [S in EmailScope]: EmailTemplateDefinition<EmailPropsByScope[S]>;
};

// 5. Per-entry builder: keeps inline `satisfies` validation AND per-entry
//    intellisense on `subject` / `attachments` / `defaultLocaleTexts` callbacks.
export function defineEmailTemplate<P>(
  def: EmailTemplateDefinition<P>,
): EmailTemplateDefinition<P> {
  return def;
}

// 6. Structural literal with per-entry builder. Computed enum-member keys are
//    single literal types (TypeScript#13948) — preserved as named properties.
const _EMAIL_TEMPLATES = {
  [EmailScope.COMPLAINT_RESPONSE]: defineEmailTemplate<ComplaintResponseEmailProps>({
    component: ComplaintResponseEmail,
    subject: (p, _l) => `Re: ${p.complaint.title}`,
    defaultEditorPermissions: [EmailEditorPermission.ADMIN],
    attachments: async (p, _l) => [{ filename: "response.pdf", content: Buffer.from(p.responseText) }],
    defaultLocaleTexts: (_l) => ({ greeting: "Dear parent,", footer: "Siraj Academy" }),
  }),
  [EmailScope.INVOICE_GENERATED]: defineEmailTemplate<InvoiceGeneratedEmailProps>({
    component: InvoiceGeneratedEmail,
    subject: (p, _l) => `Invoice ${p.invoice.number}`,
    defaultEditorPermissions: [EmailEditorPermission.ADMIN, EmailEditorPermission.STAFF],
    defaultLocaleTexts: (_l) => ({ greeting: "Dear parent,", footer: "Siraj Academy" }),
  }),
  // …one entry per remaining EmailScope case…
} as const satisfies EmailTemplateRegistry;
//   ↑ `as const satisfies EmailTemplateRegistry` (in that order) — the
//     documented-safe idiom (https://typescriptworld.com/typescript-satisfies-operator-deep-dive).
//     Order matters; reversing would error.

// 7. THE SECOND KEY STEP — re-bind the literal through the mapped type
//    annotation. `_EMAIL_TEMPLATES` has the structural shape; `EMAIL_TEMPLATES`
//    has the *mapped-type* representation TS needs to follow the S↔P
//    correlation during generic indexing. (mirrors jcalz's `_verbs`→`verbs`
//    rename pattern from #47109.)
export const EMAIL_TEMPLATES: EmailTemplateRegistry = _EMAIL_TEMPLATES;

// 8. Per-scope props via indexed access into EmailPropsByScope — directly.
//    No `Parameters<…>` unwrap needed (TS treats such generic unwraps as
//    opaque). Adds `ComponentProps<EmailTemplateRegistry[S]["component"]>`
//    alias for parity.
export type EmailTemplateProps<S extends EmailScope> = EmailPropsByScope[S];

// 9. renderEmailTemplate now type-checks inside its body AND narrows
//    correctly at call sites.
export async function renderEmailTemplate<S extends EmailScope>(
  scope: S,
  props: EmailTemplateProps<S>,
  locale: string,
  opts?: { readonly designJsonOverride?: string },
): Promise<{ readonly html: string; readonly text: string; readonly subject: string; readonly attachments: readonly AttachmentInput[] }> {
  // Runtime scope guard — P0: unknown scope from DB must throw, not crash
  const def: EmailTemplateDefinition<EmailPropsByScope[S]> = EMAIL_TEMPLATES[scope];
  if (!def) throw new Error(`Unknown email scope: ${scope as string}`);
  //  ↑ indexed access into the MAPPED TYPE — TS keeps correlation

  const subject = def.subject(props, locale); // ✅ props is EmailPropsByScope[S]
  const attachments = def.attachments ? await def.attachments(props, locale) : [];
  // … then either render @react-email component or rehydrate DB designJson:
  //   const { html, text } = await safeRender(scope, props, locale, opts);
  // If opts.designJsonOverride is present, the @react-email/editor serialized
  // JSON re-renders the body regions only — typed props still drive the
  // scaffold header/footer/subject/attachments.
  // HTML is sanitized via DOMPurify (isomorphic-dompurify) in safeRender.
  return { html: "", text: "", subject, attachments };
}
```

This pattern satisfies: typesafe, no text unions, only enums/types, each scope has its related entities, only registered scopes sendable. Relies on [microsoft/TypeScript#47109](https://github.com/microsoft/TypeScript/pull/47109) (mapped-type + base-map recipe); validated against `tsgo` 7.0.2 — full parity with TS 6.0/5.9 type checker (see [research file 06](.ai/plans/email-templates/reserch/06-typed-registry-pattern.md)).

**Note on the editor's role**: `@react-email/editor`'s `getJSON()` returns opaque TipTap `JSONContent` — typed component props never enter the editor. Body-only edits preserve typed-props only via application-layer discipline (route-level UI restricts editing to body regions; the code scaffold's typed props still drive subject/attachments/header/footer at render time). **P0 XSS/SSTI mitigation (SWE review):** `designJson` is validated against an allowed-node-types allowlist at save time (todo 7a), and `compiledHtml` is sanitized with DOMPurify (`isomorphic-dompurify`) at render time as defense-in-depth (todo 12). Both layers are required — schema validation blocks attacks at the source, DOMPurify catches any remaining vectors.

**Compile-time guard test**: add [`backend/services/communication/templates/__tests__/email-template.registry.types.test.ts`](backend/services/communication/templates/__tests__/email-template.registry.types.test.ts) containing `// @ts-expect-error` assertions on wrong-scope calls and `satisfies` checks on right-scope calls so any TS upgrade silently breaking the narrowing will fail the build.

### Multi-provider registry (your "multi-provider swappable from env")

Refactor [`backend/services/communication/channels/email/EmailChannelFactory.ts`](backend/services/communication/channels/email/EmailChannelFactory.ts) into a provider registry using a **hybrid approach** (SWE review decision): adopt the `createRegistry` pattern internally while preserving the existing factory's async init, caching, `disconnect()` cleanup semantics, and fallback-to-Resend behavior. The makerkit `@kit/shared/registry` `createRegistry` API referenced in research is **makerkit's private monorepo workspace package — not on npm**; we lift ~30 LOC of the source into our own [`backend/lib/registry.ts`](backend/lib/registry.ts) (it's generic enough to reuse for SMS/Push/FX provider registries later). The full `createRegistry<IEmailChannel, EmailProviderName>()` semantics are documented in [research file 05](.ai/plans/email-templates/reserch/05-provider-registry-pattern.md). **Migration note:** `createRegistry` lacks disposal/cleanup semantics and throws on unknown providers (vs current fallback-to-Resend). The hybrid approach wraps `createRegistry` inside the existing factory to preserve both behaviors.

`EmailProviderName` lives in canonical location per [backend/types/AGENTS.md](backend/types/AGENTS.md) — move to [`backend/types/email/emailChannel.types.ts`](backend/types/email/emailChannel.types.ts) alongside `IEmailChannel` / `EmailPayload` / `EmailSendResult` (currently mislocated in the service layer).

New: [`backend/services/communication/channels/email/EmailProviderRegistry.ts`](backend/services/communication/channels/email/EmailProviderRegistry.ts)

```ts
import { createRegistry } from "@/backend/lib/registry";
import type { EmailProviderName, IEmailChannel } from "@/backend/types/email/emailChannel.types";

export const emailProviderRegistry = createRegistry<IEmailChannel, EmailProviderName>();

emailProviderRegistry
  .register("resend",   async () => new ResendEmailAdapter(await loadResendConfig()))   // returns this (chainable)
  .register("ses",      async () => new SesEmailAdapter(await loadSesConfig()))
  .register("postmark", async () => new PostmarkEmailAdapter(await loadPostmarkConfig()))
  .register("mailgun",  async () => new MailgunEmailAdapter(await loadMailgunConfig()))
  .register("smtp",     async () => new SmtpEmailAdapter(await loadSmtpConfig()));

export async function getEmailChannel(): Promise<IEmailChannel> {
  const provider = (await resolveEnvConfig("EMAIL_PROVIDER") ?? "resend") as EmailProviderName;
  // emailProviderRegistry.get(provider) returns Promise<IEmailChannel> — always await.
  // THROWS `Unknown provider "<name>"` on unregistered names (today's EmailChannelFactory
  // falls back to Resend — the new behavior breaks explicitly with a throw).
  return emailProviderRegistry.get(provider);
}

// preserve resetEmailChannel cache-invalidation semantics from the current factory
// SWE review v2: actual signature in EmailChannelFactory.ts is `void` (not `Promise<void>`)
// — disconnect() is synchronous. Keep the existing signature to avoid unnecessary async wrapper.
// SWE review v3: `void` function MUST NOT use `await` (TS error) and `createRegistry` has no
// `peek()` method (only register/get/addSetup/setup). Use the module-level `instance` variable
// (line 5 of EmailChannelFactory.ts) to disconnect synchronously — matches existing pattern.
// SWE review v4 (V4-1): Do NOT reassign `emailChannel` (the const facade at line 100) —
// TS2588 compile error. Operate on `let instance` (line 5) instead. The facade stays alive
// for the lifetime of the process; only the underlying instance is reset.
export function resetEmailChannel(): void {
  invalidateEnvConfigCache("EMAIL_PROVIDER");
  invalidateEnvConfigCache("RESEND_API_KEY");
  invalidateEnvConfigCache("RESEND_FROM_EMAIL");
  // (add SES / Postmark / Mailgun / SMTP env keys for each new provider)
  if (instance) {
    instance.disconnect?.();  // fire-and-forget Promise<void>, matches existing latent-drop at line 89
    instance = null;
    initializationPromise = null;
  }
}
```

`emailChannel` facade wrapper shape unchanged (already used throughout services); make sure `getEmailChannel()` is awaited since `get()` is async.

Adapters to implement (each is realistically ~200 LOC, not the originally-stated ~80 LOC, once attachments + inline-image handling + delivery-row bookkeeping are included):
- `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts` — **extend existing adapter** (not rewrite): `import { Resend } from "resend"` (named export, not default); `resend.emails.send(payload: CreateEmailOptions)`; attachment fields are camelCase (`contentType`, `contentId` — inline via `contentId`, no `inline` boolean). Today only sends `from`/`to`/`subject`/`html` — add `text`, `attachments`, `cc`, `bcc`, `replyTo`, `headers` from expanded `EmailPayload`.
- `backend/services/communication/channels/email/ses/SesEmailAdapter.ts` — **choose one path** (installed today: `@aws-sdk/client-ses@3.x` = SES API **v1**, which does NOT support `Content.Simple.Attachments[]` on `SendEmailCommand`):
  - **(a) Recommended**: `bun add @aws-sdk/client-sesv2` and use SESv2 `SendEmailCommand` with `Content.Simple.Attachments[]` (`RawContent: Uint8Array`, `FileName`, optional `ContentType`/`ContentDisposition`/`ContentId`). Outbound cap is **10 MB** (not 40 MB).
  - **(b) Stay on v1**: use `SendRawEmailCommand` with hand-built `multipart/mixed` MIME for **all** attachments (`RawMessage.Data: Uint8Array`), regardless of size.
  - Both paths: use `@smithy/fetch-http-handler` for Bun compatibility (avoids Bun 1.3.x HTTPS-hang #26066).
- `backend/services/communication/channels/email/postmark/PostmarkEmailAdapter.ts` — `postmark` npm; attachments are **base64-string only** (convert Buffers via `.toString("base64")`); check `response.ErrorCode === 0` for soft failures.
- `backend/services/communication/channels/email/mailgun/MailgunEmailAdapter.ts` — `mailgun.js` + `form-data`; two-stage init: `const mg = new Mailgun(FormData).client({ username: "api", key, url?, public_key? })` (pass the `form-data` **class**, not options); send via `mg.messages.create(domain, data)` only (no `.send()`); `inline` is a **top-level field** on the send call with `Content-ID` derived from the filename (NOT a `contentId` field on each attachment). Map `EmailAttachment → { data, filename, contentType }`.
- `backend/services/communication/channels/email/smtp/SmtpEmailAdapter.ts` — `nodemailer` + `@types/nodemailer`; `@types/nodemailer@8.0.1` types `encoding` as bare `string` (not a literal union) — declare adapter-level literal union and cast before passing to nodemailer if compile-time enforcement is desired. **V5-post-SMTP (2026-08-02): Production-grade adapter.** Prior 'dev/testing only' restriction was lifted because the deployment target is Vercel + Node.js (next.config.ts already has `@vercel/functions` in `serverExternalPackages`), where `nodemailer` is rock-solid. The Bun #10329 socket-flakiness issue does not apply under Node runtime. Deployment docs should state SMTP as a supported production provider (alongside Resend/SES/Postmark/Mailgun), not a dev-only fallback. Local development CAN still run on Bun for dev loop speed — but `SmtpEmailAdapter` is production-safe when run under Node.

Move `IEmailChannel`, `EmailPayload`, `EmailSendResult`, `EmailProvider` / `EmailProviderName` types to canonical location per [backend/types/AGENTS.md](backend/types/AGENTS.md):
[`backend/types/email/emailChannel.types.ts`](backend/types/email/emailChannel.types.ts)

Extend `EmailPayload` to carry attachments + inline image CIDs:
```ts
export interface EmailPayload {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
  readonly eventType: NotificationEventType;
  readonly userId: string;
  readonly metadata?: NotificationMetadata | null;
  readonly attachments?: readonly EmailAttachment[];
}
// `content` is restricted to `Buffer` only to avoid the base64-vs-path-vs-text
// ambiguity across adapters (Resend, SES, Mailgun all interpret strings
// differently). Each adapter performs the encoding transformation it needs
// (e.g., Postmark runs `.toString("base64")`, Mailgun wraps buffer in form-data).
export interface EmailAttachment {
  readonly filename: string;
  readonly content: Buffer;
  readonly contentType?: string;
  readonly contentId?: string;               // for `<img src="cid:<contentId>">` inline images
  readonly encoding?: "base64" | "buffer";  // explicit discriminator for adapters that need it
}
```

### DB schema (NEW — currently zero email-template tables)

Repo is on `drizzle-orm 1.0.0-rc.4` (not the conservative "0.36+" framing — all schema patterns below verified against 1.0.0-rc.4 in [research file 07](.ai/plans/email-templates/reserch/07-drizzle-schema-patterns.md)).

**Pre-requisite subtask** — the `emailScopeEnum` / `emailTemplateStatusEnum` / `emailEditorPermissionEnum` Drizzle pg-enums referenced in the schema below **do not yet exist**. Add them to [`backend/db/schema/enums.ts`](backend/db/schema/enums.ts) using the repo's existing `createPgEnumFromEnum` helper (it generates the pgEnum from a backing TS enum — see how `notificationChannelEnum` is built from the `NotificationChannel` TS enum). This is part of the Task #2 (enum) subtask — make sure the enum file gets created first.

The repo has **zero** existing `.array()` columns today; first-time use of array-of-enum in this repo is a risk. Safer, idiomatic-to-this-repo choice for `allowedEditorGroups` is `jsonb.$type<readonly EmailEditorPermission[]>()` rather than `emailEditorPermissionEnum("...").array()` (the array-of-pgEnum pattern works but isn't used elsewhere in the codebase). Use the `jsonb` form unless the team specifically prefers the typed array column.

New file: [`backend/db/schema/communications/emailTemplates.ts`](backend/db/schema/communications/emailTemplates.ts) — note the additional required imports (`integer`, `uniqueIndex`) beyond what the original stub mentioned:

```ts
import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "@/backend/db/schema";
import { emailScopeEnum, emailTemplateStatusEnum } from "@/backend/db/schema/enums";
import { EmailEditorPermission } from "@/backend/enum/email";
import type { EmailAttachmentRules } from "@/backend/types/email/email.types";

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: emailScopeEnum("scope").notNull(),                    // EmailScope
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),            // friendly URL id
  status: emailTemplateStatusEnum("status").notNull().default("DRAFT"),
  // admin-editable body (from @react-email/editor)
  designJson: jsonb("design_json"),                             // serialized TipTap JSONContent blob (validated against allowed-node-types allowlist at save time — todo 7a)
  compiledHtml: text("compiled_html"),                         // last-rendered HTML cache (sanitized via DOMPurify, re-compiled atomically in same transaction as designJson — decision: keep for preview/offline fallback, staleness prevented by atomic re-compile)
  compiledText: text("compiled_text"),                          // plain-text version (re-computed atomically with compiledHtml)
  // per-template config
  defaultFromName: varchar("default_from_name", { length: 255 }),
  defaultFromEmail: varchar("default_from_email", { length: 255 }),
  // Idiomatic-to-repo choice (no existing .array() columns): JSONB typed array.
  // Alternatives (per research file 07): `emailEditorPermissionEnum("...").array()`
  // works since drizzle-kit 0.24 but is first-time-use in this repo.
  allowedEditorGroups: jsonb("allowed_editor_groups").$type<readonly EmailEditorPermission[]>().notNull(),
  // attachments / images configuration
  attachmentRules: jsonb("attachment_rules").$type<EmailAttachmentRules>(),
  // versioning + i18n
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  version: integer("version").notNull().default(1),              // optimistic locking — WHERE version = $1 check on update prevents last-write-wins on concurrent edits (SWE review decision)
  parentTemplateId: uuid("parent_template_id").references(() => emailTemplates.id), // for locale variants
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("email_templates_scope_slug_uq").on(t.scope, t.slug),
  // Partial unique: only one active row per (scope, locale). Use sql`` literal
  // (not eq(t.isActive, true)) — eq() produces a parameterized placeholder that
  // breaks drizzle-kit migration generation (issues #3349, #4790).
  uniqueIndex("email_templates_scope_locale_active_uq")
    .on(t.scope, t.locale)
    .where(sql`${t.isActive} = true`),
]);

export const emailTemplateRevisions = pgTable("email_template_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id").notNull().references(() => emailTemplates.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  designJson: jsonb("design_json").notNull(),
  compiledHtml: text("compiled_html").notNull(),
  editedBy: uuid("edited_by").references(() => users.id),
  editedAt: timestamp("edited_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
}, (t) => [
  // SWE review v3: index on templateId for revision history lookups — without this,
  // querying revisions by templateId causes a full table scan as the table grows.
  // SWE review v4 (V4-2): use inline array form (canonical codebase convention) —
  // NO separate named-object index export. All 60+ existing schemas use this pattern.
  index("email_template_revisions_template_id_idx").on(t.templateId),
  uniqueIndex("email_template_revisions_template_id_version_uq")
    .on(t.templateId, t.version),
]);
```

Run a `drizzle generate` later via the `drizzle-generate` skill workflow (NOT part of this plan — runtime dictate).

### Backend types (canonical pattern)

New: [`backend/types/email/email.types.ts`](backend/types/email/email.types.ts) — applying the `{Entity}{Select,Insert,Return,Submit}Type` pattern:

- `EmailTemplateSelectType`, `EmailTemplateInsertType` — `$inferSelect` / `$inferInsert` from `emailTemplates`
- `EmailTemplateReturnType` — API-facing shape (joins: editor name, last revision)
- `EmailTemplateSubmitInput` — create/update input (DTO)
- `EmailAttachmentInput`, `EmailAttachmentRules`
- Include `id` field (Apollo cache normalization per AGENTS.md)

### Repository

New: [`backend/db/repo/email/email-template.repository.ts`](backend/db/repo/email/email-template.repository.ts)
- Standard repo methods: `getById`, `getByScopeAndLocale(scope, locale, { activeOnly })`, `list({ scopeFilter, statusFilter, pagination })`, `create`, `update`, `softDelete`, `createRevision`, `setActive`
- Use `queryDb(tx)` for non-transactional reads ([docs/drizzle/neon-http-client.md](docs/drizzle/neon-http-client.md))
- Add `findByScopeIds(scopes: EmailScope[], tx?)` returning `Map<EmailScope, EmailTemplateReturnType>` for DataLoader batching (Pothos list fields)
- Add `export * from "./email";` to [`backend/db/repo/index.ts`](backend/db/repo/index.ts) (new `email/` sub-dir)

### Service layer

New: [`backend/services/communication/email-template.service.ts`](backend/services/communication/email-template.service.ts)
- `EmailTemplateService.list`, `get`, `create`, `update`, `publish`, `archive`, `restore`
- `renderForSend(scope, props, locale)` — uses `renderEmailTemplate` from registry, checks DB for design-json override
- `sendTest(templateId, toEmail, sampleProps)` — admin preview sends
- `previewHtml(templateId, sampleProps)` — returns rendered HTML for admin iframe preview
- `resolveTemplatesByScopes(scopes: EmailScope[], locale)` — batch method returning `Map<EmailScope, EmailTemplateReturnType | null>` for GraphQL DataLoader batching ([backend/services/AGENTS.md](backend/services/AGENTS.md))
- Authorization: check `ctx.user` permission group against `template.allowedEditorGroups` (configurable per your "configurable, default set in registry")
- All user-facing errors via `getServerTranslations(locale).emailsTranslations.errors.*` ([backend/services/AGENTS.md](backend/services/AGENTS.md))

**Pre-requisite: extend `CommunicationPayload` type** (SWE review v3 — the type at
`backend/types/notifications/communications.types.ts:4-11` does NOT have `templateProps`,
`entityId`, or `notificationEventId`). Add:
```ts
// In backend/types/notifications/communications.types.ts
export type CommunicationPayload = {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: CommunicationChannelType;
  readonly eventType: NotificationEventType;
  readonly metadata?: Record<string, unknown>;
  // SWE review v3: added for email template rendering
  readonly templateProps?: Record<string, unknown>;
};
```
The `entityId` and `notificationEventId` are accessed via `payload.metadata?.entityId` /
`payload.metadata?.notificationEventId` (metadata already exists as `Record<string, unknown>`).
Do NOT add new top-level fields for these — use the existing `metadata` bag.

Refactor dispatcher at [`backend/services/communication/communication.service.ts`](backend/services/communication/communication.service.ts).
**SWE review v5 (V5-1):** The current dispatcher does NOT have a standalone `case "email":` branch. Email falls through alongside SMS: `case "email": case "sms": return await dispatchRecipientChannel(payload, locale)` (line 72-74). `commonFields` lives inside `dispatchRecipientChannel` (line 28-33), NOT inside `dispatch()`. There is no `tx` (transaction) in `dispatch()` scope — all DB reads in the dispatch path use non-transactional `queryDb()` or direct repository calls.

Two equal approaches (pick one, document the choice):
**Approach A — Extract a dedicated `dispatchEmailChannel()` (recommended):** Break the email fall-through with SMS. Route email to a new standalone function `dispatchEmailChannel(payload, locale)` that owns `commonFields`, scope mapping, idempotency check, and `emailChannel.send()`. `dispatchRecipientChannel` shrinks to SMS-only. This keeps email and SMS logic cleanly separated as email grows in complexity.
**Approach B — Branch within `dispatchRecipientChannel`:** Add email-specific branching at the top of the existing function — map scope, check idempotency, render template — before the shared `emailChannel.send()` call at line 37. Less disruptive but couples email+SMS in one function.

The code below shows Approach A (new `dispatchEmailChannel` function):

```ts
// Inside CommunicationService namespace:

// dispatch() switch changes — break the fall-through:
case "email":
  return await dispatchEmailChannel(payload, locale);
case "sms":
  return await dispatchRecipientChannel(payload, locale);

// New function (replaces the email branch of dispatchRecipientChannel):
async function dispatchEmailChannel(
  payload: CommunicationPayload,
  locale?: string
): Promise<ChannelDispatchResult> {
  const to = (payload.metadata?.to as string) ?? "";
  const commonFields = {
    to,
    eventType: payload.eventType,
    userId: payload.userId,
    metadata: asNotificationMetadata(payload.metadata),
  };

  // Feature flag: old passthrough vs new template path
  // V5-2: MUST use getBooleanEnv, NOT resolveEnvConfig (returns string, "false" is truthy)
  if (!getBooleanEnv("EMAIL_TEMPLATES_ENABLED")) {
    // Old passthrough: use payload.body as raw HTML (backward-compatible)
    const result = await emailChannel.send(
      { ...commonFields, subject: payload.title, html: payload.body ?? "" },
      locale
    );
    return {
      channel: "email",
      success: result.success,
      providerMessageId: result.providerMessageId,
      error: result.error,
    };
  }

  // New template path
  const emailScope = mapEventTypeToEmailScope(payload.eventType);
  // SWE review v3: null scope = no email template for this event.
  // Use payload.body fallback (not success:false) so emails are not lost during migration.
  if (!emailScope) {
    if (payload.body) {
      const result = await emailChannel.send(
        { ...commonFields, subject: payload.title, html: payload.body },
        locale
      );
      return {
        channel: "email",
        success: result.success,
        providerMessageId: result.providerMessageId,
        error: result.error,
      };
    }
    return { channel: "email", success: true, skipped: "no_email_scope" };
  }

  // Idempotency check (P1: dedup duplicate event triggers)
  // SWE review v3: use payload.metadata (not nonexistent payload.entityId/notificationEventId)
  // SWE review v5 (V5-1): NO tx in dispatch scope — use non-transactional queryDb read
  // SWE review v5 (V5-10): notificationEventId may be "" if not populated in builders
  const idempotencyKey = createHash("sha256")
    .update(`${emailScope}:${payload.metadata?.entityId ?? ""}:${payload.metadata?.notificationEventId ?? ""}`)
    .digest("hex");
  // NOTE: findByIdempotencyKey requires adding an `idempotencyKey` column to the
  // notificationDeliveries table + a repo method — add as explicit task in todo 13.
  const existingDelivery = await NotificationRepository.findByIdempotencyKey(idempotencyKey);
  if (existingDelivery) return { channel: "email", success: true, skipped: "idempotent" };

  // SWE review v3: payload.templateProps now exists on CommunicationPayload (added above)
  // SWE review v5 (V5-1): EmailPayload has fields {to, subject, html, eventType, userId, metadata?}
  // — NO `text` or `attachments` fields (IEmailChannel.ts:4-11). renderForSend returns
  // {html, text?, subject, attachments?} — only `subject` and `html` map to EmailPayload.
  // `text` and `attachments` are dropped (or EmailPayload must be extended — todo 13c).
  const { html, subject } = await EmailTemplateService.renderForSend(
    emailScope,
    payload.templateProps ?? {},
    locale
  );
  const result = await emailChannel.send(
    { ...commonFields, subject: subject || payload.title, html },
    locale
  );
  return {
    channel: "email",
    success: result.success,
    providerMessageId: result.providerMessageId,
    error: result.error,
  };
}
```

**`mapEventTypeToEmailScope` definition (P0 — blocking dependency for Phase 3):**
New: [`backend/services/communication/templates/event-to-scope.ts`](backend/services/communication/templates/event-to-scope.ts)
```ts
import { NotificationEventType } from "@/backend/enum/notifications";
import { EmailScope } from "@/backend/enum/email";

/**
 * Maps a NotificationEventType (trigger) to an EmailScope (template family).
 * Not bijective: multiple events share one scope (e.g., all class lifecycle events
 * share EmailScope.CLASS_LIFECYCLE). Returns null for events that don't produce emails.
 *
 * Exhaustiveness is enforced at compile-time via `Readonly<Record<NotificationEventType, EmailScope | null>>`
 * — all 24 enum values MUST have an entry. Adding a NotificationEventType without a mapping
 * entry here will cause a TypeScript error.
 *
 * Cross-referenced against EVENT_CHANNEL_ALLOWLIST (notification-dispatch.helpers.ts:39):
 * - Events with EMAIL in allowlist → mapped to a non-null scope
 * - Events without EMAIL in allowlist (ON_APP + PUSH only) → mapped to null
 * - Events NOT in allowlist at all → fall through to ALL_ENUM_CHANNELS (all channels including
 *   email); these are mapped to a scope if email is desired, or null if not
 *
 * SWE review v2 correction: all 24 enum values verified against
 * backend/enum/notifications/notificationDeliveries.enum.ts.
 */
const EVENT_TO_SCOPE: Readonly<Record<NotificationEventType, EmailScope | null>> = {
  // === Events with EMAIL in EVENT_CHANNEL_ALLOWLIST ===
  // Class lifecycle events → shared CLASS_LIFECYCLE scope
  [NotificationEventType.CLASS_SCHEDULED]: EmailScope.CLASS_LIFECYCLE,
  [NotificationEventType.CLASS_COMPLETED]: EmailScope.CLASS_LIFECYCLE,
  [NotificationEventType.CLASS_CANCELLED]: EmailScope.CLASS_LIFECYCLE,
  [NotificationEventType.CLASS_MARKED_ABSENT]: EmailScope.CLASS_LIFECYCLE,
  [NotificationEventType.CLASS_MARKED_MISSED]: EmailScope.CLASS_LIFECYCLE,
  [NotificationEventType.CLASS_LEAVE_REQUESTED]: EmailScope.CLASS_LIFECYCLE,
  [NotificationEventType.CLASS_RESCHEDULED]: EmailScope.CLASS_LIFECYCLE,
  [NotificationEventType.CLASS_RESET]: EmailScope.CLASS_LIFECYCLE,
  // Reminder events
  [NotificationEventType.CLASS_REMINDER]: EmailScope.CLASS_REMINDER,
  // Student lifecycle events → shared STUDENT_LIFECYCLE scope
  [NotificationEventType.STUDENT_STATUS_CHANGED]: EmailScope.STUDENT_LIFECYCLE,
  [NotificationEventType.STUDENT_QUOTA_OVERRIDDEN]: EmailScope.STUDENT_LIFECYCLE,
  // Lesson report events
  [NotificationEventType.LESSON_REPORT_SUBMITTED]: EmailScope.LESSON_REPORT_SUBMITTED,
  [NotificationEventType.LESSON_REPORT_REVIEWED]: EmailScope.LESSON_REPORT_REVIEWED,

  // === Events NOT in allowlist → fall through to ALL_ENUM_CHANNELS (all channels) ===
  // SWE review v3: These events are NOT in EVENT_CHANNEL_ALLOWLIST, so the dispatcher
  // fallback `EVENT_CHANNEL_ALLOWLIST[eventType] ?? [...ALL_ENUM_CHANNELS]` sends them
  // via ALL 4 channels (ON_APP, EMAIL, SMS, PUSH). This is likely unintended for events
  // that should only use ON_APP or ON_APP+EMAIL. As part of Phase 3, add explicit
  // entries to EVENT_CHANNEL_ALLOWLIST for these events:
  //   COMPLAINT_RESPONSE → [ON_APP, EMAIL]         (currently falls through to ALL)
  //   INVOICE_GENERATED → [ON_APP, EMAIL]          (currently falls through to ALL)
  //   INVOICE_STATUS_CHANGED → [ON_APP, EMAIL]     (currently falls through to ALL)
  //   PAYMENT_METHOD_CHANGED → [ON_APP, EMAIL]     (currently falls through to ALL)
  //   SUGGESTION_ACKNOWLEDGED → [ON_APP, EMAIL]    (currently falls through to ALL)
  //   STUDENT_TEACHER_REASSIGNED → [ON_APP, EMAIL] (currently falls through to ALL)
  //   NEW_COMPLAINT → [ON_APP, SMS, PUSH]          (scope=null — see V4-5 below)
  //   NEW_SUGGESTION → [ON_APP, SMS, PUSH]          (scope=null — see V4-5 below)
  //   SUGGESTION_DUPLICATE_MARKED → [ON_APP, SMS, PUSH] (scope=null — see V4-5 below)
  //   CLASS_REMINDER → [ON_APP, EMAIL]              (currently falls through to ALL)
  // Until these entries are added, the fallback sends via ALL channels — this is
  // pre-existing behavior, NOT a regression from this plan.
  // V4-5: Events with null scope send NO email under the REFACTORED dispatcher
  // (when EMAIL_TEMPLATES_ENABLED=true). Under the LEGACY passthrough path (flag=false),
  // the existing `payload.body ?? ""` fallback still sends email for these events —
  // this is intentional so the flag can be rolled back without losing existing coverage.
  [NotificationEventType.COMPLAINT_RESPONSE]: EmailScope.COMPLAINT_RESPONSE,
  [NotificationEventType.NEW_COMPLAINT]: null, // scope=null — NO email when flag=true; passthrough when flag=false (V4-5)
  [NotificationEventType.NEW_SUGGESTION]: null, // scope=null — same as NEW_COMPLAINT
  [NotificationEventType.SUGGESTION_ACKNOWLEDGED]: EmailScope.SUGGESTION_ACKNOWLEDGED,
  [NotificationEventType.SUGGESTION_DUPLICATE_MARKED]: null,
  [NotificationEventType.INVOICE_GENERATED]: EmailScope.INVOICE_GENERATED,
  [NotificationEventType.INVOICE_STATUS_CHANGED]: EmailScope.INVOICE_STATUS_CHANGED,
  [NotificationEventType.PAYMENT_METHOD_CHANGED]: EmailScope.PAYMENT_METHOD_CHANGED,
  [NotificationEventType.STUDENT_TEACHER_REASSIGNED]: EmailScope.STUDENT_LIFECYCLE,

  // === Events with ON_APP + PUSH only (no EMAIL in allowlist) → null ===
  [NotificationEventType.CLASS_ACTIVATED]: null,
  [NotificationEventType.CLASS_STARTED]: null,

  // === Account flow events (Phase 4 — NEW enum values) ===
  // SWE review v3: These 3 event types do NOT exist in NotificationEventType today.
  // Per option (a), DO NOT add them to NotificationEventType until Phase 4.
  // When Phase 4 adds them to the enum, ALSO uncomment these lines in the SAME PR.
  // [NotificationEventType.WELCOME]: EmailScope.WELCOME,                       // Phase 4
  // [NotificationEventType.PASSWORD_RESET]: EmailScope.PASSWORD_RESET,         // Phase 4
  // [NotificationEventType.EMAIL_VERIFICATION]: EmailScope.EMAIL_VERIFICATION,  // Phase 4
};

export function mapEventTypeToEmailScope(eventType: NotificationEventType): EmailScope | null {
  return EVENT_TO_SCOPE[eventType] ?? null;
}
```
Add a test in `event-to-scope.test.ts` verifying every `NotificationEventType` enum value (all 24) has an explicit mapping entry — the `Readonly<Record<...>>` type enforces this at compile-time, but the test should also verify the mapping is complete at runtime (iterate over `Object.values(NotificationEventType)` and assert each key exists in `EVENT_TO_SCOPE`).

**SWE review v2 changes:**
- Corrected `COMPLAIT_RESPONSE_CREATED` → `COMPLAINT_RESPONSE` (actual enum value)
- Corrected `STUDENT_REASSIGNED` → `STUDENT_TEACHER_REASSIGNED` (actual enum value)
- Commented out `WELCOME`/`PASSWORD_RESET`/`EMAIL_VERIFICATION` — these don't exist in `NotificationEventType` today; defer adding them to Phase 4 (V3-8: option (a)) to avoid breaking `Readonly<Record<NotificationEventType, ...>>` compile-time exhaustiveness. When added in Phase 4, uncomment their entries in the same PR.
- Added all 10 previously-missing enum values: `NEW_COMPLAINT`, `NEW_SUGGESTION`, `SUGGESTION_DUPLICATE_MARKED`, `CLASS_ACTIVATED`, `CLASS_STARTED`, `CLASS_MARKED_ABSENT`, `CLASS_MARKED_MISSED`, `CLASS_LEAVE_REQUESTED`, `CLASS_RESCHEDULED`, `CLASS_RESET`, `STUDENT_QUOTA_OVERRIDDEN`
- Cross-referenced every entry against `EVENT_CHANNEL_ALLOWLIST` to verify email channel eligibility
- Updated enum count from "22" to "24" in the todo 3a description

**SWE review v3 changes:**
- Added explicit comment block documenting the 10 events NOT in `EVENT_CHANNEL_ALLOWLIST` and their intended channel assignments for Phase 3
- Clarified that the ALL-channels fallback is pre-existing behavior, not a regression
- Fixed null-scope dispatcher behavior: `payload.body` fallback instead of `success: false` (V3-9)
- Added `templateProps` to `CommunicationPayload` type extension as pre-requisite (V3-2)
- Fixed `resetEmailChannel()` to remove `await` + non-existent `peek()` (V3-1)
- Documented `findByIdempotencyKey` + `idempotencyKey` column as explicit tasks in todo 13 (V3-11)

### GraphQL surface (NEW — none today)

Following single-canonical-object rule ([backend/AGENTS.md](backend/AGENTS.md)).

**Pre-requisite subtask (repo rule)** — Register the three new enums (`EmailScope`, `EmailTemplateStatus`, `EmailEditorPermission`) in [`backend/graphql/pothos/shared/enum.pothos.ts`](backend/graphql/pothos/shared/enum.pothos.ts) — enums are NOT registered inline in the per-entity Pothos file. Use `*PothosEnum` suffix per [backend/graphql/AGENTS.md](backend/graphql/AGENTS.md) positive examples: `EmailScopePothosEnum`, `EmailTemplateStatusPothosEnum`, `EmailEditorPermissionPothosEnum` (repo also has `*PothosObject` precedent for older enums — both compile). Import the registered Pothos enums into [`backend/graphql/pothos/email/emailTemplate.pothos.ts`](backend/graphql/pothos/email/emailTemplate.pothos.ts) as needed. Add `export * from "@/backend/graphql/pothos/email";` to [`backend/graphql/pothos/index.ts`](backend/graphql/pothos/index.ts). **Then run** `bun run generate:gqlSchema && bun codegen` so frontend codegen enums stay in sync ([backend/graphql/AGENTS.md](backend/graphql/AGENTS.md)).

Files to create:
- [`backend/graphql/pothos/email/emailTemplate.pothos.ts`](backend/graphql/pothos/email/emailTemplate.pothos.ts) — `EmailTemplatePothosObject` (canonical, single object type per repo rule), `EmailTemplateInputPothosObject`, `EmailTemplatePreviewPothosObject`. Use the repo's input pattern: `gqlSchemaBuilder.inputRef<EmailTemplateSubmitInput>("EmailTemplateInput").implement({...})` (per existing `notification-preferences.pothos.ts`).
- [`backend/graphql/query/email/emailTemplates.query.ts`](backend/graphql/query/email/emailTemplates.query.ts) — `emailTemplates(scope?, status?, pagination)` list + `emailTemplate(id)` query.
- [`backend/graphql/mutation/email/emailTemplate.mutation.ts`](backend/graphql/mutation/email/emailTemplate.mutation.ts) — **singular file name** per repo convention (matching the existing `backend/graphql/mutation/notifications/notification-preferences.mutation.ts` and `mark-notifications-read.mutation.ts` — that directory uses singular `.mutation.ts` for single mutations). Exposes: `createEmailTemplate`, `updateEmailTemplate`, `publishEmailTemplate`, `archiveEmailTemplate`, `sendTestEmail`. `sendTestEmail` IS a mutation (side-effect — sends live email).
- [`backend/graphql/query/email/emailTemplatePreview.query.ts`](backend/graphql/query/email/emailTemplatePreview.query.ts) — `previewEmailTemplate(templateId, sampleProps)` returns HTML string for iframe preview.

**Authorization placement** (verified — see [research file 08](.ai/plans/email-templates/reserch/08-pothos-patterns.md)):
- GraphQL field-level `authScopes` is set to `{ superAdmin: true, notImpersonating: true }` on all email-template mutations (write surface is super-admin only at the GraphQL layer).
- Per-template `allowedEditorGroups` enforcement belongs in the **service layer** (Pattern A — the service refuses the edit if the caller's permission group is not in `template.allowedEditorGroups`). The service performs the actual fine-grained permission check; GraphQL just gates the surface to super-admin actors who then act on behalf of editors.
- Pattern verified against the repo's existing `NotificationPreferencePothosObject` and `@pothos/core@^4.13.1` + `@pothos/plugin-scope-auth@^4.1.7`.

#### J. Accessibility (a11y)

- **Semantic HTML** — every interactive element has an aria-label via i18n (e.g. `aria-label={t("action.create")}`).
- **DataGrid** — `aria-label={t("dashboard.emailTemplates.pageTitle")}` + visible column headers; rows are real `<tr>` (MUI DataGrid default).
- **Filter chips** — `<Chip>` filters carry `aria-label={t("filterByScope")}` etc.
- **Dialog** — `aria-labelledby={titleId}` on `<Dialog>`, title's `<Typography id={titleId} variant="h6">`.
- **Sandboxed preview iframe** — `title={t("previewTab")}` attribute (required for screen readers).
- **Keyboard navigation** — editor toolbar buttons reachable via Tab; Drawer/Dialog trap focus (MUI default — no work). The Storybook addon-a11y toolbar surfaces any a11y warning per story.
- **Color contrast** — WCAG AA minimum (4.5:1 text / 3:1 large text). Status badge colors must meet 4.5:1 against the row background. The Grid row default background is `theme.palette.background.paper` — verify each status palette slot.
- **Reduced-motion** — `usePrefersReducedMotion()` guard (§G) — closes an existing gap.
- **addon-a11y** — `@storybook/addon-a11y` is registered (todo only — warnings do not fail CI; visual a11y review is manual per story). Research file 05 confirms no `@axe-core/playwright` or `jest-axe` is installed — Phase 2 may add `@axe-core/playwright` for E2E assertions.


#### M. GraphQL Documents (KEEP verbatim from v5)

**GraphQL documents** — new sub-dir [`frontend/common/graphql/sharedDocuments/email/`](frontend/common/graphql/sharedDocuments/email/):
- `documents.ts` — `EmailTemplateQueryDocument`, `EmailTemplatesQueryDocument`, `EmailTemplateUpsertMutationDocument`, `PublishEmailTemplateMutationDocument`, `SendTestEmailMutationDocument`, `PreviewEmailTemplateQueryDocument`
- `index.ts` — `export * from "./documents";`
- Add `export * from "./email";` to [`frontend/common/graphql/sharedDocuments/index.ts`](frontend/common/graphql/sharedDocuments/index.ts)
- **Every selection set MUST include `id`** on every named object type (Apollo cache normalization per [frontend/common/graphql/sharedDocuments/AGENTS.md](frontend/common/graphql/sharedDocuments/AGENTS.md))
- **Then run** `bun run generate:gqlSchema && bun codegen`

**Apollo hooks** (`useQuery` from `@apollo/client/react`, **no** `useLazyQuery` per [frontend/AGENTS.md](frontend/AGENTS.md))


#### K. Storybook Stories (required file list, mirrors [research file 05](.ai/plans/email-templates/glm_swe/ui-research/05-storybook-tests.md) lines 282-298)

Story pattern = CSF3 explicit `Meta<typeof C>` + `StoryObj<T>` type alias (`tags: ["autodocs"]`). Use `StoryWrapper` (handles locale + theme + user-store seeding globally) — no global Apollo/i18n/theme decorator registration. Apollo `MockedProvider` + `useXStore.setState({...})` per-story **inside a decorator** (reference: `frontend/common/views/dashboard/search-schedule/SearchScheduleContainer.stories.tsx:102-127`).

| # | Component | Story file |
|---|---|---|
| 1 | `useEmailTemplatesListViewModel.ts` | (no story — covered by the.list view story below) |
| 2 | `EmailTemplatesListView.tsx` switcher | `frontend/common/views/dashboard/email-templates/EmailTemplatesListView.stories.tsx` |
| 3 | `EmailTemplatesListContainer.tsx` | `frontend/common/views/dashboard/email-templates/EmailTemplatesListContainer.stories.tsx` |
| 4 | `emailTemplatesList.mobile.tsx` | `frontend/mobile/views/dashboard/email-templates/emailTemplatesList.mobile.stories.tsx` |
| 5 | `emailTemplatesList.desktop.tsx` | `frontend/desktop/views/dashboard/email-templates/emailTemplatesList.desktop.stories.tsx` |
| 6 | `useEmailTemplateEditorViewModel.ts` | (no story — covered by the editor view story below) |
| 7 | `EmailTemplateEditorView.tsx` switcher | `frontend/common/views/dashboard/email-templates/EmailTemplateEditorView.stories.tsx` |
| 8 | `EmailTemplateEditorContainer.tsx` | `frontend/common/views/dashboard/email-templates/EmailTemplateEditorContainer.stories.tsx` |
| 9 | `emailTemplateEditor.mobile.tsx` | `frontend/mobile/views/dashboard/email-templates/emailTemplateEditor.mobile.stories.tsx` |
| 10 | `emailTemplateEditor.desktop.tsx` | `frontend/desktop/views/dashboard/email-templates/emailTemplateEditor.desktop.stories.tsx` (mock `@react-email/editor` via storybook decorator — TipTap doesn't render in Storybook cleanly) |
| 11 | `EmailEditorWrapper.tsx` | covered by editor view stories (don't add a separate story) |
| 12 | `emailTemplateEditorStore.ts` Zustand | (no story — covered indirectly) |
| 13 | GraphQL docs sub-dir | (no story) |
| 14 | Admin routes page.tsx | (no story — server component) |
| 15 | React Email scaffold components (L872+) | **optional** `frontend/**/emails/<Email>.stories.tsx` for visual baselines — Phase 2 |

Each story provides default / empty / loading / error / RTL variants. RTL variant renders with `dir="rtl"` (StoryWrapper handles `stylis-plugin-rtl` cache swap).


#### L. Component / E2E Tests (mirrors [research file 05](.ai/plans/email-templates/glm_swe/ui-research/05-storybook-tests.md))

- **Runner** — `bun:test` + Happy DOM preload (`test/ui/components/happydom-preload.ts`). Vitest is reserved for the Storybook `@storybook/addon-vitest` project only. **No frontend 100%-coverage rule** (the 100% rule is for `backend/db/repo/` only).
- **Tier-split testing convention** (`frontend/common/components/ui/AGENTS.md:227-235`): test both mobile + desktop tier variants separately; unit-test the ViewModel hook in isolation; test the switcher with mocked `useViewport`; assert via rendered output (NOT implementation details); Storybook story = visual baseline (see §K for story files).
- **Apollo mock** — `renderWithWrapper(ui, { mocks })` → `TestWrapper` builds ApolloClient with `MockLink` (`test/ui/components/TestWrapper.tsx:61-80`). i18n through `LocaleProvider`; tests set locale via `renderWithWrapper({ locale })`.
- **Required test files**:

| # | Component | Required component test file |
|---|---|---|
| 1 | `useEmailTemplatesListViewModel.ts` | `test/ui/components/email-templates/useEmailTemplatesListViewModel.test.ts` |
| 2 | `EmailTemplatesListView.tsx` switcher | `test/ui/components/email-templates/EmailTemplatesListView.test.tsx` (mocked `useViewport`) |
| 3 | `EmailTemplatesListContainer.tsx` | `test/ui/components/email-templates/EmailTemplatesListContainer.test.tsx` (permission gating) |
| 4 | `emailTemplatesList.mobile.tsx` | `test/ui/components/email-templates/emailTemplatesList.mobile.test.tsx` |
| 5 | `emailTemplatesList.desktop.tsx` | `test/ui/components/email-templates/emailTemplatesList.desktop.test.tsx` (the file plan L952 already names) |
| 6 | `useEmailTemplateEditorViewModel.ts` | `test/ui/components/email-templates/useEmailTemplateEditorViewModel.test.ts` |
| 7 | `EmailTemplateEditorView.tsx` switcher | `test/ui/components/email-templates/EmailTemplateEditorView.test.tsx` |
| 8 | `EmailTemplateEditorContainer.tsx` | `test/ui/components/email-templates/EmailTemplateEditorContainer.test.tsx` |
| 9 | `emailTemplateEditor.mobile.tsx` | `test/ui/components/email-templates/emailTemplateEditor.mobile.test.tsx` |
| 10 | `emailTemplateEditor.desktop.tsx` | `test/ui/components/email-templates/emailTemplateEditor.desktop.test.tsx` (plan L952) |
| 11 | `EmailEditorWrapper.tsx` | `test/ui/components/email-templates/EmailEditorWrapper.test.tsx` (asserts `ssr:false` lazy import behavior + that tier views import from wrapper, not `@react-email/editor` directly) |
| 12 | `emailTemplateEditorStore.ts` Zustand | `test/ui/components/email-templates/emailTemplateEditorStore.test.ts` (dirty state, dialog open, serialization — File/Blob kept out) |

- **Editor view tests must `mock.module`-stub `@react-email/editor`** because TipTap doesn't render cleanly under Happy DOM (research file 05 lines 302-303). Pattern mirrors the existing `mock.module` next/navigation stub. The real save-flow (getJSON → mutation → preview) is reserved for E2E.
- **Single E2E file** — `test/ui/e2e/email-templates.test.ts` covering the admin happy path: login (loginAsDemoUser) → navigate to `/email-templates` → list renders → click "Create" → editor opens → save mutation → publish → preview iframe assertion. Mirrors `test/ui/e2e/admin-dashboard.test.ts` pattern (`setupBrowserLifecycle`, `gotoAppRoute`, `closeE2eSession`) — no page-object layer. Requires `bun run build:test` first.
- **Bundle size verification** — KEEP from plan todo 20b: `NEXT_BUNDLE_ANALYZER=enabled bun run build` confirms the editor route's JS chunk is code-split from the main bundle (TipTap + Prism.js don't bloat the main bundle).


#### N. StatusBadge Extension (NEW)

- The shared `StatusBadge` (`frontend/common/components/ui/badge/StatusBadge.tsx`) has a fixed `category` prop today (`studentAccount|classSession|classStatus|...`).
- **Add a new `emailTemplate` category** so list+history use the standard status badge (inline `<Chip>` is FORBIDDEN per `COMPONENT_PATTERNS.md:170`).
- Map: `EmailTemplateStatus.DRAFT → theme.palette.warning`, `PUBLISHED → theme.palette.success`, `ARCHIVED → theme.palette.action.disabled / text.disabled`. Localized label per status via `dashboard.emailTemplates.status.*`.
- Mirror the existing category implementation (the component switches on `category` to render the right palette slot) — add the new branch + tests.


#### O. Feature Flag Visual Cue

- When `EMAIL_TEMPLATES_ENABLED === false` (using `getBooleanEnv` per todo 21c V5-2 - NEVER raw `resolveEnvConfig`):
  - **Admin pages still render** (for visual preview, since this is admin-only).
  - **Sidebar entry** displays a small `<LockOutlined fontSize="small" color="disabled" />` adjacent to the label, with a tooltip text explaining "Feature disabled — set EMAIL_TEMPLATES_ENABLED=true to send". Title from i18n `dashboard.emailTemplates.featureDisabledTooltip`.
  - **All "Send Test" + "Publish" actions** in the editor are **disabled** with the same tooltip + lock icon. The send mutation returns `EMAIL_TEMPLATES_DISABLED` GraphQL error code (mapped to a user-visible toast `toast.featureDisabled`).
- This is a small, additive visual cue — does not change the page-routing logic.


#### Zustand Store (KEEP from v5)

[`frontend/common/stores/emailTemplateEditorStore.ts`](frontend/common/stores/emailTemplateEditorStore.ts) — mutable editor state (filters, dialog open, locale/version selector, segmented control, sort, dirty flag, sampleProps). **Serialization rule**: do NOT store `File`/`Blob`/`FormData`/`Promise` in `persist`-enabled stores; keep non-serializable editor refs in `useRef` inside the ViewModel hook. There is NO separate `__mocks__` Storybook convention (research file 05 confirms) — use inline `create()` for the store; Storybook stories render containers with `args: {}` and no store override.


#### P. State Transitions & Edge Cases

**P1. Loading States (beyond skeletons)**  
- Inspector panel: dedicated `InspectorSkeleton` (rectangular shimmers for scope, locale, version, editor groups, subject, attachments) shown while template query `loading=true`.  
- Mutation buttons (Save Draft, Publish, Send Test): Apollo `loading` from each mutation → `<Button loading={isSaving}>` with `<CircularProgress size={20} color="inherit" />` (existing convention per §G).  
- History drawer: `HistorySkeleton` while versions query loads; `ErrorState` embedded with `onRetry={refetchHistory}` on failure.  
- Merge-tag picker: `Autocomplete` `loading` prop while `EmailPropsByScope` introspection fetches (if async); `emptyText` when scope has no variables.

**P2. Save/Publish Optimistic Transitions**  
- **Save Draft**: on mutation start → `isDirty=false` (optimistic), `lastSavedContentRef.current = designJson`, button `loading=true` + label `"Saving…"`. On success → button label `"Saved ✓"` (2s auto-revert to `"Save Draft"`); toast `dashboard.emailTemplates.toast.saved()`. On error → `isDirty=true`, restore `designJson` from ref, button `loading=false`, toast `saveFailed`.  
- **Publish**: same optimistic pattern + `isPublishing` button state. Confirm dialog → mutation → success toast `published()` + navigate to list OR stay with updated status badge.  
- **Conflict detection**: server returns `VERSION_MISMATCH { expected, actual }` → `<Dialog>` `"Template was edited by another admin (v{actual}). Overwrite or reload?"` Actions: `Overwrite` (force with current version) / `Reload` (fetch latest, re-apply local edits).  
- **Disable editor while save in flight**: `isSaving || isPublishing` → overlay `<Box sx={{ position: "absolute", inset: 0, bgcolor: "background.paper", opacity: 0.5, pointerEvents: "auto" }}>` with `<CircularProgress />`.

**P3. Send Test Flow States**  
- **To field**: RHF + Zod `z.string().email()` → `<FormHelperText error>` on blur/submit.  
- **Sample props**: RHF + custom `validate: (val) => { try { JSON.parse(val); return true } catch { return "Invalid JSON" } }`.  
- **Submit button**: `disabled` until both fields valid + `!isSendingTest`.  
- **Rate-limit**: static notice `"Max 5 test emails/min"`. On `RATE_LIMITED { retryAfter }` error → inline `<Alert severity="warning">` with live countdown; disable Submit.  
- **In-flight**: `isSendingTest` → button `loading=true`.  
- **Success**: `SuccessCheckMark` animation (600ms) in dialog → `notifications.show(t("toast.testSent", { to }), { severity: "success" })` → close after 800ms.  
- **Error**: inline `<Alert severity="error">{providerErrorMessage}</Alert>` from GraphQL error `extensions.message`.  
- **Close with unsent changes**: confirm dialog `"Discard sample props changes?"` before closing.

**P4. List View Edge Cases**  
- **Empty search**: `DataGrid emptyMessage={hasFilters ? t("empty.noSearchResults") : t("empty.emptyState")}`. Create CTA only when `!hasFilters`.  
- **Server error**: `ErrorState` or `<Alert severity="error">` with `onRetry` button; `<Button onClick={refetch}>Retry</Button>`.  
- **Stale data**: `fetchPolicy: "cache-and-network"` → list re-renders silently after background refetch.  
- **Bulk archive**: confirm dialog → optimistic row removal → undo via toast for 4 seconds (same pattern as Toolpad `useNotifications` `action: { label: "Undo", onClick } }`).  
- **Row-level loading**: `Archiving…` spinner on selected rows only; others stay interactive.

**P5. History Drawer States**  
- **Empty history**: display `"No previous versions — this is the current version."` — NOT an error state.  
- **Loading list**: `HistorySkeleton`.  
- **Error loading list**: `ErrorState` with `onRetry={refetchVersions}`.  
- **Restore in-flight**: restore entry → `loading={restoringVersion === id}` row spinner.  
- **Restore conflict**: `VERSION_RESTORE_CONFLICT` → dialog `"Another admin edited this template while you were restoring. Reload to see latest version."` → `Reload` button.  
- **Preview older version**: inline `<Preview>OldVersionPreview</Preview>` in `renderedHtml`.

**P6. Preview Tab States**  
- **Preview empty**: (empty template body) → `"No content — edit the template to see preview."`  
- **Preview loading**: `<Skeleton />`.  
- **Preview error**: `"Failed to compile HTML. Check your template for missing tags or invalid markup."`  
- **Unsaved draft**: `"Preview reflects current unsaved changes"` in a warning `Alert severity="info"` (closeable).

**P7. Connectivity & Sync Guard**  
- **Offline banner**: `isConnected` via `navigator.onLine` (or Apollo `networkError`) — `<TopBanner severity="warning">` at top of page: `"You are offline. Changes are saved locally. They will sync when reconnected."`  
- **Session expiry**: if any mutation returns `SESSION_EXPIRED`, show toast + redirect to /login after 2s — save draft JSON to `sessionStorage.setItem('draft', JSON.stringify(designRef.current))`.  
- **Stale tab**: `window.addEventListener("focus", checkVersion)` fires a light poll query — if version on server > local ref, show snackbar `"This template was edited on another tab. Reload to see latest version."` + Reload button.

**P8. Form/Dialog Edge Cases**  
- **Draft + tab close**: `beforeunload` (plan §D).  
- **Draft + navigate away**: in-app nav guard (§D).  
- **Draft + logout**: `beforeunload`, but `logout` clears `sessionStorage` — save draft just-in-case on logout path.  
- **Draft + idle timeout**: timer (10min inactivity) fires dialog: `"Would you like to keep your unsaved changes?"` — Save Draft, Discard, or Restart timer.  
- **Send Test form dismiss**: `"Discard sample props changes?"` (above).  
- **Merge-tag mismatch**: `{scope: "order", variable: "user.name"}` where `user.name` is not a field of `OrderPropsScan` — inline `<FormHelperText>` in help text of merge-tag picker.

**P9. State Lifecycle Summary Table**

| Surface | Initial Load | Loading | Success | Error | Empty/Warning |
|-----------|-------------|---------|--------|-------|---------------|
| List View | AppDataTable base state | `<EmailTemplatesListSkeleton />` | Fade in results | `<ErrorState onRetry={refetch} />` | `"No templates yet"`, CTA for new template |
| Editor | Skeleton | `InspectorSkeleton` + `IframePreviewSkeleton` | Fade in Inspector + Preview | `"Failed to load template"` + Retry | — |
| History | Button `"History"` | `HistorySkeleton` | Fade in list | `"Can't load versions"` | `"No previous versions"` |
| Save | Button idle | Button `loading` + label `"Saving…"` | `"Saved ✓"` (2s) → reset | `"Save failed"` toast | — |
| Send Test | Dialog | Submit `loading` | `SuccessCheckMark` (600ms) + toast → close | Rate-limit dialog + countdown | — |
| Archive | Menu item | `loading` on row | Row disappears + toast with undo | `"Archive failed"` toast | — |
| Restore | Select version | `loading` on entry | Fade new content + toast | `"Restore failed"` | — |
| Publish | Button | Button `"Publishing…"` | toast → status badge update | `"Publish failed"` toast | — |

> **Guideline**: Every async action defined elsewhere in this plan (§A–§O) MUST have an explicit entry in this table or be covered by one of the state patterns above. See research file [01-state-transitions.md](.ai/plans/email-templates/glm_swe/ui-research-round2/01-state-transitions.md) for full 32-gap analysis with codebase precedents.


#### Q. Data Flow, Apollo Cache & Optimistic Patterns

**Q1. Apollo Cache TypePolicies** (add to `createApolloCache()` in `frontend/common/graphql/apolloCache.ts`):

```typescript
typePolicies: {
  EmailTemplate: {
    keyArgs: ["id"],
    fields: {
      designJson: { merge: false },
      compiledHtml: { merge: false },
      version: { merge: false },
    },
  },
  EmailTemplates: {
    keyArgs: ["scope", "locale", "status", "search"],
    fields: {
      rows: {
        merge(existing, incoming, { args }) {
          if (!args?.paginationArgs?.page || args.paginationArgs.page === 1) {
            return incoming; // page 1 → replace
          }
          return [...(existing || []), ...incoming]; // subsequent pages → append
        },
      },
      totalCount: { merge: false },
      pageInfo: { merge: false },
    },
  },
}
```

**Q2. Fetch Policies (per query)**

| Query Document | `fetchPolicy` | Rationale |
|----------------|--------------|-----------|
| `EmailTemplatesQueryDocument` (list) | `"cache-and-network"` | Show cached list immediately, refetch in background |
| `EmailTemplateQueryDocument` (detail) | `"cache-and-network"` | Same — avoid content flash |
| `PreviewEmailTemplateQueryDocument` | `"network-only"` | Always get fresh rendered HTML for preview |
| `EmailTemplateVersionsQueryDocument` (history) | `"cache-first"` | Immutable version history — no refetch needed after load |

**Q3. Cache Redirect (List→Detail)**  
After upsert, `cache.modify` on root to update the detail and invalidate `EmailTemplates.list({ scope, locale, status })` to trigger refetch of relevant list queries.

**Q4. Optimistic Response Definitions**  

| Mutation | Optimistic Pattern | Rollback on Error |
|----------|-------------------|-------------------|
| `EmailTemplateUpsertMutationDocument` (Save Draft) | `optimisticResponse` inserts `designJson`, `version+1`, `status="DRAFT"` | Restore `designJson` from `useRef`; button to idle; toast error |
| `EmailTemplatePublishMutationDocument` | Flip `status="DRAFT"` → `"PUBLISHED"` in cache | Flip back to DRAFT |
| `EmailTemplateArchiveMutationDocument` | Remove from Active list; insert into Archived list | Restore both lists from pre-mutation cache snapshot |
| `SendTestEmailMutationDocument` | **NO optimistic** — wait for server confirm, only toast | N/A |

All optimistic responses use `update` callback with `cache.modify`. This is the first use of optimistic responses in the codebase — follow Apollo Client v3 docs.

**Q5. Pagination Format**  
- **Strategy**: offset-limit (`page`, `pageSize` in Zustand).  
- **Filter change** → reset to page 1 in `listStore.setPage(1)`.  
- **Total count**: `totalCount` field in `EmailTemplatesPaging`.  
- **Load More**: NOT used in desktop; mobile uses "Show More" button per §R.

**Q6. Refetch After Mutation**  
- Save → cache update (Q4 optimistic); `refetchQueries` only if version stale.  
- Publish → refetch list (status changed).  
- Archive → refetch active + archived lists.  
- Restore history → refetch editor + history.  
- **Focus refetch** uses existing `frontend/common/hooks/use-connection-events.ts` pattern.  
- **Background refetch** via `cache-and-network` ensures live cache invalidation.

**Q7. Error & Retry Policies**  

Add `RetryLink` to Apollo link chain:

```typescript
import { RetryLink } from "@apollo/client/link/retry";

export const retryLink = new RetryLink({
  delay: { initial: 500, max: 5000, jitter: true },
  attempts: { max: 3, retryIf: (error) => error.statusCode >= 500 },
});
```

- 4xx errors → **NO retry** (show error message).  
- 5xx errors → retry 3× with backoff (500ms → 1000ms → 2000ms).  
- All mutations carry `idempotencyKey` header (see §G).  
- User-facing: `"Failed to load. Retry"` button on `ErrorState`.

**Q8. Send Test Sample Props Location**  
Sample props live in **Zustand UI store** (`emailTemplateEditorStore.sampleProps: Record<string, Record<string, string>>`) — NOT Apollo cache. Reset on navigate away.

**Q9. Merge-Tag Introspection**  
- **Source**: Static list per scope (`reactEmailPropSchemas`).  
- **Cache key**: `["mergeTagByScope", scope]` — store in Apollo as `MergeTagSet`.  
- **Policy**: `network-only` on scope change; `cache-and-network` after first load.

**Q10. Store/Cache Delineation**  

| Data | Location | Reason |
|------|----------|--------|
| Template (`designJson`, subject, status) | **Apollo cache** | Lifecycle managed by Apollo; optimistic updates |
| UI: pagination, filters, active view | **Zustand** (`useEmailListStore`) | Session-only; not persisted to server |
| UI: tabs, Inspector, history, isDirty, toast visits | **Zustand** (`useEmailTemplateStore`) | Session-only |
| Sample props for Send Test | **Zustand** (`emailTemplateEditorStore.sampleProps`) | Test data only |
| File/Blob (attachments) | **useRef()** | V5-8 serialization rule |

**Q11. Real-time & Subscription**  
- `subscribeToMore`: **out of scope** for Phase 1-2. Plan for Phase 4+ with WebSocket. Use `window.focus` polling until then (see Q6).  
- `pollInterval`: **out of scope** (caching sufficient).  
- **Version conflict check**: lightweight poll on `focus` reads only `version` field via `EmailVersionQueryDocument { id version }` with `fetchPolicy: "network-only"`.


#### R. Responsive & Mobile Specification

This section explicitly defines responsive behavior, touch interactions, and mobile-specific patterns for every surface in §A–§Q.

**R1. Breakpoints & Tier**  

- **Mobile**: `<600px` (`theme.breakpoints.down("sm")`) — `isMobile=true`  
- **Tablet**: `600–900px` — `isTablet=true`, `isMobile=true` (per ViewportProvider)  
- **Desktop**: `>=900px` (`theme.breakpoints.up("md")`) — `isDesktop=true`  

Tier detection from `useViewport().isMobile` (mobile+tablet) vs `isDesktop`. All views use same route for all tiers.

**R2. List View — Responsive Columns**  

| Column | xs (<600) | sm (600-900) | md (900-1200) | lg+ (>=1200) |
|--------|-----------|--------------|---------------|--------------|
| Status | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| Name | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| Scope | ❌ Hidden | ✅ Visible | ✅ Visible | ✅ Visible |
| Locale | ❌ Hidden | ❌ Hidden | ✅ Visible | ✅ Visible |
| Version | ❌ Hidden | ❌ Hidden | ✅ Visible | ✅ Visible |
| Last Edited | ❌ Hidden | ✅ Visible | ✅ Visible | ✅ Visible |
| Editor Groups | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Visible |

Implement via `useResponsiveColumnModel(useViewport().isMobile, useViewport().isDesktopLevel)` → model passed to AppDataGrid `columnVisibilityModel`.

**R3. List — Mobile‑Specific**  
- **Row actions**: Swipe left → Action row (Archive, Edit, Preview) using `@dnd-kit` `TouchSensor` with activation distance 12.  
- **Search**: Icon button → tap reveals full-width `SearchInput` with close icon.  
- **Filter chips**: `<MobileHorizontalScroll>` for scope/status/locale. Count badge next to search icon.  
- **Pagination**: Numbered pages on desktop → mobile uses **"Show More"** button (load 25 rows). `<AppDataGrid variant="loadMore" />` on mobile.  

**R4. Editor Inspector Drawer (Mobile)**  
- `Drawer anchor="bottom"`, `maxHeight: "85vh"` (same pattern as `filterExport.mobile.tsx`).  
- **Keyboard**: `visualViewport.height - visualViewport.offsetTop - 16` on resize to keep above keyboard.  
- **Swipe dismiss**: `swipeArea="anchor"` (MUI support).  
- **Trigger**: `TuneOutlined` iconButton with `aria-expanded` and `aria-controls="inspector-drawer"`.

**R5. Editor Chrome Bottom Action Bar**  
- Fixed sticky at bottom (zIndex appBar+1), `paddingBottom: env(safe-area-inset-bottom)`.  
- Holds: primary (Save Draft), secondary (Publish), tertiary (Send Test).  
- **Always visible** outside Inspector Drawer.  
- Keyboard shortcut shown on desktop only: `sx={{ display: { xs: "none", md: "inline" }}}`.

**R6. Three Tabs (Design/Preview/Code) Mobile**  

- `Tabs variant="scrollable"` with `scrollButtons="auto"` on mobile (xs, sm).  
- Icon-only on xs; text + icon on sm+.  
- `<Slide direction>` computed from `touchstart`/`touchend` delta (swipe left → right direction).  

**R7. VariableMentionPicker Mobile**  

Full-screen bottom sheet, drawer anchor bottom with border radius → auto-focus search field, results grouped by scope; tap item → insert at cursor in Subject, close drawer, return focus to Subject.

**R8. TipTap (Mobile)**  

- Bubble menu → fixed bottom toolbar (Bold/Italic/Link/Merge-tag/Block Type/Undo/Redo) on selection.  
- Slash command → bottom sheet.  
- **DO NOT auto-focus** on mobile (keyboard takes 50% of view).  
- `@dnd-kit` sensors: `PointerSensor + TouchSensor(distance:8) + KeyboardSensor` in `SortableListWrapper`.

**R9. Preview Tab Mobile Viewport**  
- Remove viewport selector on mobile.  
- Single button: `"Preview on PC"` → opens new tab at `/email-templates/[id]?viewport=desktop`.

**R10. Send Test Dialog Mobile**  
- Dialog → bottom-sheet `Drawer` for mobile.  
- Sample props: single column stack (text inputs above labels).  
- Rate-limit inline as `<Typography variant="caption" color="error">`.

**R11. History Drawer Mobile**  
Same as Inspector — `anchor="bottom" maxHeight="90vh"`. Restore confirmation: `Dialog fullScreen={true}` (mobile) vs centered (desktop).

**R12. Dialogs vs Drawers on Mobile**  

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Send Test | `<Dialog>` centered | `Drawer bottom` |
| Save/Publish Confirm | `<Dialog>` centered | `<Dialog fullScreen={true} />` |
| Archive Confirm | `<Dialog>` centered | `Drawer bottom` |
| Feature Flag Lock Tooltip | `<Tooltip>` | `<Tooltip>` |
| History Restore Confirm | `<Dialog>` centered | `<Dialog fullScreen={true} />` |

**R13. Touch Gesture Reference**  

| Gesture | Pattern | Reference |
|---------|---------|-----------|
| Block reorder in editor | `@dnd-kit` `<SortableList>` with `TouchSensor(distance:8)` | `email-template-sortable.tsx` |
| Delete blocks | Swipe left → action row | `swipeable-row.ts` |
| Long press | 500ms for context menu (fallback) | ... |

**R14. Editor Mobile – Storage & Sync**  
- On mobile, draft saved to `sessionStorage` before `unload` with `JSON.stringify(designJson)`.  
- On return: `sessionStorage.getItem('emailTemplateDraft' + id)`; if present and `isDirty`, show restore dialog: `"You had unsaved changes. Restore them?"`

> **Interoperability note**: All R1–R14 are defined on the **view model layer** (`useEmailTemplateViewModel`, `useEmailListViewModel`) — intentionally tier-neutral. Combine with §A's Mobile/Desktop/Common tier file lists and `createLazyView`. Data-tier layout in `frontend/mobile/views/dashboard/email-templates/` and `frontend/desktop/views/dashboard/email-templates/`.

### i18n (complete key catalogue)

Existing call signature is **`getServerTranslations(locale)`** (single-arg) and it returns synchronously (existing usage at [backend/services/communication/templates/email-templates.ts:32](backend/services/communication/templates/email-templates.ts) calls it without `await`). Backend templates import from `@/shared/locale` — this is the canonical reverse direction; `shared/AGENTS.md` bans only `shared → backend` (one-directional). Research confirms (see [research file 09](.ai/plans/email-templates/reserch/09-i18n-react-email-interop.md)).

#### A. Extend existing `emails` namespace (backend per-scope emails + new errors sub-namespace)

Extend [`shared/locale/types/emails/index.ts`](shared/locale/types/emails/index.ts) with full per-scope labels:
- New `SubjectArgs` per scope, e.g. `ComplaintResponseEmailLabels.subject` already takes `{ complaintTitle }` — extend to all scopes (the file currently only defines `EmailLabels` for 2 of the ~13 scopes above).
- **Add a new `errors` sub-namespace** under `EmailsLabels` — does NOT exist today. Shape:
  ```ts
  export interface EmailsErrorLabels {
    readonly templateNotFound: (scope: string) => string;
    readonly templateNotPublished: (scope: string) => string;
    readonly unauthorizedEditor: () => string;
    readonly invalidDesignJson: () => string;
    readonly attachmentTooLarge: (max: number) => string;
    readonly invalidLocale: (locale: string) => string;
    readonly renderFailed: (scope: string) => string; // V4-10: normalized to bare-string (was object form)
  }
  ```
  Add the `errors: EmailsErrorLabels` field to `EmailsLabels`, then implement it in [shared/locale/en/emails/index.ts](shared/locale/en/emails/index.ts) (`emailsEn.errors.*`) and [shared/locale/ar/emails/index.ts](shared/locale/ar/emails/index.ts) (`emailsAr.errors.*`). **MANDATORY LOCKSTEP (V4-3):** `emailsEn` and `emailsAr` are both explicitly `: EmailsLabels` — adding `errors` to `EmailsLabels` will cause TypeScript errors on BOTH files until they BOTH implement `errors`. They MUST be edited atomically in the same commit.
  
  **Two-path i18n wiring (V4-3 correction):** The Siraj i18n system has two DECOUPLED lookup paths:
  1. **Client path:** `useAppTranslation("emails")` → `defineNamespace` registry at `shared/locale/namespaces/emails/emails.namespace.ts` (handle listed at `shared/locale/namespaces/translation.ts:86`).
  2. **Server path:** `getServerTranslations("emails")` → `getTranslations(locale)` → returns a pre-built message object (`messagesByLocale[locale]` at `server.ts:6-9,15-17`) that statically imports the SAME leaf modules (`emailsEn`/`emailsAr`) the client `defineNamespace` loaders reference. The `Translations` nominal type at `shared/locale/types/message.ts:260` is **TypeScript-only** — it validates the shape at compile time but is NOT consulted at runtime.
  
  SWE review v5 (V5-7): The server path does NOT perform a type-driven runtime lookup. Both paths consume the same `emailsEn`/`emailsAr` leaf modules at runtime. Extending `EmailsLabels` + updating both en/ar impls is sufficient; no separate `namespacePaths` or `MessageSchema` registration needed.
- All service-layer error messages use the corrected call shape: `getServerTranslations(locale).emailsTranslations.errors.<...>` (NOT `getServerTranslations(locale, "emails.errors")` — that two-arg signature does not exist and **will not compile** — verified at `shared/locale/server-graphql.ts:3`; the function is single-arg and synchronous). Added `renderFailed: (scope: string) => string` to the `EmailsErrorLabels` interface for the `safeRender()` fallback. V4-10: all `EmailsErrorLabels` methods use bare-string args consistently (matching existing `complaintResponse: (param: string) => string` precedent).
- Update English ([shared/locale/en/emails/index.ts](shared/locale/en/emails/index.ts)) and Arabic ([shared/locale/ar/emails/index.ts](shared/locale/ar/emails/index.ts)) implementations — every per-scope interface (`InvoiceGeneratedEmailLabels`, `SuggestionAcknowledgedEmailLabels`, `ClassLifecycleEmailLabels`, `StudentLifecycleEmailLabels`, `LessonReportEmailLabels`, `WelcomeEmailLabels`, `PasswordResetEmailLabels`, `EmailVerificationEmailLabels`, etc.) must be added with full en + ar implementations.

Inline-image / attachment labels use the same localized footer pattern.

#### B. NEW `dashboard.emailTemplates` UI namespace (admin management UI)

All new admin UI surfaces need a brand-new `dashboard.emailTemplates` namespace. The `emails` backend namespace (above) is functionally distinct (it covers email BODY/subject strings rendered into outbound emails). The admin UI surface needs its own namespace per the Siraj two-locale system. Below is the COMPLETE key catalogue grouped by surface (verbatim from [research file 04 lines 278-322](.ai/plans/email-templates/glm_swe/ui-research/04-i18n-locale.md)):

**Navigation labels**
- `dashboard.emailTemplates.navLabel` (sidebar entry under Admin group → ALSO add `emailTemplates: string` to `DashboardNavigationLabels` in `shared/locale/types/dashboard/core/nav.ts`)
- `pageTitle`, `pageSubtitle`

**Table headers (`dashboard.emailTemplates.column.*`)**
- `name`, `scope`, `localeColumn`, `status`, `lastEdited`, `version`, `allowedEditorGroups`

**Status chip labels (`dashboard.emailTemplates.status.*`)**
- `draft`, `published`, `archived` (align with `EmailTemplateStatus` enum)

**Button labels (`dashboard.emailTemplates.action.*`)**
- `create`, `edit`, `preview`, `publish`, `archive`, `restore`, `sendTest`, `duplicate`, `copyHtml`, `revisions`, `saveDraft`, `discard`

**Dialog titles (`dashboard.emailTemplates.dialog.*`)**
- `createTitle`, `editTitle: (name) => string`, `deleteConfirmTitle`, `publishConfirmTitle: (name) => string`, `archiveConfirmTitle`, `restoreConfirmTitle`, `sendTestTitle`, `revisionsTitle`
- `unsavedChangesTitle`, `unsavedChangesBody`, `beforeUnloadPrompt`

**Form field labels / help text (`dashboard.emailTemplates.helpText.*`)**
- `displayName`, `slug`, `scopeLabel`, `localeSelect`, `defaultFromName`, `defaultFromEmail`, `allowedEditorGroups`, `attachmentRules`, `defaultSubject`, `designJson`

**Tooltips (`dashboard.emailTemplates.*`)**
- `scopeTooltip`, `editorGroupsTooltip`, `previewTooltip`, `versionTooltip`, `attachmentRulesTooltip`, `featureDisabledTooltip`

**Toast messages (`dashboard.emailTemplates.toast.*`)**
- `saved: () => string`, `published: () => string`, `archived: () => string`, `restored: () => string`, `deleted: () => string`, `testSent: (to: string) => string`, `saveFailed`, `publishFailed`, `archiveFailed`, `sendTestFailed`, `copyHtmlCopied: () => string`, `rateLimited: (limit: number) => string`, `featureDisabled`

**Error messages (UI layer — distinct from `emails.errors` backend fns) (`dashboard.emailTemplates.error.*`)**
- `loadFailed`, `previewFailed`, `notFound`, `notEditable`, `versionMismatch: (expected: number, got: number) => string`, `invalidDesignJson`, `duplicateScopeLocale`, `duplicateSlug`, `missingCompiledHtml`
- **v10 addition (Round 5 cross-section audit §3.3) — GraphQL error-code → UI message bindings:** the existing `toast.rateLimited` / `sendTest.rateLimited` keys are toast-context only; the following three keys are the canonical `dashboard.emailTemplates.error.*` mappings for `EmailTemplateErrorCode` members (§S7 registry at L1661) surfaced via `getGraphQLErrorCode` (S2). Added so `RATE_LIMITED`, `INVALID_EMAIL`, `INVALID_SAMPLE_PROPS` resolve to a UI message instead of a missing-key lookup.
  - `rateLimited` — bound to `RATE_LIMITED` (referenced by §U7 send-test rate-limit flow, L937 inline `<Alert>`; distinct from `toast.rateLimited: (limit: number) => string` which is the toast-context copy). Static bare-string message: "Rate limit exceeded" / "تم تجاوز حد المعدل".
  - `invalidEmail` — bound to `INVALID_EMAIL` (referenced by §U2 Email scalar `parseValue` extension mapping, L1773). Static bare-string message: "Invalid email address" / "عنوان بريد إلكتروني غير صالح".
  - `invalidSampleProps` — bound to `INVALID_SAMPLE_PROPS` (referenced by §P sendTest zod rejection at L1776). Static bare-string message: "Invalid sample properties" / "خصائص العينة غير صالحة".


**Empty states (`dashboard.emailTemplates.empty.*`)**
- `emptyState`, `emptyStateHelp`, `emptyRevisions`, `emptyRevisionsHelp`, `noSearchResults`

**Search / filter (`dashboard.emailTemplates.filter.*`)**
- `searchPlaceholder`, `filterByScope`, `filterByStatus`, `filterByLocale`, `clearFilters`, `viewActive`, `viewArchived`, `viewAll`

**Editor (`dashboard.emailTemplates.editor.*`)**
- `editorLoading`, `editorNotReady`, `discardConfirm`, `previewTab`, `htmlTab`, `codeTab`, `jsonTab`, `copyHtml`, `sendPreviewEmail`, `previewTo`
- **Editor keyboard shortcuts (`dashboard.emailTemplates.editor.shortcuts.*`)** — static getter strings (no params); referenced by §G4 keyboard-shortcut wiring table (L1527-1531). V4-3 lockstep applies.
  - `saveDraft: () => string` — "Save Draft" / "حفظ المسودة"
  - `publish: () => string` — "Publish" / "نشر"
  - `sendTest: () => string` — "Send Test" / "إرسال تجريبي"
  - `close: () => string` — "Close" / "إغلاق"
  - `mergeTags: () => string` — "Insert Merge Tag" / "إدراج علامة دمج"

**Send-test dialog (`dashboard.emailTemplates.sendTest.*`)**
- `recipientLabel`, `recipientPlaceholder`, `sampleProps`, `submit`, `success: (to: string) => string`, `rateLimited: (limit: number) => string`

**Drag-and-drop announcements (`dashboard.emailTemplates.dnd.*`)** — v10 addition (Round 5 cross-section audit §3.2). Referenced by §V7 (L1875-1878) `DndContext accessibility.announcements` config; `onDragCancel` is REQUIRED by dnd-kit's TypeScript interface — omitting it (or its i18n key) is a compile error. For keys with interpolation parameters, the type schema defines `(block: string, pos?: number) => string` (interpolation args named `block` and `pos`; `pos` optional — `started`/`cancelled` carry only `block`, `over`/`dropped` carry both). V4-3 lockstep applies.
- `started: (block: string) => string` — "Grabbed {block}" / "تم التقاط {block}"
- `over: (block: string, pos: number) => string` — "{block} moved to position {pos}" / "تم نقل {block} إلى الموضع {pos}"
- `dropped: (block: string, pos: number) => string` — "Dropped {block} at position {pos}" / "تم إفلات {block} في الموضع {pos}"
- `cancelled: (block: string) => string` — "Drag cancelled" / "تم إلغاء السحب"

**Merge-tag picker (`dashboard.emailTemplates.mergeTag.*`)** — v10 addition (Round 5 cross-section audit §3.2). Referenced by §V8 (L1886) for the `<Autocomplete>` trigger `aria-label`.
- `triggerLabel: () => string` — "Insert merge tag" / "إدراج علامة دمج"

**Misc reusable** — `loading`, `cancel`, `save` — **reuse `common` namespace** (`shared/locale/en/common/index.ts:29-33`). `confirm`, `delete`, `close` are **NOT in common** — add them to `dashboard.emailTemplates`.

**LOCKSTEP rule (V4-3 applies same as `emails`)**: `dashboardEmailTemplates{En,Ar}` MUST be added atomically — the type interface in `shared/locale/types/dashboard/emailTemplates/main.ts` plus en + ar impls + namespace registration must all land in the same commit. Note: each new namespace (especially with functions taking typed args) demonstrates V4-3-style lockstep discipline.

**v10 i18n key additions (Round 5 cross-section audit §3.2-§3.3):** The type interface `EmailTemplatesManagementLabels` in `shared/locale/types/dashboard/emailTemplates/main.ts` MUST declare, and the en impl (`shared/locale/en/dashboard/emailTemplates/main.ts`) + ar impl (`shared/locale/ar/dashboard/emailTemplates/main.ts`) MUST implement, the following 13 keys added in v10 — omitting any one is a TypeScript compile error (V4-3 lockstep):
- `editor.shortcuts.saveDraft: () => string` / `editor.shortcuts.publish: () => string` / `editor.shortcuts.sendTest: () => string` / `editor.shortcuts.close: () => string` / `editor.shortcuts.mergeTags: () => string`
- `dnd.started: (block: string) => string` / `dnd.over: (block: string, pos: number) => string` / `dnd.dropped: (block: string, pos: number) => string` / `dnd.cancelled: (block: string) => string`
- `mergeTag.triggerLabel: () => string`
- `error.rateLimited` / `error.invalidEmail` / `error.invalidSampleProps` (static bare-string getters — `() => string`)
En strings and ar strings are given inline above per key. The `dnd.*` keys with interpolation parameters use `(block: string, pos?: number) => string` shape — note `pos` is typed as `number` (not optional) in the `over`/`dropped` overloads since dnd-kit always supplies a drop position for those callbacks; `started`/`cancelled` carry only `block`.


**7-file atomic changeset for the new UI namespace** (verbatim from [research file 04 lines 326-333](.ai/plans/email-templates/glm_swe/ui-research/04-i18n-locale.md)):
1. `shared/locale/types/dashboard/emailTemplates/main.ts` — define `EmailTemplatesManagementLabels`
2. `shared/locale/en/dashboard/emailTemplates/main.ts` + `shared/locale/ar/dashboard/emailTemplates/main.ts` — both must implement every key atomically (TS errors otherwise — V4-3 lockstep echoes here)
3. `shared/locale/namespaces/dashboard/emailTemplates/main.namespace.ts` — `defineNamespace` handle
4. `shared/locale/types/message.ts` — add `emailTemplates: EmailTemplatesManagementLabels` to `DashboardTranslations` + import the new type
5. `shared/locale/en/messages.ts` + `shared/locale/ar/messages.ts` — add `emailTemplates: dashboardEmailTemplates{En,Ar}` to `dashboardTranslations`
6. `shared/locale/namespaces/index.ts` + `shared/locale/namespaces/translation.ts` — re-export `DashboardEmailTemplates` namespace handle + add to `Translation.Dashboard`
7. `shared/locale/types/dashboard/core/nav.ts` + `shared/locale/en/.../core/nav.ts` + `shared/locale/ar/.../core/nav.ts` — add `emailTemplates` nav label (mirrors the §A navigation addition)

Together with the §A `emails` namespace extension (existing `EmailsLabels` + new `errors` sub-namespace), the i18n work comprises TWO atomic changesets that MUST land together — failing either one breaks the build (TS type error on the missing impl).

### React Email template components (scaffolds — code-versioned, NOT admin-editable)

New directory: [`backend/services/communication/templates/components/`](backend/services/communication/templates/components/)

- `ComplaintResponseEmail.tsx` — typed-props scaffold (replaces orphaned `renderComplaintResponseEmail` HTML); React Email primitives imported from the **unified `react-email` package** (not `@react-email/components`): `import { Html, Head, Body, Container, Section, Img, Text, Button, Hr } from "react-email"`.
- Repeat for each `EmailScope`: `InvoiceGeneratedEmail`, `SuggestionAcknowledgedEmail`, `ClassLifecycleEmail`, `StudentLifecycleEmail`, `LessonReportEmail`, `WelcomeEmail`, `PasswordResetEmail`, `EmailVerificationEmail`
- All components call `getServerTranslations(locale).emailsTranslations.<scope>` (server-safe, synchronous — confirmed by existing usage at [backend/services/communication/templates/email-templates.ts:32](backend/services/communication/templates/email-templates.ts)).
- Body regions are overridable by the DB `designJson` (rendered via `@react-email/editor`); header/footer/subject/attachments come from the typed scaffold.
- Use theme palette (cyan/teal palette from [frontend/THEME_PALETTE.md](frontend/THEME_PALETTE.md)) — colors passed as props from registry to component. Theme tokens reach the emailed HTML output via the `EmailTheming` plugin (research file 10) — not by raw `--re-*` CSS vars which only affect the in-editor chrome.

### Render pipeline (`react-email` v6 API, with safeRender + sanitization)

The `render` function is now imported from the unified `react-email` package (NOT `@react-email/render`). It is **async** and returns `Promise<string>`:
```ts
import { render, toPlainText } from "react-email";
import DOMPurify from "isomorphic-dompurify";
import { logger } from "@/backend/lib/logger";
import { getServerTranslations } from "@/shared/locale/server-graphql";

// safeRender wrapper — P1: try/catch with fallback. Prevents component throw
// (undefined prop, missing translation key) from crashing the entire send.
async function safeRender<S extends EmailScope>(
  scope: S,
  props: EmailTemplateProps<S>,
  locale: string,
  opts?: { readonly designJsonOverride?: string },
): Promise<{ readonly html: string; readonly text: string }> {
  try {
    const template = EMAIL_TEMPLATES[scope];
    // Runtime scope guard — P0: unknown scope from DB should not crash
    if (!template) throw new Error(`Unknown email scope: ${scope}`);
    const html = await render(<template.component {...props} />, { pretty: false });
    // DOMPurify defense-in-depth — sanitizes any remaining XSS vectors after
    // TipTap schema validation at save time (todo 7a). Runs at render (both
    // save-compile and send) for belt-and-suspenders protection.
    const safeHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "img", "table", "tr", "td", "th",
        "thead", "tbody", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
        "span", "div", "hr", "blockquote"],
      ALLOWED_ATTR: ["href", "src", "alt", "style", "class", "id", "width", "height",
        "colspan", "rowspan", "target", "rel"],
    });
    return { html: safeHtml, text: toPlainText(safeHtml) };
  } catch (error) {
    logger.error("Email render failed", { scope, error });
    const t = getServerTranslations(locale).emailsTranslations.errors;
    const fallbackText = t.renderFailed(scope); // V4-10: bare-string arg (not object form)
    return { html: `<p>${fallbackText}</p>`, text: fallbackText };
  }
}
```
The historical `renderAsync` API was removed when `render` became async — don't reference it. The `pretty` helper (prettier formatting, ~300ms) is **skipped in the send pipeline** — email clients don't care about whitespace; use `pretty` only in debug/preview paths, not production sends. For client-side render (e.g. preview iframe in admin), polyfill `ReadableByteStreamController` (`web-streams-polyfill`) for Safari/iOS support; not needed for SSR (Next.js Server Components) — research file 03.

### Logging & forbidden patterns

- Logger via `@/backend/lib/logger` ([AGENTS.md](AGENTS.md) — NEVER `console.*`)
- All hardcoded colors forbidden — theme palette threading. **SWE review v2:** the existing `backend/services/communication/templates/email-templates.ts` uses hardcoded hex colors (violates AGENTS.md) — the new React Email components must use theme palette tokens exclusively via `EmailTheming.configure({ theme })`. When migrating, replace all hardcoded colors in the orphaned `renderXxxEmail` helpers' output with theme tokens.
- No `next-intl` imports — compile-time TS i18n only
- No `any` props types; no text union types — only enums + Record<enum, component>
- File-scoped lint queue verification per AGENTS.md per-file subloop

### Migration / data (Phase 2 — seeds ship with the schema migration, NOT Phase 1)

- **Phase 0 flag-toggle audit (V4-5 migration risk):** Before flipping `EMAIL_TEMPLATES_ENABLED` to `true` in Phase 3, audit subscribers to the 5 null-scope events (NEW_COMPLAINT, NEW_SUGGESTION, SUGGESTION_DUPLICATE_MARKED, CLASS_ACTIVATED, CLASS_STARTED). Today these events send email via `payload.body ?? ""` passthrough. When the flag flips, null-scope events short-circuit and send NO email. If any business process relies on the legacy passthrough for these events, document the impact and either (a) map these events to a scope, or (b) accept the email drop-off as intentional.
- Seed default templates via `bun db seed` — one `emailTemplates` row per `EmailScope` per locale with compiled HTML from the React Email components. Follow [backend/db/seeds/AGENTS.md](backend/db/seeds/AGENTS.md):
  - File: [`backend/db/seeds/notifications/seed-email-templates.ts`](backend/db/seeds/notifications/seed-email-templates.ts) (grouped with other notification-domain seeders)
  - Export: `export async function seedOrGet(...)` (required naming convention)
  - **MUST NOT** import `@/backend/db/**` (schema/repo/drizzleDb) — ESLint enforced; persist via `EmailTemplateService` bootstrap methods (add `upsertManyEmailTemplates` / `findEmailTemplatesByScopes` to service if missing)
  - Add `export { seedOrGet as seedOrGetEmailTemplates } from "./seed-email-templates";` to [`backend/db/seeds/notifications/index.ts`](backend/db/seeds/notifications/index.ts)
  - Add orchestration call to master [`backend/db/seeds/index.ts`](backend/db/seeds/index.ts) in correct dependency order
- Keep existing `notificationsTranslations` namespace for ON_APP + SMS + PUSH channels. Email channel lines the React Email `subject` + `html` pipeline
- Remove orphaned `renderXxxEmail` helpers after migration (they are not in any call path today per explore subagent). SWE review v5 (V5-4): the file EXISTS (5836 bytes at `backend/services/communication/templates/email-templates.ts`) and contains `renderComplaintResponseEmail` + `renderSuggestionAcknowledgedEmail` with hardcoded hex colors (`#1976d2`, `#2e7d32`). This is NOT a greenfield — the file MUST be migrated (hardcoded colors replaced with theme tokens), not overwritten. **Explicit Phase 3 task:** delete `email-templates.ts` AFTER the dispatcher migration to `EmailTemplateService.renderForSend` is complete AND all existing notification payloads route through the new template registry. Verify zero callers (`grep -r 'email-templates' backend/ frontend/`) before deletion — the new `components/*.tsx` scaffolds replace it entirely.

### Test strategy

- Repo tests: `backend/db/test/repo/email/email-template.repository.test.ts` (100% coverage per backend/db/repo/AGENTS.md) — always `runInRollback`, never `rejects.toThrow` inside txn
- Service tests: `backend/services/communication/test/email-template.service.test.ts` — mock the channel facades, no real Resend (per [backend/services/AGENTS.md](backend/services/AGENTS.md))
- Registry type-safety test: ensure `EmailScope` exhaustiveness switches throw on unhandled scopes. Add a compile-time `email-template.registry.types.test.ts` containing `// @ts-expect-error` assertions on wrong-scope calls and `satisfies` checks on right-scope calls so any TypeScript upgrade silently breaking the narrowing will fail the build.
- Bun compatibility checks: `@react-email/editor` bundles TipTap 3.17.x as a direct dep — do NOT install `@tiptap/*` separately. SES adapter needs `@smithy/fetch-http-handler` to avoid Bun 1.3.x HTTPS-hang (#26066). Nodemailer has historical Bun SMTP flakiness (#10329) — **but deployment target is Vercel + Node.js** (next.config.ts confirms), so SMTP is production-grade (see V5-post-SMTP note in todo 4). Local dev can still use Bun. See [research file 11](.ai/plans/email-templates/reserch/11-bun-compatibility.md) and [node_modules verification summary](.ai/plans/email-templates/reserch_node/FINAL-NODE-VERIFICATION-SUMMARY.md).
- Integration smokes: extend [`test/integration/communication/resend.integration.test.ts`](test/integration/communication/resend.integration.test.ts) + add `ses.integration.test.ts` / `postmark.integration.test.ts` etc. gated behind `describeLiveWhen(hasSes, ...)`
- UI component tests under `test/ui/components/` per [test/ui/AGENTS.md](test/ui/AGENTS.md) — `emailTemplatesList.desktop.test.tsx`, `emailTemplateEditor.desktop.test.tsx` (Happy DOM, mocked Apollo)
- E2E test under `test/ui/e2e/` for the admin email-templates flow (requires `bun run build:test`)
- Use `bun run scripts/run-test/run-test.ts` for log capture on all DB tests

**SWE review v3 — missing test cases (must add):**
1. `safeRender()` error fallback path — when `render()` throws, verify fallback HTML is returned and error is logged (service test)
2. Feature flag toggle — test both `EMAIL_TEMPLATES_ENABLED=true` (routes through EmailTemplateService) and `=false` (old passthrough) paths (integration test)
3. `payload.body` fallback when scope is null — verify `null` scope returns `{ success: true, skipped: "no_email_scope" }` and does NOT send email (service test)
4. DOMPurify sanitization — verify `<script>` tags, `onclick` handlers, and `javascript:` URLs are stripped from rendered HTML (service test)
5. Partial unique index — verify that two templates with same scope+locale+status='ACTIVE' cannot coexist (repo test, use `runInRollback`)
6. Full dispatcher → render → send pipeline — integration test verifying: dispatch event → map scope → render template → channel.send (integration test)
7. Concurrent template activation (optimistic locking) — two parallel `publish()` calls on same scope should only succeed once (repo test)
8. E2E editor save flow — getJSON → save mutation → preview rendered in iframe (E2E test, requires `bun run build:test`)

### Future WhatsApp alignment

Note `.ai/plans/whatsapp/implementation.md` exists. The provider-registry pattern is designed generically enough that an SMS channel registry (`smsProviderRegistry`) and WhatsApp channel can follow the same `createRegistry<ISmsChannel, SmsProviderName>` pattern. Do NOT block on this — keep the email registry self-contained.

### Phasing recommendation (not part of plan, just framing)

**SWE review changes incorporated:**
- Todos 1-11 changed from "completed" to "pending" — no code exists in codebase.
- Added 7 new todos (3a, 7a, 7b, 12a, 16a, 20a, 20b) addressing SWE review findings.
- P0 fixes baked into Phase 1: `mapEventTypeToEmailScope` (3a), TipTap schema validation (7a), `safeRender()` wrapper (7b), i18n signature correction (8).
- P1 fixes baked into Phase 2-3: optimistic locking (9, 11), DOMPurify defense-in-depth (12), preview XSS hardening (12a), rate limiting (12), dirty state tracking (16), error handling on save (16a), idempotency (13), impersonation guard (14), bounce webhooks (20a), E2E test (20), bundle size analysis (20b).

**SWE review v3 changes incorporated:**
- V3-1 (Critical): Fixed `resetEmailChannel()` — removed `await` in void function + nonexistent `peek()` method, replaced with synchronous `disconnect?.()` + null assignment matching existing `EmailChannelFactory.ts:87` pattern.
- V3-2 (Critical): Fixed dispatcher code — added `CommunicationPayload` type extension with `templateProps`, replaced `payload.entityId`/`payload.notificationEventId` with `payload.metadata?.entityId`, added `payload.body` fallback for null scope.
- V3-3/V3-5/V3-10 (High): Documented 10 events NOT in `EVENT_CHANNEL_ALLOWLIST` and their intended Phase 3 channel assignments. Pre-existing fallback behavior noted.
- V3-6 (High): Added `EmailEditorWrapper.tsx` pattern in common layer for `next/dynamic` browser-only concerns — both tier views import from this wrapper.
- V3-8 (Medium): Resolved Phase 1 vs Phase 4 enum contradiction — defer adding WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION to NotificationEventType until Phase 4 (option a) to avoid breaking `Readonly<Record<NotificationEventType, ...>>` compile-time exhaustiveness.
- V3-8/P2: Added index on `emailTemplateRevisions.templateId` + unique index on `(templateId, version)` for optimistic locking.
- V3-9 (Medium): Fixed null-scope dispatcher behavior — `payload.body` fallback instead of `success: false`.
- V3-11 (Medium): Documented `findByIdempotencyKey` + `idempotencyKey` column as explicit tasks in todo 13 note — neither exists in codebase today.
- V3-12 (Medium): Verified todo 12 already includes transaction wrapping for template activation (V2-13 carryover).
- V3-14 (Low): Verified todo 12 already includes rate limiting on sendTestEmail (V1-5 carryover).
- V3-15 (Low): Added isomorphic-dompurify Bun compatibility check to Phase 1 scope.
- Added 8 missing test cases to test strategy section.

**SWE review v4 changes incorporated:**
- V4-1 (Critical): Fixed `resetEmailChannel()` to operate on `instance` (line 5 `let`) not `const emailChannel` facade (line 100) — prevents TS2588 compile error.
- V4-2 (High): Inlined `emailTemplateRevisions` indexes into `pgTable` array form — dropped standalone `emailTemplateRevisionsIndexes` named export. Matches canonical codebase convention.
- V4-3 (High): Added explicit i18n en/ar lockstep requirement + two-path coupling documentation (see todo 16 note).
- V4-5 (Medium): Disambiguated null-scope "NO email" comment — clarified legacy passthrough still sends email until flag toggles.
- V4-6 (Medium): Promoted isomorphic-dompurify Bun compatibility verification to Phase 0 GO/NO-GO gate (see todo 21b).
- V4-7 (Medium): Pinned `EmailTheming` import path to `@react-email/editor/plugins` subpath (see editor section).
- V4-4 (Medium): Corrected "idempotencyKey only on invoices" claim — now references all 6 tables with existing pattern (see todo 13 note).
- V4-8 (Low): Changed `notification_deliveries` to Drizzle symbol `notificationDeliveries` + added schema file path (see todo 13 note).
- V4-9 (Low): Added explicit subtask to register `EMAIL_TEMPLATES_ENABLED` in `env-config-keys.ts` (see todo 21c note).
- V4-10 (Low): Normalized `EmailsErrorLabels` argument shapes to bare-string convention (see i18n section).

**SWE review v5 changes incorporated (Grade: B+, 10 issues — 0 Critical, 2 High, 4 Medium, 4 Low, 0 regressions):**
- V5-1 (High/P0): Rewrote dispatcher section — email falls through to `dispatchRecipientChannel` (not standalone case in `dispatch()`). `commonFields` and `tx` are NOT in `dispatch()` scope. Added Approach A (extract `dispatchEmailChannel`) vs Approach B (branch within `dispatchRecipientChannel`) with full code for Approach A. Removed `tx` from `findByIdempotencyKey` call. Removed `text`/`attachments` from `emailChannel.send()` args (`EmailPayload` has no such fields).
- V5-2 (High/P0): Documented boolean flag inversion bug — `resolveEnvConfig` returns string; `"false"` is truthy. Must use `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` from `@/backend/lib/env` (same pattern as `IS_DEMO`). See todo 21c note.
- V5-3 (Medium/P1): Tightened CSP to `img-src 'self' data:` (was `img-src *` — tracking-pixel leak risk). Changed iframe sandbox to `sandbox=''` (was `allow-same-origin` — unnecessary for pure HTML preview). See todo 12a.
- V5-5 (Medium/P1): Consolidated `next/dynamic({ ssr: false })` to `EmailEditorWrapper.tsx` ONLY. Removed contradictory text about adding it in tier view files. Documented that this is an intentional deviation from `createLazyView`'s `ssr: true` default. See editor wrapper section.
- V5-6 (Medium/P1): Documented zero `.tsx` precedent in backend — added Phase 1 verification step (`bun tsgo` + `bun biome:check` + lint on new `.tsx` files). Alternative: `React.createElement()` in `.ts` files if lint issues surface. See registry section.
- V5-4 (Medium/P2): Added explicit Phase 3 task to DELETE `email-templates.ts` after dispatcher migration. File EXISTS (5836 bytes, hardcoded colors) — must be migrated, not overwritten. See migration section.
- V5-10 (Low/P2): Documented `notificationEventId` as brand-new metadata key (never populated). Choice: add to `NotificationMetadataBase` + populate in builders (todo 18), or remove from hash. See todo 13 note.
- V5-7 (Low/P3): Corrected i18n server-path mechanism description — runtime uses pre-built `messagesByLocale` objects (static leaf imports), NOT the `Translations` type (TS-only compile-time). See i18n section.
- V5-8 (Low/P3): Documented no separate Storybook mock-store pattern — use inline `create()` + container-with-args approach. See todo 16 note.
- V5-9 (Low/P3): Added `@next/bundle-analyzer` installation step (not installed today). See todo 20b.


---

### G. Accessibility & Interaction Patterns (v9 — Round 4 Audit Closure)

> New section created in v9 to close 3 dangling §G references found at lines 829, 923, 1077 (cross-section audit report 09 — the v9/v8 draft text cited "790, 884, 1038", corrected in v10 to the actual §G-referencing line numbers). §G did not exist as a section in v6-v8; all refs were forward-promises. This section now exists and is the authoritative source for: (1) reduced-motion hook, (2) button loading state convention, (3) idempotencyKey pattern, (4) keyboard shortcuts.

#### G1. `usePrefersReducedMotion()` Hook Spec

> **v10 correction (Round 5 audit §G1):** Fix path (`frontend/stores/` → `frontend/common/stores/`, the real Zustand stores location hosting ~60 stores), fix non-existent "AdminLayout" → `DashboardLayout.tsx` at `frontend/common/views/dashboard/components/DashboardLayout.tsx`, fix deprecated `navigator.platform` → `navigator.userAgentData?.platform ?? navigator.platform`.

**File:** `frontend/common/stores/preferencesStore.ts` (new Zustand store with `prefers-reduced-motion` media query listener — matches the real Zustand stores path at `frontend/common/stores/` which houses ~60 stores; `frontend/stores/` does NOT exist).

```ts
// frontend/common/stores/preferencesStore.ts
import { create } from 'zustand';

interface PreferencesState {
  prefersReducedMotion: boolean;
  setPrefersReducedMotion: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  prefersReducedMotion: false,
  setPrefersReducedMotion: (value) => set({ prefersReducedMotion: value }),
}));

// Hook: subscribes to matchMedia('(prefers-reduced-motion: reduce)')
// Must be called once at app root (DashboardLayout.tsx at
// frontend/common/views/dashboard/components/DashboardLayout.tsx) to install the listener.
export function usePrefersReducedMotion(): boolean {
  const prefersReducedMotion = usePreferencesStore((s) => s.prefersReducedMotion);
  // Listener installed in a useEffect at app root; this hook just reads state.
  return prefersReducedMotion;
}
```

**Governs:** all framer-motion animations (stagger, SuccessCheckMark, Slide tab transitions), @dnd-kit sortable transitions, Tooltip/Dialog open/close durations. When `true`:
- framer-motion `transition` duration → `0` (instant), `layout` animations → disabled.
- @dnd-kit `transition` → `null` (instant snap).
- MUI `TransitionComponent` props → `timeout={0}` where exposed.
- Does NOT disable CSS `:hover` or `:focus` visual states (those are not "motion").

**Implementation pattern (framer-motion):**
```tsx
const prefersReducedMotion = usePrefersReducedMotion();
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

#### G2. Button Loading State Convention

> **v10 correction (Round 5 audit §G2):** `<Button loading={...}>` has ZERO precedent in the repo. The actual repo convention is `<Button disabled={busy}>` (busy derived from the mutation `loading` flag). The previous "used at line 884" claim was self-referential (plan citing plan) and is removed. MUI v9 `<Button loading>` auto-renders its own internal spinner (a `<CircularProgress>`-equivalent built into the component) — do NOT pass a `<CircularProgress>` element into the `loading` prop; `loading` is a boolean. Note that MUI v9 `<Button loading>` does NOT auto-inject `aria-busy` — see the explicit `aria-busy="true"` requirement below (cross-ref §V8).

**Convention:** All mutation `<Button>` components use the repo convention `<Button disabled={busy}>` driven by their corresponding Apollo mutation `loading` flag. `busy` is the `loading` value from the `useMutation` destructure. If the MUI v9 `loading` prop is preferred over `disabled`, use it with a boolean and let MUI render its built-in spinner — never embed `<CircularProgress>` in `loading` (it is a boolean, not a node).

```tsx
const [saveDraft, { loading: isSaving }] = useMutation(SaveDraftDocument);

// Repo convention (zero-precedent-safe): disabled={busy}
<Button
  disabled={isSaving}
  aria-busy={isSaving ? 'true' : undefined}
  startIcon={<SaveOutlined />}
  onClick={handleSave}
>
  {t('saveDraft')}
</Button>

// Alternative — MUI v9 `loading` prop (boolean; MUI renders its own spinner):
// <Button loading={isSaving} aria-busy={isSaving ? 'true' : undefined} loadingPosition="start" startIcon={<SaveOutlined />} onClick={handleSave}>{t('saveDraft')}</Button>
```

**`aria-busy` requirement (cross-ref §V8):** MUI v9 `<Button loading>` does NOT auto-inject `aria-busy`. Whichever form is used, set `aria-busy="true"` explicitly on the button while a mutation is in-flight so screen readers announce the busy state. Apply to Save Draft, Publish, Send Test, Archive, Restore, Delete.

**Applies to:** Save Draft, Publish, Send Test, Archive, Restore, Delete (all mutations in §K/§L). This convention is the single source of truth for mutation-button busy state — do not create per-button loading state variants.

#### G3. `idempotencyKey` Pattern

> **v10 correction (Round 5 audit §G3):** The repo-wide idempotency pattern is documented in `docs/IDEMPOTENCY.md`. It uses the HTTP header `X-Idempotency-Key` (NOT a GraphQL variable). Server dedup uses Postgres `CacheDbRepository.insertIfNotExists` (NOT Redis SETNX). `EmailTemplateService` does NOT exist yet — this section specs its future interface, not an existing API. The previous `crypto.randomUUID()` guidance regenerated the key on every render — best practice #3 from `docs/IDEMPOTENCY.md` is to REUSE the same key on retry, not regenerate. Added sessionStorage persistence so the key survives a component re-render / accidental unmount between the generate and the retry.

**All mutations** carry an `X-Idempotency-Key` HTTP header (see `docs/IDEMPOTENCY.md` — the repo-wide idempotency pattern; this is an HTTP header, NOT a GraphQL variable) to prevent duplicate sends on network retry. Spec:

- **Client generates ONCE per logical mutation, persisted to `sessionStorage`:** `crypto.randomUUID()` (browser-native, no dep). The key is generated ONCE when the editor first dirties (for Save Draft / Publish) or the dialog opens (for Send Test / Archive / Restore / Delete), then stored in `sessionStorage` under a stable key (e.g. `email-tpl-idem:${mutationName}:${templateId}`). On retry (same logical mutation), REUSE the stored key — do NOT regenerate. This satisfies `docs/IDEMPOTENCY.md` best practice #3 (reuse on retry).
- **Passed as:** HTTP `X-Idempotency-Key` header via an Apollo `httpLink` (or `context.headers`) — NOT a GraphQL variable. Add the header in the mutation's `context: { headers: { 'X-Idempotency-Key': idempotencyKey } }`.
- **Server dedup:** the repo-wide mechanism is Postgres `CacheDbRepository.insertIfNotExists` (NOT Redis SETNX). `EmailTemplateService` does NOT exist yet — when it is created (Phase 1/2), it must follow `docs/IDEMPOTENCY.md`: persist `(idempotencyKey, result)` via `insertIfNotExists` on the first request; on a second request with the same key, return the cached result and do NOT re-execute.
- **Clearing:** delete the `sessionStorage` entry on mutation success or on intentional cancel, so a subsequent mutation gets a fresh key.

```ts
// Client side (every mutation) — generate ONCE, persist, reuse on retry
function getIdempotencyKey(scope: `${string}:${string}`): string {
  const existing = sessionStorage.getItem(scope);
  if (existing) return existing;             // REUSE on retry (best practice #3)
  const key = crypto.randomUUID();            // generate ONCE
  sessionStorage.setItem(scope, key);
  return key;
}

// Clear on success or cancel
function clearIdempotencyKey(scope: `${string}:${string}`): void {
  sessionStorage.removeItem(scope);
}

const idempotencyScope = `email-tpl:saveDraft:${draftId}` as `${string}:${string}`;
const idempotencyKey = getIdempotencyKey(idempotencyScope);
const [saveDraft] = useMutation(SaveDraftDocument, {
  context: { headers: { 'X-Idempotency-Key': idempotencyKey } }, // HTTP header, NOT a GraphQL variable
  variables: { input: { ...draftInput } },                       // no idempotencyKey in variables
  onCompleted: () => clearIdempotencyKey(idempotencyScope),
});
```

#### G4. Keyboard Shortcuts Table

> **v10 correction (Round 5 audit §G4):** Fix three browser-shortcut conflicts. `Cmd/Ctrl+Shift+T` conflicts with browser "reopen closed tab" → changed to `Cmd/Ctrl+Shift+E` (email). `Cmd/Ctrl+Shift+P` conflicts with browser Print → changed to `Cmd/Ctrl+Shift+B` (build/publish). `Cmd/Ctrl+K` conflicts with browser URL bar → kept but flagged with a browser-conflict note. Added `preventDefault()` guidance for each shortcut. `navigator.platform` is deprecated → use `navigator.userAgentData?.platform ?? navigator.platform`. No keyboard shortcut library exists in the repo today; install `react-keyboard-event-handler` or wire `keydown` listeners in the editor ViewModel — do NOT assume a pre-existing helper.

| Shortcut | Action | Context | i18n key | Browser conflict? |
|----------|--------|---------|----------|-------------------|
| `Ctrl/Cmd+S` | Save Draft | Editor (any tab) | `editor.shortcuts.saveDraft` | No (rare) — `preventDefault()` required to stop the browser "save page" dialog |
| `Ctrl/Cmd+Shift+B` | Publish | Editor (any tab) | `editor.shortcuts.publish` | No — replaces the prior `Shift+P` which collided with browser Print |
| `Ctrl/Cmd+Shift+E` | Send Test | Editor (any tab) | `editor.shortcuts.sendTest` | No — replaces the prior `Shift+T` which collided with "reopen closed tab" |
| `Escape` | Close dialog/drawer (unsaved changes confirm if dirty) | Any dialog/drawer | `editor.shortcuts.close` | No |
| `Cmd/Ctrl+K` | Open merge-tag picker | Subject or editor field | `editor.shortcuts.mergeTags` | YES — collides with the browser URL bar focus on Chrome/Firefox/Edge; **STOP the browser default with `e.preventDefault()` and only act when focus is inside the editor/subject field** (so it doesn't globally hijack URL-bar focus) |
| `Tab` / `Shift+Tab` | Navigate form fields | Editor inspector | (default browser) | No |

**`preventDefault()` guidance (every shortcut):** each handler MUST call `e.preventDefault()` and `e.stopPropagation()` to stop the browser's native command before performing its action, AND must verify `!e.defaultPrevented` defensively. Guard with a focus check (e.g. only fire Save/Publish/SendTest when the editor region has focus) so global browser shortcuts are not hijacked. For `Cmd/Ctrl+K` specifically, the merging-picker context (subject line or editor body has DOM focus) MUST be checked before `preventDefault()` — otherwise the browser's URL-bar focus is stolen globally.

```ts
useEffect(() => {
  function onKeydown(e: KeyboardEvent) {
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod || e.defaultPrevented) return;
    if (isMod && e.shiftKey && e.key === 'E' && editorHasFocus()) {
      e.preventDefault(); e.stopPropagation();
      handleSendTest();
    } else if (isMod && e.shiftKey && e.key === 'B' && editorHasFocus()) {
      e.preventDefault(); e.stopPropagation();
      handlePublish();
    } else if (isMod && !e.shiftKey && e.key === 's' && editorHasFocus()) {
      e.preventDefault(); e.stopPropagation();
      handleSave();
    } else if (isMod && e.key === 'k' && mergeTagContextHasFocus()) {
      e.preventDefault(); e.stopPropagation(); // only when editor/subject has focus — never globally
      openMergeTagPicker();
    }
  }
  window.addEventListener('keydown', onKeydown);
  return () => window.removeEventListener('keydown', onKeydown);
}, [handleSave, handlePublish, handleSendTest, openMergeTagPicker]);
```

**Keyboard shortcuts table is authoritative** — do not add shortcuts elsewhere without adding them here. Shortcut labels must go through `t('editor.shortcuts.*')` for localization. Render "Ctrl" vs "Cmd" from `navigator.userAgentData?.platform ?? navigator.platform` (the `navigator.platform` form is deprecated; the `userAgentData?.platform` fallback with the deprecated platform covers older browsers and Safari where the User-Agent Client Hints API is absent).

---

### H. Validation Schemas (v9 — Round 4 Audit Closure)

> New section created in v9 to close dangling §H references found at lines 1971-1972 (v6 introduced §H refs for zod schemas but §H was never created). This section is the authoritative source for all zod validation schemas in the email template system.

#### H1. Save Draft Validation Schema

> **v10 correction (Round 5 audit §H1):** Fix four INVALID items. (a) `scope` enum was `['transactional','marketing','compliance','system']` — WRONG; expand to all 13 `EmailScope` values from `backend/enum/email/emailTemplates.enum.ts`. (b) Remove the `subject` field — no DB column; `subject` is computed at render time via `def.subject(props, locale)`, not stored. (c) Rename `bodyJson` → `designJson` (the actual DB column). (d) Change `allowedEditorGroups` from `z.array(z.string().uuid())` to `z.enum(EmailEditorPermission)` (matching the `EmailEditorPermission` enum at `backend/enum/email/emailTemplates.enum.ts`).

```ts
// backend/lib/validations/emailTemplate.ts  (v10 path fix — see note below)
import { z } from 'zod';
import { EmailScope, EmailEditorPermission } from '@/backend/enum/email/emailTemplates.enum';

export const SaveDraftSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase kebab-case'),
  scope: z.enum([
    EmailScope.COMPLAINT_RESPONSE,
    EmailScope.SUGGESTION_ACKNOWLEDGED,
    EmailScope.INVOICE_GENERATED,
    EmailScope.INVOICE_STATUS_CHANGED,
    EmailScope.PAYMENT_METHOD_CHANGED,
    EmailScope.CLASS_LIFECYCLE,
    EmailScope.STUDENT_LIFECYCLE,
    EmailScope.LESSON_REPORT_SUBMITTED,
    EmailScope.LESSON_REPORT_REVIEWED,
    EmailScope.CLASS_REMINDER,
    EmailScope.WELCOME,
    EmailScope.PASSWORD_RESET,
    EmailScope.EMAIL_VERIFICATION,
  ]),
  locale: z.enum(['en', 'ar']),
  // NOTE: no `subject` field — subject is computed at render via
  // def.subject(props, locale) on the EmailTemplateDefinition, NOT stored on the row.
  designJson: z.record(z.any()),
  allowedEditorGroups: z.enum(EmailEditorPermission).array().optional(),
});
export type SaveDraftInput = z.infer<typeof SaveDraftSchema>;
```

> **v10 path fix (Round 5 audit §H — Path issue):** The original v9 plan placed schemas at `shared/lib/validations/emailTemplate.ts`. That path does NOT exist yet, and `shared/` CANNOT import from `@/backend/enum/` (ESLint enforced — see `shared/AGENTS.md`). Two corrective options: **(option A — preferred)** move the `EmailScope` and `EmailEditorPermission` enums to `shared/constants/` (a layer both frontend and backend can import), then keep the schemas in `shared/lib/validations/emailTemplate.ts`; OR **(option B)** keep the enums in `backend/enum/email/` and place the schemas in `backend/lib/validations/emailTemplate.ts` instead (the example above uses option B). Frontend client forms import zod schemas from whichever layer the choice lands in. Pick one at implementation time — do NOT split the enums and the schema across layers in a way that forces an ESLint violation.

#### H2. Publish Validation Schema

> **v10 correction (Round 5 audit §H2):** Fix two INVALID items. (a) `.omit({ id: z.string().optional() })` is misleading zod v4 syntax — the zod v4 form is `.omit({ id: true })`. (b) Logical contradiction: the v9 schema did `.extend({ id })` to make id required for publishing, then immediately `.omit({ id })` to strip it — leaving PublishSchema without the id it needs. **Decision:** PublishSchema NEEDS the id for publishing — so DROP the `.omit(...)`. Keep the `.extend({ id: z.string().uuid() })` that promotes the optional SaveDraft id to a required id, and add the optimistic-lock `version` field. Do NOT omit the id.

```ts
export const PublishSchema = SaveDraftSchema.extend({
  id: z.string().uuid(),                    // promote optional → required; do NOT .omit() it
  version: z.number().int().positive(),     // optimistic lock check
});
export type PublishInput = z.infer<typeof PublishSchema>;
```

#### H3. Send Test Validation Schema

> **v10 correction (Round 5 audit §H3):** Fix two INVALID items. (a) Remove `'sendgrid'` from the `channel` enum — SendGrid is NOT a registered provider (only Resend, SES, Postmark, Mailgun, SMTP + mock are wired). (b) Change `z.string().email()` to `z.email()` — the repo convention uses zod v4's top-level `z.email()`, not the chained `.email()` string validator.

```ts
export const SendTestSchema = z.object({
  templateId: z.string().uuid(),
  to: z.email(),                            // repo convention: z.email(), NOT z.string().email()
  sampleProps: z.record(z.string(), z.any()).default({}),
  channel: z.enum(['resend', 'ses', 'postmark', 'mailgun', 'smtp', 'mock']).optional(), // NO sendgrid — not a registered provider
});
export type SendTestInput = z.infer<typeof SendTestSchema>;
```

#### H4. Merge-Tag Validation Schema

Merge tags have the form `{{field.path}}`. Validate at subject/body field level:

```ts
export const MergeTagSchema = z.string().regex(/^\{\{[a-zA-Z0-9_.]+\}\}$/, 'Invalid merge tag format');
export const SubjectWithMergeTagsSchema = z.string().min(1).max(200);
// Body validation: merge tags extracted via regex, validated against NotificationMetadataBase keys
```

#### H5. `designJson` Validation Schema

> **v10 correction (Round 5 audit §H5):** Fix two INVALID items. (a) Add the missing TipTap node types (`text`, `bulletList`, `orderedList`, `listItem`, `hardBreak`, `blockquote`) to the `type` enum — TipTap's starter-kit emits all of these and the v9 schema rejected them. (b) Replace `content: z.array(z.any())` with `z.lazy(() => DesignNodeSchema)` for recursive validation. The v9 `z.array(z.any())` form is NOT recursive — it accepts `script`/`iframe` nested >1 level deep, defeating the blocklist. `z.lazy()` lets each nested `content` entry re-validate against the same node schema, so a nested `script`/`iframe` is rejected at every depth (not just the top level).

```ts
// DesignNodeSchema is recursive: a node's `content` re-validates against DesignNodeSchema itself,
// so a nested <script>/<iframe> is rejected at every depth (NOT just the top level).
// z.lazy + a self-referential const requires an explicit type annotation to break the cycle.
type DesignNode = {
  type: 'paragraph' | 'heading' | 'blockquote' | 'listItem' | 'bulletList' | 'orderedList' | 'hardBreak' | 'spacer' | 'divider' | 'button' | 'image' | 'text';
  attrs?: Record<string, unknown>;
  content?: DesignNode[];
  text?: string;
  marks?: { type: 'bold' | 'italic' | 'link' }[];
};

export const DesignNodeSchema: z.ZodType<DesignNode> = z.lazy(() => z.object({
  type: z.enum([
    // block / structural
    'paragraph', 'heading', 'blockquote', 'listItem', 'bulletList', 'orderedList',
    'hardBreak', 'spacer', 'divider',
    // interactive / media
    'button', 'image',
    // inline
    'text',
  ]),
  attrs: z.record(z.any()).optional(),
  // recursive: each embedded node re-validates against the SAME schema → nested script/iframe rejected
  content: z.array(DesignNodeSchema).optional(),
  // text node carries a `text` string + optional marks (bold/italic/link)
  text: z.string().optional(),
  marks: z.array(z.object({ type: z.enum(['bold', 'italic', 'link']) })).optional(),
}));

export const DesignJsonSchema = z.object({
  type: z.literal('doc'),
  // top-level content reuses DesignNodeSchema → recursive structural validation
  content: z.array(DesignNodeSchema),
}).optional();

// Rejected blocklist (enforced at EVERY depth via z.lazy recursion — NOT just top level):
// script, iframe, style, object, embed — these MUST never appear in `type` enum.
```

Section ref: **subject template + send-test dialog** use H3/H4 for client-side validation via react-hook-form + zod resolver. (v10: the prior "see line 884" reference was self-referential plan-citing-plan and is removed.)

Schemas live in `backend/lib/validations/emailTemplate.ts` (v10 path fix — see H1 note: `shared/lib/validations/` does NOT exist yet and `shared/` CANNOT import from `@/backend/enum/` per ESLint enforcement; option B keeps schemas in `backend/lib/validations/`). Frontend client forms import these schemas for react-hook-form + zod resolver; backend service-layer validation imports the same schemas for server-side validation.

---

### S. Error Handling & Resilience (v8 — Round 3 Audit)

**Source:** 8 parallel audit reports at `.ai/plans/email-templates/glm_swe/ui-research-round3/01-08-*.md` (168KB total, 1405 lines).

#### S1. Editor Error Boundary (P0)
`EmailEditorWrapper` embeds a third-party runtime (`@react-email/editor` / TipTap 3.17) via `next/dynamic({ ssr:false })`. A TipTap schema-extension throw, corrupted `designJson` → `getJSON()`, or React Email render failure would bubble to the nearest boundary — **none exists**.
- **Add:** `EmailEditorErrorBoundary` wrapping `EmailEditorWrapper`, mirroring `ViewSwitchErrorBoundary` (`frontend/common/components/ui/container/ResponsiveViewSwitch.tsx:20-79`). Fallback: i18n key `t.editorLoadFailed` (NOT hardcoded English "Editor failed to load") — match the existing boundary's `{ errorMessage }` state shape, MUI `Alert`, and Toolpad `Typography variant="bodyMd"` fallback UI. Place at `frontend/views/dashboard/admin/email-templates/editor/EmailEditorErrorBoundary.tsx`.
- **Plan convention:** class component with `static getDerivedStateFromError(error)` + `componentDidCatch(error, info)` → `logger.error("EmailEditor crashed", { error, info })` + `<Suspense>` fallback UI inside the boundary.

#### S2. Optimistic Lock Round-Trip End-to-End (P0)
The schema has `version` integer + `WHERE version = $1` comment, and §P2 UI handles `VERSION_MISMATCH { expected, actual }` — but the middle layer is unwired.
- **Repo:** `update(id, expectedVersion, patch)` → 0-rows-affected → throw `VersionMismatchError({ expected: expectedVersion, actual: undefined })`. First query the current row to fill `actual` version before throwing.
- **Service:** catch `VersionMismatchError` → re-throw with `extensions: { code: "VERSION_MISMATCH", expected, actual }`.
- **GraphQL:** Pothos mutation throws with `extensions.code` (matching the existing pattern at `auth.mutation.ts` — `extensions: { code: "UPPER_SNAKE" }`).
- **Frontend:** extend the existing `getGraphQLErrorMessage` at `frontend/common/utils/errorUtils.ts:10` with a new `getGraphQLErrorCode(error): EmailTemplateErrorCode | undefined` helper (reads `error.graphQLErrors[0]?.extensions?.code`; returns `undefined` for `networkError`-only errors). Returns the codegen'd client enum (see S7) — NOT a backend const object — per `backend/enum/AGENTS.md:36`. UI in §P2 already consumes this. Do NOT use the codebase-non-existent path `frontend/common/graphql/utils/errorCodes.ts` (it does NOT exist in the repo).
- **Collapse VERSION_RESTORE_CONFLICT into VERSION_MISMATCH.** Restore uses the same `WHERE version = $1` check — one code is sufficient.
- **Add `forceVersion` mutation variant** for the "Overwrite" UI action (§P2). `updateEmailTemplate(id, patch, expectedVersion?, force?: boolean)` — when `force: true`, skip version check.

#### S3. Outbound Send Retry with Backoff + DLQ (P0)
`ResendEmailAdapter` has zero retry — 429/5xx/network failures surface as one-shot `success:false` and the email is lost. The idempotency key would then *block* a legitimate retry (same key → deduped).
- **Add `EmailSendRetryPolicy`** applied in the dispatch path (NOT frontend): retry 429/5xx/network up to 3× with exponential backoff (1s→4s→16s), respect `Retry-After` header for provider rate limits.
- **Record `RETRYING` delivery status** between attempts; on final failure set `notificationDeliveries.status = 'PERMANENTLY_FAILED'` + alert.
- **Idempotency key MUST NOT block retries** of the same logical send when failure was transient — key should only dedup *successful* sends, not attempts. Change: `findByIdempotencyKey` check happens AFTER successful send, not before retry.
- **Circuit breaker:** after 5 consecutive PERMANENTLY_FAILED sends to the same provider, mark the provider as degraded in `EmailProviderRegistry` → skip to fallback provider (if configured) or return `success: false, error: "PROVIDER_DEGRADED"`.

#### S4. Align SESSION_EXPIRED to Existing UNAUTHENTICATED Recovery (P0→P1)
§P7 invents `SESSION_EXPIRED` — this code does NOT exist. The actual recovery (`apollo/utils.ts:205-296`) is: `UNAUTHENTICATED` → `handleAuthError` → `getNewAccessToken()` (deduped via `inFlightRefresh`) → on success `reFetch()` (stay-on-page, no draft loss) → on failure, save draft to `sessionStorage` then `buildLoginHref` redirect.
- **Replace §P7:** Mutation returns `UNAUTHENTICATED` → existing `handleAuthError` attempts `refreshToken` → on success `reFetch()` (stay-on-page, no draft loss) → on failure, save draft to `sessionStorage` then `buildLoginHref` redirect. Do NOT invent a new code or a 2s-delay redirect that skips the refresh attempt — that regresses the production bug the recovery was built to fix.
- **Remove** all references to `SESSION_EXPIRED` in the plan — replace with `UNAUTHENTICATED`.

#### S5. safeRender Degraded-Mode Signal (P1)
`safeRender` catches render throw → returns `"<p>renderFailed(scope)</p>"` HTML. This fallback is **sent as a real email** with `success: true` — the recipient gets a placeholder, no `FAILED` delivery row, no alerting. **v9 correction:** `IEmailChannel.send()` does NOT accept a `text` field — text-version emails are unsupported (only HTML is sent).
- **Correct contract references** (verified against `backend/services/communication/channels/email/IEmailChannel.ts` — the path `backend/types/email/emailChannel.types.ts` referenced in earlier drafts does NOT exist):
  - `EmailPayload` is `{readonly to: string; readonly subject: string; readonly html: string; readonly eventType: NotificationEventType; readonly userId: string; readonly metadata?: NotificationMetadata | null}` — there is NO `from` (consumed inside `ResendEmailAdapter`, never passed in payload) and NO `attachments`.
  - `EmailSendResult` is `{readonly success: boolean; providerMessageId?: string; error?: string}` — NOT `{ html, degraded, error? }`; do NOT conflate these two contracts.
- **Change return type:** `renderForSend(...)` (or `safeRender(...)`) returns `Promise<{ html: string; subject: string; degraded: boolean; error?: Error }>` — drop `text` (IEmailChannel.send() has no `text` field); keep `subject` (render-time subject resolution); add `degraded` (degrade flag consumed by the dispatcher). No `attachments` field (EmailPayload has none).
- **`degraded` consumption path:** the *dispatcher* (NOT `EmailSendResult`) reads `degraded:` — when `true`, mark the notification delivery row `status = 'FAILED'` and `failureReason = "render_degraded"`. `EmailSendResult.degraded` does NOT exist — this flag never flows through the channel interface.
- **Dispatcher:** when `degraded: true`, mark the delivery row as `FAILED` with `failureReason: "render_degraded"` rather than `SENT`. Log `logger.warn("Email render degraded — fallback HTML sent", { scope })` (not `logger.error` — to avoid a false critical alert for a user-visible-but-recoverable state).
- **Wrap dispatcher's `EmailTemplateService.renderForSend`** in try/catch returning `{ success: false, error: "RENDER_FAILED" }` — today an unhandled rejection in the notification job occurs if `renderForSend` throws before `safeRender` (e.g., DB read of `designJson` fails).
- **Extend safeRender try** to cover subject-render fallback explicitly. If the subject-component throws, fall back to `<subject>` text interpolation with merge-tag values (no-ops if missing key).

#### S6. Repository Constraint Violation Mapping (P0)
No existing convention for mapping Postgres `23505` (unique violation) / `40P01` (deadlock) in any repo. Plan's two unique indexes surface as raw `QueryError` → GraphQL throws raw messages to admins.
- **Service does the map (NOT repo):** the existing `backend/services/shared/is-duplicate-error.ts` helper is a boolean predicate (`isDuplicateError(e): boolean` — verified), not a mapper. EXTEND it to `mapDuplicateConstraint(e): { kind: 'scope_locale' | 'slug' } | null` (returns `null` when `e.code !== '23505'`). The SERVICE (not repo) catches the raw `QueryError` and calls `mapDuplicateConstraint(e)`, then throws a typed `DuplicateScopeLocaleError` / `DuplicateSlugError`. This keeps the repo→services import cycle from forming.
- **Typed error classes in neutral layer:** locate `DuplicateScopeLocaleError` / `DuplicateSlugError` at `backend/types/communication/errors.ts` (types layer — NOT `backend/services/communication/email-template-errors.ts`). The types layer is neutral; importing it from repo and service alike creates no `repo → services` cycle. Per `backend/db/repo/AGENTS.md:42`, user-facing strings/typed errors must not live in repository code — placing them in `backend/types/` keeps repos pure.
- **Strip the `e.constraint` assertion:** the claim "Drizzle exposes `e.code, e.detail, e.constraint`" is UNVERIFIED. Treat it as a REQUIREMENT to verify in §W1 integration tests (probe a synthetic `23505` throw, log the resulting `QueryError` shape, then implement `mapDuplicateConstraint` against the observed fields).
- **Service re-throw:** catch the typed errors → re-throw with `extensions: { code: "DUPLICATE_SCOPE_LOCALE" | "DUPLICATE_SLUG" }`.
- **UI:** existing i18n keys `duplicateScopeLocale` / `duplicateSlug` bind to `extensions.code` via the new `getGraphQLErrorCode` helper (S2). Field-level `<FormHelperText error>` displays under the relevant form field (not a form-level snackbar), matching the RHF convention.
- **Deadlock retry:** `40P01` → retry the transaction once (Drizzle already wraps in `db.transaction`).

#### S7. GraphQL Error Code Registry (P1)
The plan references `VERSION_MISMATCH`, `RATE_LIMITED`, `DUPLICATE_SCOPE_LOCALE`, `DUPLICATE_SLUG` in UI flows but never defines them as Pothos mutation throws. The codebase precedent (`auth.mutation.ts`) is `extensions: { code: "UPPER_SNAKE" }` literally — no typed union.
- **Add `EmailTemplateErrorCode`** as a `const` object (matching email enum convention, NOT a TS `enum`) in `backend/enum/notifications/email-template-error-code.enum.ts` (per `backend/enum/AGENTS.md:54`). Do NOT use `createPgEnumFromEnum` for S7 (that helper is for `pgEnum` columns, not GraphQL error codes). 10 members (verified complete): `VERSION_MISMATCH`, `RATE_LIMITED`, `DUPLICATE_SCOPE_LOCALE`, `DUPLICATE_SLUG`, `NOT_FOUND`, `RENDER_FAILED`, `PROVIDER_DEGRADED`, `EMAIL_TEMPLATES_DISABLED`, `INVALID_EMAIL`, `INVALID_SAMPLE_PROPS`.
- **SDL-reachability decision:** registering `EmailTemplateErrorCode` as a Pothos enum produces a DEAD `enum EmailTemplateErrorCode {…}` member with no field referencing it (the 45 existing enums are all value-typed — error codes are NOT value types). Register it AS a Pothos enum AND expose it via a `union SendEmailResult` whose members (`SendEmailSuccess`, `SendEmailError`) carry `errorCode: EmailTemplateErrorCode` — this makes the SDL member reachable. Alternatively, do NOT register and expose union-only via the frontend `extensions.code` path — pick one (the union approach is recommended).
- **Frontend helper:** `getGraphQLErrorCode(error): EmailTemplateErrorCode | undefined` at `frontend/common/utils/errorUtils.ts` (extend the existing helper at line 10, per S2) — reads `error.graphQLErrors[0]?.extensions?.code` and returns the codegen'd client enum value from `@/frontend/common/graphql/generated/gql/graphql-types` (NOT the backend `const` object) per `backend/enum/AGENTS.md:36`. Returns `undefined` for `networkError`-only errors; uses the `CombinedGraphQLErrors.is(error)` guard pattern for both `graphQLErrors` and `networkError` cases.
- **Field-level extensions:** constraint violation errors include `extensions.field: "scope" | "locale"` so the UI can target the correct `<FormHelperText>`.
- **All email-template mutations** throw with `extensions: { code }` matching this enum.

#### S8. Toast/Notification Convention Alignment (P1)
v8 stated `show()` might be severity-less — **v9 correction:** `@toolpad/core` `useNotifications().show()` DOES accept `severity` (verified at `useApolloConnectivity.ts:104` and `useImageUpload.ts:43`). `severity ∈ "success" | "info" | "warning" | "error"`.
- **Keep** all `notifications.show(msg, { severity })` calls as specified in §P.
- **Convention:** use toolpad `notifications.show()` for transient success/info/warning messages. Use `<Snackbar>` + `<Alert>` with `severity` only for dismissible/persisted error contexts requiring user action.
- **Callback-action carve-out (NEW):** `notifications.show(msg, { severity, actionText, onAction })` MAY carry a callback-action button WITHOUT escalating to `<Snackbar>` + `<Alert>`. A inline action button on the transient toast is sufficient when the action is recoverable (e.g., "Retry" after a connectivity blip). Verified pattern at `frontend/common/hooks/useApolloConnectivity.ts:107-118` (`actionText: t.retry`, `onAction: () => checkConnectivity()...`) — that call stays a `notifications.show()` toast, NOT an `<Alert>`. Use this carve-out for email-template send-test / publish retry flows.
- **Remove** the v8 "If NOT…" conditional-implementation branch — it was based on a false premise.

#### S9. Network/Offline — Reuse Existing Infrastructure (P1)
§P7 offline banner via `navigator.onLine` duplicates the existing `createConnectivityLink` (`utils.ts:51-100`) which emits a synthetic `NETWORK_ERROR` and renders `<InitializingUI error>`.
- **Verify §P7 cleanup:** the `SESSION_EXPIRED` symbol appears ONLY in this plan file itself — it never existed in the codebase. After v9/v10 edits, verify §P7 references are fully cleaned up (no remaining `SESSION_EXPIRED` literals anywhere in the plan). The §S4 "Remove all references to `SESSION_EXPIRED`" instruction is self-referential — it targets the plan, not the code.
- **Reuse** module-level `isConnected` state from `apolloLinkState` — do NOT introduce a parallel `navigator.onLine` check.
- **RetryLink interaction:** §Q7 `RetryLink` (5xx only) is positioned AFTER `createConnectivityLink` which short-circuits offline → `NETWORK_ERROR` (statusCode undefined). `retryIf: error.statusCode >= 500` silently drops `NETWORK_ERROR`. **Fix:** position RetryLink BEFORE connectivityLink, OR add `retryIf: error.networkError || error.statusCode >= 500`.
- **Add HttpLink timeout:** existing `HttpLink({ uri, credentials })` has no timeout → a hung request never retries. Add `timeout: 30000` via `ApolloLink.timeout` or a custom `concat` terminator.

---

### T. Performance Optimization (v8 — Round 3 Audit)

#### T1. Memoization Discipline (P0)
Zero occurrences of `React.memo` / `useMemo` / `useCallback` in the 1421-line plan. Editor re-renders on every keystroke.
- **Add `§T1 Memoization` subsection** compelling:
  - `React.memo` on every `EmailTemplateRow` component, `StatusBadge`, `InspectorPanel` sub-components.
  - `useMemo` for derived `compiledHtml` strings, filtered/sorted list rows.
  - `useCallback` for stable handlers passed to descendants (save, publish, archive, restore, sendTest).
- **TipTap editor state isolation:** TipTap editor state lives on the editor instance (`EmailEditorRef.editor`), NOT in React Zustand store. Commit to React state only on a debounced tick (300ms via `useDebouncedCallback`). This prevents keystroke→React state mutation→full editor chrome re-render.
- **`useEffect(() => () => editorRef.current?.editor?.destroy(), [])`** cleanup on unmount — TipTap editors must be `.destroy()`ed to release DOM + ProseMirror state. Codebase has zero precedent (no TipTap yet) but the pattern matches `useImageUpload.ts:169` (`URL.revokeObjectURL` cleanup).
- **React Compiler status — definitively OFF:** `babel-plugin-react-compiler@1.0.0` is installed but NOT enabled — `experimental.reactCompiler` is absent from `next.config.ts` and no `.babelrc`/`babel.config.*`/`.swcrc` exists. All `useMemo`/`useCallback`/`React.memo` in the editor route are therefore **MANDATORY** (not best-effort). Optional v9+ step: enable `experimental.reactCompiler: true` and verify no manual memo is needed — but until then, treat memoization as required.

#### T2. Preview Debounce + Render Cache Reuse (P0)
Preview `network-only` fetchPolicy ignores the stored `compiledHtml` — re-renders server-side on every preview-tab visit. No debounce means a server round-trip per keystroke.
- **§Q2 SUPERSEDED:** Mark §Q2's `PreviewEmailTemplateQueryDocument → "network-only"` row as **SUPERSEDED BY §T2**.
- **v10 CRITICAL fix (Round 5 audit §T2 — the v9 reactivity bug):** The v9 plan said `fetchPolicy={isDirtyRef.current ? 'network-only' : 'cache-first'}` using a **ref**. Refs do NOT trigger re-renders, so Apollo never observed the new `fetchPolicy` value — the dynamic switch was DEAD at runtime. T2 (ref form) also contradicted T7 (which already mandated the per-field selector STATE form `useEmailTemplateEditorStore(state => state.isDirty)`). **Switch to the STATE form:**
  ```ts
  const isDirty = useEmailTemplateEditorStore(state => state.isDirty);   // STATE, NOT ref → re-renders
  // ...
  <Query fetchPolicy={isDirty ? 'network-only' : 'cache-first'} />
  ```
  Now, when `isDirty` flips in the store, React re-renders the component, and Apollo sees the new `fetchPolicy` value. This is the critical v9-fix side-effect — refs were silently breaking the dynamic fetchPolicy.
- **Switch preview fetchPolicy** to dynamic `fetchPolicy={isDirty ? 'network-only' : 'cache-first'}` plus a `version`-equality short-circuit (compare `data.emailTemplate.version === storeVersion` before re-rendering). When `isDirty: false`, serve the stored `compiledHtml` from DB (avoid server render). When `isDirty: true`, re-render server-side. `isDirty` is Zustand client state (NOT a ref) — it CANNOT be an Apollo cache key; use the per-field selector + conditional `fetchPolicy` instead. `useEmailTemplateEditorStore(state => state.isDirty)` drives the re-render → Apollo sees the new fetchPolicy.
- **Add `useDebouncedCallback(300ms)`** for preview re-render on `designJson` change — reuse `use-debounce@10.1.1` (already installed). API: `useDebouncedCallback(callback, delay)` returns a debounced function. The codebase precedent is `useAudienceAutocomplete.ts:22,53,64` (`debouncedSearch` pattern).

#### T3. Lazy-Load Heavy Editor Dependencies (P0)
`next/dynamic` lazy-import only specified for `EmailEditorWrapper`. `@dnd-kit/sortable` (heavy), `framer-motion`, `react-color`, `react-dropzone`, Prism grammars, `recharts` are loaded unconditionally in the editor route.
- **Lazy-load via `next/dynamic`** each heavy dependency inside the editor route component:
  - `@dnd-kit/sortable` → dynamic import in `SortableListWrapper` (only renders when block-reorder mode is active).
  - `framer-motion` → dynamic import in `SuccessCheckMark` and `Slide` tab transition (only renders after send-test or tab switch).
  - `react-color` → dynamic import in `VariableMentionPicker` color controls (only renders when color merge-tag is selected).
  - Prism grammars → `next/dynamic` import with `ssr: false` in code-tab view (todo 16 already notes this).
  - `recharts` → verify if actually needed in editor route; if yes, dynamic import.
- **Add to `next.config.ts` `experimental.optimizePackageImports`:** `@react-email/editor`, `react-email`, `@tiptap/core`, `@tiptap/starter-kit`, `@dnd-kit/core`, `@dnd-kit/sortable`, `framer-motion`, `react-color`, `recharts`.

#### T4. Database Indexes for List Query (P0)
List view filter axes (`status`, `locale`, `updatedAt`, `scope` alone, `search`) have NO supporting indexes — will sequential-scan.
- **Add indexes** to `emailTemplates` schema:
  - `idx_email_templates_status` on `(status)` — for "Show Archived" filter.
  - `idx_email_templates_scope_status` on `(scope, status)` — composite for scope+status filter.
  - `idx_email_templates_updated_at` on `(updatedAt DESC)` — for "Last Edited" sort.
  - `idx_email_templates_created_at` on `(createdAt DESC)` — for "Newest" sort.
- **Search filter (P0):** `search` appears in `keyArgs` (§Q1) but NOT in the GraphQL schema signature (`emailTemplates(scope?, status?, pagination)` — line 772). **Schema/contract mismatch.** Either add `search` to the query signature or remove from keyArgs. If kept, add `pg_trgm` extension + GIN index on `name` + `slug` for `ILIKE '%term%'` performance.

#### T5. N+1 Query Batching (P1)
`EmailTemplateReturnType` joins editor name + last revision (line 507) but batching (`findByScopeIds`, `resolveTemplatesByScopes`) is keyed by scope — not by template id. For a list of N rows, the N editor-name joins + N last-revision joins become N+1 queries.
- **DataLoader batching at Pothos layer:** add `@pothos/plugin-dataloader` `loadable(...)` field declarations on `EmailTemplatePothosObject` for `createdBy` and `lastRevision` fields. This batches per-request (critical for Neon HTTP driver where each repo call is a separate HTTP round-trip — verified `@neondatabase/serverless` at `next.config.ts:61`).
- **Repo method:** add `getRevisionsByTemplateIds(ids: string[], tx?)` Map-returning batch method. The existing `@pothos/plugin-dataloader` is wired at `gqlSchemaBuilder.ts:3` but no `loadable` field is shown in the plan.

#### T6. Bundle Analyzer Wiring (P1)
`@next/bundle-analyzer@16.2.12` IS installed but NOT wired in `next.config.ts`. `next.config.ts` uses ESM (`export default`) — the v8 `require()` + `module.exports` snippet is INVALID. Also `@next/bundle-analyzer` warns "incompatible with Turbopack" and silently skips when Turbopack is enabled (`next.config.ts:62` `turbopack: {}`).
- **Add ESM wrapper** to `next.config.ts`:
  ```ts
  import withBundleAnalyzerFactory from "@next/bundle-analyzer";
  const withBundleAnalyzer = withBundleAnalyzerFactory({ enabled: process.env.NEXT_BUNDLE_ANALYZER === "enabled" });
  export default withBundleAnalyzer(nextConfig);
  ```
- **v10 correction (Round 5 audit §T6):** Change "may skip" → **WILL emit "not compatible with Turbopack"** (deterministic, not probabilistic). `@next/bundle-analyzer` explicitly checks `process.env.TURBOPACK` and short-circuits when Turbopack is on — the skip is deterministic, not a "maybe." So `next.config.ts` `turbopack: {}` + `NEXT_BUNDLE_ANALYZER=enabled` together will NOT produce a report and WILL log the incompatibility warning. To get a report, either temporarily disable Turbopack for the analyzer build (e.g. `NEXT_BUNDLE_ANALYZER=enabled bun run build --no-turbopack` or set `TURBOPACK=0`), OR use the Next.js-native alternative below.
- **Recommended alternative — `next experimental-analyze`:** Next.js 16 ships a Turbopack-native bundle analyzer (no Webpack required). Run `bun run next experimental-analyze` (or the `analyze` script equivalent) to get a Turbopack-compatible report directly. Prefer this over `@next/bundle-analyzer` unless you specifically need the Webpack-era report. Add a note to todo 20b: "Try `next experimental-analyze` first; fall back to `@next/bundle-analyzer` with `TURBOPACK=0` if the native analyzer doesn't surface the breakdown you need."

#### T7. Zustand Selector Discipline (P1)
Plan says "Zustand store" generically. The codebase precedent (`adminComplaintsStore.ts:34`, consumed at `useAdminComplaintsViewModel.ts:68-73`) is per-field selectors: `useAdminComplaintsStore(state => state.searchQuery)`. Without this discipline, the editor's React tree re-renders on every Zustand change.
- **Specify per-field selectors** in `useEmailTemplateEditorViewModel`:
  ```ts
  const designJson = useEmailTemplateEditorStore(state => state.designJson);
  const isDirty = useEmailTemplateEditorStore(state => state.isDirty);
  const isSaving = useEmailTemplateEditorStore(state => state.isSaving);
  // NEVER: const { designJson, isDirty, isSaving } = useEmailTemplateEditorStore();
  ```

#### T8. URL.revokeObjectURL Cleanup (P1)
`File/Blob (attachments)` → `useRef()` (Q10) but no `URL.revokeObjectURL` cleanup specified. Blob URLs leak memory until route unmount.
- **Add cleanup pattern** matching `useImageUpload.ts:169,183`:
  ```ts
  useEffect(() => () => {
    if (attachmentUrlRef.current) URL.revokeObjectURL(attachmentUrlRef.current);
    editorRef.current?.editor?.destroy();
  }, []);
  ```

#### T9. Apollo Cache Eviction (P2)
§Q6 says "refetch lists" after mutation but does NOT specify `cache.evict` for hard delete/archive/restore. Existing precedent: `cache.evict({ id: 'ROOT_QUERY', fieldName: 'managerDirectory' }); cache.gc()` (`useCreateManagerOnboarding.ts:35-36`).
- **Add `cache.evict` + `cache.gc()`** after Archive/Restore/Delete mutations — evict `ROOT_QUERY` `emailTemplates` field, then `cache.gc()` to purge orphaned detail objects.
- **Invalidate `cache-first` history** after Restore: `client.cache.evict({ id: 'EmailTemplateVersions:' + id })` — stale `cache-first` history (Q2) is NOT auto-invalidated when DB rows change.

#### T10. Render Timeout (P1)
`safeRender` has try/catch but no timeout — a slow/hanging React Email render blocks the send path indefinitely. **v9 correction:** `@react-email/render` `render()` signature is `(node, options?) => Promise<string>` — NO `AbortSignal` support. `Promise.race` is the ONLY viable path.
- **v10 corrections (Round 5 audit §T10):** (a) Import-path mismatch — §O says import the Renderer from `react-email` (the umbrella package that re-exports `render`), but T10 was naming `@react-email/render` (the internal package). Reconcile: import from `react-email` in code (the path §O spec'd) BUT verify at implementation time that `react-email` actually re-exports `render` — if it does NOT, fall back to `@react-email/render` directly and update §O to match. Single source of truth must be pinned in the plan. (b) `Promise.race` does NOT cancel the abandoned render promise — the render keeps running in the background (a leak) even after the timeout fires. `@react-email/render` does NOT accept an `AbortSignal` (no `signal` in Options type), so `AbortController` cannot be plumbed in directly. Document the leak explicitly and add a watchdog log.
- **Add render deadline** with a concrete `timeout()` helper (v9 had only the call site, not the helper). 5s render budget. If exceeded, return degraded fallback with `error: RenderTimeoutError`. Reuse `safeRender` degraded-mode signal (S5).
  ```ts
  // backend/services/communication/templates/safeRender.ts
  import { render } from 'react-email';   // per §O; fall back to '@react-email/render' if re-export is absent
  import { logger } from '@/backend/lib/logger';

  function timeout<R>(ms: number, fallback: R): Promise<R> {
    return new Promise((resolve) => setTimeout(() => resolve(fallback), ms));
  }

  class RenderTimeoutError extends Error {
    readonly code = 'RENDER_TIMEOUT' as const;
    readonly isRenderTimeout = true as const;
  }

  export async function safeRender(
    template: React.ReactElement,
    deadlineMs = 5000,
  ): Promise<{ html: string | null; error: RenderTimeoutError | null }> {
    const timeoutErr = new RenderTimeoutError(`render exceeded ${deadlineMs}ms budget`);
    // NOTE: Promise.race does NOT cancel the abandoned render — @react-email/render has no
    // AbortSignal, so the render keeps running in the background after the timeout fires (leak).
    // AbortController cannot be plumbed in here (no `signal` in Options). We accept the leak for
    // a bounded window and log it so it is observable.
    const renderPromise = render(template).then((html) => ({ html, error: null }));
    const result = await Promise.race([
      renderPromise,
      timeout(deadlineMs, { html: null, error: timeoutErr } as const),
    ]);
    if (result.error !== null) {
      // orphaned render is still running — log so it's observable in Vercel logs
      logger.warn('safeRender: render timed out; background render leaked (unavoidable — @react-email/render has no AbortSignal)', { deadlineMs });
    }
    return result;
  }
  ```
- **Watchdog for the leak:** the abandoned `renderPromise` resolves (or rejects) eventually. Catch its `.then().catch()` outside the race with a no-op + `logger.debug` so the unresolved background promise never surfaces as an unhandled rejection. If a future `@react-email/render` release adds `AbortSignal` support, plumb an `AbortController` in: `const ac = new AbortController(); render(template, { signal: ac.signal }); /* on timeout */ ac.abort();` — this cancels the render and removes the leak. Track the upstream feature at `@react-email/render` and adopt it when it lands.

#### T11. List-View Search Debounce (P1)

> **v10 NEW (Round 5 audit §T NEW gap 1):** No debounce specified for the list-view search input. Without it, every keystroke fires the `emailTemplates(search)` query → a round-trip per character.

- **Add `useDebouncedCallback(250ms)`** wrapping the search query — reuse `use-debounce@10.1.1` (already installed). The codebase precedent is `useAudienceAutocomplete.ts:22,53,64` (`debouncedSearch` pattern). The ViewModel exposes `debouncedSearch(value)` from the debounced callback; the input calls it `onChange`. The Apollo `useQuery` only fires after the 250ms quiet window.
- **Reset `page` cursor to 1** on the FINAL debounced update (not per keystroke) so the result page doesn't drift.
- **Race guard:** cancel an in-flight query if a new query is issued (Apollo's `network-only` on `search` variable change handles the latest result; ensure no stale-result flicker via `nextFetchPolicy: 'cache-and-network'`).

#### T12. `React.lazy` + `Suspense` Per Editor Tab (P1)

> **v10 NEW (Round 5 audit §T NEW gap 2):** T3 only mentions `next/dynamic` for `EmailEditorWrapper`; the Design/Preview/Code/History tabbed surfaces are eagerly bundled into the editor route. Each is heavy (TipTap, Prism grammars, history-fetch). Split per-tab so opening the Design tab doesn't ship the Code tab's Prism grammars until needed.

- **Wrap each editor tab component in `React.lazy(() => import(...))`** and gate it behind `<Suspense fallback={<EmailEditorSkeleton />}>`. Tab laziness is component-level, NOT route-level:
  ```tsx
  const DesignTab = lazy(() => import('@/frontend/views/dashboard/admin/email-templates/tabs/DesignTab'));
  const PreviewTab = lazy(() => import('@/frontend/views/dashboard/admin/email-templates/tabs/PreviewTab'));
  const CodeTab = lazy(() => import('@/frontend/views/dashboard/admin/email-templates/tabs/CodeTab'));
  const HistoryTab = lazy(() => import('@/frontend/views/dashboard/admin/email-templates/tabs/HistoryTab'));

  function TabbedPane({ activeTab }) {
    return (
      <Suspense fallback={<EmailEditorSkeleton />}>
        {activeTab === 'design' && <DesignTab />}
        {activeTab === 'preview' && <PreviewTab />}
        {activeTab === 'code' && <CodeTab />}
        {activeTab === 'history' && <HistoryTab />}
      </Suspense>
    );
  }
  ```
- **Why `React.lazy` (not `next/dynamic`):** these in-route tab components are NOT server-rendered (the editor route is `ssr: false` via `EmailEditorWrapper`); `React.lazy` is the right tool for client-only code-splitting here. Keep `next/dynamic({ ssr:false })` for the top-level `EmailEditorWrapper`.

#### T13. EntityCacheService Reuse for Render Cache (P1)

> **v10 NEW (Round 5 audit §T NEW gap 3):** T2's render cache lives only in the Zustand client store — the server re-renders on first load of every template. The repo already has an `EntityCacheService` dual-adapter (Postgres + Redis) cache pattern documented at `docs/services/entity-cache-service.md`. Reuse it for server-side `compiled_html` caching.

- **Wire `EmailTemplateService.renderForSend` / `previewEmailTemplate` through `EntityCacheService.cachedRead`.** Per `docs/services/entity-cache-service.md`, the service provides `cachedRead(namespace, key, loader)` and `invalidate(namespace, key)`. Namespace: `email-template-render`; key: `${scope}:${templateId}:${locale}:${hash(sampleProps)}`.
  ```ts
  // Use the existing EntityCacheService — see docs/services/entity-cache-service.md
  const compiledHtml = await entityCache.cachedRead('email-template-render', cacheKey, async () => {
    return safeRender(<template />);  // T10 mutate-time-keyed cache
  });
  ```
- **Invalidate on Publish/Restore:** call `entityCache.invalidate('email-template-render', cacheKey)` whenever a template's `designJson` / `version` flips (intersect with T9's `cache.evict` path — but T9 evicts the Apollo client cache; T13 evicts the server-side EntityCacheService cache). Without this, the server keeps serving stale `compiled_html` after a publish.
- **Conflict with T2:** T2 keeps a CLIENT STATE cache (`compiledHtml` from DB when `isDirty=false`). T13 keeps a SERVER-SIDE cache. They are complementary — T13 avoids recomputing `compiledHtml` server-side, T2 avoids the round-trip entirely. Layer them: T13's populated cache becomes T2's `cache-first` source.
- **DOC reference:** `docs/services/entity-cache-service.md` describes the dual-adapter (Postgres primary + Redis secondary) cache; the `cachedRead` / `invalidate` API is authoritative there. Reuse, do NOT invent a new cache service.

---

### U. Security Hardening (v8 — Round 3 Audit)

#### U1. Env Key Registration (P0)
`EMAIL_TEMPLATES_ENABLED` env flag is NOT registered in `backend/lib/env-config-keys.ts` — plan todo V4-9 is unexecuted. Without registration, the V5-2 truthy-string bug fires: `resolveEnvConfig('EMAIL_TEMPLATES_ENABLED')` returns `'false'` which is truthy → dispatcher routes through new pipeline even when admin intends off.
- **Add to `env-config-keys.ts`:** entry with `excludeFromDb: true, serverOnly: true` (matching `IS_DEMO` at line 510). Verify `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` returns `false` for unset env var (env.ts:70-71 confirms: `process.env[name]?.toLowerCase() === "true"` → unset = `false`).
- **Do NOT expose via `environment-config.pothos.ts`** — filter out `EMAIL_TEMPLATES_ENABLED` from the client-facing env config query.

#### U2. Server-Side Input Validation for Send-Test (P0)
`sampleProps` validated only client-side (`JSON.parse`); bypassable via direct GraphQL mutation. `to` recipient validated only client-side `z.string().email()`.
- **Server-side zod schema** for `sendTestEmail` mutation input:
  - `to`: use the existing `Email` scalar (`backend/graphql/scalars/emailScalar.ts` — wired into Pothos) instead of plain `String`. **Rejects CRLF at the schema layer** via `validator` — any `\r\n` in `to` fails validation with `INVALID_EMAIL`. Note: the scalar throws `TypeError` on parse, which surfaces as a codeless GraphQL error — add `extensions: { code: "INVALID_EMAIL" }` mapping in the `Email` scalar's `parseValue` error handler. **BLAST RADIUS:** this is a GLOBAL scalar change — `emailScalar.ts:14-23` still throws a bare `TypeError` for every `Email` field in the schema (NOT just `sendTestEmail.to`). Adding `extensions: { code: "INVALID_EMAIL" }` affects every resolvers's `Email` input field. Test the existing `Email`-typed fields (auth, user profile, etc.) before merging — the scalar is shared infrastructure.
  - `sampleProps`: zod schema mirroring `EmailPropsByScope[scope]` (compile-time type-safe; runtime validation). **NON-ACTIONABLE NOTE:** `EmailPropsByScope` is a TypeScript mapped type erased at runtime — there is NO runtime zod schema generated from it. Implementers MUST hand-write 9+ per-scope zod schemas (one per `EmailTemplateScope` value) with drift risk against the TS type. Do NOT assume `z.infer` from `EmailPropsByScope` produces runtime validation — it does not.
  - `templateId`: `z.string().uuid()`.
- **Reject** if `sampleProps` fails zod validation → `extensions: { code: "INVALID_SAMPLE_PROPS" }`.
- **Size limit:** `sampleProps` max 50KB JSON string → prevents render DoS.

#### U3. Preview Query Authorization (P0)
`previewEmailTemplate(templateId, sampleProps)` is listed (line 774) but plan **does not confirm authScope** is applied to the preview query. If accidentally unauthenticated, any logged-in user could read any template's rendered HTML.
- **Add `authScopes: { superAdmin: true, notImpersonating: true }`** explicitly on the `previewEmailTemplate` query field (Pothos). **v9 correction:** bare identifiers `{ superAdmin, notImpersonating }` are INVALID Pothos-4 syntax — boolean flags must be explicit truthy values (matching `environment-config.pothos.ts:168` pattern: `{ permission: AppPermission.X, notImpersonating: true }`). Verify in todo 14 spec.
- **Rate limit:** `previewEmailTemplate` does server-side React Email render per call with caller-supplied `sampleProps` → CPU DoS vector. Add per-user rate limit (30/min). Wire a new `previewEmailRenderRateLimiter = new RateLimiter("ratelimit:email-preview", 30, 60_000, false)` — note `failOpen=false` (unlike the existing `failOpen: true` graphQL limiter at line 165); a down cache should NOT silently allow preview beyond quota.

#### U4. CSP for Preview Iframe (P1)
Plan sets `default-src 'none'` + `style-src 'unsafe-inline'` but omits `script-src 'none'` explicitly and `frame-ancestors`. CSP is specified as a header on "the preview route" but the preview is a **GraphQL query returning a string**, not an HTML route — CSP on `/api/graphql` would break the whole endpoint.
- **CSP injection via iframe `srcdoc`:** the preview client injects a `<meta http-equiv="Content-Security-Policy">` tag inside the iframe's `srcdoc` attribute (NOT a route header). This is the correct place — CSP applies to the iframe document, not the parent. **Safari caveat:** `<meta http-equiv>` inside `srcdoc` has historically been ignored by Safari (the browser enforcement of srcdoc-CSP varies; rely on the iframe `sandbox` attribute as the primary control and treat srcdoc-CSP as defense-in-depth).
- **Full CSP:** `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'`.
- **iframe `sandbox` attribute (REQUIRED):** the iframe tag MUST carry `sandbox=''` (empty string — NONE of `allow-same-origin`, `allow-scripts`, `allow-forms`). This creates a unique opaque origin with no script execution, no form submission, no storage access, and no same-origin access to the parent. Without `sandbox`, the iframe runs with parent-origin privileges defeating the CSP intent above. The `srcdoc` CSP is defense-in-depth on TOP of `sandbox=''`, not a replacement for it (overrides the body-mandated sandbox at line 66/1428).
- **`frame-ancestors 'self'`** allows the parent app to embed the iframe; `base-uri 'none'` + `form-action 'none'` block CSS exfil redirects.
- **X-Frame-Options conflict:** if `next.config.ts` `headers()` sets `X-Frame-Options: DENY` globally, the preview iframe will be blocked. Either (a) remove `X-Frame-Options: DENY` from the global headers and rely on CSP `frame-ancestors 'self'` only, or (b) add a route-specific override for the editor path. Verify the existing `next.config.ts` `headers()` configuration before deploying.

#### U5. DOMPurify + Re-Sanitize on Read (P1)
`compiledHtml` cached in DB post-sanitize means a future DOMPurify config change (new CVE) does NOT re-sanitize cached rows until re-save.
- **Add "re-sanitize on read" pass:** `safeRender` runs DOMPurify at RENDER time (both save-compile and send) — the stored `compiledHtml` is a cache, NOT the source of truth. Always re-sanitize the `compiledHtml` from DB before sending: `DOMPurify.sanitize(storedCompiledHtml, { ...config })`.
- **§T2 reconciliation (cross-reference):** §T2 specifies a `cache-first` Apollo fetch policy for reading `compiledHtml` on the CLIENT. This is the CLIENT cache (Apollo in-memory) — it does NOT bypass server-side sanitization. The DOMPurify re-sanitize runs SERVER-SIDE before every HTTP response (including reads the client receives via `cache-first` — the cache is consulted client-side, but the row was server-sanitized when last fetched). Apollo `cache-first` is for the CLIENT cache only and has no effect on server-side DOMPurify.
- **Add `<iframe>`, `<object>`, `data:` URLs** to the DOMPurify test vectors (SWE v3 test #4 currently only covers `<script>`, `onclick`, `javascript:`). These are known DOMPurify bypass vectors relevant to the preview iframe.
- **Add `FORBID_TAGS: ['style']` AND `FORBID_ATTR: ['style']`** to the DOMPurify config. Inline `<style>` tags enable CSS exfil; the inline `style` attribute ALSO enables exfil (combined with CSP `style-src 'unsafe-inline'`, an attacker gets inline-style exfil at the CSP layer). Forbid BOTH the `<style>` block element AND the `style` attribute. If per-element inline styling is required for email rendering fidelity, document the explicit DOMPurify `ALLOWED_ATTR` allowlist and per-tag override — do NOT blanket-allow `style`.

#### U6. SMTP Header Injection Prevention (P1)
`subject` / `to` / `defaultFromEmail` pass through to raw SMTP header construction in nodemailer — CRLF injection (`\r\n`) can inject headers.
- **Add `sanitizeHeader(str)` helper** in `SmtpEmailAdapter` (NOT the `Email` scalar — see U2's blast-radius note): strip `[\r\n]` AND bare `\n` AND RTL/LTR bidi marks (`\u202E\u202D\u200E\u200F` — right-to-left override, left-to-right override, RTL mark, LTR mark) from all envelope/header fields before `nodemailer.sendMail()`. The strip regex must cover all five character classes. Apply `sanitizeHeader` to `from`, `to`, `cc`, `bcc`, `subject`, `replyTo`, AND `Return-Path` (the envelope sender — also a SMTP header injection vector).
- **Do NOT reuse the `Email` scalar** for `subject` / `replyTo` / `cc` / `bcc` / `Return-Path` — `subject` is free text, not an address; `cc`/`bcc`/`replyTo`/`Return-Path` are addresses but the scalar change in U2 is GLOBAL (affects every `Email` field — separate blast radius). `sanitizeHeader` is the right tool for all non-`to` header fields.
- **Subject merge-tag injection:** no maxlength, no forbidden-variable allowlist. If `subject` template is `"Order {{user.secret}}"` and `user.secret` resolves to internal data, it leaks via the subject line. Add validation: merge-tag keys must be in `EmailPropsByScope[scope]` — reject unknown keys at subject-template SAVE time. AND add `sanitizeSubject(resolvedSubject)` AFTER merge-tag resolution at SEND time — allowed keys still leak if a resolved value (e.g. `user.name` from a poisoned DB row) carries CRLF/bidi marks.

#### U7. Rate Limit Atomicity (P1)
**v9 correction:** v8's premise was BACKWARDS. `limit()` uses `cacheService.pipeline` with 4 commands (non-atomic, TOCTOU). `limitSimple` (`ratelimit.ts:103-158`) does `get → set/incr → ttl` as **separate non-atomic operations** (3+ cache round-trips) — it is LESS safe than `limit()`, not more.
- **Implement a real atomic Lua script** for Redis backends: `INCR → conditional EXPIRE → return`. Branch on cache backend (`CacheServiceFactory.ts:35` reads `CACHE_PROVIDER`): Redis → Lua script; Postgres → `pg_advisory_xact_lock` per `(prefix, identifier)`. **DELETE the "memory → accept non-atomic" branch** from v9 — `CacheServiceFactory` has NO memory provider (only `redis` and `postgres`), so the memory branch is dead code.
- **`IRedisService` interface extension (REQUIRED):** the current `IRedisService` has NO `eval` / `evalsha` / `script load` method. Implementing the Lua script REQUIRES extending `IRedisService` with `eval(script, keys, args)` / `evalsha(sha1, keys, args)` / and a `scriptLoad(script)` registration step, and mirroring the additions on BOTH `LocalRedisAdapter` and `UpstashRedisAdapter` (i18n + business-logic consistency across providers). Without this extension the atomic Lua script cannot run.
- **Postgres atomic path:** `PostgresCacheAdapter` exposes no advisory-lock method today — implement `db.execute(sql\`SELECT pg_advisory_xact_lock(hashtext(${key}))\`)` inside the cache adapter (the lock is transaction-scoped and auto-released on commit). This is a brand-new pattern in the codebase — add an integration test under §W1.
- **Entrypoint decision (CHOOSE ONE):** either (a) email template limiters use a NEW entrypoint that calls the atomic path DIRECTLY (bypassing `checkRateLimit`), leaving existing `checkRateLimit`-based limiters untouched; OR (b) `checkRateLimit` is migrated wholesale to the atomic path, with knock-on effects on every existing limiter using it. Option (a) is safer (smaller blast radius); document the choice and the list of affected limiters if (b) is chosen.
- **Send-test rate limit:** wire `sendTestEmailRateLimiter = new RateLimiter("ratelimit:email-send-test", 5, 60_000, false)` — `failOpen=false` (a down cache should NOT silently allow send-test beyond quota). Use the new atomic Lua script.
- **Preview query rate limit:** 30/min per user — use the same atomic Lua script (not `limitSimple`).

#### U5-webhook. Inbound Webhook Security (P1)
**NEW (v10):** §U had NO section for inbound webhook security — bounce/complaint webhook delivery surfaces unauthenticated endpoints. Add for `app/api/email/events/route.ts` (Resend/Svix webhook receiver):
- **HMAC signature verification:** Resend uses Svix for webhook signing. Verify the `svix-signature` / `svix-timestamp` / `svix-id` headers against `RESEND_WEBHOOK_SECRET` BEFORE any DB write. Reject unauthenticated requests with 401 (do NOT process unsigned events).
- **Idempotency key on `event.id`:** store each inbound `event.id` with a SETNX + TTL (24h, mirroring §G3's outbound idempotency pattern). Duplicate event deliveries (network retries from Svix) MUST NOT double-count bounce/complaint deliverability metrics — the dedup is at the webhook boundary, not the message delivery boundary.
- **Per-event rate limit + replay window:** reject events whose `svix-timestamp` falls outside a 5-minute replay window (older timestamps are replay attacks) AND apply a per-event-type rate limit at the route handler (e.g. 1000 `delivery.event` / minute for the Resend tenant) to cap webhook throughput. Log rejected events via `logger.warn`.
- **Note:** this is INBOUND (provider → API → DB) — distinct from U5 (DOMPurify, outbound) and U7 (rate limit, outbound GraphQL).

---

### V. Accessibility & RTL Depth (v8 — Round 3 Audit)

#### V1. Dangling §G Cross-Reference (P0) — RESOLVED in v9
**Historical (v8):** `§G` was referenced 3× (lines **829, 923, 1077** — corrected v10 from the v9 "790, 884, 1038" citations, which pointed at the wrong line numbers; v8's "lines 790, 884, 1038" forward-promises did not match the actual §G-referencing lines) as the authoritative source for reduced-motion + button loading + idempotencyKey, **but §G did not exist** as a section in v6-v8. Headers jumped §A–§J (§F, §G, §H, §I entirely absent). Dangling cross-reference broke spec closure.
- **v9 closure:** §G (Accessibility & Interaction Patterns) and §H (Validation Schemas) were both created in v9 (see changelog v9 entry). The §G references at lines **829, 923, 1077** (v10-corrected from the v9 "790, 884, 1038" draft) now resolve to §G1/§G2/§G3 (L1440+); the §H references (L1971-1972) now resolve to §H1 (L1542+). No dangling §G/§H reference remains in v9+. This V1 entry is retained as a historical record of the v8 dangling-reference finding; the v9 changelog documents the closure.
- **Original v8 remediation spec (now implemented in §G):** §G contains `usePrefersReducedMotion()` hook spec (G1 → V2 below), button loading state convention (`<Button loading>` + `aria-busy`, G2), `idempotencyKey` pattern (G3), keyboard shortcuts table (G4 → V5 below).

#### V2. usePrefersReducedMotion Implementation (P0)
The `usePrefersReducedMotion()` hook is not implemented anywhere in the codebase and the plan only says "guard (§G)". No specification of which animations it governs. **v10 reconciliation with §G1:** §G1 (authoritative) declares `frontend/common/stores/preferencesStore.ts` (Zustand store) — V2 previously specified a matchMedia hook at `frontend/common/hooks/usePrefersReducedMotion.ts`. To remove the §G1↔V2 architectural contradiction, BOTH sections now reference the SAME path: `frontend/common/stores/preferencesStore.ts` (Zustand store — consistent with the ~60-store repo convention under `frontend/common/stores/`). The Zustand hook `usePrefersReducedMotion()` exported from `preferencesStore.ts` is the single entrypoint; the `matchMedia('(prefers-reduced-motion: reduce)')` listener is installed inside the Zustand store's init effect, NOT in a separate hook file.
- **Implement at the path declared by §G1:** `frontend/common/stores/preferencesStore.ts` (NOT `frontend/common/hooks/usePrefersReducedMotion.ts` — that path is deprecated in v10).
  ```ts
  usePrefersReducedMotion(): boolean  // true if `(prefers-reduced-motion: reduce)`; reads from the Zustand store, not matchMedia directly
  ```
- **Govern animations (aligned with §G1's governance list — framer-motion / SuccessCheckMark / Slide / @dnd-kit / Tooltip / Dialog durations; NOT the divergent V2 v9 list of Toast/Stagger/Slide):** stagger (`MetricCard`), `SuccessCheckMark`, `@dnd-kit` `dropAnimation`, `<Slide>` tab transition, autosave toast. When reduced: disable stagger, instant fade for SuccessCheckMark, `dropAnimation={null}` in dnd-kit, `<Slide>` becomes instant opacity transition, autosave toast skips entrance animation. (§G1 is authoritative for the FULL animation list — V2's list above is a subset for editor-context clarity only.)

#### V3. Screen Reader Live Regions (P0)
Plan defines explicit error/loading/toast UI (§P) but specifies **no `aria-live` region**. Repo has 0 `aria-live` usages in `frontend/`.
- **Add `aria-live="polite"`** to save-success toast container, status-badge update region (§P "status badge update" — line 949).
- **Add `aria-live="assertive"` (SEPARATE region):** add a distinct `<div aria-live="assertive" role="alert" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>` near the polite region. The assertive region is reserved for the `FormErrorSnackbar` + version-mismatch dialog messages — these NEED to interrupt the user (NOT queue behind polite toasts). Two separate regions are required (polite + assertive), NOT one combined region — combining them would queue errors behind polite toast text. Route FormErrorSnackbar/version-mismatch text to the assertive region via the same `useNotifications` + `useEffect` write-to-textContent pattern.
- **Add `role="status"` to status-badge cell** in AppDataGrid so screen readers announce changes.
- **Implementation:** add TWO `<div>` regions (one polite, one assertive) near the toast/snackbar mount point in the editor route.

#### V4. Arabic Pluralization Rules (P0)
All 9 pluralizable toast/error keys use `(count: number) => string` — repo convention just interpolates the raw count. `rateLimited: (limit: number)` and `versionMismatch: (expected, got)` produce grammatically wrong Arabic for n=0, n=2, n=11.
- **Add Arabic plural rules** to the `dashboard.emailTemplates` namespace: define a `pluralize(count: number, forms: { zero, one, two, few, many, other })` helper in `shared/locale/ar/dashboard/emailTemplates.ts`. Each pluralizable key becomes:
  ```ts
  saved: (count: number) => pluralizeAr(count, {
    zero: "لم يتم الحفظ",
    one: `تم حفظ ${count} قالب`,
    two: `تم حفظ ${count} قالبين`,
    few: `تم حفظ ${count} قوالب`,
    many: `تم حفظ ${count} قالبًا`,
    other: `تم حفظ ${count} قالب`,
  }),
  ```
- **English side:** keep simple `count === 1 ? "Saved 1 template" : `Saved ${count} templates`` — English has only one/other.
- **`rateLimited`, `versionMismatch`**: same pattern — wrap numeric args in `pluralizeAr` when locale=ar. For `versionMismatch(expected, got)`, both `expected` and `got` need pluralization (they are integers).

#### V5. Keyboard Shortcuts (P1)
v6 changelog advertises "Save Draft + Publish + Send Test actions with keyboard shortcuts" — but the plan body never lists the shortcut bindings. Desktop action bar only *displays* shortcut text (`sx={{display:{xs:"none",md:"inline"}}}` line 1107) but no shortcut wiring. **v10 reconciliation with §G4:** the §G4 table is the AUTHORITATIVE shortcut table (declared "do not add shortcuts elsewhere without adding them here"). V5's v9 table was the "elsewhere" §G4 forbade AND used a hostile `Ctrl+P` for Publish (clashes with browser print). DELETE the V5 shortcut table — it is now consolidated into §G4.
- **See §G4** for the authoritative keyboard shortcuts table (Ctrl+Shift+P for Publish — NOT Ctrl+P which clashes with browser print; Ctrl+Shift+T for Send Test; Escape for close; Cmd/Ctrl+K for merge-tag picker).
- **Implementation:** `useHotkey` hook at `frontend/common/hooks/useHotkey.ts` — listens via `useEffect` + `document.addEventListener('keydown', ...)` with `preventDefault`. Guard: skip when focus is in a text input (except `Esc`). Hook consults §G4 as its source of truth for the binding map; any shortcut added to §G4 must be wired through `useHotkey` — never declare a shortcut in V5 or anywhere else.

#### V6. Focus Restoration After Dialog/Drawer Close (P1)
Drawer/Dialog focus trap is delegated to "MUI default — no work" (line 788), but **focus restoration after close** is unspecified. For history drawer, "Restore" in flight, and send-test close-after-success this matters.
- **Add `onClose` handler** that calls `restoreFocus_prevRef.current?.focus()` — MUI Dialog/Drawer supports this via the `onClose` + internal focus management. Explicitly capture the previously-focused element in `onOpen` → `prevFocusRef.current = document.activeElement`.

#### V7. Drag-and-Drop Screen Reader Announcements (P1)
`@dnd-kit/sortable` block reorder (R8/R13) specifies sensors + `KeyboardSensor` but **no ScreenReader / `LiveAnnouncer` script**. **v9 correction:** v8 fabricated `useSortableAnnouncements` — the real API is the `Accessibility` component type's `announcements` object. **v10 correction (Round 5 audit):** the v9 claim "v8 omitted `onDragCancel` which is REQUIRED on dnd-kit's interface" is FALSE. `accessibility.announcements` is OPTIONAL (`accessibility?: Accessibility`); IF supplied, the `Announcements` interface requires **all four** handlers (`onDragStart`, `onDragOver`, `onDragEnd`, `onDragCancel`). Supplying only three causes a compile error; supplying all four does NOT require spreading `...defaultAnnouncements` first — and in fact the `...defaultAnnouncements` spread is REDUNDANT when all four handlers are overridden (the defaults already cover cancel, but the overrides fully shadow them).
- **Add `announcements`** to `DndContext` config (supply all four handlers; DROP the redundant `...defaultAnnouncements` spread since all four are overridden):
  ```ts
  import { defaultAnnouncements } from '@dnd-kit/core'; // import only if you want defaults for non-announcements fields; drop the spread below
  <DndContext accessibility={{
    announcements: {
      onDragStart: ({ active }) => t('dnd.started', { item: active.data.current?.blockLabel }),
      onDragOver: ({ active, over }) => over ? t('dnd.over', { item: over.data.current?.blockLabel }) : "",
      onDragEnd: ({ active, over }) => t('dnd.dropped', { item: active.data.current?.blockLabel, target: over?.data.current?.blockLabel }),
      onDragCancel: ({ active }) => t('dnd.cancelled', { item: active.data.current?.blockLabel }),
    },
  }}>
  ```
- **`blockLabel` wiring (REQUIRED for the announcements to say anything meaningful):** every sortable item supplies its label to dnd-kit by wiring `useSortable({ data: { blockLabel: t('editor.block.<type>.label') } })` — the `active.data.current?.blockLabel` / `over.data.current?.blockLabel` reads come from this `data` slot. Specimen:
  ```ts
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id,
    data: { blockLabel: t(`editor.block.${block.type}.label`) }, // block.type ∈ 'text'|'heading'|'button'|'image'|'spacer'
  });
  ```
  The per-block `editor.block.<type>.label` i18n keys MUST be present in the §B catalogue (V4-3 lockstep — missing keys cause TS compile errors).

#### V8. ARIA Roles on Merge-Tag Picker & Sortable List (P1)
**v9 correction:** v8 instructed overriding dnd-kit's `DraggableAttributes` with `role="listitem"` + `aria-roledescription="draggable item"` — this CONFLICTS with dnd-kit's defaults (`role="button"`, `aria-roledescription="draggable"`) and DESTROYS keyboard D&D. Also MUI `<Autocomplete>` handles ARIA automatically — don't add `role` manually.
- **VariableMentionPicker:** MUI `<Autocomplete>` automatically wires `role=combobox`, `role=listbox`, `role=option`, `aria-expanded`, `aria-controls`, `aria-activedescendant` — DO NOT add these manually. Only add `aria-label={t('mergeTag.triggerLabel')}` on the trigger.
- **SortableList:** wrap each sortable item in `<li role="listitem">` as the list container, but `{...attributes}` from `useSortable()` must be spread on the inner `<div>` — dnd-kit's `role="button"` + `aria-roledescription="draggable"` stay intact. Do NOT override `role` or `aria-roledescription` on the sortable element.
- **`aria-busy`**: add to `<Button loading>` states (isSaving, isSendingTest). `<Button loading aria-busy="true">`.
- **`aria-invalid` + `aria-describedby`**: form validation uses `<FormHelperText error>` but no `aria-invalid` and no `aria-describedby` linkage. Add to RHF `Controller`: `aria-invalid={!!fieldState.error}` `aria-describedby={`${field.name}-helper-text`}`. Use the repo-convention default `mode: 'onSubmit'` (NOT `mode: 'onTouched'` — every existing `useForm` call in the repo uses the default `onSubmit`; matching it avoids a one-off validation timing divergence). With `onSubmit`, `fieldState.error` flips on first submit (then on every change thereafter) — `aria-invalid` follows the same timing.

---

### W. Testing Depth (v8 — Round 3 Audit)

#### W1. GraphQL Integration Test Directory (P0)
Plan lists **zero** test files under `frontend/common/graphql/test/email/`. AGENTS.md mandates per-domain organization.
- **Add directory `frontend/common/graphql/test/email/`** with:
  - `emailTemplates.query.test.ts` — list query with filters (scope, status, locale, search, pagination).
  - `emailTemplates.mutation.test.ts` — create, update (with version mismatch), setActive, delete.
  - `previewEmailTemplate.query.test.ts` — preview render with sampleProps (success + render failure).
  - `sendTestEmail.mutation.test.ts` — send-test with rate-limit + Zod validation.
- Use `testClient` (NOT raw fetch) per `frontend/common/graphql/AGENTS.md`.
- **Throw-and-log probe (closes §S6 cross-link at line 1654):** add `backend/db/test/email/drizzle-constraint-probe.test.ts`. Purpose: trigger a REAL `23505` unique violation against the real test DB (NOT inside `runInRollback` — outside any wrapping transaction so the error bubbles), catch it, and assert `e.code === "23505"`, `e.constraint` contains the index name (`email_templates_scope_locale_active_uq`), `e.detail` carries the `(scope, locale)` key. This probes the runtime Drizzle → pg error shape so §S6's constraint-name matching logic can be authored against verified field names. Disambiguation: probe = `.test.ts` (NOT a script); runs against the real test DB (NOT inside `runInRollback`); Phase-2 gated (needs `email_templates` table).

#### W2. Apollo Mock Factory Pattern (P0)
**v9 correction:** v8 cited `createSearchMock()` from `SearchScheduleContainer.test.tsx` — this does NOT exist. **v10 correction (R5 audit):** v9's cited precedent (`SearchScheduleContainer.stories.tsx`) is the WRONG model — it uses raw `MockedProvider` + untyped `MockedResponse[]` array, contradicting the "use TestWrapper, NOT raw MockedProvider" rule. The correct typed-factory precedent sits in the `.test.tsx` files (line 166-192): `createSearchMock()` returning `MockLink.MockedResponse[]` and `createTeachersMock()` returning a single `MockedResponse` — typed factories with explicit return types, consumed by `TestWrapper`. Follow the `.test.tsx` factory precedent, NOT the `.stories.tsx` raw-array pattern. Also, the proposed `frontend/common/graphql/test/email/mocks/` subdir violates AGENTS.md ("sub-dirs hold only `*.test.ts`"). Put mock factories in `test/ui/components/email-templates/mocks/` instead.
- **Add `test/ui/components/email-templates/mocks/emailTemplateMocks.ts`** with mock factories returning `MockLink.MockedResponse[]` (NOT `MockedResponse<X>[]` — use `MockLink.MockedResponse` from the codebase's existing `MockLink` plumbing):
  ```ts
  export function createEmailTemplatesListMock(variables: ..., result: ...): MockLink.MockedResponse[] {
    return [{ request: { query: EmailTemplatesQueryDocument, variables }, result: { data: { emailTemplates: result } } }];
  }
  ```
  - `createEmailTemplateDetailMock(id, result)` — detail query mock.
  - `createSaveEmailTemplateMock(vars, result)` — mutation mock.
  - `createVersionMismatchMock(vars)` — error mock: `error: new Error("VERSION_MISMATCH")` + `result: { errors: [{ extensions: { code: "VERSION_MISMATCH" } }] }`.
  - Use `TestWrapper` from `test/ui/components/` (provides `MockLink` + `ThemeProvider` + `i18n`) — NOT raw `<MockedProvider>`.

#### W3. Test Data Fixture Factory (P0)
No email-template fixture. `test/ui/components/fixtures/` has only `adminDashboardFixtures.ts`.
- **Add `test/ui/components/fixtures/emailTemplateFixtures.ts`:**
  ```ts
  createEmailTemplateFixture(overrides?: Partial<EmailTemplateReturnType>): EmailTemplateReturnType
  createEmailTemplateRevisionFixture(overrides?: Partial<EmailTemplateRevisionReturnType>): EmailTemplateRevisionReturnType
  ```
- Default: `{ id: "tpl-001", scope: "INVOICE_GENERATED", locale: "en", status: "PUBLISHED", version: 1, ... }`.

#### W4. ViewModel Hook Tests (P0)
Plan §L lists `useEmailTemplatesListViewModel.test.ts` + `useEmailTemplateEditorViewModel.test.ts` but specifies no test patterns. Codebase has zero `renderHook` precedent.
- **Use `@testing-library/react` `renderHook` + `act` + `waitFor`** with the existing `TestWrapper` (NOT raw `<MockedProvider>`). `TestWrapper` provides `MockLink` + `ThemeProvider` + `i18n` + `dir` + `viewport` support:
  ```ts
  const { result } = renderHook(() => useEmailTemplateEditorViewModel({ id: "tpl-001" }), {
    wrapper: ({ children }) => <TestWrapper mocks={createEmailTemplateDetailMock("tpl-001", fixture)} locale="en" viewport="desktop">{children}</TestWrapper>,
  });
  await waitFor(() => expect(result.current.isLoaded).toBe(true));
  ```
- **If `renderHook` has issues** (zero precedent in repo — verify `@testing-library/react` exports `renderHook` under Happy DOM), use the fallback recipe: render a `<TestComponent>` that calls the hook and exposes state via a ref/callback.
- Add to `test/ui/components/email-templates/` — 10+ scenario matrix per surface (loading/error/empty/access-denied/dirty/clean/saving/publish/send-test/restore).

#### W5. Concurrent Publish (Optimistic Lock) Test (P0)
SWE v3 test #7 says "two parallel publish() calls on same scope should only succeed once" — but codebase has no advisory-lock precedent. **v9 correction:** The `email_templates` table does NOT exist yet (Phase 2 creates it), so the `email_templates_scope_locale_active_uq` partial unique index is NOT "already in schema." Also, `runInRollback` handles `40P01` deadlock retry — NOT constraint-collision assertion.
- **Schema prerequisite:** `email_templates_scope_locale_active_uq` partial unique index must land in §DB schema (Phase 2) BEFORE this test can run.
- **Use true-parallel approach** (NOT `runInRollback` single transaction): two concurrent `emailTemplateRepository.publish()` calls inside `Promise.allSettled` (repository methods open their own transactions — do NOT wrap them in `db.transaction` at the test level, since `Promise.all` would reject on first failure and `db.transaction` at the test layer would double-wrap). Assert exactly one `fulfilled` and one `rejected` with `e.code === '23505'` — mirroring `class_quota_race.test.ts:236-285`.
- **Assert service mapping:** the service maps Postgres `23505` → domain `DuplicateScopeLocaleError` (per S6) — separate from the constraint-trick itself.

#### W6. Merge-Tag Substitution Tests (P1)
React Email `<Mail>{{user.name}}</Mail>` substitution path is core to rendering, but no test verifies merge-tag substitution with sample props.
- **Test cases:**
  - Standard substitution: `{ user: { name: "Ahmed" } }` → `<p>Ahmed</p>`.
  - Missing key: `{ user: {} }` → empty string (no throw).
  - Nested object: `{ order: { items: [...] } }` → rendered list.
  - Date formatting: `{ date: new Date("2026-01-01") }` → locale-formatted date.

#### W7. Attachment + Inline-CID Tests (P1)
`EmailPayload.attachments` + inline-CID is brand-new. No test that adapter encodes Buffer correctly per provider.
- **Test cases per adapter:**
  - Resend: `attachments: [{ filename, content: Buffer }]` → JSON API.
  - SESv2: base64-encoded attachment in `Content` field.
  - Postmark: base64-only.
  - Mailgun: multipart form-data with `inline` top-level.
  - Nodemailer/SMTP: Buffer attachment + `cid:` reference.

#### W8. Error-State Test Matrix (P1)
Plan §P1/P4/P5/P6 describe rich error states, but no test file maps to them. Precedent: `SearchScheduleContainer.test.tsx` (`shows error message when query fails`).
- **Add test cases** per state: `shows loading skeleton on mount`, `shows error state on query failure`, `shows empty state when no templates`, `shows access denied when not admin`, `shows version mismatch UI on concurrent edit`, `shows preview error on render failure`. **W4↔W8 disambiguation (v10):** W4 is hook-level (asserting state shape via `renderHook` — `isRateLimited===true`, etc.), W8 is component-DOM-level (asserting rendered UI text/aria via `render` + `screen`). Assign `shows send-test rate limit on 6th call` to **W8 only** (component-DOM assertion of the visible rate-limit notice text); the hook-level equivalent in W4 asserts `useEmailTemplateEditorViewModel().isRateLimited === true` without rendering DOM.

#### W9. RTL + Responsive Component Tests (P1)
§K stories cover RTL, but §L component tests do not specify an RTL test case.
- **Add `dir="rtl"` test cases** to `emailTemplatesList.test.tsx` and `emailEditor.test.tsx`: pass `{ locale: "ar" }` to the existing `renderWithWrapper` / `TestWrapper` (which already derives `dir` and threads it to `<ThemeProvider>` — `TestWrapper.tsx:47` derives `direction`, `TestWrapper.tsx:88` renders `<ThemeProvider theme={theme}>` with the derived direction; RTL cache selection inside `TestWrapper` is at `TestWrapper.tsx:24-28, 49`). Assert `dir="rtl"` on DOM containers + i18n key fallback.
- **Add responsive breakpoint tests:** pass `viewport: "mobile" / "desktop"` to the existing `TestWrapper` (NOT mock `useViewport` — `TestWrapper` already handles this). Assert hidden columns, bottom action bar visible, Inspector drawer anchored bottom.

#### W10. Optimistic Update Rollback Tests (P1)
§Q4 has optimistic response table for Save/Publish/Archive, but no test for rollback (`optimisticResponse` + error → cache snapshot restore).
- **Test:** mock mutation returns error → assert Apollo cache reverts to pre-optimistic state. **v10 correction (R5):** Use `TestWrapper` with `createVersionMismatchMock(vars)` (per W2 — typed factory + `TestWrapper`, NOT raw `MockedProvider`); the mock returns `error: new Error("VERSION_MISMATCH")` + `result: { errors: [{ extensions: { code: "VERSION_MISMATCH" } }] }` (the field is `error`/`result.errors`, NOT a non-existent `errorMessage`). Assert `result.current.designJson` reverts to the pre-save snapshot captured from the Apollo cache before the mutation (read cache via `Screen` wrapper or `testClient.cache.extract()` prior to firing the mutation).

#### W11. DOMPurify Extended Test Vectors (P2)
SWE v3 test #4 covers script/onclick/javascript: vectors but omits `<iframe>`, `<object>`, `data:` URLs.
- **Add test vectors:** `<iframe src="javascript:...">`, `<object data="...">`, `<img src="data:text/html,...">`. Assert all stripped by DOMPurify config.

#### W6-bis. Subject-Template Merge Test (P1) [v10 — R5 NEW gap]
W6 covers body `{user.name}` substitution only — the email *subject* template has no dedicated test. The subject is rendered separately from the body and has its own `safeRender` fallback path (§S5).
- **Test cases:**
  - Standard subject merge: render the subject template string with `{ user: { name: "Ahmed" } }` → assert `Re: …Ahmed…` interpolation (exact shape per scope registry).
  - `safeRender` subject fallback: when the subject-component throws (e.g., missing required template variable), assert the fallback `<subject>` text-interpolation path runs with merge-tag values (no-ops on missing key) and returns a non-empty string without re-throwing.

#### W8-bis. safeRender Degraded-Mode Test (P1) [v10 — R5 NEW gap]
§S5 specifies the `safeRender` degraded signal, but §W has no test that drives it end-to-end.
- **Test:** trigger `render()` throw (force a template component to throw) → assert `degraded: true`, `error` is captured on the returned envelope, and the dispatcher marks the `notificationDeliveries` row `FAILED` with `failureReason: "render_degraded"` (per §S5 degraded-handling contract). Run at the service layer (`EmailTemplateService.renderForSend`) with a fake/throwing template registry entry.

#### W8-ter. Preview iframe CSP Enforcement Test (P2) [v10 — R5 NEW gap]
§E specifies the preview `<iframe sandbox=''>` + CSP `<meta>` + DOMPurify, but no test verifies the rendered output actually carries these attributes.
- **Test:** render the preview component → assert the rendered `<iframe>` carries `sandbox=''` (no allowed features), the `srcdoc` document contains a CSP `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:">` tag, and `X-Frame-Options: DENY` is NOT globally present (it would break the legitimate preview use case — CSP `frame-ancestors` is the correct mechanism, scoped to the iframe srcdoc only).

#### W10-bis. Optimistic Rollback Scope — Publish + Archive (P1) [v10 — R5 NEW gap]
W10 covers Save-rollback only. §Q4's optimistic-response table spans Save, Publish, AND Archive — the latter two have no rollback test.
- **Add explicit rollback cases:**
  - **Publish rollback:** optimistic mutation flips `status: DRAFT → PUBLISHED` in cache; mock returns error → assert cache reverts `status` to `DRAFT` and the active-row pointer (per `email_templates_scope_locale_active_uq`) is NOT mutated optimistically.
  - **Archive rollback:** optimistic mutation flips `status → ARCHIVED` + clears `isActive`; mock returns error → assert cache reverts `status` to pre-archive value and `isActive: true` restored.
  - Use `TestWrapper` + typed factory mocks per W2 (`createPublishEmailTemplateMock(vars, error)`, `createArchiveEmailTemplateMock(vars, error)`). Assert via cache snapshot diff (read `testClient.cache.extract()` before mutation, after optimistic apply, and after rollback).

---

### X. Developer Experience & Onboarding (v8 — Round 3 Audit)

#### X1. Single-Command Email System Bring-Up (P0)
No `bun run email:setup` that combines: seed default templates → start admin UI. A new dev must manually sequence `bun run db -- seed` + `bun run dev`. **v9 corrections:** (a) `bun db seed` is NOT a valid command — the real runner is `bun run db -- seed` (option 2 of `scripts/dbActions/index.ts`, which runs `backend/db/scripts/drizzleSeed.ts`). (b) Email seeds do NOT exist yet — blocked by §Y3 (seeds move to Phase 2). (c) Use `Bun.spawn` for orchestration (precedent: `scripts/safe-dev.ts`) — no `concurrently` dependency needed.
- **Add `scripts/email-setup.ts`** — orchestrates (gated behind Phase 2 per §Y8 deployment order):
  1. `bun run db -- seed` (once `backend/db/seeds/email/` is created per §Y3 — until then, X1 is blocked).
  2. `Bun.spawn` `bun run dev` on port 3000.
  3. Log "Open `/en/admin/email-templates` in your browser."
- Document in `docs/email/quickstart.md`.

#### X2. GraphQL Schema Descriptions (P1)
No todo requires `description` strings on the new `EmailTemplatePothosObject`, enums, queries, mutations. GraphQL introspection yields empty descriptions → Apollo Playground shows unannotated schema.
- **Add `description` to every Pothos object/enum/field** in `backend/graphql/pothos/email-templates/`:
  ```ts
  t.field("emailTemplates", {
    type: [EmailTemplateType],
    description: "List all email templates with optional filters by scope, status, and locale.",
    args: { ... },
  });
  ```

#### X3. Merge-Tag System Usage Guide (P1)
The merge-tag picker is referenced (§P1, §P8) but the system itself (how `{scope, variable}` is resolved, how `EmailPropsByScope` is introspected, allowed variables per scope) is never documented. This is a primary admin-user-facing feature.
- **Add `docs/email/merge-tags.md`:**
  - How merge-tags map to `EmailPropsByScope[scope]` props.
  - Per-scope variable list (e.g., `INVOICE_GENERATED` → `{ user, invoice, items, total }`).
  - How to insert via the picker UI.
  - How to troubleshoot "merge-tag mismatch" (§P8).

#### X4. Mock Email Adapter for Local Dev (P1)
No `MockEmailAdapter` — a local dev without Resend keys must set `EMAIL_PROVIDER=resend` and mock at the test layer. **v9 corrections:** path is `backend/services/communication/channels/email/mock/MockEmailAdapter.ts` (NOT `backend/services/communication/adapters/`). Factory is `EmailChannelFactory` (NOT `EmailProviderRegistry` — that name doesn't exist). **v10 note (R5):** the `email/mock/` sub-directory establishes a NEW convention — no `sms/mock/` or `push/mock/` peer exists today (`sms/` has only `twilio/`, `push/` only `fcm/`). Document this as the precedent so future channel owners mirror it.
- **Add `backend/services/communication/channels/email/mock/MockEmailAdapter.ts`:** writes a `notificationDeliveries` row with `providerMessageId: "mock-{timestamp}"` (matching the Resend delivery-row contract at `ResendEmailAdapter.ts:122-131`), logs a one-line summary to `logger.info` (NOT the full HTML body), and writes full HTML to `/tmp/email-mock-{timestamp}.html`.
- **Widen `EmailProvider` type union** in `IEmailChannel.ts:25`: `export type EmailProvider = "resend" | "mock"`. Update `EmailChannelFactory.getEmailProvider()` (lines 15-25) to recognize `"mock"` without the "Invalid EMAIL_PROVIDER" warning.
- **Default in `.env.example`:** `EMAIL_PROVIDER=mock` (safer than `resend` for first run).

#### X5. Adapter Authoring Guide (P2)
Each adapter's gotchas (Postmark base64-only, Mailgun `inline` top-level, SESv2 10MB cap) live only in the plan — a future adapter author has to re-read the plan.
- **Add `docs/email/adapters.md`:** per-provider checklist, gotchas, env keys, validateConfig pattern, retry 적용 point, delivery-row convention.

#### X6. Visual Diff / Visual Regression (P2)
No automated visual diff despite 15 Storybook stories. No Chromatic. No `@axe-core/playwright`. **v9 correction:** the e2e tests use `bun:test` + the bare `playwright` package (per `test/ui/e2e/admin-dashboard.test.ts:1-2`). **v10 correction (R5):** "NOT `@playwright/test`" is technically false — `@playwright/test@^1.62.1` IS installed (and used for other purposes); e2e tests import from bare `playwright` (NOT `@playwright/test`'s test runner), but the package being present doesn't mean it's the e2e runner. Softened: e2e tests import from bare `playwright`, not `@playwright/test`'s runner, even though `@playwright/test` is installed for other purposes. Use `AxeBuilder` from `@axe-core/playwright` inside a `bun:test` `test()` block:
- **Phase-2 precondition [v10 — R5]:** `@axe-core/playwright` is NOT yet installed — add it as an explicit devDep install in the Phase-2 todo (must happen BEFORE the test file lands):
- **Install `@axe-core/playwright`** (devDep). Add `test/ui/e2e/email-templates.a11y.test.ts`:
  ```ts
  import { AxeBuilder } from '@axe-core/playwright';
  import { test, expect } from 'bun:test';
  // ... login via loginAsDemoUser (admin auth needed — route is gated)
  const results = await new AxeBuilder(page).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toHaveLength(0);
  ```
  Run via `bun run test:ui:e2e` (NOT `@playwright/test` runner).
- **Chromatic:** deferred to a concrete backlog location (no Phase 5 section exists yet — add as a future enhancement note).

#### X7. Storybook addon-a11y CI Gate (P3)
`.storybook/preview.tsx:81` sets `a11y.test = "todo"` (warnings only, no CI gate). Plan §J confirms "warnings do not fail CI".
- **Phase 5 todo:** flip `a11y.test = "error"` after all email-template stories pass axe. Requires: (a) all stories clean, (b) `@storybook/addon-vitest` wired.

---

### Y. Migration & Rollback Runbook (v8 — Round 3 Audit)

#### Y1. Forward-Only DB Migration Acknowledgment (P0)
No DB `down`-migration mechanism exists — `drizzle-kit@1.0.0-rc.4` generates forward-only `migration.sql`. A failed Phase 2 DB migration is NOT reversible via the toolchain. **v10 correction (R5):** name the custom pipeline explicitly — the manifest is `backend/drizzle/.custom-migrations.json` (NOT repo-root), the custom runner is `backend/db/scripts/migrate.ts` driving `backend/db/scripts/applyCustomMigrations.ts`, and the SQL breakpoint mechanism lives at `scripts/dbActions/sqlBreakpoints.ts`. (Earlier `bun run db -- generate` snapshotting works via `scripts/dbActions/actions.ts:53` which shells out to `drizzle-kit generate`, but the resulting migration is APPLIED through the custom runner — NOT via a `bun run db -- generate` apply step; that command only snapshots.)
- **Document:** "DB migrations are forward-only via the custom migration pipeline (`backend/drizzle/.custom-migrations.json` manifest tracks SHA256 hashes + `appliedFolders`; applied by `backend/db/scripts/applyCustomMigrations.ts` invoked from `backend/db/scripts/migrate.ts`). Rollback = manual `DROP TABLE email_templates; DROP TYPE email_scope_enum; ...`." Add to `docs/email/migration-runbook.md`.
- **Pre-deploy verification:** `bun run db` (interactive `scripts/dbActions/index.ts`) → select "generate" → review migration SQL → apply via the custom runner (`backend/db/scripts/migrate.ts`) → verify via `bun run db` studio option. Do NOT pass `generate`/`seed`/`migrate`/`studio` as positional args (i.e., `bun run db generate|seed|migrate|studio` is NOT the supported syntax — `bun run db` is interactive; the only exception is `bun run db -- seed` which selects sub-command 2 via `scripts/dbActions/index.ts`).

#### Y2. Phase 3 Rollback Procedure (P0)
Plan only says "flip flag false." Missing: order, who runs it, how to reconcile templates created during the rolled-back window.
- **Add `docs/email/rollback-runbook.md`:**
  1. Set `EMAIL_TEMPLATES_ENABLED=false` in Vercel env → redeploy.
  2. Verify legacy `emailChannel.send({ html: payload.body ?? "" })` resumes.
  3. Drain queued sends (wait for `notificationDeliveries` in `RETRYING` state to complete or fail).
  4. Do NOT delete `email_templates` rows — they remain for audit. Flag=false disables read path but rows persist.
  5. If re-enabling later, re-run `bun db seed` (idempotent) to refresh default templates.

#### Y3. Seed Phase Correction (P1)
**v9 correction:** The contradiction is real and affects THREE locations: (a) Phase 1 definition lists "**seed default templates**" AND "**no DB schema**" — self-contradictory (seeds need a table). (b) Section heading "Phase 1 — seeds must ship…" is wrong. (c) todo 19 note says "seeds should be Phase 1". All three must be fixed. **v10 correction (R5):** v9's instruction text cited stale line numbers ("line 1954", "line 1315") — at v10 the Phase 1 definition sits at line 2351, the section heading moved to ~line 1354, and the per-section note moved to ~line 97 (Phase header). The edits themselves already landed correctly (verified at lines 97, 1354, 2216, 2217 in the v9/v10 file) — the v9 instruction text's *line citations* were stale, NOT the edits. Reference the affected sections by HEADING NAME (not line number) to stay stable across future edits.
- **Move seeds to Phase 2** — after DB schema migration, run `bun run db -- seed` as a Phase 2 deploy step. Phase 1 ships the registry + `safeRender` + `mapEventTypeToEmailScope` without seeds (no DB dependency).
- **Amend the Phase 1 definition section** (titled "Phase 1 — Types + enum + …"): delete "**seed default templates**" from Phase 1 scope. Phase 1 = "no UI, no DB schema, no seeds."
- **Amend the Phase 2 deployment-order section** (titled "Phase 2 — DB schema … + seed default email templates"): confirm "Phase 2 — seeds ship after schema migration."
- **Reassign todo 19** from Phase 1 to Phase 2 explicitly.
- **Phase 2 deploy order:** apply migration → run seed → deploy code (flag=false).

#### Y4. Seed Idempotency Verification (P1)
`seedOrGet` naming implies idempotent, but the upsert target is the `scope+slug` unique index, NOT the `scope+locale+active_uq` partial index. A re-seed that flips `isActive` could violate the partial unique constraint.
- **Seed logic:** `upsertManyEmailTemplates` uses `onConflictDoUpdate` on `(scope, slug)`. For the partial unique `(scope, locale) where isActive=true`: the seed must set `isActive: true` only for the first seed, and `isActive: false` for re-runs' old rows. OR: seed inserts with `isActive: false` by default; admin activates via UI.
- **Test:** add seed-idempotency test to `backend/db/seeds/test/` — run seed twice, assert no constraint violation.

#### Y5. Post-Migration Data Validation (P1)
No prod post-deploy assertion that (a) every `EmailScope` has an active template per locale, (b) `compiled_html` is non-null, (c) partial unique index has exactly one active row per scope+locale.
- **Add `scripts/email-post-deploy-check.ts`:** runs after Phase 3 deploy → queries DB → asserts all 13 EmailScopes × locales have active templates → logs failures → alerts via `logger.error`.
- **Wire into CI:** add as a Vercel post-build script or a manual `bun run email:post-deploy-check`.

#### Y6. Per-Scope Canary Opt-in (P1)
Single global flag flips all 24 event mappings simultaneously. No gradual per-event opt-in. `Readonly<Record<NotificationEventType, EmailScope | null>>` makes missing keys a compile error — all-or-nothing.
- **Add `EMAIL_TEMPLATE_SCOPES_ENABLED`** env var as a comma-separated allowlist of EmailScope values. **v9 addition:** `getEnvArray` does NOT exist in `backend/lib/env.ts` — add a new helper `getEnvArray(name, sep=","): string[] | undefined` that splits the env var and returns parsed array or undefined. Dispatcher checks `getEnvArray("EMAIL_TEMPLATE_SCOPES_ENABLED")` — if set, only dispatches templates for scopes in the list (deny-by-default — empty string means "none", NOT "all"). If unset, dispatches all. Pin the exact dispatcher integration point at `communication.service.ts:37` and decide filter-at-mapper vs filter-at-dispatcher (recommend mapper, fallback to `payload.body ?? ""` for non-canary scopes so existing email keeps flowing).
- **Canary flow:** `EMAIL_TEMPLATE_SCOPES_ENABLED=INVOICE_GENERATED` → verify one scope for 24h → add more scopes → `*` for full rollout.

#### Y7. Monitoring & Alerting Strategy (P1)
Bounce/complaint webhooks (todo 20a) populate `NotificationDeliveryStatus` but there is no alerting threshold. **v9 correction:** grep for `slack|Slack|webhook|sendAlert` across `backend/` returned ZERO hits — no Slack webhook infrastructure exists. v8's "logger.error + Slack webhook alert" presents an alerting channel that does NOT exist. **v10 correction (R5):** the Vercel log-drain to Datadog (or equivalent) is ASPIRATIONAL, not yet operational — no Vercel log drain is configured in this repo today. Treat Y7 as a wiring TODO, not a deployed capability:
- **TODO (wiring):** step 1 — define the exact Datadog/grep aggregation queries against `notificationDeliveries` (grouped by scope / provider / status / hour) in `docs/email/metrics-dashboard.md` BEFORE relying on log-drain pickup; step 2 — register the log drain in Vercel project settings (out-of-repo infra change; track as a deploy-time checklist item); step 3 — add alert rule thresholds in the log-drain provider's UI (NOT in this repo). Until step 2 lands, `logger.error` calls emit logs but trigger NO alert.
- **Alerting thresholds (via `logger.error` + NOT-YET-OPERATIONAL Vercel log drain to Datadog/etc., NOT Slack):**
  - Send-success rate < 95% → `logger.error` for log-drain pickup.
  - Render-degraded rate > 5% → `logger.warn`.
  - Provider 429 rate > 10/min → `logger.warn`.
  - PERMANENTLY_FAILED count > 50 in 1h → `logger.error`.
- **Optional Slack integration:** if Slack alerting is needed, spec a new `ALERT_SLACK_WEBHOOK_URL` env var + transport in `backend/lib/`. But this is a cross-cutting infra task, NOT email-template-specific.
- **Dashboard:** `docs/email/metrics-dashboard.md` with queries against `notificationDeliveries` table grouped by scope, provider, status, hour.

#### Y8. Deployment Order Invariant (P1)
Phase 3 dispatcher reads `templateProps` (Phase 1 payload change) AND requires seed rows (Phase 2). Hard ordering. No `requires:` field.
- **Add explicit deployment order:**
  1. Phase 0 (deps) — NO behavioral change.
  2. Phase 1 (registry + safeRender + mapEventTypeToEmailScope + i18n) — NO DB, NO seeds, NO UI. Existing notifications unaffected.
  3. Phase 2 (DB schema + seeds + repo + GraphQL + admin UI) — flag=false, dispatcher still legacy.
  4. Phase 3 (dispatcher migration) — set flag=true in Vercel env → redeploy.
  5. Phase 4 (bundle analysis + auth/account emails) — after Phase 3 stable for 7 days.
- **Document:** "Phase 3 CANNOT ship until Phase 1 AND Phase 2 are deployed and verified."

#### Y9. Startup Env Validation (P0) [v10 — R5 cross-cutting NEW gap]
New email env vars (`EMAIL_PROVIDER`, `EMAIL_TEMPLATE_SCOPES_ENABLED` from Y6, `EMAIL_TEMPLATES_ENABLED` deployment flag) are read lazily at call-time — a typo'd/missing value surfaces only when a send fires, NOT at boot. Fail-fast at startup is the repo convention.
- **Register the three new env reads in `validateEnvironment()` at `backend/lib/env.ts:366`** so a missing/invalid value throws during server boot (NOT on first send):
  - `EMAIL_PROVIDER` — validate against the `EmailProvider` union (`"resend" | "sesv2" | "postmark" | "mailgun" | "smtp" | "mock"`); reject unknown providers at boot with a clear `EnvValidationError`. Default `"mock"` if unset (per X4 `.env.example`).
  - `EMAIL_TEMPLATES_ENABLED` — boolean coerce (match the existing `parseBooleanEnv` helper pattern); default `false`.
  - `EMAIL_TEMPLATE_SCOPES_ENABLED` — OPTIONAL comma-separated EmailScope allowlist (per Y6); if set, validate each token against the `EmailScope` enum union (reject unknown scopes at boot, NOT silently filtered).
- **Test:** add `backend/lib/test/env-validation.test.ts` (or extend existing) asserting missing `EMAIL_PROVIDER` throws at boot, invalid scope tokens throw, empty `EMAIL_TEMPLATE_SCOPES_ENABLED` is allowed (means "none").

#### Y10. Custom Migration Pipeline Test (P1) [v10 — R5 cross-cutting NEW gap]
The custom migration runner (`backend/db/scripts/applyCustomMigrations.ts` driven by `backend/db/scripts/migrate.ts` per Y1) is itself untested. A bug in the manifest SHA256 check or the `appliedFolders` tracking could silently skip migrations or re-apply them.
- **Add `backend/db/scripts/test/applyCustomMigrations.test.ts`:** asserting (a) **idempotency** — running `applyCustomMigrations` twice against the same test DB applies each migration exactly once (second run is a no-op); (b) **tamper-detection** — modifying a previously-applied migration file's SHA256 (via the `backend/drizzle/.custom-migrations.json` manifest hash) causes the runner to throw `MigrationTamperError` rather than silently re-running; (c) **new-migration application** — adding a new manifest entry applies it and records the new hash.
- Use `runInRollback` for the happy path; the tamper-detection case lives OUTSIDE `runInRollback` (asserting a throw, per the AGENTS.md try/catch helper pattern for tests that assert rejection).

---

### Z. Implementation Patterns Clarification (v8 — Round 3 Audit)

#### Z1. Per-Scope EmailLabels Field Lists (P0)
~11 missing EmailScopes never specify their `*EmailLabels` interface field lists. V4-3 atomic en/ar lockstep CANNOT land without them. **v9 correction:** `EmailLabels` interfaces live in `shared/locale/types/emails/index.ts` (extend existing file — already houses `ComplaintResponseEmailLabels` + `SuggestionAcknowledgedEmailLabels`). Backend typed Props (`ComplaintResponseEmailProps`) stay in `backend/types/email/email.types.ts`.
- **Add per-scope EmailLabels interfaces** in `shared/locale/types/emails/index.ts` — one per EmailScope. Each scope MUST have `subject`, `preview`, `body` signatures matching the merge-tags in `EmailPropsByScope[scope]`:
  ```ts
  interface InvoiceGeneratedEmailLabels {
    subject: (params: { invoiceNumber: string; studentName: string }) => string;
    preview: (studentName: string) => string;
    body: (invoice: InvoiceProps) => string;
  }
  ```
  Mirror the existing `ComplaintResponseEmailLabels` / `SuggestionAcknowledgedEmailLabels` arg shapes. Spell out all 11 Phase 1-3 labels + 3 Phase 4 labels with exact `subject/greeting/body/footer` arg shapes.

#### Z2. EmailTemplateReturnType Omit List (P0)
`EmailTemplateReturnType` never specifies which internal fields to Omit nor how JSONB columns get narrowed.
- **Specify:** `Omit<EmailTemplateSelect, 'compiledHtml' | 'compiledText'>` if admin should not see raw compiled HTML. Or `EmailTemplateSelect` in full if admin can view compiled HTML in the Code tab.
- **JSONB narrowing:** `designJson: string` (not jsonb) — plan must specify whether the admin UI receives raw JSON string or a parsed object.

#### Z3. ComplaintReturnType.title Mismatch (P0)
Registry `subject: (p) => \`Re: ${p.complaint.title}\`` depends on `ComplaintReturnType.title` — but `complaints` table has `body`, NOT `title`. **v9 correction:** option (b) (`complaint.subject`) is INVALID — neither `title` nor `subject` column exists on the `complaints` table.
- **Fix (DECIDED — option c):** derive subject from `body`: `subject: (p) => \`Re: ${p.complaint.body.slice(0, 50)}…\``. OR change the registry `complaint` prop to a flat `complaintTitle: string` (mirroring the existing `renderComplaintResponseEmail` convention which takes `complaintTitle: string` passed by the caller, NOT the whole `ComplaintReturnType`). Option (a) (add `title` column) is a schema change — avoid for P0.

#### Z4. EmailAttachmentEncoding Enum (P1)
`EmailPayload.encoding?: "base64" | "buffer"` is inline text union — violates plan's own rule "no text unions, only enums". **v9 corrections:** (a) title should be `EmailAttachment.encoding` (the field is on `EmailAttachment`, not `EmailPayload`). (b) Use the repo's `createPgEnumFromEnum` pattern, NOT raw `pgEnum`. (c) Backing TS enum in `backend/enum/email/emailTemplates.enum.ts`.
- **RESOLVED (v10 — R5 FIX):** the v9 spec was self-contradictory — it said BOTH "register via `createPgEnumFromEnum`" (line 2128) AND "drop the pgEnum" (line 2129 disclaimer, since `EmailAttachment` is not persisted). v9 also carried an INVALID enum semantic mismatch (`base64` is a wire MIME encoding, `buffer` is a JS runtime type — they don't belong in the same enum, and `buffer` is NOT a valid MIME Content-Transfer-Encoding). **Resolution chosen: (a) valid MIME encodings only.** Drop `BUFFER`; use real MIME Content-Transfer-Encoding values. Do NOT register a pgEnum (per the spec's own disclaimer AND the fact that `EmailAttachment` is never persisted — runtime-only TS enum is sufficient; a pgEnum would schema-bake a value never read from a column).
- **Add `EmailAttachmentEncoding` enum** in `backend/enum/email/emailTemplates.enum.ts`:
  ```ts
  export enum EmailAttachmentEncoding {
    BASE64 = "base64",
    QUOTED_PRINTABLE = "quoted-printable",
    BINARY = "binary",
    SEVEN_BIT = "7bit",
    EIGHT_BIT = "8bit",
  }
  ```
- **Rationale:** all five are valid MIME Content-Transfer-Encoding values (RFC 2045 §6). `buffer` is dropped (it conflated the JS runtime type with the wire encoding). Per-adapter selects one — `BASE64` for Postmark/SESv2/Resend JSON; `BINARY`/`7BIT`/`8BIT` for Mailgun multipart / SMTP Nodemailer Buffer attachment. No pgEnum registration (see disclaimer — `EmailAttachment` is runtime-only, never persisted).

#### Z5. findByIdempotencyKey Convention (P1)
`findByIdempotencyKey(key: string)` is WRONG convention — existing pattern is plural batch `findByIdempotencyKeys(keys: string[], tx?)`.
- **Change to `findByIdempotencyKeys(keys: string[], tx?)`** — match `credit.repository.ts:135`. Idempotency check can batch-multiple keys (for multi-recipient sends).

#### Z6. queryFields Registration (P2)
`queryFields(t => ({...}))` registration idiom never specified in the plan.
- **Add to §M (GraphQL Documents / Pothos surface):**
  ```ts
  queryFields: (t) => ({
    emailTemplates: t.field({ ... }),
    previewEmailTemplate: t.field({ ... }),
  }),
  mutationFields: (t) => ({
    createEmailTemplate: t.field({ ... }),
    updateEmailTemplate: t.field({ ... }),
    // ...
  }),
  ```

#### Z7. Backend .tsx ESLint/Biome Override (P1)
Zero `.tsx` files in backend today. ESLint/Biome may not have overrides for React Email `.tsx` components in `backend/services/communication/templates/components/`. **v10 correction (R5):** the repo's actual config file is `eslint.config.mjs` (NOT `eslint.config.js` — the v9 cosmetic-fix log already notes this; verified in place). However biome.json's scope coverage for `backend/**/*.tsx` was UNVERIFIED in R5 — biome's default `includes` may not match `.tsx` under `backend/`.
- **Verify** `eslint.config.mjs` (confirmed correct filename) + `biome.json` handle `.tsx` in `backend/` — check for override blocks. **Specifically for biome.json:** confirm the `includes` array (or `files.includes`) matches `backend/**/*.tsx` — biome defaults to `.ts`/`.js`/`.jsx`/`.tsx` only when explicitly listed; if `backend/**` is included via a glob that doesn't capture `.tsx`, add an explicit `backend/**/*.tsx` matcher. If missing, add override:
  ```json
  { "include": ["backend/services/communication/templates/components/**/*.tsx"], "rules": { ... } }
  ```

#### Z8. DashboardTranslations Aggregator Import (P2)
`DashboardTranslations` aggregator in `messages.ts` has ~118 alphabetical imports. Adding `dashboardEmailTemplates{En,Ar}` requires adding an import line in sorted order. **v9 corrections:** (a) path is `shared/locale/en/messages.ts` / `shared/locale/ar/messages.ts` (NOT `message.ts` — that's child dir). (b) Use `@/shared/locale/…` alias imports (matching the 118 existing `@/shared/locale/…` imports), NOT relative `./emailTemplates`.
- **Add to todo 16:** "Add `import { dashboardEmailTemplatesEn } from '@/shared/locale/en/dashboard/emailTemplates/main.ts'` and `import { dashboardEmailTemplatesAr } from '@/shared/locale/ar/dashboard/emailTemplates/main.ts'` to `shared/locale/en/messages.ts` and `shared/locale/ar/messages.ts` respectively, in alphabetical order (between `coreXxx` and `lmsXxx`, ~line 188). Add the `emailTemplates:` key to the `dashboardTranslations` object."

#### Z9. Barrel Export for Communications Schema (P2)
`backend/db/schema/communications/index.ts` barrel export micro-edit missing — new `emailTemplates.ts` schema file needs to be re-exported.
- **Add to todo 9:** "Add `export * from "./emailTemplates";` to `backend/db/schema/communications/index.ts`."

#### Z10. codegen.ts Glob Entry for Email Documents (P1)
`codegen.ts` config entry for new `email` sharedDocuments glob never scheduled. New GraphQL documents in `frontend/common/graphql/sharedDocuments/email.documents.ts` won't be picked up by codegen unless the glob matches.
- **Add to todo 15:** "Verify `codegen.ts` glob includes `frontend/common/graphql/sharedDocuments/email.documents.ts`. If the existing glob is `frontend/common/graphql/sharedDocuments/*.documents.ts` (wildcard), it already matches. If per-file, add the email entry explicitly."

#### Z11. Two Unnamed Zustand Stores (P2)
Plan only files ONE store (`emailTemplateEditorStore.ts`) but there are two stores — the list view store and the editor store are separate.
- **Add `emailTemplatesListStore.ts`** for list view state (search, scopeFilter, statusFilter, pagination, segmented Active/Archived selection). Separate from `emailTemplateEditorStore.ts` (designJson, isDirty, isSaving, activeTab, history drawer options).

#### Z12. Editor Error Boundary (P1) [v10 — R5 cross-cutting NEW gap]
`@react-email/editor` (loaded via `next/dynamic({ ssr: false })` per §F `EmailEditorWrapper`) is a complex third-party React component imported at runtime — its render-loop, JSON schema, or block registry can throw on malformed `designJson`. With no boundary, an editor crash takes down the entire admin route (`/admin/email-templates/[id]`).
- **Wrap `EmailEditorWrapper` in an `<ErrorBoundary>`** at the route-page level (NOT inside the wrapper itself — the boundary must live ABOVE the `ssr: false` dynamic import so it renders server-side even when the dynamic chunk fails to load). Spec the boundary:
  - Fallback UI: a `SectionPanel` titled "Editor failed to load" (i18n key `dashboard.emailTemplates.error.editorCrash`) with a "Reload editor" button (calls `window.location.reload()`) and a "Return to list" button (router push to `/admin/email-templates`).
  - Log the error via `logger.error("EmailEditorWrapper crash", { error, designJsonSize })` (use the frontend `@/frontend/utils/logger`).
  - Reset on navigation: the boundary resets state when the route `[id]` param changes (use `key={id}` on the boundary or `componentDidCatch` → `routerEvents` reset).
- **Reuse:** check `frontend/components/` for an existing `ErrorBoundary` (likely reused). If none exists, add a minimal `frontend/components/ui/ErrorBoundary.tsx` (class component — `componentDidCatch` + `getDerivedStateFromError`).
- **Test (W8):** add `shows editor crash fallback on render throw` to the W8 error-state matrix — render `EmailEditorWrapper` with a mock `@react-email/editor` that throws → assert fallback panel renders + "Reload editor" button present.

---

**v10 (Round 5 Cross-Section Consistency Audit — i18n Catalogue Closure + Phase-Mapping/Changelog Reconciliation, 2026-08-02):** Round 5 launched a cross-section consistency subagent validating the plan file against itself (cross-references, i18n lockstep, phase mapping, locked-decision count, changelog accuracy, codebase-path validity). Applied surgical fixes to §B i18n catalogue, the Phase Mapping table, the §V1 historical narrative, and the changelog footer. Section-audit subagents (§S–§Z bodies) were handled by sibling v10 subagents — this entry covers ONLY the cross-section scope. Key corrections:
- **§B i18n catalogue — 10 missing keys added (P0, build-breaking under V4-3 lockstep):** The following keys were referenced by code snippets in §G4 (L1527-1531), §V7 (L1875-1878), and §V8 (L1886) but absent from the §B `dashboard.emailTemplates` catalogue — V4-3 lockstep would make them TypeScript compile errors. Added to the catalogue + the type interface (`EmailTemplatesManagementLabels` in `shared/locale/types/dashboard/emailTemplates/main.ts`) + the en impl (`shared/locale/en/dashboard/emailTemplates/main.ts`) + the ar impl (`shared/locale/ar/dashboard/emailTemplates/main.ts`):
  1. `editor.shortcuts.saveDraft` — "Save Draft" / "حفظ المسودة"
  2. `editor.shortcuts.publish` — "Publish" / "نشر"
  3. `editor.shortcuts.sendTest` — "Send Test" / "إرسال تجريبي"
  4. `editor.shortcuts.close` — "Close" / "إغلاق"
  5. `editor.shortcuts.mergeTags` — "Insert Merge Tag" / "إدراج علامة دمج"
  6. `dnd.started` — "Grabbed {block}" / "تم التقاط {block}"
  7. `dnd.over` — "{block} moved to position {pos}" / "تم نقل {block} إلى الموضع {pos}"
  8. `dnd.dropped` — "Dropped {block} at position {pos}" / "تم إفلات {block} في الموضع {pos}"
  9. `dnd.cancelled` — "Drag cancelled" / "تم إلغاء السحب"
  10. `mergeTag.triggerLabel` — "Insert merge tag" / "إدراج علامة دمج"
  - New sub-namespaces added to the catalogue: `editor.shortcuts.*` (static getters, no params), `dnd.*` (interpolation params — `(block: string, pos?: number) => string` per the type schema; `over`/`dropped` carry `pos` as required `number` since dnd-kit always supplies a drop position; `started`/`cancelled` carry only `block`), `mergeTag.*` (static ARIA-label getter).
- **§B i18n catalogue — 3 GraphQL error-code bindings added (P1):** `RATE_LIMITED`, `INVALID_EMAIL`, `INVALID_SAMPLE_PROPS` are `EmailTemplateErrorCode` members (§S7 registry at L1661) surfaced via `getGraphQLErrorCode` (S2) but had no canonical `dashboard.emailTemplates.error.*` UI message key — the existing `toast.rateLimited` / `sendTest.rateLimited` were toast-context, not error-code bindings. Added `error.rateLimited`, `error.invalidEmail`, `error.invalidSampleProps` (static bare-string getters) with en/ar strings.
- **Locked-decision count corrected (P1):** The changelog claimed "30" locked decisions; the actual unique `V#-#` ids = **33** (V3 = 13 — V3-4 and V3-13 absent; V4 = 10; V5 = 10). Repaired all four "30" occurrences: v9 cross-section footer, v8 entry footer, v8 research-files footer, v7 research-files footer. No "12" count remained (v9 already purged it).
- **Phase Mapping table subsection ranges corrected (P1):** §S → S1-S9 (was S1-S8, missing S9 "Network/Offline"), §W → W1-W11 (was W1-W9, missing W10/W11), §X → X1-X7 (was X1-X6), §Y → Y1-Y8 (was Y1-Y7), §Z → Z1-Z11 (was Z1-Z8, missing Z9/Z10/Z11). §W phase column now includes W10 (Phase 3 optimistic rollback); §Z phase column now includes Z9 barrel export + Z11 Zustand stores (Phase 1) and Z10 codegen glob (Phase 2).
- **§V1 historical narrative updated (P1):** The §V1 narrative (L1813-1819-era) still said "§G does not exist as a section … §F, §G, §H, §I entirely absent" — factually false post-v9 since §G and §H were both created in v9. Updated to mark V1 as RESOLVED in v9, retain the v8 dangling-reference finding as a historical record, and document that the §G references at lines **829/923/1077** (v10-corrected from the v9 "790/884/1038" draft citations) now resolve to §G1/§G2/§G3 + the §H references now resolve to §H1.
- **Cosmetic fixes (P2):** (1) Round-4 research-file size corrected ~235KB → ~233KB (actual 238,196 bytes = 232.6 KiB). (2) Subagent count wording clarified: "9 parallel audit subagents, each validating one v8 section" → "8 section-audit subagents (§S-§Z) + 1 cross-section consistency subagent = 9 reports total". (3) §Z7 eslint config filename `eslint.config.js` → `eslint.config.mjs` (repo actuality). (4) "3 locations" of seed-fix enumerated explicitly: Phase-1 definition ("no seeds"), Phase-2 definition ("seed default email templates" + todo 19), and todo 19 note ("v9 §Y3 correction").
- **No §G/§H/§S/§T/§U/§V/§W/§X/§Y/§Z body content modified** by this v10 cross-section pass; section bodies were edited by sibling v10 subagents per scope.

**v10 (Round 5 §G/§H/§T Section Audit — Accessibility, Validation Schemas, Performance, 2026-08-02):** Round 5 launched 3 section-audit subagents validating §G (Accessibility & Interaction), §H (Validation Schemas), and §T (Performance) against the actual codebase. Sources at `.ai/plans/email-templates/glm_swe/ui-research-round5/01-§g-accessibility-interaction.md`, `02-§h-validation-schemas.md`, `04-§t-performance.md`. Applied surgical in-place fixes — no new sections created, only corrections to existing §G/§H/§T bodies + the Phase Mapping table. All v1-v9 locked decisions preserved verbatim. Key corrections:
- **§G (Accessibility & Interaction):**
  - **G1 (path + deprecated-API fix):** `frontend/stores/preferencesStore.ts` → `frontend/common/stores/preferencesStore.ts` (the real Zustand stores path hosting ~60 stores; `frontend/stores/` does NOT exist). "AdminLayout or similar" → `DashboardLayout.tsx` at `frontend/common/views/dashboard/components/DashboardLayout.tsx` (the real app-root layout). `navigator.platform` (deprecated) → `navigator.userAgentData?.platform ?? navigator.platform`.
  - **G2 (button convention):** `<Button loading={...}>` has ZERO repo precedent — actual repo convention is `<Button disabled={busy}>` (busy = Apollo mutation `loading`). Removed the self-referential "used at line 884" claim (plan citing plan). Clarified MUI v9 `<Button loading>` is a BOOLEAN prop that auto-renders its own internal spinner — do NOT embed `<CircularProgress>` in `loading`. Added explicit `aria-busy="true"` requirement (cross-ref §V8): MUI v9 `<Button loading>` does NOT auto-inject `aria-busy`.
  - **G3 (idempotency mechanism):** The v9 mechanism was wholly wrong. `docs/IDEMPOTENCY.md` uses the HTTP header `X-Idempotency-Key` (NOT a GraphQL variable). Server dedup uses Postgres `CacheDbRepository.insertIfNotExists` (NOT Redis SETNX). `EmailTemplateService` does NOT exist yet (specced for future, not referenced as existing). Fixed `crypto.randomUUID()` guidance: generate ONCE per logical mutation, persist to `sessionStorage`, REUSE on retry (best-practice #3 — not regenerate per render). Added `sessionStorage` client-side persistence + clear-on-success pattern.
  - **G4 (keyboard shortcuts):** Fixed three browser-shortcut conflicts: `Cmd/Ctrl+Shift+T` (collides with "reopen closed tab") → `Cmd/Ctrl+Shift+E` (email); `Cmd/Ctrl+Shift+P` (collides with browser Print) → `Cmd/Ctrl+Shift+B` (build/publish); `Cmd/Ctrl+K` (collides with browser URL bar) kept with explicit browser-conflict note + focus-guard. Added `preventDefault()` + `stopPropagation()` + focus-check guidance for every shortcut (no global hijack). `navigator.platform` → `navigator.userAgentData?.platform ?? navigator.platform` for the Ctrl/Cmd label rendering. Noted no keyboard-shortcut library exists in the repo today.
- **§H (Validation Schemas):**
  - **H1 (scope enum + DB columns + types):** `scope` enum expanded from `['transactional','marketing','compliance','system']` (wrong) to all 13 `EmailScope` values from `backend/enum/email/emailTemplates.enum.ts`. Removed `subject` field (no DB column — `subject` is computed at render via `def.subject(props, locale)`). Renamed `bodyJson` → `designJson` (the actual DB column). `allowedEditorGroups` changed from `z.array(z.string().uuid())` to `z.enum(EmailEditorPermission).array()` (the actual `EmailEditorPermission` enum).
  - **H2 (zod v4 syntax + logical paradox):** `.omit({ id: z.string().optional() })` (wrong zod v4 syntax) → `.omit({ id: true })` form documented; then the logical contradiction was resolved by DROPPING the `.omit(...)` entirely — PublishSchema NEEDS the id for publishing, so the v9 chain that did `.extend({ id })` then `.omit({ id })` left the schema id-less. Kept `.extend({ id: z.string().uuid() })` + `version`.
  - **H3 (channel enum + email validator):** Removed `'sendgrid'` from the `channel` enum (SendGrid is NOT a registered provider — only Resend/SES/Postmark/Mailgun/SMTP+mock). `z.string().email()` → `z.email()` (repo convention, zod v4 top-level validator).
  - **H5 (TipTap nodes + recursion):** Added the missing TipTap node types (`text`, `bulletList`, `orderedList`, `listItem`, `hardBreak`, `blockquote`) to the `type` enum. Replaced `content: z.array(z.any())` (NOT recursive — accepts nested `script`/`iframe` >1 level deep) with `z.lazy(() => DesignNodeSchema)` for recursive structural validation. Now a nested `script`/`iframe` is rejected at every depth, not just the top level.
  - **Path fix:** `shared/lib/validations/emailTemplate.ts` does NOT exist, and `shared/` CANNOT import from `@/backend/enum/` (ESLint enforced per `shared/AGENTS.md`). Documented two corrective options: (A — preferred) move `EmailScope`/`EmailEditorPermission` to `shared/constants/` and keep schemas in `shared/lib/validations/emailTemplate.ts`; OR (B) keep enums in `backend/enum/email/` and place schemas in `backend/lib/validations/emailTemplate.ts`. The H1/H2/H3/H5 examples use option B. Removed the self-referential "Section ref (see line 884)" claim.
- **§T (Performance):**
  - **T2 (CRITICAL ref→state fix):** The v9 plan drove the dynamic `fetchPolicy` off `isDirtyRef.current` (a REF). Refs do NOT trigger re-renders, so Apollo never observed the new `fetchPolicy` value — the dynamic switch was DEAD at runtime, and T2 (ref form) contradicted T7 (state form `useEmailTemplateEditorStore(state => state.isDirty)`). Switched to the STATE form: `const isDirty = useEmailTemplateEditorStore(state => state.isDirty)` → re-render → Apollo sees the new `fetchPolicy`. This is the critical v9-fix side-effect.
  - **T6 (deterministic Turbopack skip + alternative):** "may skip" → **WILL emit "not compatible with Turbopack"** (deterministic — `@next/bundle-analyzer` checks `process.env.TURBOPACK` and short-circuits). Added `next experimental-analyze` as the recommended Turbopack-native alternative; `@next/bundle-analyzer` with `TURBOPACK=0` is the fallback.
  - **T10 (import path + render leak + concrete helper + AbortController):** Reconciled the import-path mismatch (§O says `react-email`, T10 said `@react-email/render`) with a single-source-of-truth rule: import from `react-email` per §O, fall back to `@react-email/render` if the re-export is absent. Added the concrete `timeout()` helper + full `safeRender` body the v9 entry only hand-waved. Documented the leak: `Promise.race` does NOT cancel the abandoned render — `@react-email/render` has no `AbortSignal`, so the render keeps running in the background. Added watchdog logging + a forward-compatibility note: plumb `AbortController` in when upstream adds `signal` support.
  - **T11 (NEW — list-view search debounce):** Added `useDebouncedCallback(250ms)` for the list-view search input (reuses the existing `useAudienceAutocomplete.ts:22,53,64` precedent). Reset `page` cursor on the final debounced update. Race guard via `nextFetchPolicy: 'cache-and-network'`.
  - **T12 (NEW — `React.lazy` + `Suspense` per editor tab):** Added `React.lazy` + `<Suspense fallback={<EmailEditorSkeleton />}>` per editor tab (Design/Preview/Code/History) so opening the Design tab doesn't ship the Code tab's Prism grammars. Used `React.lazy` (NOT `next/dynamic`) because these are in-route client-only components (the editor route is `ssr:false` via `EmailEditorWrapper`).
  - **T13 (NEW — `EntityCacheService` render-cache reuse):** Wired `EmailTemplateService.renderForSend` / `previewEmailTemplate` through `EntityCacheService.cachedRead` (`docs/services/entity-cache-service.md` dual-adapter Postgres+Redis cache). Namespace `email-template-render`, key `${scope}:${templateId}:${locale}:${hash(sampleProps)}`. Invalidate on Publish/Restore. Documented how T13 (server-side cache) complements T2 (client-side cache): T13 avoids recomputing `compiled_html` server-side, T2 avoids the round-trip entirely.
- **Phase Mapping table update (P1):** §T row updated from "T1-T10 (Performance)" to "T1-T13 (Performance)" with phase-allocated T11/T12/T13. Header marked v10.

**v10 (Round 5 §W/§X/§Y/§Z Section Audit — Testing, DX, Migration, Implementation Patterns, 2026-08-02):** Round 5 launched section-audit subagents validating §W (Testing), §X (DX), §Y (Migration & Rollback), and §Z (Implementation Patterns) against the actual codebase. Sources at `.ai/plans/email-templates/glm_swe/ui-research-round5/06-§w-testing.md` and `07-§xyz-dx-migration-patterns.md`. Applied surgical in-place fixes — corrections to existing §W/§X/§Y/§Z bodies + the Phase Mapping table; no new top-level sections created (new findings added as `-bis`/`-ter` subsections under existing sections per the "fix in-place" rule). All v1-v9 locked decisions preserved verbatim. Key corrections:
- **§W (Testing):**
- **W1 (§S6 cross-link + throw-and-log probe):** v9's §S6 (line 1654) promised a "throw-and-log probe in §W1" but §W1 contained NO probe. Added `backend/db/test/email/drizzle-constraint-probe.test.ts` spec: trigger a REAL `23505` against the real test DB (NOT inside `runInRollback`), assert `e.code === "23505"`, `e.constraint` contains index name, `e.detail` carries `(scope, locale)`. Disambiguated probe = `.test.ts` (NOT script), runs on real DB (NOT `runInRollback`), Phase-2 gated.
- **W2 (precedent fix):** v9 cited `SearchScheduleContainer.stories.tsx` as the typed-factory precedent — WRONG (that file uses raw `MockedProvider` + untyped array, contradicting the "use TestWrapper, NOT raw MockedProvider" rule). Corrected to the `.test.tsx` precedent: `createSearchMock()` returning `MockLink.MockedResponse[]` + `createTeachersMock()` returning a single `MockedResponse` (lines 166-192).
- **W4↔W8 disambiguation:** Stated explicitly: W4 is hook-level (asserting state shape via `renderHook`), W8 is component-DOM-level (asserting rendered UI text via `render`/`screen`). Assigned `shows send-test rate limit on 6th call` to W8 only; the hook-level equivalent lives in W4.
- **W5 (precedent + mechanism fix):** Changed "two `db.transaction` blocks in `Promise.all`" → "two concurrent `emailTemplateRepository.publish()` calls inside `Promise.allSettled` (repository methods open their own transactions — do NOT wrap in `db.transaction` at the test level); assert exactly one `fulfilled` and one `rejected` with `e.code === '23505'`, mirroring `class_quota_race.test.ts:236-285`." Noted `Promise.allSettled` specifically (NOT `Promise.all` — `Promise.all` rejects on first failure).
- **W9 (line citation fix):** Replaced `TestWrapper.tsx:30,77` with `TestWrapper.tsx:47` (`direction` derivation) + `TestWrapper.tsx:88` (`<ThemeProvider theme={theme}>`); RTL cache selection at `TestWrapper.tsx:24-28, 49`.
- **W10 (regression + field fix):** Replaced "Use `MockedProvider` with `errorMessage: 'VERSION_MISMATCH'`" with "Use `TestWrapper` with `createVersionMismatchMock(vars)` per W2"; `errorMessage` is NOT a `MockLink.MockedResponse` field (real fields are `error?: Error` + `result: { errors: [...] }`). Assert `result.current.designJson` reverts to pre-save cache snapshot.
- **NEW W6-bis (Subject-template merge test):** Body-only W6 left the subject template untested. Added subject merge + `safeRender` subject-render fallback test.
- **NEW W8-bis (safeRender degraded-mode test):** §S5 specifies the degraded signal; §W had no test. Added: trigger `render()` throw → assert `degraded: true`, `error` captured, dispatcher marks delivery row `FAILED` with `failureReason: "render_degraded"`.
- **NEW W8-ter (iframe CSP enforcement test):** Assert rendered `<iframe>` carries `sandbox=''`, srcdoc contains CSP `<meta>`, `X-Frame-Options: DENY` NOT globally present (would break the legitimate preview use case — `frame-ancestors` is the correct CSP mechanism).
- **NEW W10-bis (Optimistic rollback scope):** W10 covered Save-rollback only; §Q4 spans Save/Publish/Archive. Added explicit Publish-rollback + Archive-rollback cases with cache-snapshot assertions.
- **§X (DX):**
- **X4 (mock dir convention note):** Added one-line note that `email/mock/` establishes a NEW convention — no `sms/mock/` or `push/mock/` peer exists today (`sms/` has only `twilio/`, `push/` only `fcm/`). Document as the precedent for future channel owners.
- **X6 (@playwright/test + axe install):** Softened "NOT `@playwright/test`" to "e2e tests import from bare `playwright` (not `@playwright/test`'s runner), even though `@playwright/test` is installed for other purposes." Added `@axe-core/playwright` install as explicit Phase-2 precondition (NOT yet installed — must land BEFORE the a11y test file).
- **§Y (Migration):**
- **Y1 (custom pipeline refs):** Named `backend/db/scripts/migrate.ts`, `backend/db/scripts/applyCustomMigrations.ts`, and `scripts/dbActions/sqlBreakpoints.ts` explicitly. Clarified manifest at `backend/drizzle/.custom-migrations.json` (NOT repo root). Fixed the `bun run db -- generate` syntax contradiction (it snapshots via drizzle-kit but application runs through the custom runner — `bun run db generate|...` is NOT supported as positional args; `bun run db` is interactive, with `bun run db -- seed` the documented exception selecting sub-command 2).
- **Y3 (stale line refs):** Replaced v9's stale line citations ("line 1954", "line 1315") with HEADING-NAME references (Phase 1 definition section, Phase 2 deployment-order section) — the edits themselves landed correctly at lines 97/1354/2216-2217, only the instruction text's line citations were stale.
- **Y7 (monitoring aspirational):** Added explicit note that the Vercel log drain is ASPIRATIONAL/not yet operational — added a wiring TODO (define Datadog aggregation queries in `docs/email/metrics-dashboard.md`, register Vercel log drain as out-of-repo infra change, add alert rule thresholds in the log-drain provider's UI). Until step 2 lands, `logger.error` calls emit logs but trigger NO alert.
- **NEW Y9 (Startup env validation):** Register `EMAIL_PROVIDER`, `EMAIL_TEMPLATE_SCOPES_ENABLED`, `EMAIL_TEMPLATES_ENABLED` in `validateEnvironment()` at `backend/lib/env.ts:366` so missing/invalid values fail fast at boot (NOT on first send). Validate `EMAIL_PROVIDER` against the union, boolean-coerce `EMAIL_TEMPLATES_ENABLED`, validate scope tokens against the `EmailScope` enum. Added env-validation test spec.
- **NEW Y10 (Custom migration pipeline test):** Added `backend/db/scripts/test/applyCustomMigrations.test.ts` spec asserting idempotency (second run = no-op), tamper-detection (modified SHA256 → `MigrationTamperError`), and new-migration application. Tamper case lives OUTSIDE `runInRollback` per AGENTS.md try/catch helper pattern.
- **§Z (Implementation Patterns):**
- **Z4 (enum semantic fix — RESOLVED):** v9 said BOTH "register via `createPgEnumFromEnum`" AND "drop the pgEnum" — self-contradictory. v9 also carried an INVALID enum semantic mismatch (`base64` = wire MIME encoding, `buffer` = JS runtime type — not valid MIME Content-Transfer-Encoding). Picked resolution (a): valid MIME encodings only — `EmailAttachmentEncoding { BASE64, QUOTED_PRINTABLE, BINARY, SEVEN_BIT, EIGHT_BIT }` (drop `BUFFER`), AND drop the pgEnum registration entirely (per the spec's own disclaimer AND `EmailAttachment` is never persisted — runtime-only TS enum is sufficient).
- **Z7 (eslint filename + biome scope):** Confirmed `eslint.config.mjs` is the correct filename (the v9 cosmetic-fix log already noted this; spec text verified in place). Added explicit note to verify `biome.json` actually lints `backend/**/*.tsx` — biome's default `includes` may not match `.tsx` under `backend/`; if `backend/**` glob doesn't capture `.tsx`, add an explicit `backend/**/*.tsx` matcher.
- **NEW Z12 (Editor error boundary):** Added spec for `<ErrorBoundary>` wrapping `EmailEditorWrapper` (complex third-party component loaded via `ssr: null`). Boundary lives ABOVE the `ssr:false` dynamic import (renders server-side even if the dynamic chunk fails to load) — NOT inside the wrapper. Fallback UI (SectionPanel + "Reload editor"/"Return to list" buttons) + `logger.error` + reset-on-navigation (`key={id}`). Added W8 test case `shows editor crash fallback on render throw`.
- **Cross-cutting:** Three cross-cutting NEW gaps landed as Y9 (startup env validation), Y10 (migration pipeline test), and Z12 (editor error boundary) — placed in the most logical existing section per the "fix in-place, no new top-level sections" rule.
- **Phase Mapping table update (P1):** §W row updated to "W1-W11 + W6-bis/W8-bis/W8-ter/W10-bis"; §X row updated to include the Phase-2 `@axe-core/playwright` install precondition; §Y row updated to "Y1-Y10"; §Z row updated to "Z1-Z12".
- **Scope discipline:** Did NOT modify §G, §H, §S, §T, §U, §V — those are owned by sibling v10 subagents.

**v10 (Round 5 §S/§U/§V Section Audit — Error Handling, Security, A11y/RTL, 2026-08-02):** Round 5 launched section-audit subagents validating §S (Error Handling), §U (Security), and §V (A11y/RTL) against the actual codebase. Sources at `.ai/plans/email-templates/glm_swe/ui-research-round5/03-§s-error-handling.md`, `05-§u-security.md`, `08-§v-a11y-rtl.md`. Applied surgical in-place fixes — corrections to existing §S/§U/§V bodies + line 70 (todo 12 dispatcher) + line 158 (todo §G content) + the Phase Mapping table; the only NEW subsection added is the §U5-webhook inbound-webhook block (per explicit instruction). All v1-v9 locked decisions preserved verbatim. Key corrections:
- **§S (Error Handling):**
- **S1 (i18n key for editor boundary):** Added requirement that the editor error-boundary fallback use the i18n key `t.editorLoadFailed` (NOT a hardcoded string) and match the `{ errorMessage }` state shape of `ViewSwitchErrorBoundary` (the canonical repo boundary).
- **S2 (path fix):** Replaced the non-existent `frontend/common/graphql/utils/errorCodes.ts` with "extend the existing `frontend/common/utils/errorUtils.ts:10` with `getGraphQLErrorCode()`". Added requirement that, if `EmailTemplateErrorCode` is registered as a Pothos enum, `getGraphQLErrorCode` MUST return the codegen'd client enum from `@/frontend/common/graphql/generated/gql/graphql-types`, NOT the backend `const` object (keeps the client/back boundary clean).
- **S5 (channel contract rewrite — CRITICAL):** Fixed the file path `backend/types/email/emailChannel.types.ts` (does NOT exist) → actual contract at `backend/services/communication/channels/email/IEmailChannel.ts`. Corrected `EmailPayload` to `{ to, subject, html, eventType, userId, metadata? }` (NO `from`, NO `attachments`, NO `text`). Corrected `EmailSendResult` to `{ success, providerMessageId?, error? }` (NO `degraded` field — degraded flows through the dispatcher, not the channel interface). Fixed `renderForSend(...)` return to `Promise<{ html: string; subject: string; degraded: boolean; error?: Error }>` (dropped `text`, kept `subject`, added `degraded`). Clarified that `degraded` is consumed by the *dispatcher* (sets `status=FAILED`, `failureReason="render_degraded"`) — NOT via `EmailSendResult`. Removed the attachments resolver bullet. Also fixed line 70 (todo 12) which still said "pass html+text+attachments" → updated to match the new contract ("pass `html` and `subject`").
- **S6 (import cycle fix — CRITICAL):** Replaced "reuse the existing `is-duplicate-error.ts` pattern" (it is a boolean predicate only — `isDuplicateError(e): boolean`, checks `e.code === "23505"`, does NOT access `e.constraint`) with "EXTEND `is-duplicate-error.ts` to `mapDuplicateConstraint(e): { kind: 'scope_locale' | 'slug' } | null`". Moved typed error classes to `backend/types/communication/errors.ts` (neutral types layer) to avoid the repo→services import cycle — NOT in `backend/services/communication/email-template-errors.ts`. Service (not repo) catches raw `QueryError` and maps to `DuplicateScopeLocaleError` / `DuplicateSlugError`. Stripped the "Drizzle exposes `e.code, e.detail, e.constraint`" assertion and re-framed it as a requirement to verify in §W1.
- **S7 (Pothos enum decision):** Added the decision: register `EmailTemplateErrorCode` as a Pothos enum AND add a `result.errorCode` field on a `union SendEmailResult` so the SDL member is reachable. Added prohibition: do NOT use `createPgEnumFromEnum` for S7. Added requirement: if registered, frontend `getGraphQLErrorCode` MUST return the codegen'd client enum (per S2 helper path). Kept the 10 member list (verified complete).
- **S8 (toast carve-out):** Added convention: `notifications.show(msg, { severity, actionText, onAction })` may carry a callback-action button *without* escalating to `<Alert>` — verified pattern at `useApolloConnectivity.ts:107-118`.
- **S9 (SESSION_EXPIRED self-referential):** Added note that `SESSION_EXPIRED` appears only in the plan file itself — §P7 references must be cleaned up; no codebase usage found.
- **§U (Security):**
- **U2 (scalar blast radius):** Added note that adding `extensions: { code: "INVALID_EMAIL" }` to `emailScalar.ts` (which still throws bare `TypeError`) is a GLOBAL scalar change affecting EVERY `Email` field across the schema — flag the blast radius. Added note that the `sampleProps` zod mirror is non-actionable: `EmailPropsByScope` is a TS mapped type erased at runtime; implementers MUST hand-write per-scope zod schemas (9+ scopes).
- **U4 (sandbox attribute):** Added `sandbox=''` (NONE of `allow-same-origin`/`allow-scripts`/`allow-forms`) requirement on the iframe tag inside §U4, not just in the plan body. Added Safari caveat: `<meta http-equiv>` srcdoc has incomplete browser support under strict sandbox — prefer http-equiv on the response header when available.
- **U5 (DOMPurify + §T2 reconciliation):** Added explicit cross-reference: DOMPurify re-sanitize runs server-side before every HTTP response, including §T2 cache-first reads; Apollo `cache-first` is for the CLIENT cache only (the server still re-sanitizes on every response). Added `FORBID_ATTR: ['style']` alongside the existing `FORBID_TAGS: ['style']`.
- **U6 (sanitizeHeader fix):** Replaced "Enforce `Email` scalar on all email-address inputs" with "`sanitizeHeader(str)` on `from/to/cc/bcc/subject/replyTo/Return-Path`". Extended the strip regex to cover `[\r\n]` AND bare `\n` AND RTL/LTR bidi marks (`\u202E\u202D\u200E\u200F`). Added `Return-Path` to the field list. Added a `sanitizeSubject(resolvedSubject)` step AFTER merge-tag resolution (header injection can re-emerge via resolved merge-tag values).
- **NEW U5-webhook (inbound webhook security):** Added a new subsection for `app/api/email/events/route.ts` — HMAC signature verification (Resend uses Svix), idempotency key on `event.id`, per-event rate limit + replay window (5 minutes). This is the ONLY new subsection added by this pass (per explicit instruction).
- **U7 (implementation gaps):** Removed the dead "memory → accept non-atomic" branch (CacheService has NO memory provider). Added requirement that `IRedisService` needs `eval`/`evalsha`/`scriptLoad` methods extended on the interface AND implemented in both `LocalRedisAdapter` and `UpstashRedisAdapter`. Specified the Postgres path: `db.execute(sql\`SELECT pg_advisory_xact_lock(hashtext(${key}))\`)` inside the cache adapter. Added the entrypoint decision: email limiters use a NEW entrypoint bypassing `checkRateLimit`, OR `checkRateLimit` is migrated to the atomic path (with knock-on effect on existing limiters — flag for §W review).
- **§V (A11y/RTL):**
- **V1 (line citations):** Fixed lines 790/884/1038 → actual lines 829/923/1077 in the V1 header, the v9 closure bullet, the §G section header at L1470, and the v9 changelog entries at L2461/L2473.
- **V2 (↔ §G1 reconciliation):** Reconciled V2 with §G1's corrected path — both now reference `frontend/common/stores/preferencesStore.ts` (Zustand store, the more repo-consistent pattern — the repo has 60 Zustand stores under `frontend/common/stores/` and NO `frontend/stores/` directory). Deprecated the v9 `frontend/common/hooks/usePrefersReducedMotion.ts` path. Aligned the V2 animation-governance list with §G1.
- **V3 (assertive region):** Added a SEPARATE `<div aria-live="assertive" role="alert">` for `FormErrorSnackbar` + version-mismatch dialog. Two regions required (polite + assertive), NOT one — the polite region is for progressive status, the assertive region is for errors requiring immediate attention.
- **V5 (↔ §G4 keyboard shortcuts):** DELETED the V5 shortcut table. Replaced with "See §G4 for the authoritative keyboard shortcuts table." Uses `Ctrl+Shift+P` for Publish (per §G4), NOT `Ctrl+P`. `useHotkey` consults §G4 as the single source of truth.
- **V7 (accessibility.announcements fix):** Softened the false "onDragCancel REQUIRED → compile error" claim to the accurate statement: `accessibility.announcements` is OPTIONAL; if supplied, the `Announcements` interface requires all four handlers. Dropped the redundant `...defaultAnnouncements` spread when all four handlers are overridden. Added a `useSortable({ data: { blockLabel: t('editor.block.<type>.label') } })` wiring specimen with i18n lockstep note (block labels are i18n'd strings, NOT hardcoded).
- **V8 (onTouched convention):** Changed `mode: 'onTouched'` → default `mode: 'onSubmit'` to match repo convention (all existing `useForm` calls use `onSubmit`).
- **Cross-cutting line fixes:** Path at line 158 (todo §G content) corrected `frontend/stores/` → `frontend/common/stores/` (the repo has no `frontend/stores/` directory). Phase Mapping table: §U row updated to "U1-U7 + U5-webhook" with Phase 3 = U5-webhook inbound webhook security.
- **Scope discipline:** Scope = §S, §U, §V ONLY. Did NOT modify §G, §H, §T, §W, §X, §Y, §Z — those are owned by sibling v10 subagents.

- **§S (Error Handling):** S5 (dropped `text` from `safeRender` return — `IEmailChannel.send()` has no `text` field), S6 (`e.constraint_name`→`e.constraint`, errors live in services layer not repo), S7 (error code registry → `const` object in `backend/enum/`, not TS `enum` in `backend/types/`), S8 (`show()` DOES accept `severity` — v8 premise was false).
- **§T (Performance):** T1 (React Compiler definitively OFF — memoization mandatory), T2 (`isDirty` is Zustand state, cannot be Apollo cache key — use dynamic `fetchPolicy`), T6 (ESM import fix, Turbopack caveat), T10 (no `AbortSignal` support — `Promise.race` only).
- **§U (Security):** U3 (invalid `authScope` syntax → explicit boolean flags `authScopes: { superAdmin: true, notImpersonating: true }`), U7 (`limitSimple` is NON-atomic — real Lua script for Redis, `pg_advisory_xact_lock` for Postgres).
- **§V (A11y/RTL):** V3 (`sx={{ srOnly: true }}` is NOT valid — full CSS clip/clipPath pattern), V7 (missing `onDragCancel` + fabricated `useSortableAnnouncements` → real `Accessibility` `announcements` object + `defaultAnnouncements` merge), V8 (overriding `DraggableAttributes` DESTROYS keyboard D&D — spread `{...attributes}` on inner `<div>`).
- **§W (Testing):** W2 (real `MockLink.MockedResponse` precedent, correct test dir `test/ui/components/email-templates/mocks/`), W4 (`TestWrapper` not raw `MockedProvider`), W5 (`email_templates` table = Phase 2, two `db.transaction` in `Promise.all` for concurrency test), W9 (`TestWrapper` already handles RTL/viewport).
- **§X (DX):** X1 (`bun run db -- seed` not `bun db seed`, `Bun.spawn`), X4 (`EmailChannelFactory` not `EmailProviderRegistry`, correct `backend/services/communication/channels/email/mock/` path), X6 (`bun:test` + `AxeBuilder` not `@playwright/test`).
- **§Y (Migration):** Y1 (custom `.custom-migrations.json` manifest, not standard drizzle-kit), Y3 (fix seed phase contradiction — seeds moved to Phase 2; the 3 fixed locations are Phase-1 definition, Phase-2 definition, and todo 19 note), Y6 (`getEnvArray` helper), Y7 (no Slack infra — `logger.error` + Vercel log drain).
- **§Z (Impl Patterns):** Z1 (`shared/locale/types/emails/` not `backend/types/`), Z3 (option c: `body.slice(0, 50) + "…"`), Z4 (`EmailAttachmentEncoding` + `createPgEnumFromEnum`), Z8 (`shared/locale/en/messages.ts` path, `@/` alias imports), Z6 (§M cross-ref fix).
- **New §G (Accessibility & Interaction Patterns):** Created to close 3 dangling §G references (lines **829, 923, 1077** — v10-corrected from the v9/v8 draft "790, 884, 1038"). Contains `usePrefersReducedMotion()` hook spec (G1), button loading state convention (G2), `idempotencyKey` pattern (G3), keyboard shortcuts table (G4).
- **New §H (Validation Schemas):** Created to close dangling §H references. Contains zod schemas for Save Draft (H1), Publish (H2), Send Test (H3), Merge-Tag (H4), `designJson` (H5).
- **Phase corrections:** Seed phase contradiction fixed at 3 locations — (1) Phase 1 definition ("no seeds — seeds are Phase 2"), (2) Phase 2 definition ("seed default email templates" + todo 19 per §Y3), and (3) todo 19 note ("v9 §Y3 correction: seeds are Phase 2"). Phase 1 no longer lists "seed default templates"; Phase 2 now includes todo 19 (seeds) per §Y3.
- **i18n:** Added missing `duplicateSlug` key to §B error catalogue (referenced in §S6/S7 but absent from catalogue).
- **Cross-section:** Dangling §G references resolved. Locked-decision count corrected (33 V-numbered decisions across v3-v5, not "12").

Research files at `.ai/plans/email-templates/glm_swe/ui-research-round4/01-09-*.md` (9 reports, ~233KB total). All v1-v5 locked decisions preserved verbatim.

**v8 (Round 3 Audit — 8-Domain Deep Closure, 2026-08-02):** Round 3 launched 8 parallel audit subagents covering: implementation patterns (28 gaps), error handling (20 gaps), performance (20 gaps), security (23 gaps), testing depth (33 gaps), a11y/RTL (28 gaps), migration strategy (20 gaps), DX/docs (34 gaps). Total **206 gaps** identified across 8 audit reports (168KB, 1405 lines at `.ai/plans/email-templates/glm_swe/ui-research-round3/01-08-*.md`). Applied enhancements organized into new sections §S–§Z (Error Handling, Performance, Security, A11y/RTL, Testing, DX, Migration, Implementation Patterns) addressing all P0/P1 gaps: editor error boundary, optimistic lock round-trip wiring, outbound send retry + DLQ, safeRender degraded-mode signal, server-side input validation, env key registration, preview query authScope, CSP iframe injection, Arabic pluralization rules, screen reader live regions, keyboard shortcuts, GraphQL integration test directory, Apollo mock factories, test fixtures, single-command bring-up, mock email adapter, rollback runbook, per-scope canary opt-in, monitoring alerts, per-scope EmailLabels field lists, ComplaintReturnType.title fix, enum for EmailPayload.encoding, barrel export + codegen glob + two Zustand stores. All 33 v1-v5 locked decisions preserved verbatim.

Research files at `.ai/plans/email-templates/glm_swe/ui-research-round3/01-08-*.md` (8 reports, 168KB total). All 33 v1-v7 locked decisions preserved verbatim.

**v7 (Round 2 Audit — State/Responsive/Data-flow closure, 2026-08-02):** Round 2 parallel subagent audits (state transitions, Apollo data flow, responsive/mobile tiers, i18n+RTL+a11y depth, cross-section consistency) identified **103 gaps** across all dimensions. Applied surgical fixes:
- Added **§P State Transitions & Edge Cases** (9 sub-sections, lifecycle table covering every async action in §A–§O).
- Added **§Q Data Flow, Apollo Cache & Optimistic Patterns** (11 sub-sections: typePolicies, fetchPolicy per query, optimistic responses for Save/Publish/Archive, RetryLink config, store/cache delineation table, merge-tag introspection, subscription roadmap).
- Added **§R Responsive & Mobile Specification** (14 sub-sections: breakpoint table, responsive column visibility, mobile row actions (swipe), Inspector drawer, bottom action bar, tabs variant, VariableMentionPicker bottom sheet, TipTap mobile toolbar, preview viewport selector replacement, Send Test bottom sheet, history drawer mobile, dialog↔drawer mapping, touch gestures, sessionStorage draft sync).
- **Reordered §M GraphQL Documents before §K/§L** (upstream dependency).
- **Fixed i18n catalogue**: removed false "common.confirm/delete/close" claim; added 14 missing keys (dialog bodies, toast pluralization, preview viewport labels, send-test extras, form field errors, help-text interpolation).
- **Cross-refs added**: §D→§M, §D→§H, §F→§H, §L→§K, i18n §B→Frontend sub-sections mapping.
- **Consistency fixes**: inline `<Chip>` rule consolidated to §N with xref; `next/dynamic` block consolidated; CSP `img-src` canonical at §E; typo `mbox.confirm` → `confirm dialog`.
- **Todo alignment**: 4 new Phase 2 todos (skeletons, usePrefersReducedMotion hook, StatusBadge emailTemplate, dashboard.emailTemplates namespace, 15 Storybook stories).
- **Phase alignment**: `dashboard.emailTemplates` i18n namespace moved to Phase 2.

Research files at `.ai/plans/email-templates/glm_swe/ui-research-round2/01-05-*.md` (5 reports, 118KB total). All 33 v1-v5 locked decisions preserved verbatim.

**v6 (UI/UX completeness, 2026-08-02):** Expanded the thin "### Frontend" (~60 lines) + "### i18n" (~30 lines) sections into a complete production-ready UI/UX specification, now ~410 lines covering: routing & navigation (exact admin routes, sidebar entry, breadcrumbs, two-layer permission gate + new `EMAIL_TEMPLATES_MANAGE` enum value); page layouts (DesktopPageContainer/MobilePageContainer + DesktopPageHeader + SectionPanel + new EmailTemplatesListSkeleton/EmailEditorSkeleton + shared EmptyState/ErrorState); list view (AppDataGrid columns + row-actions menu via useRowMenuAnchor + search bar + filter chips + segmented Active/Archived/All view + pagination in Zustand store); editor view (three-tab Design/Preview/Code layout with Slide tab transitions; right-pane Inspector via SectionPanel — scope lock, locale, version, allowed-editor-groups TagInput, subject template with merge-tag insertion (validation schema in §H); Save Draft + Publish + Send Test actions with keyboard shortcuts (mutation documents in §M); History restore drawer; isDirty beforeunload + in-app nav guard; all v1-v5 locked decisions preserved verbatim — EmailEditorWrapper + ssr:false, ScopedCssBaseline, EmailTheming /plugins import, atomic save flow); preview tab (sandbox='' iframe + CSP default-src 'none' / style-src 'unsafe-inline' / img-src 'self' data: + DOMPurify server-side sanitize + viewport selector + Copy HTML); send-test dialog (To input + sample props + rate-limit notice + success animation (zod schema in §H)); animations & micro-interactions (reuse framer-motion stagger from MetricCard + new SuccessCheckMark + @dnd-kit/sortable built-ins for block reorder + NEW usePrefersReducedMotion hook closing a production-readiness gap — today the codebase respects reduced-motion nowhere); forms & validation (react-hook-form + Controller + zod + useWatch — NO useFieldArray per repo precedent); theming & dark mode (theme palette only + useColorScheme drives --re-* CSS vars); accessibility (aria-labels, focus trap, WCAG AA color contrast, prefers-reduced-motion); storybook stories (full per-component table of 15 rows from research file 05); component + E2E tests (15-row table + mock.module-stub for @react-email/editor + single test/ui/e2e/email-templates.test.ts happy path); GraphQL documents (KEEP verbatim from v5); StatusBadge extension (new `emailTemplate` category — Draft=warning, Published=success, Archived=disabled; inline `<Chip>` forbidden per COMPONENT_PATTERNS.md:170); feature-flag visual cue (`<LockOutlined>` on sidebar entry + disabled Send Test/Publish buttons when EMAIL_TEMPLATES_ENABLED=false); Zustand store (KEEP from v5, no separate Storybook mock-store convention). The i18n section was expanded with a new `dashboard.emailTemplates` UI namespace — complete key catalogue grouped by surface (nav labels, page titles, table headers, status chip labels, button labels, dialog titles, form fields/help text, tooltips, toast messages, error messages, empty states, search/filter, editor labels, send-test dialog labels) reusing the existing `common` namespace for generic verbs (loading/cancel/save — do NOT duplicate; confirm/delete/close are NOT in common — add to dashboard.emailTemplates); 7-file atomic changeset listed for the new namespace (V4-3 lockstep rule echoes for `dashboardEmailTemplates{En,Ar}`). Research synthesis at `.ai/plans/email-templates/glm_swe/ui-research/00-synthesis.md`; five deep research files at `.ai/plans/email-templates/glm_swe/ui-research/01-05-*.md` (dashboard inventory, template editor, animations, i18n, storybook+tests).

**Post-v5 package install (2026-08-02):** Installed 3 missing plan-required packages and verified their APIs against `node_modules` + Bun smoke tests. `isomorphic-dompurify@3.21.0` + `@aws-sdk/client-sesv2@3.1101.0` (runtime), `@next/bundle-analyzer@16.2.12` (dev). **Phase 0 GO/NO-GO gate (V4-6) is now GREEN — added `@dnd-kit/utilities@^2.2.0` + `@dnd-kit/modifiers@^9.0.0` (Phase 0 dependencies)** — `isomorphic-dompurify.sanitize()` under Bun 1.3.14 strips `<script>` and `onerror` vectors correctly, `isSupported: true`. jsdom fallback NOT required. See `.ai/plans/email-templates/reserch_node/15-newly-installed-packages-verification.md`.
- **V5-post-SMTP (2026-08-02):** SMTP production restriction LIFTED. Prior "dev/test only" caveat was driven solely by Bun #10329 (nodemailer TLS socket flakiness under Bun). Confirmed deployment target is **Vercel + Node.js** (next.config.ts `serverExternalPackages` includes `@vercel/functions`), where `nodemailer` is the industry-standard SMTP library with zero caveats. SMTP is now a first-class production provider alongside Resend/SES/Postmark/Mailgun. Production warning log + "dev/test only" deployment-doc note removed. Local dev can still run on Bun for dev-loop speed; `SmtpEmailAdapter` is production-safe when run under Node. See todos 4, 6, adapter specs section.

Phase 0 — GO/NO-GO gate: install dependencies (todo 1) and verify isomorphic-dompurify Bun compatibility (todo 21b). ✅ Phase 0 is GREEN (2026-08-02): packages installed + isomorphic-dompurify Bun smoke test PASSED (`sanitize()` strips `<script>` + `onerror`, `isSupported: true`). Proceed safely with isomorphic-dompurify; jsdom fallback not required. **Todos 1, 21b.**
Phase 1 — Types + enum + registry + multi-provider adapter refactor + `mapEventTypeToEmailScope` + `safeRender()` + TipTap schema validation + i18n signature fix (no UI, no DB schema, **no seeds** — seeds are Phase 2). Existing notification bodies still passthrough. Get `renderEmailTemplate` working with code-only scaffolds. **Todos 1-8, 3a, 7a, 7b.**
Phase 2 — DB schema (with optimistic locking) + repo (with version increment) + Pothos + GraphQL CRUD (with impersonation guard + rate limiting) + admin list/edit view (with dirty state tracking + error handling + preview XSS hardening) using `@react-email/editor` + **seed default email templates** (todo 19, per §Y3 correction). **Todos 9-12, 12a, 14-17, 16a, 19, 21a.**
Phase 3 — Migrate dispatcher email channel through `EmailTemplateService.renderForSend` for each `NotificationEventType → EmailScope` mapping (gated by EMAIL_TEMPLATES_ENABLED feature flag, todo 21c). Wire attachments + idempotency + payload.body fallback. Add bounce/complaint webhooks. **Todos 13, 18, 20, 20a, 21c.**
Phase 4 — Bundle size analysis + auth/account emails: add WELCOME/PASSWORD_RESET/EMAIL_VERIFICATION to NotificationEventType AND uncomment their EVENT_TO_SCOPE entries in the same PR (V3-8). Run full quality gate. **Todos 20b, 21.**

#### Phase Mapping for §S–§Z Subsections (v10 — §T count updated by round-5 audit)

| Section | Subsection | Phase |
|---------|-----------|-------|
| §S | S1-S9 (Error Handling) | Phase 1 (registry/errors), Phase 2 (GraphQL error mapping), Phase 3 (retry/DLQ) |
| §T | T1-T13 (Performance) | Phase 1 (T7 safeRender caching), Phase 2 (T2 fetchPolicy state-form fix, T3 virtualization, T11 search debounce, T12 lazy+Suspense per tab), Phase 1/2 (T13 EntityCacheService render-cache), Phase 4 (T6 bundle analysis) |
| §U | U1-U7 + U5-webhook (Security) | Phase 1 (U1 Email scalar), Phase 2 (U3 authScope, U7 rate limit), Phase 3 (U5-webhook inbound webhook security) |
| §V | V1-V8 (A11y/RTL) | Phase 2 (all — ships with UI) |
| §W | W1-W11 + W6-bis/W8-bis/W8-ter/W10-bis (Testing) | Phase 1 (W1 throw-and-log probe), Phase 2 (W2 mocks, W3 fixtures, W4 TestWrapper, W6/W6-bis merge, W8-bis safeRender, W8-ter iframe CSP, W10/W8/W10-bis rollback), Phase 3 (W5 concurrency) |
| §X | X1-X7 (DX) | Phase 1 (X1 bring-up), Phase 2 (X4 mock adapter, X6 install `@axe-core/playwright` precondition), Phase 4 (X6 visual regression test) |
| §Y | Y1-Y10 (Migration) | Phase 1 (Y1 migration pipeline, Y9 startup env), Phase 2 (Y3 seeds, Y10 migration pipeline test), Phase 3 (Y5 rollback runbook, Y7 monitoring) |
| §Z | Z1-Z12 (Impl Patterns) | Phase 1 (Z1-Z4 types/enum, Z9 barrel export, Z11 Zustand stores, Z12 error boundary), Phase 2 (Z6-Z8 barrel/codegen, Z10 codegen glob, Z12 editor boundary) |
| §G | G1-G4 (Accessibility) | Phase 2 (usePrefersReducedMotion hook, button loading, idempotencyKey, shortcuts) |
| §H | H1-H5 (Validation) | Phase 1 (H1-H2 schemas for types), Phase 2 (H3 send-test, H4 merge-tag, H5 designJson) |

