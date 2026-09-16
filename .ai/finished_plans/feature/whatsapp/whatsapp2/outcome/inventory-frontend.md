# Frontend / UI WhatsApp v1 Inventory (for whatsapp2 planning)

Source: automated read-only exploration on 2026-09-04. Canonical UI reference: `docs/frontend/whatsapp-ui-patterns.md`.

## 1. File tree

- Route: `app/(dashboard)/settings/whatsapp/` — `page.tsx` (server, `withPageAuth([WHATSAPP_VIEW])` → `WhatsappSettingsContainer`), `loading.tsx`, `error.tsx`.
- Common: `frontend/common/views/dashboard/settings/whatsapp/`
  - `WhatsappSettingsContainer.tsx` — thin, spreads ViewModel onto view
  - `useWhatsappSettingsViewModel.ts` (767L) — composed sub-hooks: queries, mutations, dialogs, snackbar, create/update/delete handlers, labels, refetchers → `buildWhatsappViewModel`
  - `WhatsappConfigView.tsx` — `WhatsappConfigTab = "numbers" | "templates" | "optin"`; lazy shell + TabNav + TabPanels
  - `whatsappTabUrl.ts` — `?tab=` URL sync (validated against TAB_IDS)
  - `whatsappConfig.constants.ts` — `TAB_IDS`, `TAB_LABELS`, `TAB_PERMISSIONS` (per-tab permission map)
  - `WhatsappTabNav.tsx`, `WhatsappTabPanels.tsx` (lazy per tab × mobile/desktop, `RequirePermission`, Suspense, tab fade animation)
  - `types/whatsappSettingsTypes.ts`, `whatsappFormValidation.ts` (5 pure validators), label helpers (quality/tier/throughput/template-status), `whatsappStatusBadge.tsx` (reuses `syncStatus` StatusBadge category)
  - Dialogs: `createAccountDialog/`, `editNameDialog/`, `dialogs/DialogSaveCancelActions.tsx`
  - Tab content: `tabs/shared/{NumberCard, NumberCardContent, OptInTabContent, TemplatesTabContent}` (NumberCard already renders COEXISTENCE warning Alert + UNTIERED alert), `tabs/__shared__/*` scaffolds, `tabs/whatsappTabSharedProps.ts` (per-tab prop contracts — the extension point)
- Desktop: `frontend/desktop/views/dashboard/settings/whatsapp/` — shell + 3 tab files
- Mobile: `frontend/mobile/views/dashboard/settings/whatsapp/` — same structure, full parity (`MobileCardList`, fullscreen dialogs)
- GraphQL: `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts`
- i18n: `shared/locale/{types,en,ar}/whatsapp/index.ts` + `shared/locale/namespaces/whatsapp/` (nav label lives in `dashboard/core/nav`)

## 2. Tab structure & mechanics

Tabs: numbers → templates → optin; URL-synced via `?tab=`; switching = navigation (remount). Each tab lazy-loaded twice (mobile + desktop), shared content components hold cross-platform body. Desktop `NumberCardContent` has `extraMetadata` slot (wabaId/phoneNumberId desktop-only).

## 3. GraphQL per tab (all via one ViewModel)

- Numbers: `whatsappAccountsQueryDocument` (fragment `WhatsappAccountFields`), create/update/delete account, setAccessToken, setTwoStepPin, `syncWhatsappAccountsFromMetaMutationDocument` (returns accounts + transient templates snapshot)
- Templates: only data source = the sync mutation's transient snapshot (no `whatsappTemplates` query; commented-out stub)
- Opt-in: `isUserWhatsappOptInQueryDocument`, `setUserWhatsappOptInMutationDocument`
- Opt-in history & admin user list are hardcoded placeholder arrays (`WhatsappTabPanels.tsx:163-172`)

## 4. i18n

Namespace `whatsapp.whatsapp`, `WhatsappLabels` type strict-matched in en+ar (~120 keys). Coexistence keys already exist: `throughputCoexistence`, `coexistenceWarningTitle/Body`, `warningCoexistence`, `unverifiedWarningTitle/Body`, `warningTierExceeded`, `throughputUnknown`. New tab needs new label key; consider whether inbox needs its own sub-namespace.

## 5. Permissions

- Enum `backend/enum/permissions/permission.enum.ts:273-275`: `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`, `WHATSAPP_TEMPLATES_MANAGE`. No inbox/dispatch permission.
- Page: `withPageAuth([WHATSAPP_VIEW])`; nav item `whatsapp-settings` under `grp_integrations` (`navigationConfig.ts:709-716`); `PAGE_PERMISSIONS.whatsappSettings` (`page-permissions.types.ts:111`).
- Per-tab: `TAB_PERMISSIONS` (numbers→CONFIG_MANAGE, templates→TEMPLATES_MANAGE, optin→VIEW), client-enforced via `RequirePermission` in `WhatsappTabPanels`.

## 6. Gaps for whatsapp2

**(a) Per-number purpose/routing UI**
- No purpose/role field anywhere: extend schema column → `WhatsappAccountFields` fragment → Create/Edit dialogs (+ validator) → NumberCard chip. Backend routing must land first.
- Natural extension points identified: `whatsappConfig.constants.ts`, `whatsappTabSharedProps.ts`, `whatsappFormValidation.ts`.

**(b) Coexistence onboarding status**
- Display primitives exist (COEXISTENCE badge via throughputLevel) but nothing shows onboarding journey state (embedded-signup progress, sync completion %, last-sync). Needs schema columns for onboarding state + StatusBadge config + NumberCard surface.

**(c) Inbound inbox tab**
- Biggest delta; today inbound is destroyed at the webhook. New tab is pattern-locked: extend `WhatsappConfigTab`, TAB_IDS/LABELS/PERMISSIONS, lazy views, `tabs/shared/InboxTabContent.tsx` + desktop/mobile files, new i18n keys, own ViewModel if it outgrows the settings VM.
- Inbox list must follow `frontend/COMPONENT_PATTERNS.md`: AppDataGrid (+paginationOptions) / MobileCardList, PageContainer/PageHeader, StatusBadge, theme-token colors.
- Needs new permission (e.g. `WHATSAPP_INBOX_VIEW`) following the 3-permission precedents — new enum value requires DB enum migration (AppPermission TS enum must match DB enum gotcha).

## 7. Latent v1 gaps (pre-existing, relevant)

- Templates query + opt-in audit resolvers unimplemented (placeholder arrays).
- `docs/services/whatsapp-cloud-api.md` r3 review notes 2 HIGH issues as open but current code has fixed both (SELECT FOR UPDATE + channel/userId/eventType now passed). Treat doc table as stale.
