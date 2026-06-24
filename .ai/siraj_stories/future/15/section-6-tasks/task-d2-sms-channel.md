### Task D2 — SMS Channel (Twilio Provider)

**Objective:**
Implement the SMS communication channel using the codebase's established **Interface + Adapter + Factory + Singleton** pattern (mirroring `StorageService`, `CacheService`, `RedisService`). The SMS channel sends transactional text messages via the Twilio API, enforces per-user rate limiting (max SMS per hour), tracks delivery status in `notificationDeliveries`, and provides SMS text templates for urgent complaint response notifications. The factory manages a singleton adapter instance with race-condition prevention during initialization.

**Dependencies:**
- Depends on Task B2 (Notification Repository Extensions) — `NotificationRepository.createDelivery()`, `NotificationRepository.updateDeliveryStatus()`, and `NotificationRepository.getSmsCountInLastHour()` must already be in place for delivery tracking and SMS rate limiting.
- Depends on Task A (Migration/Schema/Enums) — `NotificationChannel.SMS`, `NotificationEventType.COMPLAINT_RESPONSE` must exist in `shared/lib/enum.ts`.
- Depends on Story 14 execution — the base `notificationDeliveries` table and `NotificationRepository` namespace with `createDelivery` and `updateDeliveryStatus` methods must already be in place.

**New Packages:**
- `twilio` (npm) — Twilio REST API client for Node.js

**Layer-Specific Rules (Backend Services — Flattened from backend/services/AGENTS.md):**
- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern. The SMS channel is scoped strictly to SMS delivery — no email, push, or other channel logic.
- **NO Monolithic Services**: Do not create a generic "NotificationSender" that handles all channels. Each channel is its own interface + adapter + factory.
- **Business Logic Hub**: Rate limiting logic (checking SMS count per hour) and delivery tracking reside in the adapter, not in the calling service.
- **i18n / Localized Error Messages**: All user-facing error messages must be translated using `getBackendTranslations`, optionally accepting a `locale?: string` parameter.
- **🚫 Services MUST NOT import from DB/Drizzle**: The adapter can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, or any Drizzle-related module is **strictly forbidden**.
- **Logger utility mandatory**: Use `import { logger } from '@/backend/lib/logger'`. Console methods are forbidden.
- **🚫 NO Local Entity Type Definitions**: Channel adapter files MUST NOT define local entity types. All entity types (like `NotificationDeliverySelectType`, `UserNotificationPreferenceSelectType`) MUST be imported from canonical `backend/types/` files.
- **Import canonical types**: Adapters MUST import types from `@/backend/types` — use `NotificationDeliverySelectType`, `NotificationDeliveryInsertType`, `SetNotificationPreferenceInput` etc. from their respective canonical files (e.g., `backend/types/notification-deliveries.types.ts`, `backend/types/user-notification-preferences.types.ts`).

**Target Files:**

| File | Action |
|------|--------|
| `backend/services/communication/channels/sms/ISmsChannel.ts` | NEW — interface + types |
| `backend/services/communication/channels/sms/SmsChannelFactory.ts` | NEW — factory + singleton |
| `backend/services/communication/channels/sms/twilio/TwilioSmsAdapter.ts` | NEW — Twilio adapter |
| `backend/services/communication/channels/sms/twilio/twilio.types.ts` | NEW — context types |
| `backend/services/communication/channels/sms/twilio/index.ts` | NEW — barrel export |
| `backend/services/communication/channels/sms/index.ts` | NEW — barrel export |
| `backend/services/communication/templates/sms-templates.ts` | NEW — template helpers |
| `environment.d.ts` | MODIFY — add env var declarations |

---

### Detailed Implementation Steps

#### Step 1 — Install the `twilio` Package

Run the following command to add the Twilio SDK:

```bash
bun add twilio
```

Verify the package is added to `package.json` dependencies.

---

#### Step 2 — Add Environment Variable Declarations to `environment.d.ts`

Open `environment.d.ts` and add the following declarations inside the `ProcessEnv` interface, after the Email Configuration section added in Task D1:

