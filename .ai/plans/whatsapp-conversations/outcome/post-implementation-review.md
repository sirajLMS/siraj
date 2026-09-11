# Post-Implementation Review — WhatsApp Conversations

Date: 2026-09-11.

Findings from the whole-feature review after the `/whatsapp` workspace landed,
tracked here with the verification story for each fix. Items are ordered by
severity; the FIX section records the applied remediation.

## FIXes applied

### FIX 1 [HIGH] — Composer persist used the Meta request envelope

`WhatsappConversationsService.sendMessage` persisted the Graph API request
envelope (`{ text: { body } }` / `{ template: { name, languageCode } }`) as the
message `content`, while every inbox read path expects the inner typed-content
object the webhook ingest writes (`extractTypedContent` in
`whatsapp-webhook-inbox.helpers.ts` stores `message[type]` — e.g. `{ body }`
for text; both thread panes read only a string `content` or a `content.body`
string). Outbound composer bubbles therefore rendered empty.

Fix (`backend/services/whatsapp/whatsapp-conversations.service.ts`):

- TEXT persists `{ body }`.
- TEMPLATE persists `{ body: "[template] <name>", name: <name> }` — the `body`
  marker mirrors the conversation-preview tradition (`[template] <name>`,
  already used for `lastMessagePreview` and the ingest preview's `[${type}]`
  fallback) and is the only key the renderer reads; `name` keeps the raw
  template handle on the row. Shared `templateDisplayText()` serves both the
  bubble body and the conversation preview.
- The `type` column stays `"text"` / `"template"`.

Tests: the existing happy sends now assert the exact persisted shape literals
plus a round-trip through a mirror of the pane's `resolveMessageText` read
contract (`paneMessageText` in the service test).

### FIX 2 [MEDIUM] — `conversationId` coherence check

`resolveSendConversation` previously checked only conversation→account
ownership. A caller could pass a `conversationId` for a thread whose peer is
not `to`, which would let a window-exempt TEMPLATE send book its message into
an unrelated thread. The check now also requires the conversation's `waId`
(digits-normalized) to equal the send target; a mismatch throws
`NotFoundError("WHATSAPP_CONVERSATION", tErrors.notFound)`, same as the
ownership mismatch.

Tests: mismatch rejects with `NotFoundError` before any Meta call (TEMPLATE
mode — the window-exempt path), and a same-recipient `conversationId` bind
still succeeds and persists into that conversation.

### FIX 3 [LOW] — Meta error 132047 mapping

Meta returns `132047` (re-engagement required) when the 24h customer-service
window has already closed server-side. `dispatchSend` now maps it to the
outside-service-window translated error
(`WHATSAPP_OUTSIDE_SERVICE_WINDOW` / `tErrors.whatsappOutsideServiceWindow`),
alongside the existing 131030 → recipient-allow-list mapping; all other
failures keep the generic `WHATSAPP_CONVERSATION_SEND_FAILED`.

Tests: a 132047 Graph API rejection surfaces
`errorsEn.whatsappOutsideServiceWindow` and persists nothing.

## Verification

- `test/scripts/run-test.ts
  backend/services/whatsapp/test/whatsapp-conversations.service.test.ts` —
  37 pass / 0 fail (23 original + new content-shape, coherence, and 132047
  cases).
- `test/scripts/run-test.ts
  backend/services/whatsapp/test/whatsapp-optin.test.ts` — green.
- `test/scripts/run-test.ts
  backend/services/whatsapp/test/whatsapp-webhook-ingest.test.ts` — green.
- Per-file `sub-loop --lifecycle codescene` — exit 0 for both edited files.
- `bun tsgo` — 0 errors for the edited files (sub-loop).

## Known fallout (cross-file)

- `test/workflows/whatsapp/conversations.test.ts` asserted the old
  Meta-envelope shape (`content.text.body`) for the post-window free-text
  send; FIX 1 legitimately changes the persisted shape to `{ body }`, so that
  journey expectation must be updated to `content.body`. Owned by the fix
  wave for the journey test file.

## FIX B — Frontend fixes (post-implementation review)

Date: 2026-09-11.

### B1 [MED] — Conversation list page clamp (query variables + pager)

`useWhatsappConversationsViewModel.ts` previously queried the unclamped
`filters.page`, so a shrinking `totalCount` left the workspace on a
non-existent page showing the empty state while nothing re-fetched. The
ViewModel now tracks the latest server-reported `totalCount`
(`serverTotalCount` state) and folds a clamped page
(`resolveListQueryPage`) into the list-query variables *before* they are
built; the pager keeps showing the clamped `conversationsPage`; and a
`useSyncListPage` effect re-anchors `filters.page` to the last existing
page whenever a landed payload reports a smaller total, so every
subsequent request already targets a real page.

