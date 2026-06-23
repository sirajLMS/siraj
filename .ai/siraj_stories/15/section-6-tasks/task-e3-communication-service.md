# Task E3 — Communication Service Multi-Channel Fan-Out

## Sprint 15 · Services Layer · Section 6

---

## Objective

Update `CommunicationService` to use the new channel factories and add `dispatchMulti()` for parallel multi-channel dispatch. Expand the channel type to include `sms` and `push`.

---

## Dependencies

| Task | Description |
|------|-------------|
| D1 | Email channel implementation (`getEmailChannel()`) |
| D2 | SMS channel implementation (`getSmsChannel()`) |
| D3 | Push channel implementation (`getPushChannel()`) |

---

## Target Files

| File | Action |
|------|--------|
| `backend/services/communication/communication.service.ts` | Update `dispatch()`, add `dispatchMulti()` |

---

## Pre-Implementation Checklist

- [ ] Read `backend/services/AGENTS.md` for service layer rules
- [ ] Verify `getEmailChannel()` factory exists and returns `{ send(payload): Promise<ChannelResult> }`
- [ ] Verify `getSmsChannel()` factory exists and returns `{ send(payload): Promise<ChannelResult> }`
- [ ] Verify `getPushChannel()` factory exists and returns `{ send(payload): Promise<ChannelResult> }`
- [ ] Verify `getOnAppChannel()` factory exists and returns `{ send(payload): Promise<ChannelResult> }`
- [ ] Confirm all channel factories share a common `CommunicationChannel` interface
- [ ] Confirm `NotificationChannel` enum includes `EMAIL`, `SMS`, `PUSH`

---

## Implementation Details

### 1. Expanded Payload Type

Update the `CommunicationPayload` interface to support all four channels and optional metadata.

```typescript
export type CommunicationChannelType = "on_app" | "email" | "sms" | "push";

export interface CommunicationPayload {
  userId: string;
  channel: CommunicationChannelType;
  eventType: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelDispatchResult {
  channel: CommunicationChannelType;
  success: boolean;
  providerMessageId?: string;
  error?: string;
}
```

---

### 2. Updated `dispatch()` Method

The `dispatch()` method now handles all four channel types via their respective factories.

```typescript
export async function dispatch(
  payload: CommunicationPayload,
  locale?: string
): Promise<ChannelDispatchResult> {
  const t = await getBackendTranslations({ locale, namespace: "errors" });

  try {
    switch (payload.channel) {
      case "on_app": {
        const channel = getOnAppChannel();
        const result = await channel.send({
          userId: payload.userId,
          eventType: payload.eventType,
          title: payload.title,
          body: payload.body,
        });
        return {
          channel: "on_app",
          success: result.success,
          providerMessageId: result.messageId,
          error: result.error,
        };
      }

      case "email": {
        const channel = getEmailChannel();
        const result = await channel.send({
          userId: payload.userId,
          eventType: payload.eventType,
          title: payload.title,
          body: payload.body,
          metadata: payload.metadata,
        });
        return {
          channel: "email",
          success: result.success,
          providerMessageId: result.messageId,
          error: result.error,
        };
      }

      case "sms": {
        const channel = getSmsChannel();
        const result = await channel.send({
          userId: payload.userId,
          eventType: payload.eventType,
          title: payload.title,
          body: payload.body,
          metadata: payload.metadata,
        });
        return {
          channel: "sms",
          success: result.success,
          providerMessageId: result.messageId,
          error: result.error,
        };
      }

      case "push": {
        const channel = getPushChannel();
        const result = await channel.send({
          userId: payload.userId,
          eventType: payload.eventType,
          title: payload.title,
          body: payload.body,
          metadata: payload.metadata,
        });
        return {
          channel: "push",
          success: result.success,
          providerMessageId: result.messageId,
          error: result.error,
        };
      }

      default: {
        const _exhaustiveCheck: never = payload.channel;
        logger.error("Unknown communication channel", {
          channel: _exhaustiveCheck,
        });
        throw new Error(t("unknownCommunicationChannel"));
      }
    }
  } catch (error) {
    logger.error("Communication dispatch failed", {
      channel: payload.channel,
      userId: payload.userId,
      eventType: payload.eventType,
      error,
    });

    return {
      channel: payload.channel,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

---

### 3. New `dispatchMulti()` Method

Dispatches multiple payloads in parallel using `Promise.allSettled()`. Failures in one channel do NOT block other channels.

```typescript
export async function dispatchMulti(
  payloads: CommunicationPayload[],
  locale?: string
): Promise<ChannelDispatchResult[]> {
  if (payloads.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    payloads.map(p => dispatch(p, locale))
  );

  const dispatchResults: ChannelDispatchResult[] = [];
  const failures: PromiseRejectedResult[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      dispatchResults.push(result.value);
    } else {
      failures.push(result);
      dispatchResults.push({
        channel: payloads[i].channel,
        success: false,
        error: result.reason instanceof Error
          ? result.reason.message
          : "Unknown dispatch error",
      });
    }
  }

  if (failures.length > 0) {
    logger.error("Multi-channel dispatch had failures", {
      failureCount: failures.length,
      totalChannels: payloads.length,
      failedChannels: failures.map((f, idx) => ({
        channel: payloads[results.indexOf(f)].channel,
        error: f.reason instanceof Error ? f.reason.message : "Unknown",
      })),
    });
  }

  const successCount = dispatchResults.filter(r => r.success).length;
  logger.info("Multi-channel dispatch complete", {
    totalChannels: payloads.length,
    successCount,
    failureCount: dispatchResults.length - successCount,
  });

  return dispatchResults;
}
```

---

## Complete Service File Structure

```typescript
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { getEmailChannel } from "@/backend/services/communication/channels/email.channel";
import { getOnAppChannel } from "@/backend/services/communication/channels/on-app.channel";
import { getPushChannel } from "@/backend/services/communication/channels/push.channel";
import { getSmsChannel } from "@/backend/services/communication/channels/sms.channel";

