### Task D1 — Email Channel (Resend Provider)

**Objective:**
Implement the email communication channel using the codebase's established **Interface + Adapter + Factory + Singleton** pattern (mirroring `StorageService`, `CacheService`, `RedisService`). The email channel sends real transactional emails via the Resend API, tracks delivery status in `notificationDeliveries`, and provides HTML email templates for complaint responses and suggestion acknowledgments. The factory manages a singleton adapter instance with race-condition prevention during initialization.

**Dependencies:**
- Depends on Task B2 (Notification Repository Extensions) — `NotificationRepository.createDelivery()`, `NotificationRepository.updateDeliveryStatus()`, and `NotificationRepository.getPreference()` must already be in place for delivery tracking and preference checking.
- Depends on Task A (Migration/Schema/Enums) — `NotificationChannel.EMAIL`, `NotificationEventType.COMPLAINT_RESPONSE`, `NotificationEventType.SUGGESTION_ACKNOWLEDGED` must exist in `shared/lib/enum.ts`.
- Depends on Story 14 execution — the base `notificationDeliveries` table and `NotificationRepository` namespace with `createDelivery` and `updateDeliveryStatus` methods must already be in place.

**New Packages:**
- `resend` (npm) — Resend email API client for Node.js

**Layer-Specific Rules (Backend Services — Flattened from backend/services/AGENTS.md):**
- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern. The email channel is scoped strictly to email delivery — no SMS, push, or other channel logic.
- **NO Monolithic Services**: Do not create a generic "NotificationSender" that handles all channels. Each channel is its own interface + adapter + factory.
- **Business Logic Hub**: Delivery tracking (creating `notificationDeliveries` records, updating status) resides in the adapter, not in the calling service.
- **i18n / Localized Error Messages**: All user-facing error messages must be translated using `getBackendTranslations`, optionally accepting a `locale?: string` parameter.
- **🚫 Services MUST NOT import from DB/Drizzle**: The adapter can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, or any Drizzle-related module is **strictly forbidden**.
- **Logger utility mandatory**: Use `import { logger } from '@/backend/lib/logger'`. Console methods are forbidden.
- **🚫 NO Local Entity Type Definitions**: Channel adapter files MUST NOT define local entity types. All entity types (like `NotificationDeliverySelectType`, `UserNotificationPreferenceSelectType`) MUST be imported from canonical `backend/types/` files.
- **Import canonical types**: Adapters MUST import types from `@/backend/types` — use `NotificationDeliverySelectType`, `NotificationDeliveryInsertType`, `SetNotificationPreferenceInput` etc. from their respective canonical files (e.g., `backend/types/notification-deliveries.types.ts`, `backend/types/user-notification-preferences.types.ts`).

**Target Files:**

| File | Action |
|------|--------|
| `backend/services/communication/channels/email/IEmailChannel.ts` | NEW — interface + types |
| `backend/services/communication/channels/email/EmailChannelFactory.ts` | NEW — factory + singleton |
| `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts` | NEW — Resend adapter |
| `backend/services/communication/channels/email/resend/resend.types.ts` | NEW — context types |
| `backend/services/communication/channels/email/resend/index.ts` | NEW — barrel export |
| `backend/services/communication/channels/email/index.ts` | NEW — barrel export |
| `backend/services/communication/templates/email-templates.ts` | NEW — template helpers |
| `environment.d.ts` | MODIFY — add env var declarations |

---

### Detailed Implementation Steps

#### Step 1 — Install the `resend` Package

Run the following command to add the Resend SDK:

```bash
bun add resend
```

Verify the package is added to `package.json` dependencies.

---

#### Step 2 — Add Environment Variable Declarations to `environment.d.ts`

Open `environment.d.ts` and add the following declarations inside the `ProcessEnv` interface, after the existing `CACHE_PROVIDER` section:

