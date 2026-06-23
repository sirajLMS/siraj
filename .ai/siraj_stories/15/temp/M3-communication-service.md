# M3 — Communication Service Analysis

## Current Architecture (from Story 14 Plan)

### CommunicationService Interface (`task-c-services.md`)

The Story 14 plan defines a channel-dispatch pattern:

```typescript
export interface CommunicationPayload {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: "on_app" | "email";  // Service-level discriminator
  readonly eventType: NotificationEventType;
}

export namespace CommunicationService {
  export async function dispatch(payload: CommunicationPayload, locale?: string): Promise<void>;
}
```

**Key observations:**
- `channel` is a **string literal union** (`"on_app" | "email"`), NOT the DB enum `NotificationChannel`
- The `dispatch()` function routes to channel implementations via a `switch` statement
- Uses `never` exhaustive check for compile-time safety
- Errors are logged and re-thrown

### Current Channel Implementations

#### OnAppChannel (Story 14 plan)
- Creates a `notificationDeliveries` record via `NotificationRepository.createDelivery()`
- Maps service-level `"on_app"` to `NotificationChannel.ON_APP` (which doesn't exist in the enum yet!)
- Sets `status=PENDING` by default

#### EmailChannel (Story 14 — STUB)
- **Does NOT send actual emails**
- Logs a `warn`-level message: `"Email channel stubbed — no email sent"`
- Returns `void`
- The caller is responsible for setting `emailSent`/`emailSentAt` on the entity

---

## Story 15 Required Changes

### 1. Expand CommunicationPayload Channel Union

The `channel` type must expand from `"on_app" | "email"` to include SMS and Push:

```typescript
export interface CommunicationPayload {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: "on_app" | "email" | "sms" | "push";  // Expanded
  readonly eventType: NotificationEventType;
  readonly metadata?: Record<string, unknown>;  // For channel-specific data (e.g., phone number, device tokens)
}
```

### 2. EmailChannel — Replace Stub with Resend

**Package:** `resend` (npm)

**Implementation requirements:**
- Initialize Resend client with `RESEND_API_KEY` env var
- Send email using `resend.emails.send()` with `from: RESEND_FROM_EMAIL`
- Create a `notificationDeliveries` record BEFORE sending (status=PENDING)
- Update delivery status to SENT on success, FAILED on error
- Store `providerMessageId` (Resend message ID) on the delivery record
- Store `failureReason` on failure

**Email templates needed:**

| Template | Event | Recipient |
|----------|-------|-----------|
| Complaint Response Notification | `COMPLAINT_RESPONSE` | Parent who submitted the complaint |
| Suggestion Acknowledgment | `SUGGESTION_ACKNOWLEDGED` | Parent who submitted the suggestion |

**Template approach:** Use Resend's React Email or simple HTML templates. Consider:
- Subject line with complaint/suggestion reference
- Body with response text or acknowledgment message
- i18n support via `getBackendTranslations`
- Link back to the complaint/suggestion in the LMS

**Key change to caller flow:**
- Currently, `ComplaintService.respondToComplaint()` sets `emailSent: true` optimistically
- After Story 15, `emailSent` should only be `true` AFTER successful Resend delivery
- The `EmailChannel.send()` should return `{ success: boolean, providerMessageId?: string, error?: string }`

### 3. SmsChannel — New Implementation (Twilio)

**Package:** `twilio` (npm)

**Implementation requirements:**
- Initialize Twilio client with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- Send SMS using `client.messages.create()` with `from: TWILIO_FROM_NUMBER`
- Resolve parent phone number from user/parent profile
- Create `notificationDeliveries` record (channel=SMS)
- Update delivery status based on Twilio response
- Store `providerMessageId` (Twilio message SID)

**SMS templates needed:**

| Template | Event | Recipient | Condition |
|----------|-------|-----------|-----------|
| Urgent Complaint Response | `COMPLAINT_RESPONSE` | Parent | Only for urgent/high-priority complaints |

**Rate limiting:**
- Max 3 SMS per parent per hour (configurable via `sms_rate_limit_per_hour` system setting)
- Implementation: Check `notificationDeliveries` count for user+SMS channel in the last hour
- If rate limit exceeded, log warning and skip SMS (don't fail the overall operation)

**Phone number resolution:**
- Parents table must have a phone number field — need to verify this exists
- If no phone number on file, skip SMS delivery and log warning

### 4. PushChannel — New Implementation (FCM)

**Package:** `firebase-admin` (npm)

**Implementation requirements:**
- Initialize Firebase Admin SDK with `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- Use `admin.messaging().sendMulticast()` for batch sending
- Resolve active device tokens via `NotificationRepository.getActiveDeviceTokensForUser(userId)`
- Create `notificationDeliveries` record per device token (channel=PUSH, with `deviceTokenId`)
- Handle token expiration: deactivate invalid tokens via `NotificationRepository.deactivateDeviceToken()`

**Push notification payloads:**

| Event | Title | Body | Data |
|-------|-------|------|------|
| `COMPLAINT_RESPONSE` | "Complaint Response" | Response preview | `{ type: "complaint_response", complaintId }` |
| `SUGGESTION_ACKNOWLEDGED` | "Suggestion Reviewed" | Acknowledgment preview | `{ type: "suggestion_ack", suggestionId }` |

**Token refresh handling:**
- FCM returns error codes for invalid/expired tokens
- On `messaging/registration-token-not-registered` error, deactivate the token
- On `messaging/invalid-argument`, log error and deactivate

### 5. CommunicationService.dispatch() Updates

The `dispatch()` switch statement must expand:

```typescript
switch (payload.channel) {
  case "on_app":
    await OnAppChannel.send(payload, locale);
    break;
  case "email":
    await EmailChannel.send(payload, locale);
    break;
  case "sms":
    await SmsChannel.send(payload, locale);
    break;
  case "push":
    await PushChannel.send(payload, locale);
    break;
  default: {
    const exhaustiveCheck: never = payload.channel;
    logger.error("Unknown communication channel", { channel: exhaustiveCheck });
    break;
  }
}
```

### 6. Multi-Channel Dispatch Pattern

For events that require multiple channels (e.g., complaint response = on_app + email + SMS for urgent), the service layer needs a **fan-out** pattern:

```typescript
export async function dispatchMulti(
  payloads: CommunicationPayload[],
  locale?: string
): Promise<void> {
  const results = await Promise.allSettled(
    payloads.map(p => dispatch(p, locale))
  );
  
  const failures = results.filter(r => r.status === "rejected");
  if (failures.length > 0) {
    logger.error("Multi-channel dispatch had failures", { 
      failureCount: failures.length,
      totalChannels: payloads.length 
    });
  }
}
```

**Important:** Failures in one channel should NOT block other channels. Use `Promise.allSettled()`.

---

## Existing Notification Patterns

### NotificationAlertsService (`notification-alerts.service.ts`)

- Aggregates unanswered complaints + recent notification deliveries
- Returns a merged `SystemAlert[]` sorted by `createdAt`
- Uses `notification.view_alerts` permission
- **Directly queries DB** (imports from `drizzle-orm` and schema) — violates the service-layer rule but exists as-is
- This service is READ-ONLY and doesn't dispatch notifications

### Key observation for Story 15:
The alerts service should also surface new suggestion-related events (e.g., new suggestions pending review).

---

## Delivery Tracking Integration

All channel implementations must integrate with `notificationDeliveries`:

| Step | Action | Status |
|------|--------|--------|
| 1 | Create delivery record | `PENDING` |
| 2 | Call provider API | — |
| 3a | On success | Update to `SENT`, store `providerMessageId` |
| 3b | On failure | Update to `FAILED`, store `failureReason` |
| 4 | Webhook callback (async) | Update to `DELIVERED` or `OPENED` |

The existing `NotificationRepository` already supports this lifecycle:
- `createDelivery()` — Step 1
- `updateDeliveryStatus()` — Steps 3a, 3b, 4
- `handleDeliveryWebhook()` — Step 4 (for async provider callbacks)

---

## File Structure

```
backend/services/communication/
├── communication.service.ts      # dispatch() + dispatchMulti()
├── channels/
│   ├── on-app.channel.ts         # Existing (Story 14)
│   ├── email.channel.ts          # Replace stub with Resend
│   ├── sms.channel.ts            # NEW — Twilio
│   └── push.channel.ts           # NEW — FCM
├── complaint.service.ts          # Existing (Story 14) — update email flow
├── suggestion.service.ts         # Existing (Story 14) — extend with review/respond/duplicate
└── templates/                    # NEW — Email/SMS template helpers
    ├── email-templates.ts
    └── sms-templates.ts
```

---

## Environment Variables Required

| Variable | Channel | Required |
|----------|---------|----------|
| `RESEND_API_KEY` | Email | Yes |
| `RESEND_FROM_EMAIL` | Email | Yes |
| `TWILIO_ACCOUNT_SID` | SMS | Yes |
| `TWILIO_AUTH_TOKEN` | SMS | Yes |
| `TWILIO_FROM_NUMBER` | SMS | Yes |
| `FIREBASE_PROJECT_ID` | Push | Yes |
| `FIREBASE_PRIVATE_KEY` | Push | Yes |
| `FIREBASE_CLIENT_EMAIL` | Push | Yes |
