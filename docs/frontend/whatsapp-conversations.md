# WhatsApp Conversations — `/whatsapp` page reference

Top-level WhatsApp conversations workspace at `/whatsapp` (under the `grp_integrations`
nav group, directly after WhatsApp settings). It lists per-account conversations, sends
free-text messages inside Meta's 24-hour customer-service window, sends templates at any
time, and manages a local recipient registry for Meta test numbers. The Settings WhatsApp
**Inbox** tab stays read-only; `/whatsapp` is the full workspace.

Adjacent references: `docs/services/whatsapp-cloud-api.md` (v1 integration),
`docs/services/whatsapp-coexistence-multi.md` (multi-number routing + webhook ingest),
`docs/frontend/whatsapp-ui-patterns.md` (settings UI patterns this page builds on),
`docs/graphql/domain-error-extensions-code.md` (DomainError → `extensions.code` contract).

## Architecture

```
app/(dashboard)/whatsapp/page.tsx                    [Server, withPageAuth(view permission)]
  └─ WhatsappConversationsContainer.tsx              [Client, zero props, named export]
      └─ useWhatsappConversationsViewModel.ts        [all state/queries/mutations]
          └─ ResponsiveViewSwitch + createLazyView   [desktop / mobile tier leaves]
              └─ *Shared.tsx components (common layer)
```

- Common feature folder: `frontend/common/views/dashboard/whatsapp/conversations/`
  (`ConversationListShared`, `ConversationThreadPaneShared`, `ComposerShared`,
  `TestRecipientsPanel`, `TestNumberBanner`, `ConversationsWorkspaceShared`,
  `NoWhatsappAccountsState`, view types under `types/`).
- Tier leaves: `frontend/{desktop,mobile}/views/dashboard/whatsapp/conversations/` —
  pure layout; desktop gets a 2/3-column grid (list / thread+composer / recipients),
  mobile stacks and swaps list ↔ thread with a back button.
- Shared scaffold rules per `docs/frontend/ui-shared-scaffold-pattern.md` (tier leaves
  export components only — react-refresh).
- Nav: `frontend/common/views/dashboard/config/navigationConfig.ts` (`whatsapp-conversations`
  key, `chat` icon via `navIconRegistry`), gated by `PAGE_PERMISSIONS.whatsappConversations`.
- The thread pane is **re-implemented locally**, not the settings `ConversationThread`
  reused: the inbox pane hard-codes a read-only footer, which is false here. Reuse from
  settings covers message direction labels/typing, `textDirection`, and the inbox row
  types + `WhatsappInboxLabels` message chrome only.
- The settings **Numbers** tab also surfaces a "Test number" chip (`NumberCardContent`),
  driven by `isTestNumber`; its label reuses the `whatsappConversations` locale
  namespace's `testNumberBadge` key, merged into the settings label pack in
  `useWhatsappSettingsViewModel` — do not duplicate the key into another namespace.

## GraphQL surface

Backend: `backend/graphql/pothos/whatsapp/whatsapp-conversations.pothos.ts` (objects,
inputs, enums), resolvers under `backend/graphql/{query,mutation}/whatsapp/`.
Documents: `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-conversations.documents.ts`.
Both resolvers and service gate on permissions (resolver `authScopes` + service re-check).

### Queries (view permission)

- `whatsappConversationThreads(accountId, pagination)` — paginated conversation list;
  reuse of the inbox envelope.
- `whatsappConversationThread(id, pagination)` — `WhatsappConversationThread` object:
  conversation fields flattened + nested paginated `messages` (distinct object type from
  `WhatsappConversation` — fragments must target the right type).
- `whatsappTestRecipients(accountId)` — `[WhatsappTestRecipient!]!`.

### Mutations (manage permission)

- `addWhatsappTestRecipient(input: { accountId, phoneNumber, note })`
- `removeWhatsappTestRecipient(recipientId)` → `Boolean!`
- `verifyWhatsappTestRecipient(recipientId)` — sends the `hello_world` test template with
  the account's own credentials; flips the registry row to `ALLOWED` on success or back to
  `PENDING` with the Meta error code stored.
- `sendWhatsappConversationMessage(input)` → `WhatsappConversationSendResult { id, message }`.