export type CommunicationChannelType = "on_app" | "email" | "sms" | "push";

export interface CommunicationPayload {
  userId: string;
  channel: CommunicationChannelType;
  eventType: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelDispatchResult {
  channel: CommunicationChannelType;
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export namespace CommunicationService {
  export async function dispatch(
    payload: CommunicationPayload,
    locale?: string
  ): Promise<ChannelDispatchResult> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    try {
      switch (payload.channel) {
        case "on_app": {
          const channel = getOnAppChannel();
          const result = await channel.send({
            userId: payload.userId,
            eventType: payload.eventType,
            title: payload.title,
            body: payload.body,
          });
          return {
            channel: "on_app",
            success: result.success,
            providerMessageId: result.messageId,
            error: result.error,
          };
        }

        case "email": {
          const channel = getEmailChannel();
          const result = await channel.send({
            userId: payload.userId,
            eventType: payload.eventType,
            title: payload.title,
            body: payload.body,
            metadata: payload.metadata,
          });
          return {
            channel: "email",
            success: result.success,
            providerMessageId: result.messageId,
            error: result.error,
          };
        }

        case "sms": {
          const channel = getSmsChannel();
          const result = await channel.send({
            userId: payload.userId,
            eventType: payload.eventType,
            title: payload.title,
            body: payload.body,
            metadata: payload.metadata,
          });
          return {
            channel: "sms",
            success: result.success,
            providerMessageId: result.messageId,
            error: result.error,
          };
        }

        case "push": {
          const channel = getPushChannel();
          const result = await channel.send({
            userId: payload.userId,
            eventType: payload.eventType,
            title: payload.title,
            body: payload.body,
            metadata: payload.metadata,
          });
          return {
            channel: "push",
            success: result.success,
            providerMessageId: result.messageId,
            error: result.error,
          };
        }

        default: {
          const _exhaustiveCheck: never = payload.channel;
          logger.error("Unknown communication channel", {
            channel: _exhaustiveCheck,
          });
          throw new Error(t("unknownCommunicationChannel"));
        }
      }
    } catch (error) {
      logger.error("Communication dispatch failed", {
        channel: payload.channel,
        userId: payload.userId,
        eventType: payload.eventType,
        error,
      });

      return {
        channel: payload.channel,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  export async function dispatchMulti(
    payloads: CommunicationPayload[],
    locale?: string
  ): Promise<ChannelDispatchResult[]> {
    if (payloads.length === 0) {
      return [];
    }

    const results = await Promise.allSettled(
      payloads.map(p => dispatch(p, locale))
    );

    const dispatchResults: ChannelDispatchResult[] = [];
    const failures: PromiseRejectedResult[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        dispatchResults.push(result.value);
      } else {
        failures.push(result);
        dispatchResults.push({
          channel: payloads[i].channel,
          success: false,
          error: result.reason instanceof Error
            ? result.reason.message
            : "Unknown dispatch error",
        });
      }
    }

    if (failures.length > 0) {
      logger.error("Multi-channel dispatch had failures", {
        failureCount: failures.length,
        totalChannels: payloads.length,
      });
    }

    const successCount = dispatchResults.filter(r => r.success).length;
    logger.info("Multi-channel dispatch complete", {
      totalChannels: payloads.length,
      successCount,
      failureCount: dispatchResults.length - successCount,
    });

    return dispatchResults;
  }
}
```

---

## Channel Factory Interface

All channel factories must implement this common interface:

```typescript
export interface CommunicationChannel {
  send(input: {
    userId: string;
    eventType: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}
```

---

## Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| Single channel dispatch fails | Returns `{ success: false, error }` — does NOT throw |
| Multi-channel partial failure | Logs error, returns all results including failures |
| Multi-channel all fail | Logs error with failure count, returns all failure results |
| Unknown channel type | Exhaustive check catches at compile time; runtime throws |
| Empty payloads array | Returns empty array immediately (no-op) |

---

## Logging Requirements

All methods must use `logger` (never `console`):

- `logger.info()` — Successful dispatch summary (multi-channel complete)
- `logger.error()` — Dispatch failures, unknown channel types
- `logger.warn()` — Partial failures in multi-channel dispatch

---

## Quality Gate — Implementation

- [ ] `CommunicationPayload.channel` type expanded to include `"sms"` and `"push"`
- [ ] `CommunicationPayload` includes optional `metadata?: Record<string, unknown>`
- [ ] `dispatch()` switch includes all four cases: `on_app`, `email`, `sms`, `push`
- [ ] `dispatch()` includes exhaustive `default` case with `never` type check
- [ ] Each case calls the correct channel factory: `getOnAppChannel()`, `getEmailChannel()`, `getSmsChannel()`, `getPushChannel()`
- [ ] `dispatchMulti()` uses `Promise.allSettled()` for parallel execution
- [ ] `dispatchMulti()` failures in one channel do NOT block other channels
- [ ] `dispatchMulti()` logs failure count when any channel fails
- [ ] `dispatchMulti()` returns empty array for empty input
- [ ] `dispatch()` catches errors and returns result object (does NOT throw to caller)
- [ ] All logging uses `logger` (no `console.*` calls)
- [ ] TypeScript types are fully resolved (no `any`)

---

## Quality Gate — Verification

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun lint` passes with zero errors
- [ ] `bun run test:db` passes (integration tests from Task E4)
- [ ] Manual verification: `dispatch()` routes `on_app` payload to `getOnAppChannel()`
- [ ] Manual verification: `dispatch()` routes `email` payload to `getEmailChannel()`
- [ ] Manual verification: `dispatch()` routes `sms` payload to `getSmsChannel()`
- [ ] Manual verification: `dispatch()` routes `push` payload to `getPushChannel()`
- [ ] Manual verification: `dispatchMulti()` with all-success returns all success results
- [ ] Manual verification: `dispatchMulti()` with partial failure returns mixed results and logs error
- [ ] Manual verification: `dispatchMulti()` with all-fail returns all failure results and logs error
- [ ] Manual verification: `dispatchMulti()` with empty array returns empty array

---

## Notes

- The `dispatch()` method catches all errors internally and returns a result object. This ensures that `dispatchMulti()` can collect all results without one failure aborting the entire batch.
- The exhaustive `default` case with `never` type ensures compile-time safety if a new channel type is added to the union without updating the switch.
- `metadata` is passed through to channel implementations for use cases like phone numbers (SMS), device tokens (push), or email template variables.
- The `Promise.allSettled()` pattern ensures maximum delivery — a failure in the SMS provider does not prevent the email or push notification from being sent.