```typescript
      // SMS Configuration
      SMS_PROVIDER?: "twilio";
      TWILIO_ACCOUNT_SID?: string;
      TWILIO_AUTH_TOKEN?: string;
      TWILIO_FROM_NUMBER?: string;
```

These declarations provide TypeScript type safety for the environment variables used by the SMS channel factory and adapter.

---

#### Step 3 — Create the SMS Channel Interface (`ISmsChannel.ts`)

Create `backend/services/communication/channels/sms/ISmsChannel.ts`:

```typescript
import type { NotificationEventType } from "@/shared/lib/enum";

export interface SmsPayload {
  readonly to: string;
  readonly body: string;
  readonly eventType: NotificationEventType;
  readonly userId: string;
}

export interface SmsSendResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly error?: string;
  readonly rateLimited?: boolean;
}

export interface ISmsChannel {
  send(payload: SmsPayload, locale?: string): Promise<SmsSendResult>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export type SmsProvider = "twilio";
```

**Key implementation notes for `ISmsChannel.ts`:**
- `SmsPayload` is readonly — prevents mutation after construction. The `to` field is the recipient's phone number in E.164 format (e.g., `+966501234567`).
- `SmsSendResult` includes an additional `rateLimited` boolean field that is `true` when the send was blocked by the per-user rate limit. This allows the caller to distinguish between a rate-limited send (soft failure) and a provider error (hard failure).
- `ISmsChannel` defines three methods: `send()` for dispatching SMS messages, `validateConfig()` for checking API credentials, and `disconnect()` for cleanup.
- `SmsProvider` type is a union of supported providers — currently only `"twilio"`, but extensible for future providers (e.g., `"vonage"`, `"messagebird"`).
- The interface imports `NotificationEventType` from `shared/lib/enum` for type-safe event tagging.

---

#### Step 4 — Create Twilio Context Types (`twilio.types.ts`)

Create `backend/services/communication/channels/sms/twilio/twilio.types.ts`:

```typescript
import type Twilio from "twilio";

export interface TwilioSmsContext {
  readonly client: Twilio.Twilio;
  readonly fromNumber: string;
}

export interface TwilioMessageResponse {
  readonly sid: string;
  readonly status: string;
  readonly errorCode: number | null;
  readonly errorMessage: string | null;
}

export interface TwilioRateLimitConfig {
  readonly maxSmsPerHour: number;
}
```

**Key implementation notes for `twilio.types.ts`:**
- `TwilioSmsContext` holds the initialized Twilio REST client and the configured sender phone number.
- `TwilioMessageResponse` mirrors the shape of the Twilio Messages API response — `sid` is the unique message identifier, `status` indicates delivery state, `errorCode` and `errorMessage` contain failure details.
- `TwilioRateLimitConfig` holds the rate limit configuration — `maxSmsPerHour` is read from the `sms_rate_limit_per_hour` system setting (default: 3).
- These types are used internally by `TwilioSmsAdapter` to type-check API responses without relying on `any`.

---

#### Step 5 — Create the Twilio SMS Adapter (`TwilioSmsAdapter.ts`)

Create `backend/services/communication/channels/sms/twilio/TwilioSmsAdapter.ts`:

```typescript
import twilio from "twilio";
import { logger } from "@/backend/lib/logger";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { NotificationChannel, NotificationDeliveryStatus } from "@/shared/lib/enum";
import type { ISmsChannel, SmsPayload, SmsSendResult } from "../ISmsChannel";
import type { TwilioSmsContext, TwilioRateLimitConfig } from "./twilio.types";

const DEFAULT_SMS_RATE_LIMIT_PER_HOUR = 3;

export class TwilioSmsAdapter implements ISmsChannel {
  private readonly context: TwilioSmsContext;
  private readonly rateLimitConfig: TwilioRateLimitConfig;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid) {
      throw new Error("TWILIO_ACCOUNT_SID environment variable is required for TwilioSmsAdapter");
    }

    if (!authToken) {
      throw new Error("TWILIO_AUTH_TOKEN environment variable is required for TwilioSmsAdapter");
    }

    if (!fromNumber) {
      throw new Error("TWILIO_FROM_NUMBER environment variable is required for TwilioSmsAdapter");
    }

    this.context = {
      client: twilio(accountSid, authToken),
      fromNumber,
    };

    this.rateLimitConfig = {
      maxSmsPerHour: DEFAULT_SMS_RATE_LIMIT_PER_HOUR,
    };
  }

  async send(payload: SmsPayload, locale?: string): Promise<SmsSendResult> {
    const smsCount = await NotificationRepository.getSmsCountInLastHour(payload.userId);

    if (smsCount >= this.rateLimitConfig.maxSmsPerHour) {
      logger.warn("SMS rate limit exceeded for user", {
        userId: payload.userId,
        smsCount,
        maxPerHour: this.rateLimitConfig.maxSmsPerHour,
      });

      return {
        success: false,
        rateLimited: true,
        error: `SMS rate limit exceeded: ${smsCount}/${this.rateLimitConfig.maxSmsPerHour} in the last hour`,
      };
    }

    const delivery = await NotificationRepository.createDelivery({
      userId: payload.userId,
      channel: NotificationChannel.SMS,
      eventType: payload.eventType,
      title: "SMS",
      body: payload.to,
    });

    try {
      const message = await this.context.client.messages.create({
        to: payload.to,
        from: this.context.fromNumber,
        body: payload.body,
      });

      if (message.errorCode) {
        logger.error("Twilio API returned an error", {
          deliveryId: delivery.id,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
        });

        await NotificationRepository.updateDeliveryStatus({
          deliveryId: delivery.id,
          status: NotificationDeliveryStatus.FAILED,
          providerMessageId: message.sid,
          failureReason: message.errorMessage ?? `Twilio error code: ${message.errorCode}`,
        });

        return {
          success: false,
          providerMessageId: message.sid,
          error: message.errorMessage ?? `Twilio error code: ${message.errorCode}`,
        };
      }

      await NotificationRepository.updateDeliveryStatus({
        deliveryId: delivery.id,
        status: NotificationDeliveryStatus.SENT,
        providerMessageId: message.sid,
      });

      logger.info("SMS sent successfully via Twilio", {
        deliveryId: delivery.id,
        providerMessageId: message.sid,
      });

      return {
        success: true,
        providerMessageId: message.sid,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("Failed to send SMS via Twilio", {
        deliveryId: delivery.id,
        error: errorMessage,
      });

      await NotificationRepository.updateDeliveryStatus({
        deliveryId: delivery.id,
        status: NotificationDeliveryStatus.FAILED,
        failureReason: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Twilio configuration validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    logger.info("TwilioSmsAdapter disconnected");
  }
}
```

**Key implementation notes for `TwilioSmsAdapter`:**
- **Constructor validation**: Throws immediately if `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, or `TWILIO_FROM_NUMBER` is missing — fails fast at initialization.
- **Rate limiting**: Before creating a delivery record, checks `NotificationRepository.getSmsCountInLastHour(userId)` against the configured limit (default: 3 per hour). If the limit is reached, returns `{ success: false, rateLimited: true }` without creating a delivery record or calling the Twilio API.
- **Delivery tracking**: Creates a `notificationDeliveries` record with `status = PENDING` before calling the Twilio API. Updates to `SENT` on success or `FAILED` on error.
- **Error handling**: Catches both Twilio API errors (returned in `message.errorCode`/`message.errorMessage`) and network/transport errors (caught in `try/catch`). Both paths update the delivery status to `FAILED` with a `failureReason`.
- **No credential leakage**: Logger calls only include `deliveryId`, `providerMessageId`, `errorCode`, `errorMessage`, `userId`, and `smsCount` — never the account SID, auth token, or phone numbers in full.
- **`providerMessageId`**: Stores the Twilio message SID for future webhook correlation and delivery status tracking.
- **`validateConfig()`**: Checks that required environment variables are present. Does not make an API call to avoid unnecessary costs.
- **`disconnect()`**: No-op for Twilio (HTTP-based client, no persistent connection). Logs disconnection for observability.
- **Phone number resolution**: The `to` phone number is passed in the payload by the caller (who resolves it from the parent profile). The adapter does not perform phone number lookups.

---

#### Step 6 — Create the Twilio Barrel Export (`twilio/index.ts`)

Create `backend/services/communication/channels/sms/twilio/index.ts`:

```typescript
export { TwilioSmsAdapter } from "./TwilioSmsAdapter";
export type { TwilioSmsContext, TwilioMessageResponse, TwilioRateLimitConfig } from "./twilio.types";
```

---

#### Step 7 — Create the SMS Channel Factory (`SmsChannelFactory.ts`)

Create `backend/services/communication/channels/sms/SmsChannelFactory.ts`:

```typescript
import { logger } from "@/backend/lib/logger";
import type { ISmsChannel, SmsProvider } from "./ISmsChannel";

