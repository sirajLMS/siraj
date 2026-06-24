### Task D3 — Push Channel (FCM Provider)

**Objective:**
Implement the push notification channel using the codebase's established **Interface + Adapter + Factory + Singleton** pattern (mirroring `StorageService`, `CacheService`, `RedisService`). The push channel sends cross-platform push notifications (iOS, Android, Web) via Firebase Cloud Messaging (FCM), tracks delivery status per device token in `notificationDeliveries`, handles expired/invalid tokens by deactivating them, and supports multicast delivery to all active device tokens for a user. The factory manages a singleton adapter instance with race-condition prevention during initialization.

**Dependencies:**
- Depends on Task B2 (Notification Repository Extensions) — `NotificationRepository.createDeliveriesBatch()`, `NotificationRepository.updateDeliveryStatus()`, `NotificationRepository.getActiveDeviceTokensForUser()`, and `NotificationRepository.deactivateDeviceToken()` must already be in place for batch delivery tracking and token management.
- Depends on Task A (Migration/Schema/Enums) — `NotificationChannel.PUSH`, `NotificationEventType.COMPLAINT_RESPONSE`, `NotificationEventType.SUGGESTION_ACKNOWLEDGED` must exist in `shared/lib/enum.ts`.
- Depends on Story 14 execution — the base `notificationDeliveries` table, `userDeviceTokens` table, and `NotificationRepository` namespace with `createDelivery`, `updateDeliveryStatus`, `getActiveDeviceTokensForUser`, and `deactivateDeviceToken` methods must already be in place.

**New Packages:**
- `firebase-admin` (npm) — Firebase Admin SDK for Node.js (includes Cloud Messaging)

**Layer-Specific Rules (Backend Services — Flattened from backend/services/AGENTS.md):**
- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern. The push channel is scoped strictly to push notification delivery — no email, SMS, or other channel logic.
- **NO Monolithic Services**: Do not create a generic "NotificationSender" that handles all channels. Each channel is its own interface + adapter + factory.
- **Business Logic Hub**: Multicast delivery logic (resolving tokens, creating batch deliveries, handling per-token results, deactivating expired tokens) resides in the adapter, not in the calling service.
- **i18n / Localized Error Messages**: All user-facing error messages must be translated using `getBackendTranslations`, optionally accepting a `locale?: string` parameter.
- **🚫 Services MUST NOT import from DB/Drizzle**: The adapter can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, or any Drizzle-related module is **strictly forbidden**.
- **Logger utility mandatory**: Use `import { logger } from '@/backend/lib/logger'`. Console methods are forbidden.
- **🚫 NO Local Entity Type Definitions**: Channel adapter files MUST NOT define local entity types. All entity types (like `NotificationDeliverySelectType`, `UserNotificationPreferenceSelectType`, `UserDeviceTokenSelectType`) MUST be imported from canonical `backend/types/` files.
- **Import canonical types**: Adapters MUST import types from `@/backend/types` — use `NotificationDeliverySelectType`, `NotificationDeliveryInsertType`, `SetNotificationPreferenceInput`, `UserDeviceTokenSelectType` etc. from their respective canonical files (e.g., `backend/types/notification-deliveries.types.ts`, `backend/types/user-notification-preferences.types.ts`, `backend/types/user-device-tokens.types.ts`).

**Target Files:**

| File | Action |
|------|--------|
| `backend/services/communication/channels/push/IPushChannel.ts` | NEW — interface + types |
| `backend/services/communication/channels/push/PushChannelFactory.ts` | NEW — factory + singleton |
| `backend/services/communication/channels/push/fcm/FcmPushAdapter.ts` | NEW — FCM adapter |
| `backend/services/communication/channels/push/fcm/fcm.types.ts` | NEW — context types |
| `backend/services/communication/channels/push/fcm/index.ts` | NEW — barrel export |
| `backend/services/communication/channels/push/index.ts` | NEW — barrel export |
| `environment.d.ts` | MODIFY — add env var declarations |

---

### Detailed Implementation Steps

#### Step 1 — Install the `firebase-admin` Package

Run the following command to add the Firebase Admin SDK:

```bash
bun add firebase-admin
```

Verify the package is added to `package.json` dependencies.

---

#### Step 2 — Add Environment Variable Declarations to `environment.d.ts`

