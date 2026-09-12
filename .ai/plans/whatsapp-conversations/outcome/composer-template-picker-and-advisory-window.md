# Outcome — Composer Template Picker + Advisory Window

**Date:** 2026-09-12
**Scope:** Post-implementation patch on the WhatsApp conversations send surface.

## What changed

- New GraphQL query `whatsappAccountTemplates(accountId)` (permission
  `whatsapp.conversations_view`) lists the account's WABA message templates **live from Meta**
  using the per-account token.
- `collectAllTemplates`, `messageTemplateListSchema`, and `buildTemplateSnapshot` were rehomed
  from `whatsapp-account.service.ts` into
  `backend/services/communication/channels/whatsapp/cloud-api/requests/` (shared).
- `WhatsappTemplateSnapshot` gained nullable `bodyText` + `bodyParamsCount` (count of `{{n}}`
  placeholders in the BODY component), exposed via Pothos.
- `WhatsappConversationsService.sendMessage`: the local `lastInboundMessageAt` 24h pre-block
  was **removed** — the window check is now advisory/meta-authoritative. Rationale: inbound
  webhooks don't reach local dev, so the DB window state is blind while Meta's is authoritative.
- Meta send error mapping updated: `131047` and `132047` → `WHATSAPP_OUTSIDE_SERVICE_WINDOW`;
  `132000` → new `WHATSAPP_TEMPLATE_PARAMS_MISMATCH` ("template requires variables — not
  supported yet"); `131030` → `WHATSAPP_RECIPIENT_NOT_ALLOWED` (unchanged).
- Composer UI (parallel agent): template name becomes an Autocomplete fed by the new query
  (APPROVED only); selection auto-fills the language code; parameter-bearing templates are
  disabled with a "requires variables" note; free text stays possible via freeSolo; text mode
  is no longer locally window-blocked/locked (initiation still defaults to template mode).

## Verification evidence (live, via scratch scripts with `.env`)

1. `GET /{waba}/message_templates` returned **5 APPROVED templates**.
2. `POST` text message to an allowlisted test recipient → **HTTP 200** (with DB window null).
3. Parameterized template sent without params → Meta error **132000** (maps to the new
   params-mismatch error).

## Files touched (summary)

- Backend: new/extended request helpers under
  `backend/services/communication/channels/whatsapp/cloud-api/requests/`; Pothos conversations
  query + `WhatsappTemplateSnapshot` fields; `whatsapp-conversations.service.ts` send path;
  types/enum additions (`WHATSAPP_TEMPLATE_PARAMS_MISMATCH`) + i18n keys.
- Frontend: conversations composer (Autocomplete template picker, advisory window hints);
  `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts`
  doc comment amended to reference the new query.
- Docs: `docs/services/whatsapp-cloud-api.md` (snapshot fields); plan design files
  `design-01-architecture.md`, `design-03-backend.md` (Post-implementation patch sections).

## Deferred items

- Parameterized template variable entry — picker disables them; Meta `132000` is mapped, but
  variable input UI is not implemented. See deferred-items.md D8.
- Settings templates tab still reads the sync-snapshot cache only — could adopt
  `whatsappAccountTemplates` later. See deferred-items.md D9.
- Media/interactive composer message types not supported. See deferred-items.md D10.