Enums: `WhatsappConversationSendMode { TEXT | TEMPLATE }`,
`WhatsappTestRecipientStatus { PENDING | ALLOWED }` (in
`backend/enum/whatsapp/whatsapp-conversations.enum.ts`; registered in
`backend/graphql/pothos/shared/enum.pothos.ts`). `WhatsappAccount.isTestNumber` is
server-derived during sync-from-Meta — never client-submitted.
`actorUserId` is injected from the authenticated context server-side; clients never send it.

## Send contract (`WhatsappConversationsService.sendMessage`)

Service: `backend/services/whatsapp/whatsapp-conversations.service.ts`.

1. **Permission**: manage permission throws `ForbiddenError` before any repo/Meta work;
   the inbox-delegating list methods assert the view permission before delegating
   (the inbox delegate keeps its own gate as defense-in-depth).
2. **Credentials** are resolved per account row only (the driver decrypts
   `encryptedAccessToken` at read time). No env-global token fallback.
3. **Test-number hard block**: if the account is a test number, the registry must hold the
   recipient with `status = ALLOWED` or the send is rejected locally — Meta is never
   called. This exists because **Meta exposes no API to list or manage test-number
   allowlist recipients** (every probed edge returns `#2500 Unknown path components`;
   management happens only in App Dashboard → WhatsApp → API Setup). The local registry is
   therefore the only gate.
4. **24h window**: TEXT requires `lastInboundMessageAt` within 24h; TEMPLATE skips the
   check. `lastInboundMessageAt` is stamped by webhook ingest
   (`WhatsappConversationRepository.touchLastMessage` with `inboundAt`) — inbound rows only,
   under a last-writer-wins guard, so echoes / API_OUTBOUND rows / stale replays never
   move it. Meta remains the authoritative window enforcer; a hint-time "open" can still
   be rejected server-side (see error mapping).
5. **Conversation coherence**: a caller-supplied `conversationId` must belong to the
   account **and** match the `to` waId (digits-normalized) — otherwise `NotFoundError`,
   so a window-exempt template send cannot be booked into an unrelated thread.
