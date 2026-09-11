# Tasks 4 — Frontend

- [x] 4.1 i18n namespace `whatsappConversations` (types/en/ar leaves, namespace module,
  `Translation` registry, en/ar `messages.ts`) + `dashboard/core/nav` label keys en/ar +
  type; run `bun run locale:snapshots`.
- [x] 4.2 Permissions frontend wiring: `frontend/common/types/page-permissions.types.ts`
  (`whatsappConversations: [AppPermission.WhatsappConversationsView]`), nav icon key
  (`navIconKeys.ts` + `navIconRegistry.tsx`), nav item in `navigationConfig.ts` +
  `grp_integrations` permission array + portal overrides.
- [x] 4.3 Route: `app/(dashboard)/whatsapp/page.tsx` (withPageAuth + metadata).
- [x] 4.4 Container + state: `WhatsappConversationsContainer` +
  `useWhatsappConversationsViewModel` (accounts query with `isTestNumber`, conversations
  query reuse, polling, account selector, selected conversation, composer state, registry
  query, mutations, translated error surfaces via extensions.code).
- [x] 4.5 Components: `ConversationListShared`, thread pane (reuse inbox rendering shared
  bits — extract ONLY if it avoids duplication; prefer importing inbox view pieces),
  `ComposerShared` (+ template select from synced templates document), `TestRecipientsShared`,
  `TestNumberBanner`; desktop/mobile tier files.
- [x] 4.6 Settings badge: `NumberCardContent` (+ stories) show "Test number" chip from
  fragment `isTestNumber`; keep existing two-state badges untouched.
  → outcome/4.6-badge-outcome.md
- [x] 4.7 Storybook stories for container (MockedProvider + seeded permissions) — happy,
  test-number, view-only permission.
- [x] 4.8 UI tests dir `test/ui/components/whatsapp-conversations/` (preload namespace):
  composer window open/closed, test-number gating per registry state, recipients panel
  flows, badge presence; rerun any touched whatsapp settings UI tests.
  → outcome/4.7-4.8-stories-tests-outcome.md
  _Requirements: design-04, design-05, specs-2/3/4 frontend bits_