let instance: ISmsChannel | null = null;
let initializationPromise: Promise<ISmsChannel> | null = null;

function getSmsProvider(): SmsProvider {
  const rawProvider = process.env.SMS_PROVIDER as string | undefined;
  const provider = (rawProvider || "twilio").toLowerCase();

  if (provider !== "twilio") {
    logger.warn(`Invalid SMS_PROVIDER: ${provider}. Must be 'twilio'. Using 'twilio'.`);
    return "twilio";
  }

  return provider;
}

async function createTwilioAdapter(): Promise<ISmsChannel> {
  logger.info("Initializing SMS channel with Twilio provider");
  const { TwilioSmsAdapter } = await import("./twilio/TwilioSmsAdapter");
  return new TwilioSmsAdapter();
}

async function createSmsChannel(): Promise<ISmsChannel> {
  const provider = getSmsProvider();

  logger.info(`Initializing SMS channel with provider: ${provider}`);

  switch (provider) {
    case "twilio":
      return await createTwilioAdapter();

    default:
      logger.warn(`Unknown SMS provider: ${provider}, falling back to twilio`);
      return await createTwilioAdapter();
  }
}

export const getSmsChannel = async (): Promise<ISmsChannel> => {
  if (instance) {
    return instance;
  }

  initializationPromise ??= (async () => {
    try {
      const service = await createSmsChannel();
      instance = service;
      return instance;
    } catch (error) {
      initializationPromise = null;
      logger.error("Failed to initialize SMS channel", error);
      throw error;
    }
  })();

  return initializationPromise;
};

export const resetSmsChannel = (): void => {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
  initializationPromise = null;
};

export const smsChannel = {
  send: async (payload: Parameters<ISmsChannel["send"]>[0], locale?: string) => {
    const service = await getSmsChannel();
    return service.send(payload, locale);
  },
  validateConfig: async () => {
    const service = await getSmsChannel();
    return service.validateConfig();
  },
  disconnect: async () => {
    const service = await getSmsChannel();
    return service.disconnect();
  },
};
```

**Key implementation notes for `SmsChannelFactory.ts`:**
- **Singleton pattern**: Module-level `instance` and `initializationPromise` variables mirror the `CacheServiceFactory`, `StorageService`, and `EmailChannelFactory` patterns exactly.
- **Race-condition prevention**: The `initializationPromise ??= ...` pattern ensures that concurrent calls to `getSmsChannel()` during startup share the same initialization promise rather than creating multiple adapter instances.
- **Error recovery**: If initialization fails, `initializationPromise` is reset to `null` so subsequent calls can retry.
- **Lazy import**: `TwilioSmsAdapter` is imported dynamically via `await import()` to avoid loading the `twilio` package when the SMS channel is not used. The `twilio` package is large and should not be loaded unnecessarily.
- **Proxy wrapper**: `smsChannel` export provides a synchronous-looking API that internally awaits initialization — callers can use `smsChannel.send(payload)` without managing the singleton lifecycle.
- **`resetSmsChannel()`**: Disconnects the adapter and clears both `instance` and `initializationPromise` — used in test teardown.

---

#### Step 8 — Create the SMS Channel Barrel Export (`sms/index.ts`)

Create `backend/services/communication/channels/sms/index.ts`:

```typescript
export type { ISmsChannel, SmsPayload, SmsSendResult, SmsProvider } from "./ISmsChannel";
export { getSmsChannel, resetSmsChannel, smsChannel } from "./SmsChannelFactory";
```

---

#### Step 9 — Create SMS Template Helpers (`sms-templates.ts`)

Create `backend/services/communication/templates/sms-templates.ts`:

```typescript
import { getBackendTranslations } from "@/backend/lib/intl";