6. **External call before transaction**: the Meta `fetch` completes fully, and only then
   one transaction (or the caller's `tx`) persists conversation upsert +
   `WhatsappMessageRepository.upsertByWamid` + `touchLastMessage` + audit row atomically.
   Never hold a DB transaction open across the HTTP call. The request builders run inside
   the same `try` as the fetch so builder validation errors map to the generic send-failed
   code instead of escaping.
7. **Defaults**: composer template sends default to language `en_US` via a dedicated
   constant — do not share the verify-flow template/language constants, or changing one
   silently changes the other.

### Persisted message content shape (invariant)

Persisted `whatsapp_messages.content` is the **inner typed-content object**, not the Graph
API request envelope:

- TEXT → `{ body }`
- TEMPLATE → `{ body: "[template] <name>", name: <name> }`

Webhook ingest (`extractTypedContent` in `whatsapp-webhook-inbox.helpers.ts`) writes
`message[type]` — e.g. `{ body }` — and both thread panes read only a string `content` or
`content.body`. Persisting the request envelope (`{ text: { body } }`) renders outbound
bubbles empty. The `[template] <name>` body marker mirrors the conversation-preview
tradition so the same `templateDisplayText()` serves bubble and preview.

### Meta error-code mapping

| Meta code / condition | Error `extensions.code` | `errors` namespace key |
|---|---|---|
| 131030 (recipient not in allowlist) — mid-send | `WHATSAPP_RECIPIENT_NOT_ALLOWED` | `whatsappRecipientNotAllowedFromMeta` |
| Local pre-send block (test number, recipient not ALLOWED) | `WHATSAPP_RECIPIENT_NOT_ALLOWED` | `whatsappRecipientNotAllowed` |
| 132047 (re-engagement / window closed server-side) | `WHATSAPP_OUTSIDE_SERVICE_WINDOW` | `whatsappOutsideServiceWindow` |
| Local window check (TEXT outside 24h) | `WHATSAPP_OUTSIDE_SERVICE_WINDOW` | `whatsappOutsideServiceWindow` |
| Any other GraphApiError / network / timeout / builder error | `WHATSAPP_CONVERSATION_SEND_FAILED` | `whatsappConversationSendFailed` |
| Recipient cap (5 per test number) | `WHATSAPP_RECIPIENT_LIMIT_REACHED` | `whatsappRecipientLimitReached` |
| Duplicate `(accountId, phoneNumber)` registry insert | `WHATSAPP_RECIPIENT_CONFLICT` | `whatsappRecipientConflict` |
| TEXT without body / TEMPLATE without name | `VALIDATION` | `whatsappMessageRequired` / `whatsappTemplateRequired` |
| Account row without decrypted token | `WHATSAPP_CONFIG` | (existing config key) |

Note that 132047 arrives only from Meta mid-send, so the composer hint and the server
error can disagree on window state — that is expected; hint it, never trust it.

## Test-number recipient registry

Table `whatsapp_test_recipients`; repo
`backend/db/repo/whatsapp/whatsapp-test-recipient.repository.ts`; types in
`backend/types/whatsapp/whatsapp-conversations.types.ts`.

- **Max 5 recipients per test number** (Meta's dashboard cap). The cap check + insert run
  in one transaction serialized by an account-scoped advisory lock
  (`acquireAdvisoryLock(t, "whatsapp-recipient-cap:" + accountId)`), taken *before* the
  count — plain check-then-insert is a TOCTOU race. When the caller passes its own `tx`
  the lock is skipped (the caller may already hold locks; acquiring then risks ABBA
  deadlock). Non-test accounts never hit the cap path.
- Unique `(accountId, phoneNumber)`; the repo lets the driver unique violation surface and
  the **service** translates SQLSTATE 23505 (cause-chained) into the conflict DomainError.
- Delete is a hard delete; `recordVerify` flips `PENDING`/`ALLOWED` and stores
  `lastCheckedAt` / `lastErrorCode` (the verify fetch also runs before its transaction
  opens — see send contract rule 6).
- Registry mutations audit against entity `WHATSAPP_ACCOUNT` with
  `metadata: { registry: "whatsapp_test_recipients", recipientId }`.

### Test-number detection

`isMetaTestNumber(verifiedName, codeVerificationStatus, displayPhoneNumber)` in
`backend/lib/whatsapp-coercion.ts`, applied during `syncFromMeta` (both create and update
paths): test number iff `verified_name === "Test Number"`, OR the code-verification status
is present and not `"VERIFIED"` while the digits-only display number starts with `1555`.
Absent signals resolve to `false` (fail-open — Meta still enforces the real allowlist).
Embedded-signup (coexistence) accounts never see those fields; the next sync stamps the
flag.

## Frontend behavior notes

- **Polling**: the conversation list polls every 30s, paused while the tab is hidden —
  `document.hidden` is consumed via `useSyncExternalStore`, not effect-set-state (React
  Compiler purity).
- **Clamped pagination**: the ViewModel tracks the server-reported `totalCount`, folds a
  clamped page into the list query variables *before* they are built, and re-anchors the
  stored page when a shrunken payload lands — never query the unclamped page, or a
  shrinking total strands the list on a non-existent page showing the empty state.
- **Window hint**: computed from the newest inbound `sentAt` + 24h against a **mount-time**
  `Date.now()` snapshot (`useState(() => Date.now())` — calling `Date.now()` in render
  trips the React Compiler purity lint). Duration copy interpolates via
  `Intl.RelativeTimeFormat` (hours ≥ 60 min, else minutes).
- **Template picker is a free-text name field**: there is no `whatsappTemplates` query in
  the GraphQL schema (synced templates exist only transiently on the sync mutation
  result), so the composer types template name + language and the server validates.
  Replace with a synced-template select only after a templates query exists.
- **Send error surfacing**: mutation runs with `errorPolicy: "none"`; failures read
  `extensions.code` from `CombinedGraphQLErrors` → mapped `errors`-namespace key, falling
  back to the server-localized message, then the generic send-failed key. The registry
  add flow has its own catch-all (`recipientAddFailed`) — do not reuse the send-failed
  fallback for registry failures.
- **Badges**: test-number chips (list rows, settings NumberCard) use
  `StatusBadge { category: "syncStatus", status: "partial" }`; recipient rows map
  PENDING→`pending` / ALLOWED→`completed` on the same category.
- **Account selector** shows active accounts only, like the inbox; the offboarded-account
  composer hint branch is kept defensively in the ViewModel.
- Desktop omits the thread-pane back button (navigation stays on the list pane); mobile
  renders it — controlled via a `showThreadBackButton` prop, default true.

## i18n

- UI namespace: `whatsappConversations` (`Translation.WhatsappConversations`; snapshots
  `public/static/locale-snapshots/{en,ar}/whatsappConversations.whatsappConversations.json`).
  Interpolated keys: `threadHeading {name}`, `lastMessageAt {date}`,
  `windowOpenHint {duration}`, `recipientLastChecked {date}`, `recipientErrorCode {code}`,
  `removeRecipientConfirm {phone}`.
- Error messages live in the `errors` namespace (table above) — services resolve them via
  `ctx.t("errors")` / the `tErrors` parameter; the conversations namespace owns only
  UI-surface titles/hints (`sendErrorTitle`, `loadErrorTitle`, …).
- Nav label: `dashboardTranslations.coreNav.whatsappConversations`.

## Battle-tested gotchas

- **Meta test numbers have no recipients API** — probed live; every list/manage edge
  returns `#2500`. Never design around a remote recipient list; the local registry +
  hello_world verify-send is the only mechanism, and the hard block must stay local.
- **Postgres enum + data in two phases**: adding enum values and inserting rows that use
  them must be split into two custom migrations (enum `ALTER TYPE ... ADD VALUE` committed
  in its own transaction first, then the data INSERT phase — the `46a`/`46b` pair does
  this for the conversations permissions, mirroring the earlier inbox pair). Data-phase
  touching system permissions wraps the protected `trg_protect_system_permissions`
  trigger (disable → upsert → re-enable).
- **Documents before codegen are intentionally red**: sharedDocuments written against the
  locked field names show expected tsgo (`TS2305 has no exported member`) and
  @graphql-eslint unknown-field errors until `bun run generate:gqlSchema && bun codegen`
  run. Do not "fix" them by renaming — verify after regen instead.
- **Fragment spreads must match the object type**: the thread payload is a separate
  `WhatsappConversationThread` object (flattened conversation + nested messages), so the
  inbox `WhatsappConversationFields` fragment cannot spread onto it — the thread query
  uses its own fragment. Adding a required field to an account fragment (e.g.
  `isTestNumber`) breaks every `WhatsappAccountFieldsFragment`-typed fixture until the
  mocks are updated.
- **Phone-shaped literals get PII-redacted in agent-generated files**: build digit strings
  from fragments (e.g. `["1", "555", "01x"].join("")`) in test fixtures, or the file
  lands containing `[PHONE_REDACTED]` placeholders.
- **`resolveListQueryPage` pattern**: whenever a paginated list can shrink under the user's
  feet (polling + deletes), fold the clamp into the query variables, not just the pager.

## Tests

- Service unit suite (mocked repos/permissions, stubbed fetch, no DB):
  `backend/services/whatsapp/test/whatsapp-conversations.service.test.ts` — send gating,
  error-code mapping, persistence shape, cap/lock ordering, tx-after-fetch ordering.
- Repo suite: `backend/db/test/repo/whatsapp/whatsapp-test-recipient.repo.test.ts`.
- GraphQL integration: `frontend/common/graphql/test/whatsapp/whatsapp-conversations.test.ts`
  (denials for every field, send error codes).
- UI components: `test/ui/components/whatsapp-conversations/*` (container, composer,
  thread pane, recipients panel).
- Cross-actor journey (real services + DB, stubbed Meta fetch):
  `test/workflows/whatsapp/conversations.test.ts` — sync → verify → template → window-gated
  text → cap → honest denial.
- No E2E spec yet (requires the production test build + live WhatsApp credentials; the
  journey test stands in).

## Manual steps outside the codebase

Recipient approval for Meta test numbers happens only in the Meta App Dashboard
(WhatsApp → API setup); the app can add/verify against the registry, but dashboard
approval is a human step.
