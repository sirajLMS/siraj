# Design 4 — Frontend / UX / Navigation

## Route + page

- `app/(dashboard)/whatsapp/page.tsx`: `generateMetadata` via `getTranslations(locale)
  [whatsappConversations namespace]` + `withPageAuth([AppPermission.WHATSAPP_CONVERSATIONS_VIEW])`
  rendering `<WhatsappConversationsContainer />`. Mirror `app/(dashboard)/settings/whatsapp/page.tsx`.

## Nav

- `navigationConfig.ts`: new `SIDEBAR_NAV_ITEMS` entry `whatsapp-conversations`:
  `labelKey: "whatsappConversations"`, `iconKey: "chat"` (new icon key — add to
  `navIconKeys.ts` union + `navIconRegistry.tsx` loader for `ChatOutlined`),
  `href: "/whatsapp"`, `groupId: "grp_integrations"`, `permission:
  PAGE_PERMISSIONS.whatsappConversations`.
- Add `WhatsappConversationsView` to `grp_integrations` group permission array.
- Hide for portal roles in each `apply*NavOverrides` set alongside `whatsapp-settings` (the
  4 portals: parent/teacher/student/supervisor has NO nav by default).
- Bottom nav: leave unchanged (tab space is reserved for mobile home fixtures).
- Breadcrumbs free via NAV_ITEMS walk.

## Component tree

`frontend/common/views/dashboard/whatsapp/conversations/`:
- `WhatsappConversationsContainer.tsx` (tier switcher + error boundary)
- `useWhatsappConversationsViewModel.ts` (wraps inbox list/thread fetch; adds selection,
  composer state machine, recipients query/mutations, polling reuse)
- `ConversationListShared.tsx` (columns: contact, preview, time, account chip)
- `ComposerShared.tsx` (mode toggle text/template, textarea, template select, recipient
  picker, send button, window countdown hint)
- `TestRecipientsShared.tsx` (panel: table, add dialog, verify action with spinner,
  remove dialog)
- `TestNumberBanner.tsx` (info Alert + dashboard link)
- Desktop/mobile tier files under `frontend/desktop|mobile/views/dashboard/whatsapp/...`.

Permissions in UI: send/recipient controls render only with
`useUserStore.hasPermission(WhatsappConversationsManage)`.

Numbers settings page: `NumberCardContent` gets a `Test number` badge next to the meta
status chip (uses fragment `isTestNumber`).

## Role visibility matrix

| Role | Page | Nav | Compose | Registry |
|---|---|---|---|---|
| super_admin | ✓ | ✓ | ✓ | ✓ |
| academy_admin | ✓ | ✓ | ✓ | ✓ |
| staff_default | ✓ | ✓ | ✗ | read |
| supervisor_default | ✓ | ✓ | ✗ | read |
| others | ✗ | ✗ | ✗ | ✗ |

## States to cover

loading / empty (no accounts; no conversations), polling-safe composer state, test-number
banner, window-closed template nudge, send error mapping (localized), registry empty state
w/ "add recipient" CTA.
