# Tasks 6 — Test-number recipients UX

- [ ] 6.0 Regression baseline: re-run the existing badge + settings + conversations test
  slices (`test/ui/components/whatsapp/whatsappMobileParity.test.tsx`,
  `whatsappNumberCardPurposeSync.test.tsx`, `useWhatsappSettingsViewModel.test.tsx`,
  plus `test/ui/components/whatsapp-conversations/*`) to confirm current green state
  BEFORE edits. Note any pre-existing failures in the outcome.

- [x] 6.1 i18n (en/ar/types): add the keys from design-06 to `whatsappConversations`
  namespace; `bun run locale:snapshots`; verify dist JSONs carry the new keys.

- [ ] 6.2 PhoneInput adoption:
  - `TestRecipientsPanel` add dialog: swap free-text phone TextField → shared PhoneInput
    (country picker + prefix/national split); the submit handler normalizes via the phone
    lib helper; disabled-until-valid per specs-5 #2/#3.
  - `ComposerShared` non-test free-text recipient field → PhoneInput as well
    (E.164 conversion + same normalization).
  - Tests updated: existing testRecipientsPanel + composer tests use phone input UI
    semantics (fill national digits + pick prefix) — check how
    `createUser` forms use it: `PhoneInputShared`/`usePhoneInput`.

- [ ] 6.3 New-conversation initiation on `/whatsapp`:
  - VM: new `startNewConversation()` mode state; template-locked composer for test accounts
    targeting a chosen or typed recipient; on send success select the new conversation and
    refetch the list.
  - WorkspaceShared/header: translate "New conversation" action (icon + label).
  - Composer: in `new conversation` mode, Text disabled with translated hint
    (template-required); registry recipients picker for test accounts, PhoneInput for
    normal accounts.
  - Service: add a service-level test asserting conversation auto-creation for
    conversationId=null with a brand-new recipient (template mode).

- [x] 6.4 Settings card manage affordance:
  - Numbers tab cards (desktop + mobile leaves) expose an icon button (e.g. PersonAddAlt1)
    for test-number cards only; opens `TestRecipientsManageDialog` (AppDialog-style)
    rendering the shared recipients content for that account.
  - Wire accountId → dialog; reload/parent refresh handled by the dialog's internal
    query usage.
  - Add a per-card component test covering the dialog open + add/remove/verify flows.

- [ ] 6.5 Component tests: update + new tests for PhoneInput consumers, new-conversation
  flow, settings dialog; `test/ui/components/whatsapp-conversations/` +
  `test/ui/components/whatsapp/` as applicable.

- [ ] 6.6 Stories: update `WhatsappConversationsContainer.stories.tsx` + a settings-card
  story on NumberCard panel that MCs showcase the manage action.

- [ ] 6.7 Verification: run all whatsapp-related suites + `bun run test:ui:components`
  whatsapp dirs; write `outcome/6.x` files and tick tasks.