Open `environment.d.ts` and add the following declarations inside the `ProcessEnv` interface, after the SMS Configuration section added in Task D2:

```typescript
      // Push Notification Configuration
      PUSH_PROVIDER?: "fcm";
      FIREBASE_PROJECT_ID?: string;
      FIREBASE_PRIVATE_KEY?: string;
      FIREBASE_CLIENT_EMAIL?: string;
```

These declarations provide TypeScript type safety for the environment variables used by the push channel factory and adapter.

---

#### Step 3 — Create the Push Channel Interface (`IPushChannel.ts`)

Create `backend/services/communication/channels/push/IPushChannel.ts`:

```typescript
import type { NotificationEventType } from "@/shared/lib/enum";

export interface PushPayload {
  readonly userId: string;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
  readonly eventType: NotificationEventType;
}

export interface PushSendResult {
  readonly success: boolean;
  readonly successCount: number;
  readonly failureCount: number;
  readonly errors?: string[];
}

export interface IPushChannel {
  send(payload: PushPayload, locale?: string): Promise<PushSendResult>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export type PushProvider = "fcm";
```

**Key implementation notes for `IPushChannel.ts`:**
- `PushPayload` targets a `userId` rather than a specific device token — the adapter resolves active device tokens internally via `NotificationRepository.getActiveDeviceTokensForUser()`. This allows the caller to send push notifications without knowing the user's device topology.
- `PushPayload.data` is an optional `Record<string, string>` for FCM data payloads — used for deep linking (e.g., `{ complaintId: "abc123", action: "view" }`).
- `PushSendResult` returns aggregate counts (`successCount`, `failureCount`) rather than per-token results — the adapter handles per-token delivery tracking internally.
- `PushSendResult.errors` is an optional array of error messages for failed tokens — useful for debugging but not for per-token retry logic (which is handled by token deactivation).
- `IPushChannel` defines three methods: `send()` for dispatching push notifications, `validateConfig()` for checking Firebase credentials, and `disconnect()` for cleanup.
- `PushProvider` type is a union of supported providers — currently only `"fcm"`, but extensible for future providers (e.g., `"apns"`, `"onesignal"`).

---

#### Step 4 — Create FCM Context Types (`fcm.types.ts`)

Create `backend/services/communication/channels/push/fcm/fcm.types.ts`:

```typescript
import type { messaging } from "firebase-admin";

export interface FcmPushContext {
  readonly messaging: messaging.Messaging;
  readonly projectId: string;
}

export interface FcmMulticastResult {
  readonly successCount: number;
  readonly failureCount: number;
  readonly responses: FcmSendResponse[];
}

export interface FcmSendResponse {
  readonly success: boolean;
  readonly messageId?: string;
  readonly error?: FcmErrorInfo;
}

export interface FcmErrorInfo {
  readonly code: string;
  readonly message: string;
}

export const FCM_TOKEN_EXPIRED_ERROR = "messaging/registration-token-not-registered";
export const FCM_INVALID_TOKEN_ERROR = "messaging/invalid-registration-token";
```

**Key implementation notes for `fcm.types.ts`:**
- `FcmPushContext` holds the initialized Firebase Messaging instance and the project ID for logging.
- `FcmMulticastResult` mirrors the shape of the FCM `sendEachForMulticast` response — includes aggregate counts and per-token responses.
- `FcmSendResponse` mirrors the per-token response shape — `success` boolean, optional `messageId`, and optional `error` with `code` and `message`.
- `FcmErrorInfo` mirrors the FCM error info shape — `code` is the FCM error code (e.g., `messaging/registration-token-not-registered`), `message` is the human-readable error description.
- `FCM_TOKEN_EXPIRED_ERROR` and `FCM_INVALID_TOKEN_ERROR` are constants for the FCM error codes that indicate a token should be deactivated. These are used by the adapter to determine which tokens to deactivate after a multicast send.

---

#### Step 5 — Create the FCM Push Adapter (`FcmPushAdapter.ts`)

Create `backend/services/communication/channels/push/fcm/FcmPushAdapter.ts`:

```typescript
import admin from "firebase-admin";
import { logger } from "@/backend/lib/logger";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { NotificationChannel, NotificationDeliveryStatus } from "@/shared/lib/enum";
import type { IPushChannel, PushPayload, PushSendResult } from "../IPushChannel";
import type { FcmPushContext } from "./fcm.types";
import { FCM_TOKEN_EXPIRED_ERROR, FCM_INVALID_TOKEN_ERROR } from "./fcm.types";

export class FcmPushAdapter implements IPushChannel {
  private readonly context: FcmPushContext;

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID environment variable is required for FcmPushAdapter");
    }

    if (!privateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY environment variable is required for FcmPushAdapter");
    }

    if (!clientEmail) {
      throw new Error("FIREBASE_CLIENT_EMAIL environment variable is required for FcmPushAdapter");
    }

    const normalizedPrivateKey = privateKey.replace(/\\n/g, "\n");

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: normalizedPrivateKey,
          clientEmail,
        }),
      });
    }

    this.context = {
      messaging: admin.messaging(),
      projectId,
    };
  }

  async send(payload: PushPayload, locale?: string): Promise<PushSendResult> {
    const deviceTokens = await NotificationRepository.getActiveDeviceTokensForUser(payload.userId);

    if (deviceTokens.length === 0) {
      logger.info("No active device tokens found for user", {
        userId: payload.userId,
      });

      return {
        success: true,
        successCount: 0,
        failureCount: 0,
      };
    }

    const tokens = deviceTokens.map(dt => dt.token);

    const deliveries = await NotificationRepository.createDeliveriesBatch(
      deviceTokens.map(dt => ({
        userId: payload.userId,
        channel: NotificationChannel.PUSH,
        eventType: payload.eventType,
        deviceTokenId: dt.id,
        title: payload.title,
        body: payload.body,
      }))
    );

    try {
      const multicastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
      };

      const response = await this.context.messaging.sendEachForMulticast(multicastMessage);

      const errors: string[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < response.responses.length; i++) {
        const tokenResponse = response.responses[i];
        const delivery = deliveries[i];

        if (!delivery) {
          continue;
        }

        if (tokenResponse.success) {
          successCount++;

          await NotificationRepository.updateDeliveryStatus({
            deliveryId: delivery.id,
            status: NotificationDeliveryStatus.SENT,
            providerMessageId: tokenResponse.messageId ?? null,
          });
        } else {
          failureCount++;

          const errorCode = tokenResponse.error?.code ?? "unknown";
          const errorMessage = tokenResponse.error?.message ?? "Unknown FCM error";

          errors.push(`Token ${tokens[i]}: ${errorMessage}`);

          await NotificationRepository.updateDeliveryStatus({
            deliveryId: delivery.id,
            status: NotificationDeliveryStatus.FAILED,
            failureReason: `${errorCode}: ${errorMessage}`,
          });

          if (
            errorCode === FCM_TOKEN_EXPIRED_ERROR ||
            errorCode === FCM_INVALID_TOKEN_ERROR
          ) {
            const deviceToken = deviceTokens[i];
            if (deviceToken) {
              await NotificationRepository.deactivateDeviceToken(deviceToken.id);

              logger.info("Deactivated expired/invalid FCM token", {
                userId: payload.userId,
                deviceTokenId: deviceToken.id,
                errorCode,
              });
            }
          }
        }
      }

      logger.info("Push notification multicast completed", {
        userId: payload.userId,
        totalTokens: tokens.length,
        successCount,
        failureCount,
      });

      return {
        success: failureCount === 0,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("Failed to send push notification via FCM", {
        userId: payload.userId,
        error: errorMessage,
      });

      for (const delivery of deliveries) {
        await NotificationRepository.updateDeliveryStatus({
          deliveryId: delivery.id,
          status: NotificationDeliveryStatus.FAILED,
          failureReason: errorMessage,
        });
      }

      return {
        success: false,
        successCount: 0,
        failureCount: deliveries.length,
        errors: [errorMessage],
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!projectId || !privateKey || !clientEmail) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error("FCM configuration validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (admin.apps.length > 0) {
      const app = admin.app();
      await app.delete();
    }

    logger.info("FcmPushAdapter disconnected");
  }
}
```

