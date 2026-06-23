# M4 — Notification Infrastructure Analysis

## NotificationRepository Methods (`notification.repository.ts`, 348 lines)

### Method Inventory

| # | Method | Signature | Purpose |
|---|--------|-----------|---------|
| 1 | `registerDeviceToken` | `(input: RegisterDeviceTokenInput, tx?) → UserDeviceTokenSelectType` | Upserts a device token (on conflict by token value, updates userId/platform/deviceName/isActive) |
| 2 | `deactivateDeviceToken` | `(userId, token, tx?) → UserDeviceTokenSelectType \| null` | Sets `isActive=false` for a specific user+token pair |
| 3 | `getActiveDeviceTokensForUser` | `(userId, tx?) → UserDeviceTokenSelectType[]` | Returns all active tokens for a user |
| 4 | `createDelivery` | `(input: CreateNotificationDeliveryInput, tx?) → NotificationDeliverySelectType` | Creates a delivery record with `status=PENDING` |
| 5 | `updateDeliveryStatus` | `(input: UpdateDeliveryStatusInput, tx?, locale?) → NotificationDeliverySelectType` | Updates status with transition validation, sets timestamps |
| 6 | `recordDeliveryOpened` | `(deliveryId, webhookPayload?, tx?, locale?) → NotificationDeliverySelectType` | Convenience wrapper for `updateDeliveryStatus(OPENED)` |
| 7 | `getDeliveryByProviderMessageId` | `(providerMessageId, tx?) → NotificationDeliverySelectType \| null` | Lookup by provider's message ID |
| 8 | `handleDeliveryWebhook` | `(input: DeliveryWebhookInput, tx?, locale?) → NotificationDeliverySelectType` | Processes provider webhook: finds delivery by providerMessageId, updates status |
| 9 | `getDeliveryAnalytics` | `(filters, tx?) → NotificationDeliveryAnalyticsResult` | Aggregates delivery stats: total, status counts, open rate, failure rate |

### Internal Helpers

| Helper | Purpose |
|--------|---------|
| `acquireDeviceTokenLock` | Advisory lock on device token operations per user |
| `acquireDeliveryLock` | Advisory lock on delivery status updates |
| `assertValidStatusTransition` | Validates PENDING→SENT→DELIVERED→OPENED progression; FAILED is terminal |
| `buildStatusTimestamps` | Maps status to the appropriate timestamp fields |

### Status Transition Rules

```
PENDING → SENT → DELIVERED → OPENED
Any state → FAILED (terminal, cannot transition out)
Same state → allowed (idempotent)
Backward transitions → rejected (e.g., DELIVERED → SENT)
```

---

## NotificationEventType Values

### Current Values (`shared/lib/enum.ts:132-137`)

```typescript
export enum NotificationEventType {
  CLASS_REMINDER = "CLASS_REMINDER",
  INVOICE_GENERATED = "INVOICE_GENERATED",
  COMPLAINT_RESPONSE = "COMPLAINT_RESPONSE",
  BANKING_DETAILS_CHANGED = "BANKING_DETAILS_CHANGED",
}
```

### New Values Needed for Story 15

| Value | Purpose | Triggered By |
|-------|---------|-------------|
| `NEW_COMPLAINT` | Notify admins of new complaint | `ComplaintService.submitComplaint()` |
| `NEW_SUGGESTION` | Notify admins of new suggestion | `SuggestionService.submitSuggestion()` |
| `SUGGESTION_ACKNOWLEDGED` | Notify parent their suggestion was reviewed | `SuggestionService.markSuggestionReviewed()` / `respondToSuggestion()` |
| `SUGGESTION_DUPLICATE_MARKED` | Notify parent their suggestion was marked duplicate | `SuggestionService.markAsDuplicate()` |

### Migration Impact

The `notification_event_type` PostgreSQL enum must be extended via `ALTER TYPE`:

```sql
ALTER TYPE notification_event_type ADD VALUE 'NEW_COMPLAINT';
ALTER TYPE notification_event_type ADD VALUE 'NEW_SUGGESTION';
ALTER TYPE notification_event_type ADD VALUE 'SUGGESTION_ACKNOWLEDGED';
ALTER TYPE notification_event_type ADD VALUE 'SUGGESTION_DUPLICATE_MARKED';
```

**Note:** `ALTER TYPE ADD VALUE` cannot run inside a transaction block in PostgreSQL. The migration must handle this appropriately (e.g., using `DO $$ ... $$` with exception handling or running outside a transaction).

---

## userDeviceTokens Analysis (`communications.ts:51-70`)

### Schema

```
id          uuid PK
userId      uuid FK→users (cascade)
token       varchar(512) NOT NULL UNIQUE
platform    device_platform enum NOT NULL
deviceName  varchar(255) nullable
isActive    boolean DEFAULT true
lastUsedAt  timestamp nullable
createdAt   timestamp NOT NULL
updatedAt   timestamp NOT NULL
```

### DevicePlatform Enum (`shared/lib/enum.ts:147-151`)

```typescript
export enum DevicePlatform {
  IOS = "IOS",
  ANDROID = "ANDROID",
  WEB = "WEB",
}
```

**Finding: WEB platform IS supported.** The `DevicePlatform` enum already includes `WEB`. This means:
- FCM web push tokens can be stored with `platform = "WEB"`
- iOS/Android native push tokens use their respective platform values
- The `registerDeviceToken` method accepts any `DevicePlatform` value
- No schema changes needed for push notification support

### Indexes
- `user_device_tokens_user_id_idx` on `userId`
- `user_device_tokens_token_unique_idx` on `token` (unique)

### Push Channel Integration Points

The `PushChannel` implementation will use:
1. `getActiveDeviceTokensForUser(userId)` — to get all active tokens
2. `registerDeviceToken()` — to register new tokens (upsert pattern)
3. `deactivateDeviceToken()` — to handle expired/invalid tokens from FCM responses

---

## userNotificationPreferences Analysis (`communications.ts:23-40`)

### Schema

```
id          uuid PK
userId      uuid FK→users (cascade)
channel     notification_channel enum NOT NULL
eventType   notification_event_type enum NOT NULL
enabled     boolean DEFAULT true
createdAt   timestamp NOT NULL
updatedAt   timestamp NOT NULL
```

### Unique Constraint
- `(userId, channel, eventType)` — one preference per user per channel per event type

### Opt-In/Opt-Out Capability

**Finding: The schema fully supports per-channel, per-event opt-in/opt-out.**

Each row represents a user's preference for a specific `(channel, eventType)` combination:
- `enabled = true` → user wants to receive this type of notification on this channel
- `enabled = false` → user has opted out

### Usage in Story 15

Before dispatching any notification, the channel implementations should check preferences:

```typescript
const preference = await NotificationRepository.getPreference(userId, channel, eventType);
if (preference && !preference.enabled) {
  logger.info("User opted out of notification", { userId, channel, eventType });
  return; // Skip delivery
}
```

**Missing repository method:** `NotificationRepository` does NOT currently have methods for:
- `getPreference(userId, channel, eventType)`
- `setPreference(userId, channel, eventType, enabled)`
- `getDefaultPreferences()` — for new users

These must be added to `NotificationRepository` for Story 15.

### Default Behavior

If no preference row exists for a `(userId, channel, eventType)` combination, the system should default to **enabled** (opt-out model). This is consistent with the `enabled: true` default on insert.

---

## NotificationDeliveries Analysis (`communications.ts:81-112`)

### Schema