```typescript
      // Email Configuration
      EMAIL_PROVIDER?: "resend";
      RESEND_API_KEY?: string;
      RESEND_FROM_EMAIL?: string;
```

These declarations provide TypeScript type safety for the environment variables used by the email channel factory and adapter.

---

#### Step 3 — Create the Email Channel Interface (`IEmailChannel.ts`)

Create `backend/services/communication/channels/email/IEmailChannel.ts`:

```typescript
import type { NotificationEventType } from "@/shared/lib/enum";

export interface EmailPayload {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly eventType: NotificationEventType;
  readonly userId: string;
}

export interface EmailSendResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly error?: string;
}

export interface IEmailChannel {
  send(payload: EmailPayload, locale?: string): Promise<EmailSendResult>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export type EmailProvider = "resend";
```

**Key implementation notes for `IEmailChannel.ts`:**
- `EmailPayload` is readonly — prevents mutation after construction.
- `EmailSendResult` includes optional `providerMessageId` for tracking the provider-side message ID (Resend message ID) and optional `error` for failure diagnostics.
- `IEmailChannel` defines three methods: `send()` for dispatching emails, `validateConfig()` for checking API key validity, and `disconnect()` for cleanup.
- `EmailProvider` type is a union of supported providers — currently only `"resend"`, but extensible for future providers (e.g., `"sendgrid"`, `"ses"`).
- The interface imports `NotificationEventType` from `shared/lib/enum` for type-safe event tagging.

---

#### Step 4 — Create Resend Context Types (`resend.types.ts`)

Create `backend/services/communication/channels/email/resend/resend.types.ts`:

```typescript
import type { Resend } from "resend";

export interface ResendEmailContext {
  readonly client: Resend;
  readonly fromEmail: string;
}

export interface ResendSendResponse {
  readonly id: string;
}

export interface ResendErrorResponse {
  readonly message: string;
  readonly name: string;
}
```

**Key implementation notes for `resend.types.ts`:**
- `ResendEmailContext` holds the initialized Resend client and the configured sender email address.
- `ResendSendResponse` mirrors the shape of the successful Resend API response (contains the message `id`).
- `ResendErrorResponse` mirrors the shape of error responses from the Resend API.
- These types are used internally by `ResendEmailAdapter` to type-check API responses without relying on `any`.

---

#### Step 5 — Create the Resend Email Adapter (`ResendEmailAdapter.ts`)

Create `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts`:

```typescript
import { Resend } from "resend";
import { logger } from "@/backend/lib/logger";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { NotificationChannel, NotificationDeliveryStatus } from "@/shared/lib/enum";
import type { IEmailChannel, EmailPayload, EmailSendResult } from "../IEmailChannel";
import type { ResendEmailContext } from "./resend.types";

export class ResendEmailAdapter implements IEmailChannel {
  private readonly context: ResendEmailContext;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required for ResendEmailAdapter");
    }

    if (!fromEmail) {
      throw new Error("RESEND_FROM_EMAIL environment variable is required for ResendEmailAdapter");
    }

    this.context = {
      client: new Resend(apiKey),
      fromEmail,
    };
  }

  async send(payload: EmailPayload, locale?: string): Promise<EmailSendResult> {
    const delivery = await NotificationRepository.createDelivery({
      userId: payload.userId,
      channel: NotificationChannel.EMAIL,
      eventType: payload.eventType,
      title: payload.subject,
      body: payload.to,
    });

    try {
      const response = await this.context.client.emails.send({
        from: this.context.fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      if (response.error) {
        logger.error("Resend API returned an error", {
          errorName: response.error.name,
          errorMessage: response.error.message,
        });

        await NotificationRepository.updateDeliveryStatus({
          deliveryId: delivery.id,
          status: NotificationDeliveryStatus.FAILED,
          failureReason: response.error.message,
        });

        return {
          success: false,
          error: response.error.message,
        };
      }

      await NotificationRepository.updateDeliveryStatus({
        deliveryId: delivery.id,
        status: NotificationDeliveryStatus.SENT,
        providerMessageId: response.data?.id ?? null,
      });

      logger.info("Email sent successfully via Resend", {
        deliveryId: delivery.id,
        providerMessageId: response.data?.id,
      });

      return {
        success: true,
        providerMessageId: response.data?.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("Failed to send email via Resend", {
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
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL;

      if (!apiKey || !fromEmail) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Resend configuration validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    logger.info("ResendEmailAdapter disconnected");
  }
}
```