interface UrgentComplaintResponseSmsData {
  readonly parentName: string;
  readonly complaintTitle: string;
  readonly responseSummary: string;
}

export const renderUrgentComplaintResponseSms = async (
  data: UrgentComplaintResponseSmsData,
  locale?: string
): Promise<string> => {
  const t = await getBackendTranslations({ locale, namespace: "sms.complaintResponse" });

  const message = t("urgentResponse", {
    parentName: data.parentName,
    complaintTitle: data.complaintTitle,
    responseSummary: data.responseSummary,
  });

  return message;
};

export const renderSuggestionAcknowledgedSms = async (
  data: { readonly parentName: string; readonly suggestionTitle: string },
  locale?: string
): Promise<string> => {
  const t = await getBackendTranslations({ locale, namespace: "sms.suggestionAcknowledged" });

  const message = t("acknowledged", {
    parentName: data.parentName,
    suggestionTitle: data.suggestionTitle,
  });

  return message;
};
```

**Key implementation notes for `sms-templates.ts`:**
- **i18n integration**: Both template functions use `getBackendTranslations` with dedicated namespaces (`sms.complaintResponse`, `sms.suggestionAcknowledged`) for localized SMS content.
- **SMS length constraints**: SMS messages are limited to 160 characters (GSM) or 70 characters (Unicode/Arabic). The translation keys must produce concise text that fits within these limits. The template functions return the raw translated string — the caller is responsible for truncation if needed.
- **Data interfaces**: `UrgentComplaintResponseSmsData` defines the exact data shape needed for the urgent complaint response SMS template.
- **No hardcoded strings**: All user-visible text comes from the translation system.
- **`responseSummary`**: The caller is responsible for truncating the admin's response text to a summary suitable for SMS (e.g., first 50 characters).

---

#### Step 10 — Verify Directory Structure

After creating all files, verify the directory structure:

```
backend/services/communication/
├── channels/
│   ├── email/           (from Task D1)
│   └── sms/
│       ├── ISmsChannel.ts
│       ├── SmsChannelFactory.ts
│       ├── index.ts
│       └── twilio/
│           ├── TwilioSmsAdapter.ts
│           ├── twilio.types.ts
│           └── index.ts
└── templates/
    ├── email-templates.ts  (from Task D1)
    └── sms-templates.ts