```
id                  uuid PK
userId              uuid FK→users (cascade)
deviceTokenId       uuid FK→userDeviceTokens (set null) nullable
channel             notification_channel enum NOT NULL
eventType           notification_event_type enum NOT NULL
status              notification_delivery_status enum DEFAULT "PENDING"
title               varchar(255) nullable
body                text nullable
providerMessageId   varchar(255) nullable
failureReason       text nullable
webhookPayload      jsonb nullable
sentAt              timestamp nullable
deliveredAt         timestamp nullable
openedAt            timestamp nullable
failedAt            timestamp nullable
createdAt           timestamp NOT NULL
updatedAt           timestamp NOT NULL
```

### Indexes (6 total)
- `notification_deliveries_user_id_idx` on `userId`
- `notification_deliveries_status_idx` on `status`
- `notification_deliveries_event_type_idx` on `eventType`
- `notification_deliveries_channel_idx` on `channel`
- `notification_deliveries_created_at_idx` on `createdAt`
- `notification_deliveries_provider_message_id_idx` on `providerMessageId`

### Multi-Channel Delivery Support

The schema already supports multi-channel delivery:
- Each delivery is a separate row with its own `channel` value
- A single event (e.g., complaint response) creates multiple delivery rows (one per channel)
- `deviceTokenId` links push deliveries to specific device tokens
- `providerMessageId` tracks the external provider's message ID (Resend ID, Twilio SID, FCM message ID)

### What's Missing for Multi-Channel

1. **No batch creation method** — `createDelivery()` creates one row at a time. For multi-channel dispatch, need either:
   - A `createDeliveriesBatch()` method that inserts multiple rows in one transaction
   - Or call `createDelivery()` multiple times within a transaction

2. **No preference checking** — The repository doesn't check `userNotificationPreferences` before creating deliveries. This check should happen in the service layer (channel implementations) before calling `createDelivery()`.

3. **No SMS rate limiting** — No mechanism to check how many SMS deliveries were created for a user in the last hour. Need a query like:
   ```sql
   SELECT COUNT(*) FROM notification_deliveries 
   WHERE user_id = $1 AND channel = 'SMS' AND created_at > NOW() - INTERVAL '1 hour'
   ```

4. **No `ON_APP` channel value** — The `NotificationChannel` enum only has `EMAIL`, `SMS`, `PUSH`. The Story 14 plan references `ON_APP` but it hasn't been added. This must be added to the enum.

---

## NotificationChannel Enum Gap

### Current (`shared/lib/enum.ts:126-130`)

```typescript
export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
}
```

### Required

```typescript
export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
  ON_APP = "ON_APP",  // Needed for in-app notifications
}
```

This requires:
1. Adding `ON_APP` to the TypeScript enum
2. `ALTER TYPE notification_channel ADD VALUE 'ON_APP'` in migration
3. The `OnAppChannel` implementation from Story 14 already references `NotificationChannel.ON_APP`

---

## Required New Repository Methods

| Method | Purpose |
|--------|---------|
| `getPreference(userId, channel, eventType)` | Check user opt-in/opt-out before delivery |
| `setPreference(userId, channel, eventType, enabled)` | Update user preference |
| `createDeliveriesBatch(inputs[], tx?)` | Create multiple delivery records atomically |
| `getSmsCountInLastHour(userId, tx?)` | Rate limiting for SMS |
| `getDeliveriesByUser(userId, options)` | Paginated delivery history for user |
| `getDeliveriesByEvent(eventType, options)` | Admin view of deliveries by event type |

---

## Summary of Required Changes

| Category | Change | Priority |
|----------|--------|----------|
| Enum | Add `ON_APP` to `NotificationChannel` | Critical |
| Enum | Add 4 values to `NotificationEventType` | Critical |
| Migration | `ALTER TYPE` for both enums | Critical |
| Repository | Add preference CRUD methods | High |
| Repository | Add batch delivery creation | High |
| Repository | Add SMS rate limiting query | High |
| Repository | Add delivery listing queries | Medium |
| Schema | No changes to existing tables | — |
| Indexes | Existing indexes are sufficient | — |