**Key implementation notes for `ResendEmailAdapter`:**
- **Constructor validation**: Throws immediately if `RESEND_API_KEY` or `RESEND_FROM_EMAIL` is missing — fails fast at initialization rather than at first send attempt.
- **Delivery tracking**: Creates a `notificationDeliveries` record with `status = PENDING` before calling the Resend API. Updates to `SENT` on success or `FAILED` on error.
- **Error handling**: Catches both Resend API errors (returned in `response.error`) and network/transport errors (caught in `try/catch`). Both paths update the delivery status to `FAILED` with a `failureReason`.
- **No credential leakage**: Logger calls only include `deliveryId`, `providerMessageId`, `errorName`, and `errorMessage` — never the API key or sender email content.
- **`providerMessageId`**: Stores the Resend message ID (`response.data?.id`) for future webhook correlation and delivery status tracking.
- **`validateConfig()`**: Checks that required environment variables are present. Does not make an API call to avoid unnecessary costs.
- **`disconnect()`**: No-op for Resend (HTTP-based client, no persistent connection). Logs disconnection for observability.

---

#### Step 6 — Create the Resend Barrel Export (`resend/index.ts`)

Create `backend/services/communication/channels/email/resend/index.ts`:

```typescript
export { ResendEmailAdapter } from "./ResendEmailAdapter";
export type { ResendEmailContext, ResendSendResponse, ResendErrorResponse } from "./resend.types";
```

---

#### Step 7 — Create the Email Channel Factory (`EmailChannelFactory.ts`)

Create `backend/services/communication/channels/email/EmailChannelFactory.ts`:

```typescript
import { logger } from "@/backend/lib/logger";
import type { EmailProvider, IEmailChannel } from "./IEmailChannel";

let instance: IEmailChannel | null = null;
let initializationPromise: Promise<IEmailChannel> | null = null;

function getEmailProvider(): EmailProvider {
  const rawProvider = process.env.EMAIL_PROVIDER as string | undefined;
  const provider = (rawProvider || "resend").toLowerCase();

  if (provider !== "resend") {
    logger.warn(`Invalid EMAIL_PROVIDER: ${provider}. Must be 'resend'. Using 'resend'.`);
    return "resend";
  }

  return provider;
}

async function createResendAdapter(): Promise<IEmailChannel> {
  logger.info("Initializing Email channel with Resend provider");
  const { ResendEmailAdapter } = await import("./resend/ResendEmailAdapter");
  return new ResendEmailAdapter();
}

async function createEmailChannel(): Promise<IEmailChannel> {
  const provider = getEmailProvider();

  logger.info(`Initializing Email channel with provider: ${provider}`);

  switch (provider) {
    case "resend":
      return await createResendAdapter();

    default:
      logger.warn(`Unknown email provider: ${provider}, falling back to resend`);
      return await createResendAdapter();
  }
}

export const getEmailChannel = async (): Promise<IEmailChannel> => {
  if (instance) {
    return instance;
  }

  initializationPromise ??= (async () => {
    try {
      const service = await createEmailChannel();
      instance = service;
      return instance;
    } catch (error) {
      initializationPromise = null;
      logger.error("Failed to initialize email channel", error);
      throw error;
    }
  })();

  return initializationPromise;
};

export const resetEmailChannel = (): void => {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
  initializationPromise = null;
};

export const emailChannel = {
  send: async (payload: Parameters<IEmailChannel["send"]>[0], locale?: string) => {
    const service = await getEmailChannel();
    return service.send(payload, locale);
  },
  validateConfig: async () => {
    const service = await getEmailChannel();
    return service.validateConfig();
  },
  disconnect: async () => {
    const service = await getEmailChannel();
    return service.disconnect();
  },
};
```

