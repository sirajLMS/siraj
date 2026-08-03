# Task 6 Outcome: Notification Dispatch Wiring (REQ-1, B1, REQ-10/BL1)

## Summary

Wired WhatsApp into the notification dispatch pipeline across three core files:
1. **`notification-dispatch.helpers.ts`** — event allowlist + recipient address resolution
2. **`notification-payloads.builders.ts`** — channel list, template map, payload stamping
3. **`communication.service.ts`** — dedicated `dispatchWhatsapp` branch + Q4 budget accounting

Plus supporting changes in:
- **`communications.types.ts`** — added `sendAttempted?` to `ChannelDispatchResult`
- **`shared/locale/{types,en,ar}/errors/index.ts`** — added `whatsappTemplateMissing` translation key

## Files Modified

| File | Changes |
|------|---------|
| `backend/services/notification/notification-dispatch.helpers.ts` | WHATSAPP added to 5 event allowlist entries; CLASS_REMINDER + INVOICE_GENERATED entries added (were missing); `ALL_ENUM_CHANNELS` no longer filters out WHATSAPP; `recipientAddressForChannel` returns `user.phone` for WHATSAPP |
| `backend/services/notification/notification-payloads.builders.ts` | WHATSAPP added to `ALL_CHANNELS`; exported `CHANNEL_FROM_ENUM`; exported `NOTIFICATION_TEMPLATE_MAP` (5 utility events); exported `DEFAULT_WHATSAPP_LANGUAGE_CODE`; `buildPerChannel` stamps `metadata.whatsappTemplate` on WhatsApp payloads; skips WhatsApp if no template in map |
| `backend/services/communication/communication.service.ts` | Imported `whatsappChannel` + `WhatsappTemplateComponent`; replaced WHATSAPP stub with `dispatchWhatsapp` function; `dispatchMulti` logs `whatsappBudgetConsumed` for Q4 budget accounting |
| `backend/types/notifications/communications.types.ts` | Added `sendAttempted?: boolean` to `ChannelDispatchResult` (Q4 budget tracking) |
| `shared/locale/types/errors/index.ts` | Added `whatsappTemplateMissing: string` to `ErrorsLabels` |
| `shared/locale/en/errors/index.ts` | English: `"WhatsApp template configuration is missing for this notification."` |
| `shared/locale/ar/errors/index.ts` | Arabic: `"تكوين قالب واتساب مفقود لهذا الإشعار."` |

## Architecture Decisions

### C2: Dedicated `dispatchWhatsapp` branch
WhatsApp has its own dispatch path — never routed through email/sms-shaped `dispatchRecipientChannel`. The `dispatchWhatsapp` function:
1. Extracts `whatsappTemplate` from `payload.metadata` (stamped by builders)
2. **Fails fast** with `whatsappTemplateMissing` error if template is absent (indicates misconfigured event — allowlisted for WhatsApp but no template in `NOTIFICATION_TEMPLATE_MAP`)
3. Constructs `WhatsappPayload` with `template: { name, languageCode }` from metadata
4. Builds `components` array from `paramsOrder` — each param maps to a `{ type: "body", parameters: [{ type: "text", text: value }] }` component
5. Calls `whatsappChannel.send(whatsappPayload, locale)`
6. Maps result to `ChannelDispatchResult` with `sendAttempted` propagation

### B1: `NOTIFICATION_TEMPLATE_MAP`
Per-event template registry in `notification-payloads.builders.ts`:
- `CLASS_REMINDER` → `class_reminder_utility_v1`
- `CLASS_ACTIVATED` → `class_activated_utility_v1`
- `LESSON_REPORT_SUBMITTED` → `lesson_report_submitted_utility_v1`
- `LESSON_REPORT_REVIEWED` → `lesson_report_reviewed_utility_v1`
- `INVOICE_GENERATED` → `invoice_generated_utility_v1`

Each entry has `{ templateName, paramsOrder }`. The `paramsOrder` array lists metadata keys that should be bound to template body components in order.

`buildPerChannel` stamps `metadata.whatsappTemplate = { name, languageCode, paramsOrder }` on WhatsApp payloads. If an event has no entry in the map, the WhatsApp payload is **skipped entirely** (no `continue` — just no payload generated).

### REQ-10/BL1: Opt-in gate
Builders are pure (no I/O) and **cannot** check per-user `whatsappEnabled`. The opt-in gate is applied **downstream** in `dispatchWithPreferences` → `dispatchForUser` via `NotificationPreferencesRepository.getByUserId()`. The dedicated `whatsappEnabled` column will be added in Task 29.

### Q4: Budget accounting
`dispatchMulti` now counts results where `channel === WHATSAPP && sendAttempted === true` and logs it as `whatsappBudgetConsumed`. This captures failed sends that still reached Meta's Graph API and consumed tier budget. The `sendAttempted` flag is set by `MetaCloudApiAdapter` on all paths where a Graph API call was actually made (Task 5).

### `ALL_ENUM_CHANNELS` fix
Previously filtered out WHATSAPP with `.filter(ch => ch !== NotificationChannel.WHATSAPP)`. Now returns all 5 channels. This is safe because:
- Events with explicit allowlist entries use the allowlist channels
- Events WITHOUT allowlist entries default to ALL channels
- BUT the `NOTIFICATION_TEMPLATE_MAP` in builders ensures only events with approved templates actually emit WhatsApp payloads (no template → skip)

### `CLASS_REMINDER` and `INVOICE_GENERATED` allowlist entries
These were **missing entirely** from `EVENT_CHANNEL_ALLOWLIST` (not just missing WhatsApp — missing as keys). Added new entries with WHATSAPP included alongside existing channels.

## Translation Key
`whatsappTemplateMissing` added to all three locale layers:
- **Type schema** (`shared/locale/types/errors/index.ts`): `readonly whatsappTemplateMissing: string`
- **English** (`shared/locale/en/errors/index.ts`): `"WhatsApp template configuration is missing for this notification."`
- **Arabic** (`shared/locale/ar/errors/index.ts`): `"تكوين قالب واتساب مفقود لهذا الإشعار."`

## Quality Verification

| Check | Result |
|-------|--------|
| `bun tsgo` | ✅ pass |
| `bun biome:check` | ✅ pass (fixed 1 file formatting) |
| `bun lint` (lint queue) | ✅ pass (all 7 modified files) |

## Deferred Items

- **`createManyDeliveries`**: Bulk delivery-row writes via `NotificationRepository.createManyDeliveries` — deferred to a future task where N-recipient fan-out occurs. Current dispatch uses per-send `createDelivery`.
- **`DEFAULT_WHATSAPP_LANGUAGE_CODE`**: Placeholder `"en"` — B6 mandates it be overridden from the synced template row's `language` column in a future task.
- **`whatsappEnabled` opt-in column**: Added in Task 29 (database schema). Currently the opt-in gate relies on `NotificationPreferencesRepository.getByUserId()`.
- **Template name → Meta approval sync**: The `NOTIFICATION_TEMPLATE_MAP` template names are placeholder conventions (`{event}_utility_v1`). The actual approved names from Meta Business Manager will be synced in a future task.
