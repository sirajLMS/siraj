# 12 — Inbox Tab End-to-End (frontend)

- **Plan**: `.ai/plans/whatsapp2/` Phase 12
- **Date**: 2026-09-06
- **Requirements**: REQ-8 (read-only inbox: conversations, thread, account filter, RTL)

## Deliverables

| Task | File(s) | State |
|---|---|---|
| 12.1 | `whatsappConfig.constants.ts` | `TAB_IDS`/`TAB_LABELS`/`TAB_PERMISSIONS` gained `inbox` (`tabInbox` key existed since Phase 10; permission `AppPermission.WhatsappInboxView`) |
| 12.1 | `WhatsappConfigView.tsx` | tab union now `"numbers" \| "templates" \| "optin" \| "inbox"`; `whatsappTabUrl.ts` unchanged (generic allowlist via `TAB_IDS`) |
| 12.1 | `WhatsappTabNav.tsx` | permission-filtered tabs via `useUserStore().hasPermission` × `TAB_PERMISSIONS` — tab hidden when the user lacks its permission (was: always rendered) |
| 12.2 | `whatsappInboxDirectionLabel.ts` (new) | Record<WhatsappMessageDirection, labelKey> lookup — no enum-comparison lint |
| 12.2 | `types/whatsappInboxView.types.ts` (new) | `WhatsappConversationRow`, `WhatsappMessageRow`, `WhatsappInboxAccountOption`, `WhatsappInboxViewModel` |
| 12.2 | `useWhatsappInboxViewModel.ts` (new) | own VM: accounts query (filter options), conversations query (account filter + server pagination page/pageSize), thread query (`skip` until selection), 30s `pollInterval` + `cache-and-network`, client-side search over page rows, locale-aware `formatTimestamp` |
| 12.2 | `whatsapp-inbox.documents.ts` | NOT touched — Phase 9 documents already carry everything (`id` on all selections); no codegen rerun needed |
| 12.3 | `tabs/shared/InboxTabContent.tsx` (new) | header, account-filter Select + SearchBarField, error Alert with retry, children = tier section |
| 12.3 | `tabs/shared/ConversationThread.tsx` (new) | RTL-safe logical-property bubbles (inbound surfaceVariant / outbound primaryContainer), revoked italic marker, `editedLabel` caption, media-expired placeholder, read-only notice footer, loading `component="output"` |
| 12.4 | `InboxTab.desktop.tsx` (new) | `DesktopAppDataGrid` (Contact/preview/purpose-badge/last-activity), server pagination, row click → thread pane beside list |
| 12.4 | `InboxTab.mobile.tsx` (new) | `MobileCardList` + `MobileCardListItem` cards; selection swaps to full thread with back button |
| 12.4 | `WhatsappTabPanels.tsx` | `lazyInboxTab` + `InboxTabPanel` calling the inbox VM; inbox gated by the panel-wide `RequirePermission` via `TAB_PERMISSIONS.inbox` |
| 12.TE | `test/ui/components/whatsapp/whatsappInboxTab.test.tsx` (new, 9 tests), `whatsappUrlTabNav.test.tsx` (updated: full-permission grant + inbox tab assertions + hidden-when-no-permission test) | **written, NOT executed** (user constraint) |

## 12.QL

Every file above passed `scripts/health/sub-loop.ts --lifecycle codescene` (exit 0). Cycle fixes during the loop: sonar nested-ternary/cognitive-complexity extractions in `ConversationThread` (`ThreadBody`, `RevokedMessageBody`, sx callback constants), CodeScene test-body duplication → `renderTab`/`renderSelectedThreadTab` helpers. Repo tsgo shows zero whatsapp-scoped errors.

## 12.SEC

- Tab hidden client-side without `WHATSAPP_INBOX_VIEW`; panel content independently wrapped in `RequirePermission` (belt-and-braces, same as other tabs).
- No new backend surface invented; VM consumes only Phase-9 read queries plus the existing accounts query. No credentials/tokens rendered; thread UI is strictly read-only (no composer).
- No re-querying of permissions; gating reads the already-loaded user store.

## 12.SR

- Zero prototype placeholder data; rows/bubbles render only GraphQL fragment fields.
- i18n strictly via the `whatsappInbox` namespace (en/ar from Phase 10) + `whatsapp.tabInbox` for nav; rule 7 holds (labels object via VM).
- Server pagination uses `mode: "server"` with real page/totalCount — no client-mode fakery on a server slice.

## 12.IV

Read/applied: root `AGENTS.md` (re-read after on-disk change); `frontend/AGENTS.md`; `frontend/common/views/AGENTS.md` (VM composable-hook pattern, labels aggregation); `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md` (mobile barrel imports, gutter ownership); `test/ui/AGENTS.md`, `test/ui/components/AGENTS.md`; `docs/frontend/whatsapp-ui-patterns.md`; prototypes (desktop inbox + thread, one image per turn).

## Notes / follow-ups

- `historyDeclinedNotice` (Phase 10 key) is unused — no server signal distinguishes it yet; thread shows the generic read-only notice instead.
- Desktop thread pin width (380px) and media "pending vs expired" semantics (placeholder ⇒ currently surfaces `mediaExpired`; `mediaPending` unused pending a backend signal) are candidates for Phase 15 doc notes.
- Tests were not executed per the phase constraint; `bun run test:ui:components` remains as a Phase 14 gate item.