```

---

#### Step 11 — TypeScript Compilation Check

After creating all files, run:

```bash
bun tsgo
```

Expected: 0 TypeScript errors. Pay attention to:
- `twilio` import from `"twilio"` — must resolve correctly after `bun add twilio`. The default import `twilio` is a function that returns a `Twilio.Twilio` client instance.
- `NotificationRepository` import from `"@/backend/db/repo/notification.repository"` — must include `getSmsCountInLastHour` from Task B2.
- `NotificationChannel` and `NotificationDeliveryStatus` imports from `"@/shared/lib/enum"` — must include `SMS`, `PENDING`, `SENT`, `FAILED`.
- `message.sid` — the Twilio SDK response type must include `sid` as a string.
- `message.errorCode` — the Twilio SDK response type must include `errorCode` as `number | null`.

---

### Test Execution Requirements

Run the full test suite after completing all file implementations:

```bash
bun run test:db
```

**Expected output:** 0 failures. All existing tests still pass. The SMS channel adapter creates and updates `notificationDeliveries` records via `NotificationRepository` and checks rate limits via `getSmsCountInLastHour` — existing delivery tests should not be affected.

Also verify TypeScript compilation and linting:

```bash
bun tsgo
bun biome:check
bun lint
bun codescene
```

---

### Success Criteria / Check Progress Points

- [ ] `twilio` package is installed and listed in `package.json` dependencies
- [ ] `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` declarations are added to `environment.d.ts`
- [ ] `ISmsChannel.ts` defines `SmsPayload`, `SmsSendResult`, `ISmsChannel`, and `SmsProvider` types
- [ ] `SmsPayload` includes `to`, `body`, `eventType`, `userId` as readonly fields
- [ ] `SmsSendResult` includes `success`, optional `providerMessageId`, optional `error`, and optional `rateLimited`
- [ ] `ISmsChannel` defines `send()`, `validateConfig()`, and `disconnect()` methods
- [ ] `twilio.types.ts` defines `TwilioSmsContext`, `TwilioMessageResponse`, `TwilioRateLimitConfig`
- [ ] `TwilioSmsAdapter` implements `ISmsChannel` with all three methods
- [ ] `TwilioSmsAdapter` constructor throws if `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, or `TWILIO_FROM_NUMBER` is missing
- [ ] `TwilioSmsAdapter.send()` checks SMS rate limit via `NotificationRepository.getSmsCountInLastHour(userId)` before creating delivery
- [ ] `TwilioSmsAdapter.send()` returns `{ success: false, rateLimited: true }` when rate limit is exceeded
- [ ] `TwilioSmsAdapter.send()` creates a `notificationDeliveries` record with `status = PENDING` before calling Twilio API
- [ ] `TwilioSmsAdapter.send()` updates delivery to `SENT` with Twilio SID as `providerMessageId` on success
- [ ] `TwilioSmsAdapter.send()` updates delivery to `FAILED` with `failureReason` on error
- [ ] `TwilioSmsAdapter.send()` handles both Twilio API errors (`message.errorCode`) and network errors (`try/catch`)
- [ ] `TwilioSmsAdapter.send()` logs errors without leaking account SID, auth token, or full phone numbers
- [ ] `TwilioSmsAdapter.validateConfig()` returns `true` when env vars are present, `false` otherwise
- [ ] `TwilioSmsAdapter.disconnect()` logs disconnection message
- [ ] `SmsChannelFactory.ts` reads `SMS_PROVIDER` env var with `"twilio"` as default
- [ ] `SmsChannelFactory.ts` uses `initializationPromise ??= ...` pattern for race-condition prevention
- [ ] `SmsChannelFactory.ts` resets `initializationPromise` to `null` on initialization failure
- [ ] `SmsChannelFactory.ts` uses dynamic `await import()` for `TwilioSmsAdapter`
- [ ] `SmsChannelFactory.ts` exports `getSmsChannel()`, `resetSmsChannel()`, and `smsChannel` proxy
- [ ] `smsChannel` proxy wraps all `ISmsChannel` methods with automatic initialization
- [ ] `twilio/index.ts` barrel exports `TwilioSmsAdapter` and context types
- [ ] `sms/index.ts` barrel exports interface types, factory functions, and proxy
- [ ] `sms-templates.ts` exports `renderUrgentComplaintResponseSms()` with i18n support
- [ ] `sms-templates.ts` exports `renderSuggestionAcknowledgedSms()` with i18n support
- [ ] Both template functions use `getBackendTranslations` for all user-visible text
- [ ] No hardcoded error strings in adapter or factory
- [ ] No `console` method usage — all logging via `logger`
- [ ] No direct Drizzle/schema imports in any file — only repository layer access
- [ ] `bun tsgo` reports zero type errors
- [ ] `bun run test:db` passes with zero failures
- [ ] NO local entity type definitions in channel files — all entity types imported from canonical `backend/types/` files
- [ ] Interface contracts (`ISmsChannel`, `SmsPayload`, `SmsSendResult`) remain as local definitions (these are contracts, not entity types)

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