**Key implementation notes for `FcmPushAdapter`:**
- **Constructor validation**: Throws immediately if `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, or `FIREBASE_CLIENT_EMAIL` is missing — fails fast at initialization.
- **Private key normalization**: Replaces `\\n` with actual newlines in the private key — environment variables often escape newlines as literal `\n` strings.
- **Firebase app initialization**: Uses `admin.apps.length` check to prevent initializing multiple Firebase app instances. Only initializes if no app exists yet.
- **Token resolution**: Calls `NotificationRepository.getActiveDeviceTokensForUser(userId)` to get all active device tokens for the user. Returns early with `{ success: true, successCount: 0, failureCount: 0 }` if no tokens exist — this is not an error condition.
- **Batch delivery creation**: Uses `NotificationRepository.createDeliveriesBatch()` to create one `notificationDeliveries` record per device token, all with `status = PENDING`. Each delivery is linked to its `deviceTokenId`.
- **Multicast delivery**: Uses `messaging.sendEachForMulticast()` to send the notification to all tokens in a single API call. This is more efficient than sending individual messages.
- **Per-token result handling**: Iterates over `response.responses` and updates each delivery record individually:
  - Success: Updates to `SENT` with the FCM `messageId` as `providerMessageId`.
  - Failure: Updates to `FAILED` with the error code and message as `failureReason`.
- **Token deactivation**: When a token returns `messaging/registration-token-not-registered` or `messaging/invalid-registration-token`, the adapter calls `NotificationRepository.deactivateDeviceToken()` to mark the token as inactive. This prevents future send attempts to dead tokens.
- **Aggregate result**: Returns `{ success, successCount, failureCount, errors }` where `success` is `true` only if all tokens succeeded (`failureCount === 0`).
- **Network error handling**: If the entire multicast call fails (network error, auth error), all deliveries are updated to `FAILED` with the same error message.
- **No credential leakage**: Logger calls only include `userId`, `deviceTokenId`, `errorCode`, `successCount`, `failureCount` — never the private key, client email, or full token values.
- **`disconnect()`**: Deletes the Firebase app instance to clean up resources. Checks `admin.apps.length` before attempting deletion.

---

#### Step 6 — Create the FCM Barrel Export (`fcm/index.ts`)

Create `backend/services/communication/channels/push/fcm/index.ts`:

```typescript
export { FcmPushAdapter } from "./FcmPushAdapter";
export type {
  FcmPushContext,
  FcmMulticastResult,
  FcmSendResponse,
  FcmErrorInfo,
} from "./fcm.types";
export { FCM_TOKEN_EXPIRED_ERROR, FCM_INVALID_TOKEN_ERROR } from "./fcm.types";
```

---

#### Step 7 — Create the Push Channel Factory (`PushChannelFactory.ts`)

Create `backend/services/communication/channels/push/PushChannelFactory.ts`:

```typescript
import { logger } from "@/backend/lib/logger";
import type { IPushChannel, PushProvider } from "./IPushChannel";

let instance: IPushChannel | null = null;
let initializationPromise: Promise<IPushChannel> | null = null;

function getPushProvider(): PushProvider {
  const rawProvider = process.env.PUSH_PROVIDER as string | undefined;
  const provider = (rawProvider || "fcm").toLowerCase();

  if (provider !== "fcm") {
    logger.warn(`Invalid PUSH_PROVIDER: ${provider}. Must be 'fcm'. Using 'fcm'.`);
    return "fcm";
  }

  return provider;
}

async function createFcmAdapter(): Promise<IPushChannel> {
  logger.info("Initializing Push channel with FCM provider");
  const { FcmPushAdapter } = await import("./fcm/FcmPushAdapter");
  return new FcmPushAdapter();
}

async function createPushChannel(): Promise<IPushChannel> {
  const provider = getPushProvider();

  logger.info(`Initializing Push channel with provider: ${provider}`);

  switch (provider) {
    case "fcm":
      return await createFcmAdapter();

    default:
      logger.warn(`Unknown push provider: ${provider}, falling back to fcm`);
      return await createFcmAdapter();
  }
}

export const getPushChannel = async (): Promise<IPushChannel> => {
  if (instance) {
    return instance;
  }

  initializationPromise ??= (async () => {
    try {
      const service = await createPushChannel();
      instance = service;
      return instance;
    } catch (error) {
      initializationPromise = null;
      logger.error("Failed to initialize push channel", error);
      throw error;
    }
  })();

  return initializationPromise;
};

export const resetPushChannel = (): void => {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
  initializationPromise = null;
};