**Key implementation notes for `EmailChannelFactory.ts`:**
- **Singleton pattern**: Module-level `instance` and `initializationPromise` variables mirror the `CacheServiceFactory` and `StorageService` patterns exactly.
- **Race-condition prevention**: The `initializationPromise ??= ...` pattern ensures that concurrent calls to `getEmailChannel()` during startup share the same initialization promise rather than creating multiple adapter instances.
- **Error recovery**: If initialization fails, `initializationPromise` is reset to `null` so subsequent calls can retry.
- **Lazy import**: `ResendEmailAdapter` is imported dynamically via `await import()` to avoid loading the `resend` package when the email channel is not used.
- **Proxy wrapper**: `emailChannel` export provides a synchronous-looking API that internally awaits initialization — callers can use `emailChannel.send(payload)` without managing the singleton lifecycle.
- **`resetEmailChannel()`**: Disconnects the adapter and clears both `instance` and `initializationPromise` — used in test teardown.

---

#### Step 8 — Create the Email Channel Barrel Export (`email/index.ts`)

Create `backend/services/communication/channels/email/index.ts`:

```typescript
export type { IEmailChannel, EmailPayload, EmailSendResult, EmailProvider } from "./IEmailChannel";
export { getEmailChannel, resetEmailChannel, emailChannel } from "./EmailChannelFactory";
```

---

#### Step 9 — Create Email Template Helpers (`email-templates.ts`)

Create `backend/services/communication/templates/email-templates.ts`:

```typescript
import { getBackendTranslations } from "@/backend/lib/intl";

interface ComplaintResponseEmailData {
  readonly parentName: string;
  readonly complaintTitle: string;
  readonly responseText: string;
  readonly respondedAt: string;
  readonly complaintId: string;
}

interface SuggestionAcknowledgedEmailData {
  readonly parentName: string;
  readonly suggestionTitle: string;
  readonly suggestionText: string;
  readonly acknowledgedAt: string;
  readonly suggestionId: string;
}

export const renderComplaintResponseEmail = async (
  data: ComplaintResponseEmailData,
  locale?: string
): Promise<string> => {
  const t = await getBackendTranslations({ locale, namespace: "emails.complaintResponse" });

  const subject = t("subject", { complaintTitle: data.complaintTitle });
  const greeting = t("greeting", { parentName: data.parentName });
  const body = t("body", { complaintTitle: data.complaintTitle });
  const responseLabel = t("responseLabel");
  const dateLabel = t("dateLabel");
  const footer = t("footer");

  return `