Test: "shrinking totalCount keeps the list visible on the last partial
page" in `whatsappConversationsContainer.test.tsx` — navigates to page 2
of 45 rows, refetch reports 21, and the list settles on the last partial
page (page 1) with its row visible and no empty state.

### B2 [MED] — Composer template-field accessibility labels

The template name and language fields shared `templatePickerLabel` /
`templatePickerPlaceholder`, and the mode toggle was aria-labelled with
the template-picker label. New `whatsappConversations` keys —
`composerModeLabel` ("Message type" / "نوع الرسالة"),
`templateNameLabel` ("Template name" / "اسم القالب"),
`templateNamePlaceholder` ("e.g. hello_world" / "مثال: hello_world"),
`templateLanguageLabel` ("Language" / "اللغة"),
`templateLanguagePlaceholder` ("en_US") — are wired into the mode
toggle's `aria-label` and the two template fields in
`ComposerShared.tsx`. The composer has no template empty state, so
`templatePickerEmpty` was removed; `templatePickerLabel` /
`templatePickerPlaceholder` had no remaining consumers after the
rewiring and were removed as well (dead keys).

### B3 [MED→LOW] — Add-recipient catch-all uses a registry message

`executeAddRecipient`'s fallback was the send-failure message. New
`whatsappConversations.recipientAddFailed` ("Couldn't add the recipient.
Please try again." / "تعذّرت إضافة المستلم. يرجى المحاولة مرة أخرى.") is
now the catch-all fallback; known codes still map to their dedicated
errors.

Test: "add-recipient failures surface the registry-specific error"
mocks a failing `addWhatsappTestRecipient` mutation and asserts the new
copy, not the send copy.

### B4 [LOW] — Test-number chip consistency

`ConversationListShared.tsx` row chip now uses
`StatusBadge { category: "syncStatus", status: "partial" }`, matching the
settings `NumberCardContent` test-number chip (was `status: "pending"`).

### B5 [LOW] — Desktop thread pane has no back button

`WhatsappConversationsWorkspacePane` accepts
`showThreadBackButton` (default `true`); the desktop tier passes `false`
so the split view keeps navigation on the list pane and the thread pane
omits the back button. Mobile keeps the default (back button rendered).

Tests: thread-pane unit test asserts the button is omitted when `onBack`
is undefined; the container desktop test asserts no back button in the
open thread while the list row stays selectable. `openDefaultThread` now
detects the open thread via its labelled region instead of the back
button.

### B6 [LOW] — `NoAccounts` story mocks the list query

`WhatsappConversationsContainer.stories.tsx` `NoAccounts` now mocks
`whatsappConversationThreads` (`accountId: null`, empty rows) in
addition to the empty accounts response — the workspace issues the list
query with `accountId: null` before any number is selected.

### B7 [LOW] — `chat` nav icon ordering

`navIconKeys.ts` + `navIconRegistry.tsx`: true string ordering is
`calendarToday < category < chat < class`; `chat` moved after `category`
in both the key union and the loader/lazy maps. No other changes.

### B8 [LOW] — Dead-label sweep

Removed from `whatsappConversations` types/leaves (no component, VM, or
tier-leaf consumer — verified by repo-wide search):
`accountSelectorPlaceholder`, `loadingConversations`, `loadErrorTitle`,
`columnPreview`, `columnLastActivity`, `columnAccount`,
`templatePickerEmpty`, plus `templatePickerLabel` /
`templatePickerPlaceholder` (gratuitously dead after B2). The
`whatsappInbox` namespace keeps its own `columnAccount` /
`columnLastActivity` / `loadErrorTitle` keys — those are still used by
the settings inbox grid.

## FIX B — Verification

- `bun run locale:snapshots` — 264 snapshots processed, en/ar
  `whatsappConversations` snapshots regenerated.
- `bun tsgo` — 0 errors.
- `test/scripts/run-test.ts` on all four
  `test/ui/components/whatsapp-conversations/*` files — 33 tests pass
  (container 8, composer 10, thread pane 7, recipients panel 8).
- Per-file `sub-loop --lifecycle codescene` — exit 0 for every edited
  file (locale types/leaves, view types, ComposerShared, ViewModel,
  ConversationsWorkspaceShared, ConversationListShared, desktop tier,
  stories, navIcon keys/registry, the four touched test files).

## FIX C — Journey-test alignment (2026-09-11)

`test/workflows/whatsapp/conversations.test.ts` — journey-test alignment —
followed the new persisted content shape (FIX 1: TEXT → `content.body`;
TEMPLATE → `{ body: "[template] <name>", name }`); the post-window free-text
step now asserts `content.body` directly. 8/8 journey tests pass; per-file
`sub-loop --lifecycle codescene` exit 0. Resolves the "Known fallout" entry
above.
