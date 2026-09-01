# WhatsApp Webhook Handling

The endpoint at `app/api/webhooks/whatsapp/route.ts` is the single entry point for Meta's WhatsApp Cloud API: `GET` answers Meta's subscription verification handshake (rate-limited per IP, `hub.verify_token` compared with `crypto.timingSafeEqual`, numeric-only `hub.challenge` echoed back as plain text), while `POST` ingests asynchronous events. The POST path enforces a 1 MB body cap, fail-closed per-IP rate limiting, constant-time HMAC-SHA256 verification against `app_secret`, and a 24h replay nonce in the cache (duplicate bodies within the window get 409). After JSON parsing and rejecting any payload whose `object` is not `whatsapp_business_account`, the route strips inbound `value.messages[]` (user message content is never stored), acknowledges with 200 immediately, and defers real work through `after()` from `next/server`. `WhatsappWebhookHandler.processEvent` then fans changes out in parallel (`Promise.allSettled`, one failure doesn't block others) by field: `messages` statuses are validated and mapped to `NotificationDeliveryStatus` and upserted via `NotificationRepository.handleDeliveryWebhook` — with a batch event-type lookup (CLASS_REMINDER fallback), per-request recipient phone→user caching, and a forward-only rank guard for idempotency, template lifecycle events become audit-log entries, `phone_number_quality_update` / `business_capability_update` / `account_update` update `whatsappAccounts` through `WhatsappAccountService` (with a WABA-ID match check) and are audited. Key edge behaviors: signature/replay/rate-limit failures log only safe metadata (never bodies or raw headers), and deferred work dropped on serverless is recovered through Meta retries because the handler is idempotent.

## Key sources

- `app/api/webhooks/whatsapp/route.ts` — GET verification and POST ingestion (rate limit, HMAC, replay nonce, JSON validation, message stripping, `after()` deferral)
- `backend/services/whatsapp/whatsapp-webhook.handler.ts` — `WhatsappWebhookHandler.processEvent`, per-field dispatch, status mapping, phone-number/account update helpers
- `backend/db/repo/notifications/notification.repository.ts` — `getDeliveriesByProviderMessageIds`, `handleDeliveryWebhook` (upsert + forward-only rank guard)
- `backend/db/repo/users/user.repository.ts` — `findByPhone` recipient resolution
- `backend/services/whatsapp/whatsapp-account.service.ts` — `systemFindByPhoneNumberId`, `systemUpdateAccount`
- `backend/services/system/audit.service.ts` — `createManyAuditLogs` for template lifecycle and account/quality events
- `backend/lib/ratelimit` and `cacheService` (`@/backend/services/cache/CacheServiceFactory`) — fail-closed rate limiting and the 24h replay nonce

```mermaid
%% WhatsApp Webhook Handling — inbound validation, parsing, and dispatch into services
sequenceDiagram
    autonumber
    participant Meta as Meta Cloud API
    participant Route as Webhook Route (app/api/webhooks/whatsapp/route.ts)
    participant RL as Rate Limiter (checkRateLimit)
    participant Cache as CacheService (replay nonce)
    participant Handler as WhatsappWebhookHandler
    participant NotifRepo as NotificationRepository
    participant UserRepo as UserRepository
    participant WaSvc as WhatsappAccountService
    participant Audit as AuditService

    note over Meta,Route: GET — Meta webhook verification handshake
    Meta->>Route: GET with hub.mode, hub.verify_token, hub.challenge
    Route->>RL: checkRateLimit per IP (fail-closed)
    RL-->>Route: success or 429
    Route->>Route: safeEqual verify_token vs WHATSAPP_VERIFY_TOKEN
    alt token mismatch or invalid request
        Route-->>Meta: 403 (or 400 when challenge not numeric)
    else token matches
        Route-->>Meta: 200 text/plain hub.challenge
    end

    note over Meta,Route: POST — inbound event delivery
    Meta->>Route: POST webhook payload
    Route->>Route: reject content-length over 1 MB with 413
    Route->>RL: checkRateLimit per IP (fail-closed)
    RL-->>Route: success or 429
    Route->>Route: read raw body, re-check size else 413
    Route->>Route: HMAC-SHA256 safeEqual vs WHATSAPP_APP_SECRET else 401
    Route->>Cache: setNX replay key sha256 of body, 24h TTL
    Cache-->>Route: claimed, else 409 on replay or cache error (fail-closed)
    Route->>Route: JSON parse else 400, object must be whatsapp_business_account else 404
    Route->>Route: stripInboundMessages removes value.messages[] (S3)
    Route-->>Meta: 200 status ok
    note right of Route: processing deferred via after() from next/server, best-effort on serverless — Meta retries plus an idempotent handler guarantee delivery

    Route->>Handler: processEvent(strippedBody)
    Handler->>Handler: dispatch each change by field via Promise.allSettled, one failure does not stop others

    alt field is messages (delivery statuses)
        Handler->>NotifRepo: getDeliveriesByProviderMessageIds (batched event types, fallback CLASS_REMINDER)
        loop each status update
            Handler->>Handler: validate wamid and recipient_id, mapStatus to NotificationDeliveryStatus
            Handler->>UserRepo: findByPhone recipientId (cached per request)
            Handler->>NotifRepo: handleDeliveryWebhook upsert by providerMessageId with B3 forward-only rank guard and sanitized failureReason
        end
    else field is template lifecycle (status / category / quality / components update)
        Handler->>Audit: createManyAuditLogs SYSTEM actor on WHATSAPP_ACCOUNT, action STATUS_CHANGE
    else field is phone_number_quality_update or business_capability_update
        Handler->>WaSvc: systemFindByPhoneNumberId, reject on webhook-WABA mismatch
        Handler->>WaSvc: systemUpdateAccount throughputLevel / qualityRating / limit tier
        Handler->>Audit: createManyAuditLogs UPDATE (written in parallel)
    else field is account_update
        Handler->>WaSvc: systemFindByPhoneNumberId then systemUpdateAccount lastWebhookAt
        Handler->>Audit: createManyAuditLogs verification change
    else unknown field
        Handler->>Handler: log debug and skip
    end
```

Machine-checkable copy: [whatsapp-webhook-ingestion.mmd](./whatsapp-webhook-ingestion.mmd)