<!DOCTYPE html>
<html lang="${locale ?? "ar"}" dir="${locale === "en" ? "ltr" : "rtl"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background-color: #1976d2; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .content { padding: 24px; }
    .greeting { font-size: 16px; color: #333333; margin-bottom: 16px; }
    .message { font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 16px; }
    .response-box { background-color: #f0f7ff; border-left: 4px solid #1976d2; padding: 16px; margin: 16px 0; border-radius: 4px; }
    .response-box .label { font-size: 12px; color: #1976d2; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .response-box .text { font-size: 14px; color: #333333; line-height: 1.6; }
    .meta { font-size: 12px; color: #888888; margin-top: 16px; }
    .footer { background-color: #f5f5f5; padding: 16px 24px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p class="greeting">${greeting}</p>
      <p class="message">${body}</p>
      <div class="response-box">
        <div class="label">${responseLabel}</div>
        <div class="text">${data.responseText}</div>
      </div>
      <p class="meta">${dateLabel}: ${data.respondedAt}</p>
    </div>
    <div class="footer">
      ${footer}
    </div>
  </div>
</body>
</html>`.trim();
};

export const renderSuggestionAcknowledgedEmail = async (
  data: SuggestionAcknowledgedEmailData,
  locale?: string
): Promise<string> => {
  const t = await getBackendTranslations({ locale, namespace: "emails.suggestionAcknowledged" });

  const subject = t("subject");
  const greeting = t("greeting", { parentName: data.parentName });
  const body = t("body");
  const suggestionLabel = t("suggestionLabel");
  const dateLabel = t("dateLabel");
  const footer = t("footer");

  return `
<!DOCTYPE html>
<html lang="${locale ?? "ar"}" dir="${locale === "en" ? "ltr" : "rtl"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background-color: #2e7d32; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .content { padding: 24px; }
    .greeting { font-size: 16px; color: #333333; margin-bottom: 16px; }
    .message { font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 16px; }
    .suggestion-box { background-color: #f0fff0; border-left: 4px solid #2e7d32; padding: 16px; margin: 16px 0; border-radius: 4px; }
    .suggestion-box .label { font-size: 12px; color: #2e7d32; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .suggestion-box .title { font-size: 16px; color: #333333; font-weight: 600; margin-bottom: 8px; }
    .suggestion-box .text { font-size: 14px; color: #555555; line-height: 1.6; }
    .meta { font-size: 12px; color: #888888; margin-top: 16px; }
    .footer { background-color: #f5f5f5; padding: 16px 24px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p class="greeting">${greeting}</p>
      <p class="message">${body}</p>
      <div class="suggestion-box">
        <div class="label">${suggestionLabel}</div>
        <div class="title">${data.suggestionTitle}</div>
        <div class="text">${data.suggestionText}</div>
      </div>
      <p class="meta">${dateLabel}: ${data.acknowledgedAt}</p>
    </div>
    <div class="footer">
      ${footer}
    </div>
  </div>
</body>
</html>`.trim();
};
```

**Key implementation notes for `email-templates.ts`:**
- **i18n integration**: Both template functions use `getBackendTranslations` with a dedicated namespace (`emails.complaintResponse`, `emails.suggestionAcknowledged`) for localized email content.
- **RTL support**: The `dir` attribute on the `<html>` tag switches between `ltr` and `rtl` based on locale — Arabic emails render right-to-left.
- **Responsive design**: Templates use a max-width container with responsive styling suitable for email clients.
- **Data interfaces**: `ComplaintResponseEmailData` and `SuggestionAcknowledgedEmailData` are readonly interfaces defining the exact data shape each template needs.
- **No hardcoded strings**: All user-visible text comes from the translation system — subject, greeting, body, labels, footer.
- **Theme-consistent colors**: Uses Material UI-aligned colors (`#1976d2` for primary blue, `#2e7d32` for success green).

---

#### Step 10 — Verify Directory Structure

After creating all files, verify the directory structure:

```
backend/services/communication/
├── channels/
│   └── email/
│       ├── IEmailChannel.ts
│       ├── EmailChannelFactory.ts
│       ├── index.ts
│       └── resend/
│           ├── ResendEmailAdapter.ts
│           ├── resend.types.ts
│           └── index.ts
└── templates/
    └── email-templates.ts
```

---

#### Step 11 — TypeScript Compilation Check

After creating all files, run:

```bash
bun tsgo
```

Expected: 0 TypeScript errors. Pay attention to:
- `Resend` import from `"resend"` — must resolve correctly after `bun add resend`.
- `NotificationRepository` import from `"@/backend/db/repo/notification.repository"` — must be accessible.
- `NotificationChannel` and `NotificationDeliveryStatus` imports from `"@/shared/lib/enum"` — must include `EMAIL`, `PENDING`, `SENT`, `FAILED`.
- `getBackendTranslations` import from `"@/backend/lib/intl"` — must be accessible.
- `response.data?.id` — the Resend SDK response type must include `data` with an `id` field.

---

### Test Execution Requirements

Run the full test suite after completing all file implementations:

```bash
bun run test:db
```

**Expected output:** 0 failures. All existing tests still pass. The email channel adapter creates and updates `notificationDeliveries` records via `NotificationRepository` — existing delivery tests should not be affected.

Also verify TypeScript compilation and linting:

```bash
bun tsgo
bun biome:check
bun lint
bun codescene
```

---

### Success Criteria / Check Progress Points

- [ ] `resend` package is installed and listed in `package.json` dependencies
- [ ] `EMAIL_PROVIDER`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` declarations are added to `environment.d.ts`
- [ ] `IEmailChannel.ts` defines `EmailPayload`, `EmailSendResult`, `IEmailChannel`, and `EmailProvider` types
- [ ] `EmailPayload` includes `to`, `subject`, `html`, `eventType`, `userId` as readonly fields
- [ ] `EmailSendResult` includes `success`, optional `providerMessageId`, and optional `error`
- [ ] `IEmailChannel` defines `send()`, `validateConfig()`, and `disconnect()` methods
- [ ] `resend.types.ts` defines `ResendEmailContext`, `ResendSendResponse`, `ResendErrorResponse`
- [ ] `ResendEmailAdapter` implements `IEmailChannel` with all three methods
- [ ] `ResendEmailAdapter` constructor throws if `RESEND_API_KEY` or `RESEND_FROM_EMAIL` is missing
- [ ] `ResendEmailAdapter.send()` creates a `notificationDeliveries` record with `status = PENDING` before calling Resend API
- [ ] `ResendEmailAdapter.send()` updates delivery to `SENT` with `providerMessageId` on success
- [ ] `ResendEmailAdapter.send()` updates delivery to `FAILED` with `failureReason` on error
- [ ] `ResendEmailAdapter.send()` handles both Resend API errors (`response.error`) and network errors (`try/catch`)
- [ ] `ResendEmailAdapter.send()` logs errors without leaking API keys or email content
- [ ] `ResendEmailAdapter.validateConfig()` returns `true` when env vars are present, `false` otherwise
- [ ] `ResendEmailAdapter.disconnect()` logs disconnection message
- [ ] `EmailChannelFactory.ts` reads `EMAIL_PROVIDER` env var with `"resend"` as default
- [ ] `EmailChannelFactory.ts` uses `initializationPromise ??= ...` pattern for race-condition prevention
- [ ] `EmailChannelFactory.ts` resets `initializationPromise` to `null` on initialization failure
- [ ] `EmailChannelFactory.ts` uses dynamic `await import()` for `ResendEmailAdapter`
- [ ] `EmailChannelFactory.ts` exports `getEmailChannel()`, `resetEmailChannel()`, and `emailChannel` proxy
- [ ] `emailChannel` proxy wraps all `IEmailChannel` methods with automatic initialization
- [ ] `resend/index.ts` barrel exports `ResendEmailAdapter` and context types
- [ ] `email/index.ts` barrel exports interface types, factory functions, and proxy
- [ ] `email-templates.ts` exports `renderComplaintResponseEmail()` with i18n and RTL support
- [ ] `email-templates.ts` exports `renderSuggestionAcknowledgedEmail()` with i18n and RTL support
- [ ] Both template functions use `getBackendTranslations` for all user-visible text
- [ ] No hardcoded error strings in adapter or factory
- [ ] No `console` method usage — all logging via `logger`
- [ ] No direct Drizzle/schema imports in any file — only repository layer access
- [ ] `bun tsgo` reports zero type errors
- [ ] `bun run test:db` passes with zero failures
- [ ] NO local entity type definitions in channel files — all entity types imported from canonical `backend/types/` files
- [ ] Interface contracts (`IEmailChannel`, `EmailPayload`, `EmailSendResult`) remain as local definitions (these are contracts, not entity types)

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
