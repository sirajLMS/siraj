# WhatsApp Integration — Trackable Tasks

## Document Information

- **Feature Name**: WhatsApp Business Cloud API (Meta direct)
- **Version**: 1.0
- **Date**: 2026-07-30
- **Related Documents**:
  - [Requirements (Specs)](./specs.md)
  - [Implementation Guide](./implementation.md)

## Task Status Legend

| Marker | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[-]` | In progress |
| `[x]` | Completed |

**Rules:**
- Mark a parent task `[-]` when any sub-task is in progress
- Mark a parent task `[x]` only when ALL sub-tasks are `[x]`
- Update this file as you work — single source of truth for execution progress
- Reference requirements as `REQ-N` from [specs.md](./specs.md)

---

## Phase 1: Channel Foundations

- [ ] **1. Enum and type extensions (REQ-1)**
  - [ ] 1.1 Edit `backend/types/notifications/communications.types.ts` — add `"whatsapp"` to `CommunicationChannelType`
  - [ ] 1.2 Edit `backend/enum/notifications/notificationDeliveries.enum.ts` — `WHATSAPP = "WHATSAPP"`
  - [ ] 1.3 Edit `backend/db/schema/enums.ts` — Drizzle `notificationChannel` enum value
  - [ ] 1.4 Edit `backend/graphql/pothos/shared/enum.pothos.ts` — register `NotificationChannel.WHATSAPP`
  - [ ] 1.5 Run `bun run generate:gqlSchema && bun codegen`
  - [ ] 1.6 Verify `CommunicationService.dispatch` fails tsgo until `case "whatsapp"` added

- [ ] **2. Env-config registry (REQ-3)**
  - [ ] 2.1 Edit `backend/lib/env-config-keys.ts` — `whatsapp` category with 6 keys
  - [ ] 2.2 Edit `backend/types/shared/env-config.types.ts` — `whatsapp` in `EnvConfigCategory`
  - [ ] 2.3 Per-file verification on env-config files

- [ ] **3. WhatsApp channel interface and factory**
  - [ ] 3.1 Create `backend/services/communication/channels/whatsapp/IWhatsappChannel.ts`
  - [ ] 3.2 Create `backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts`
  - [ ] 3.3 Create `backend/services/communication/channels/whatsapp/index.ts`
  - [ ] 3.4 Per-file verification

- [ ] **4. Typed Graph API request builders (REQ-2, REQ-9)**
  - [ ] 4.1 Create `cloud-api/meta-cloud-api.types.ts` + shared `buildGraphUrl` / auth header helpers
  - [ ] 4.2 Create `send-text-message.request.ts`
  - [ ] 4.3 Create `send-template-message.request.ts`
  - [ ] 4.4 Create `list-phone-numbers.request.ts`
  - [ ] 4.5 Create `get-phone-number.request.ts`
  - [ ] 4.6 Create `register-phone-number.request.ts`
  - [ ] 4.7 Create `deregister-phone-number.request.ts`
  - [ ] 4.8 Create `request-verification-code.request.ts`
  - [ ] 4.9 Create `verify-phone-number.request.ts`
  - [ ] 4.10 Create `list-message-templates.request.ts`
  - [ ] 4.11 Create `create-message-template.request.ts`
  - [ ] 4.12 Create `delete-message-template.request.ts`
  - [ ] 4.13 Per-file verification on all request builders

- [ ] **5. MetaCloudApiAdapter (REQ-2, R5 pair rate limit)**
  - [ ] 5.1 Create `cloud-api/MetaCloudApiAdapter.ts` — send text/template, pair-rate guard, delivery lifecycle
  - [ ] 5.2 Create `cloud-api/index.ts`
  - [ ] 5.3 Per-file verification on adapter

- [ ] **6. Notification dispatch wiring (REQ-1)**
  - [ ] 6.1 Edit `notification-dispatch.helpers.ts` — allowlist + `recipientAddressForChannel`
  - [ ] 6.2 Edit `notification-payloads.builders.ts` — `ALL_CHANNELS` + `CHANNEL_FROM_ENUM`
  - [ ] 6.3 Edit `communication.service.ts` — `case "whatsapp"`
  - [ ] 6.4 Per-file verification on dispatch files

---

## Phase 2: Accounts Backend

- [ ] **7. Database schema (REQ-3, R2/R3/R8)**
  - [ ] 7.1 Create `backend/db/schema/whatsapp/whatsapp-accounts.ts` — `portfolioMessagingLimitTier`, `throughputLevel`
  - [ ] 7.2 Create `backend/db/schema/whatsapp/index.ts`
  - [ ] 7.3 Edit `backend/db/schema/index.ts` — barrel export
  - [ ] 7.4 Author migration via `drizzle-generate` skill
  - [ ] 7.5 Run `bun run db push` and verify

- [ ] **8. Backend types and repository (REQ-3, REQ-8)**
  - [ ] 8.1 Create `backend/types/whatsapp/whatsapp-account.types.ts`
  - [ ] 8.2 Create `backend/types/whatsapp/index.ts`
  - [ ] 8.3 Create `backend/db/repo/whatsapp/whatsapp-account.repository.ts`
  - [ ] 8.4 Create `backend/db/repo/whatsapp/index.ts`
  - [ ] 8.5 Per-file verification on types + repo

- [ ] **9. WhatsApp account service (REQ-4)**
  - [ ] 9.1 Create `backend/services/whatsapp/whatsapp-account.service.ts` — CRUD, syncFromMeta, setToken/PIN
  - [ ] 9.2 Create `backend/services/whatsapp/index.ts`
  - [ ] 9.3 Edit `backend/types/audit/audit.types.ts` — `WHATSAPP_ACCOUNT`
  - [ ] 9.4 Per-file verification on service

- [ ] **10. Permissions migration (REQ-6)**
  - [ ] 10.1 Edit `backend/enum/permissions/permission.enum.ts` — four `WHATSAPP_*` permissions
  - [ ] 10.2 Create `backend/db/migration/8a-whatsapp-permissions-enum.sql`
  - [ ] 10.3 Create `backend/db/migration/8b-whatsapp-permissions-data.sql`
  - [ ] 10.4 Wire into `backend/drizzle/.custom-migrations.json`
  - [ ] 10.5 Apply migrations / `db push`

- [ ] **11. GraphQL layer (REQ-8)**
  - [ ] 11.1 Create `backend/graphql/pothos/whatsapp/whatsapp.pothos.ts`
  - [ ] 11.2 Create `backend/graphql/pothos/whatsapp/index.ts`
  - [ ] 11.3 Create `backend/graphql/mutation/whatsapp/whatsapp.mutation.ts`
  - [ ] 11.4 Create `backend/graphql/query/whatsapp/whatsapp.query.ts`
  - [ ] 11.5 Edit GraphQL index barrels (pothos, query, mutation)
  - [ ] 11.6 Run `bun run generate:gqlSchema && bun codegen`
  - [ ] 11.7 Per-file verification on GraphQL files

---

## Phase 3: Webhook Receiver

- [ ] **12. Webhook route (REQ-5)**
  - [ ] 12.1 Create `app/api/webhooks/whatsapp/route.ts` — GET verify + POST raw-body HMAC
  - [ ] 12.2 Per-file verification on route

- [ ] **13. Webhook handler (REQ-5, R1, R2, R6)**
  - [ ] 13.1 Create `backend/services/whatsapp/whatsapp-webhook.handler.ts`
  - [ ] 13.2 Status forward-only transitions on `notification_deliveries`
  - [ ] 13.3 Four template lifecycle events → audit log only
  - [ ] 13.4 `phone_number_quality_update` → `portfolioMessagingLimitTier`
  - [ ] 13.5 `business_capability_update` → account fields + audit
  - [ ] 13.6 Inbound `messages[]` no-op (200 ack, no persist)
  - [ ] 13.7 `queueMicrotask` deferral for DB writes
  - [ ] 13.8 Per-file verification on handler

---

## Phase 4: Admin Numbers Page

- [ ] **14. i18n (REQ-7, R7)**
  - [ ] 14.1 Create `shared/locale/types/whatsapp/index.ts`
  - [ ] 14.2 Create `shared/locale/en/whatsapp/index.ts`
  - [ ] 14.3 Create `shared/locale/ar/whatsapp/index.ts`
  - [ ] 14.4 Register namespace in `message.ts` and `server.ts`
  - [ ] 14.5 Add WhatsApp delivery-failure keys to `notifications` locale (types/en/ar)
  - [ ] 14.6 Coexistence + unverified slot warning strings (R7)

- [ ] **15. Frontend GraphQL documents**
  - [ ] 15.1 Create `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts`
  - [ ] 15.2 Run `bun codegen` if schema already generated in Phase 2

- [ ] **16. Store and ViewModel (REQ-4)**
  - [ ] 16.1 Create `frontend/common/stores/whatsappAccountsStore.ts`
  - [ ] 16.2 Create `useWhatsappAccountsViewModel.ts`
  - [ ] 16.3 Create `types/whatsappConfigTypes.ts` if needed

- [ ] **17. Tier-isolated views (REQ-4)**
  - [ ] 17.1 Create `WhatsappConfigView.tsx` — `ResponsiveViewSwitch`
  - [ ] 17.2 Create `whatsappConfig.desktop.tsx` + account card components
  - [ ] 17.3 Create `whatsappConfig.mobile.tsx` + account card components
  - [ ] 17.4 Wire settings navigation + `WHATSAPP_VIEW` permission gate
  - [ ] 17.5 Per-file verification on frontend files

---

## Phase 5: Tests

- [ ] **18. @live-comm integration tests (REQ-9)**
  - [ ] 18.1 `send-text-message.integration.test.ts`
  - [ ] 18.2 `send-template-message.integration.test.ts`
  - [ ] 18.3 `list-phone-numbers.integration.test.ts`
  - [ ] 18.4 `get-phone-number.integration.test.ts`
  - [ ] 18.5 `register-phone-number.integration.test.ts` (optional if test number allows)
  - [ ] 18.6 `deregister-phone-number.integration.test.ts` (optional)
  - [ ] 18.7 `request-verification-code.integration.test.ts` (optional)
  - [ ] 18.8 `verify-phone-number.integration.test.ts` (optional)
  - [ ] 18.9 `list-message-templates.integration.test.ts`
  - [ ] 18.10 `create-message-template.integration.test.ts` (optional — may skip in CI)
  - [ ] 18.11 `delete-message-template.integration.test.ts` (optional)
  - [ ] 18.12 `pair-rate-limit.integration.test.ts` — R5 guard behavior
  - [ ] 18.13 `whatsapp-api-call-coverage.test.ts` — builder ↔ test pairing guard
  - [ ] 18.14 Verify skip behavior when env creds missing

- [ ] **19. Unit tests**
  - [ ] 19.1 Create `whatsapp-channel.test.ts` — factory, validateConfig
  - [ ] 19.2 Create `whatsapp-webhook.handler.test.ts` — HMAC, forward-only, idempotency, inbound no-op
  - [ ] 19.3 Run via `bun run scripts/run-test/run-test.ts` where applicable

---

## Phase 6: Quality Gates

- [ ] **20. Final verification**
  - [ ] 20.1 All REQ acceptance criteria checked against [specs.md](./specs.md)
  - [ ] 20.2 Run `bun quality-gate:fresh`
  - [ ] 20.3 Fix tsgo / biome / lint / codescene / sonar failures
  - [ ] 20.4 Re-run quality gate until all stages pass
  - [ ] 20.5 Update Progress Summary below

---

## Blocker Log

| Date | Task | Blocker | Resolution | Status |
|------|------|---------|------------|--------|
| — | — | — | — | — |

_Add rows when blocked. Remove or mark resolved when unblocked._

---

## Progress Summary

| Phase | Parent Tasks | Completed | Status |
|-------|-------------|-----------|--------|
| 1. Channel Foundations | 6 | 0 | `[ ]` |
| 2. Accounts Backend | 5 | 0 | `[ ]` |
| 3. Webhook Receiver | 2 | 0 | `[ ]` |
| 4. Admin Numbers Page | 4 | 0 | `[ ]` |
| 5. Tests | 2 | 0 | `[ ]` |
| 6. Quality Gates | 1 | 0 | `[ ]` |
| **Total** | **20** | **0** | **0%** |

_Update the Progress Summary table as tasks are completed._

---

## Requirements Traceability

| Requirement | Primary tasks |
|-------------|---------------|
| REQ-1 Channel | 1, 6 |
| REQ-2 Send messages | 4, 5, 18 |
| REQ-3 Credentials | 2, 7, 8, 9 |
| REQ-4 Numbers admin | 9, 16, 17 |
| REQ-5 Webhooks | 12, 13, 19.2 |
| REQ-6 Permissions | 10 |
| REQ-7 i18n | 14 |
| REQ-8 GraphQL | 11, 15 |
| REQ-9 Integration tests | 4, 18 |