export const pushChannel = {
  send: async (payload: Parameters<IPushChannel["send"]>[0], locale?: string) => {
    const service = await getPushChannel();
    return service.send(payload, locale);
  },
  validateConfig: async () => {
    const service = await getPushChannel();
    return service.validateConfig();
  },
  disconnect: async () => {
    const service = await getPushChannel();
    return service.disconnect();
  },
};
```

**Key implementation notes for `PushChannelFactory.ts`:**
- **Singleton pattern**: Module-level `instance` and `initializationPromise` variables mirror the `CacheServiceFactory`, `StorageService`, `EmailChannelFactory`, and `SmsChannelFactory` patterns exactly.
- **Race-condition prevention**: The `initializationPromise ??= ...` pattern ensures that concurrent calls to `getPushChannel()` during startup share the same initialization promise rather than creating multiple adapter instances.
- **Error recovery**: If initialization fails, `initializationPromise` is reset to `null` so subsequent calls can retry.
- **Lazy import**: `FcmPushAdapter` is imported dynamically via `await import()` to avoid loading the `firebase-admin` package when the push channel is not used. The `firebase-admin` package is large and should not be loaded unnecessarily.
- **Proxy wrapper**: `pushChannel` export provides a synchronous-looking API that internally awaits initialization — callers can use `pushChannel.send(payload)` without managing the singleton lifecycle.
- **`resetPushChannel()`**: Disconnects the adapter (which deletes the Firebase app instance) and clears both `instance` and `initializationPromise` — used in test teardown.

---

#### Step 8 — Create the Push Channel Barrel Export (`push/index.ts`)

Create `backend/services/communication/channels/push/index.ts`:

```typescript
export type { IPushChannel, PushPayload, PushSendResult, PushProvider } from "./IPushChannel";
export { getPushChannel, resetPushChannel, pushChannel } from "./PushChannelFactory";
```

---

#### Step 9 — Verify Directory Structure

After creating all files, verify the directory structure:

```
backend/services/communication/
├── channels/
│   ├── email/           (from Task D1)
│   ├── sms/             (from Task D2)
│   └── push/
│       ├── IPushChannel.ts
│       ├── PushChannelFactory.ts
│       ├── index.ts
│       └── fcm/
│           ├── FcmPushAdapter.ts
│           ├── fcm.types.ts
│           └── index.ts
└── templates/
    ├── email-templates.ts  (from Task D1)
    └── sms-templates.ts    (from Task D2)
```

---

#### Step 10 — TypeScript Compilation Check

After creating all files, run:

```bash
bun tsgo
```

Expected: 0 TypeScript errors. Pay attention to:
- `admin` import from `"firebase-admin"` — must resolve correctly after `bun add firebase-admin`. The default import `admin` provides the Firebase Admin SDK namespace.
- `messaging` type import from `"firebase-admin"` — used in `fcm.types.ts` for the `messaging.Messaging` type.
- `NotificationRepository` import from `"@/backend/db/repo/notification.repository"` — must include `getActiveDeviceTokensForUser`, `createDeliveriesBatch`, `updateDeliveryStatus`, and `deactivateDeviceToken` from Task B2 and prior sprints.
- `NotificationChannel` and `NotificationDeliveryStatus` imports from `"@/shared/lib/enum"` — must include `PUSH`, `PENDING`, `SENT`, `FAILED`.
- `response.responses[i].success` — the FCM SDK response type must include per-response `success` boolean.
- `response.responses[i].messageId` — the FCM SDK response type must include optional `messageId` string.
- `response.responses[i].error?.code` — the FCM SDK response type must include optional `error` with `code` string.
- `admin.apps` — the Firebase Admin SDK must expose `apps` as an array of initialized app instances.
- `admin.app()` — the Firebase Admin SDK must expose `app()` to get the default app instance.
- `app.delete()` — the Firebase App instance must expose `delete()` for cleanup.

---

### Test Execution Requirements

Run the full test suite after completing all file implementations:

```bash
bun run test:db
```

**Expected output:** 0 failures. All existing tests still pass. The push channel adapter creates and updates `notificationDeliveries` records via `NotificationRepository` and manages device tokens via `getActiveDeviceTokensForUser` and `deactivateDeviceToken` — existing delivery and token tests should not be affected.

Also verify TypeScript compilation and linting:

```bash
bun tsgo
bun biome:check
bun lint
bun codescene
```

---

### Success Criteria / Check Progress Points

- [ ] `firebase-admin` package is installed and listed in `package.json` dependencies
- [ ] `PUSH_PROVIDER`, `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` declarations are added to `environment.d.ts`
- [ ] `IPushChannel.ts` defines `PushPayload`, `PushSendResult`, `IPushChannel`, and `PushProvider` types
- [ ] `PushPayload` includes `userId`, `title`, `body`, optional `data`, and `eventType` as readonly fields
- [ ] `PushSendResult` includes `success`, `successCount`, `failureCount`, and optional `errors` array
- [ ] `IPushChannel` defines `send()`, `validateConfig()`, and `disconnect()` methods
- [ ] `fcm.types.ts` defines `FcmPushContext`, `FcmMulticastResult`, `FcmSendResponse`, `FcmErrorInfo`
- [ ] `fcm.types.ts` exports `FCM_TOKEN_EXPIRED_ERROR` and `FCM_INVALID_TOKEN_ERROR` constants
- [ ] `FcmPushAdapter` implements `IPushChannel` with all three methods
- [ ] `FcmPushAdapter` constructor throws if `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, or `FIREBASE_CLIENT_EMAIL` is missing
- [ ] `FcmPushAdapter` constructor normalizes private key newlines (`\\n` → `\n`)
- [ ] `FcmPushAdapter` constructor checks `admin.apps.length` before initializing Firebase app
- [ ] `FcmPushAdapter.send()` resolves active device tokens via `NotificationRepository.getActiveDeviceTokensForUser(userId)`
- [ ] `FcmPushAdapter.send()` returns `{ success: true, successCount: 0, failureCount: 0 }` when no tokens exist
- [ ] `FcmPushAdapter.send()` creates batch `notificationDeliveries` records (one per token) via `NotificationRepository.createDeliveriesBatch()`
- [ ] `FcmPushAdapter.send()` uses `messaging.sendEachForMulticast()` for efficient batch delivery
- [ ] `FcmPushAdapter.send()` updates each delivery to `SENT` with FCM `messageId` on success
- [ ] `FcmPushAdapter.send()` updates each delivery to `FAILED` with error code and message on failure
- [ ] `FcmPushAdapter.send()` deactivates tokens that return `messaging/registration-token-not-registered` or `messaging/invalid-registration-token`
- [ ] `FcmPushAdapter.send()` returns aggregate `{ success, successCount, failureCount, errors }` result
- [ ] `FcmPushAdapter.send()` handles network-level errors by marking all deliveries as `FAILED`
- [ ] `FcmPushAdapter.send()` logs errors without leaking private key, client email, or full token values
- [ ] `FcmPushAdapter.validateConfig()` returns `true` when env vars are present, `false` otherwise
- [ ] `FcmPushAdapter.disconnect()` deletes the Firebase app instance via `admin.app().delete()`
- [ ] `PushChannelFactory.ts` reads `PUSH_PROVIDER` env var with `"fcm"` as default
- [ ] `PushChannelFactory.ts` uses `initializationPromise ??= ...` pattern for race-condition prevention
- [ ] `PushChannelFactory.ts` resets `initializationPromise` to `null` on initialization failure
- [ ] `PushChannelFactory.ts` uses dynamic `await import()` for `FcmPushAdapter`
- [ ] `PushChannelFactory.ts` exports `getPushChannel()`, `resetPushChannel()`, and `pushChannel` proxy
- [ ] `pushChannel` proxy wraps all `IPushChannel` methods with automatic initialization
- [ ] `fcm/index.ts` barrel exports `FcmPushAdapter`, context types, and error code constants
- [ ] `push/index.ts` barrel exports interface types, factory functions, and proxy
- [ ] No hardcoded error strings in adapter or factory
- [ ] No `console` method usage — all logging via `logger`
- [ ] No direct Drizzle/schema imports in any file — only repository layer access
- [ ] `bun tsgo` reports zero type errors
- [ ] `bun run test:db` passes with zero failures
- [ ] NO local entity type definitions in channel files — all entity types imported from canonical `backend/types/` files
- [ ] Interface contracts (`IPushChannel`, `PushPayload`, `PushSendResult`) remain as local definitions (these are contracts, not entity types)

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
