import { NotificationRepository } from "@/backend/db/repo/notifications";
import { NotificationChannel } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { emailChannel } from "@/backend/services/communication/channels/email";
import { OnAppChannel } from "@/backend/services/communication/channels/on-app.channel";
import { pushChannel } from "@/backend/services/communication/channels/push";
import { smsChannel } from "@/backend/services/communication/channels/sms";
import { whatsappChannel } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import type {
  ChannelDispatchResult,
  CommunicationPayload,
  NotificationDeliverySelectType,
  NotificationEntityKind,
  NotificationMetadata,
  WhatsappTemplateComponent,
  WhatsappTemplateMetadata,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const NOTIFICATION_ENTITY_KINDS: readonly NotificationEntityKind[] = [
  "invoice",
  "class",
  "student",
  "complaint",
  "suggestion",
  "paymentMethod",
  "schedule",
  "lessonReport",
];

/** Type guard: narrows an untyped `metadata` blob to a valid `NotificationMetadata`. */
function isNotificationMetadata(metadata: unknown): metadata is NotificationMetadata {
  if (metadata === null || typeof metadata !== "object") return false;
  const entries = Object.entries(metadata);
  const entityKind = entries.find(([k]) => k === "entityKind")?.[1];
  const entityId = entries.find(([k]) => k === "entityId")?.[1];
  if (typeof entityKind !== "string" || typeof entityId !== "string") {
    return false;
  }
  return NOTIFICATION_ENTITY_KINDS.some(kind => kind === entityKind);
}

function asNotificationMetadata(metadata: Record<string, unknown> | undefined): NotificationMetadata | null {
  return isNotificationMetadata(metadata) ? metadata : null;
}

/** Type guard: narrows an untyped value to `Record<string, string>` (for push `data`). */
function isStringRecord(value: unknown): value is Record<string, string> {
  if (value === null || typeof value !== "object") return false;
  return Object.entries(value).every(([, v]) => typeof v === "string");
}

/**
 * Type guard: validates that an untyped value matches `WhatsappTemplateMetadata`.
 * Avoids unsafe `as` assertions by validating each property at runtime.
 */
function isWhatsappTemplateMetadata(value: unknown): value is WhatsappTemplateMetadata {
  if (value === null || typeof value !== "object") return false;
  const entries = Object.entries(value);
  const name = entries.find(([k]) => k === "name")?.[1];
  if (typeof name !== "string") return false;
  const languageCode = entries.find(([k]) => k === "languageCode")?.[1];
  if (languageCode != null && typeof languageCode !== "string") {
    return false;
  }
  const paramsOrder = entries.find(([k]) => k === "paramsOrder")?.[1];
  if (paramsOrder !== undefined) {
    if (!Array.isArray(paramsOrder)) return false;
    if (!paramsOrder.every(p => typeof p === "string")) return false;
  }
  return true;
}

export namespace CommunicationService {
  async function dispatchOnApp(payload: CommunicationPayload, locale?: string): Promise<ChannelDispatchResult> {
    await OnAppChannel.send(payload, locale);
    return { channel: NotificationChannel.ON_APP, success: true };
  }

  async function dispatchRecipientChannel(
    payload: CommunicationPayload,
    locale?: string
  ): Promise<ChannelDispatchResult> {
    const to = typeof payload.metadata?.to === "string" ? payload.metadata.to : "";
    const commonFields = {
      to,
      eventType: payload.eventType,
      userId: payload.userId,
      metadata: asNotificationMetadata(payload.metadata),
    };

    const isEmail = payload.channel === NotificationChannel.EMAIL;
    const result = isEmail
      ? await emailChannel.send({ ...commonFields, subject: payload.title, html: payload.body ?? "" }, locale)
      : await smsChannel.send({ ...commonFields, body: payload.body ?? "" }, locale);

    return {
      channel: payload.channel,
      success: result.success,
      providerMessageId: result.providerMessageId,
      error: result.error,
    };
  }

  async function dispatchPush(payload: CommunicationPayload, locale?: string): Promise<ChannelDispatchResult> {
    const result = await pushChannel.send(
      {
        userId: payload.userId,
        title: payload.title,
        body: payload.body ?? "",
        data: isStringRecord(payload.metadata?.data) ? payload.metadata.data : undefined,
        eventType: payload.eventType,
        metadata: asNotificationMetadata(payload.metadata),
      },
      locale
    );
    return {
      channel: NotificationChannel.PUSH,
      success: result.success,
      error: result.errors?.join("; "),
    };
  }

  /**
   * Dedicated WhatsApp dispatch branch (C2 — never route through the
   * email/sms-shaped `dispatchRecipientChannel`).
   *
   * Reads `metadata.whatsappTemplate` (stamped by `notification-payloads.builders`
   * via `NOTIFICATION_TEMPLATE_MAP`, B1) and calls `whatsappChannel.send` with
   * a proper `WhatsappPayload`.
   *
   * Fails fast with a clear error if `whatsappTemplate` is missing — this
   * indicates a misconfigured event (event allowlisted for WhatsApp but no
   * template in `NOTIFICATION_TEMPLATE_MAP`).
   *
   * Q4: Propagates `result.sendAttempted` so `dispatchMulti` can log tier-budget
   * accounting (failed sends that reached Meta still consume budget).
   */
  async function dispatchWhatsapp(payload: CommunicationPayload, locale?: string): Promise<ChannelDispatchResult> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    const to = typeof payload.metadata?.to === "string" ? payload.metadata.to : "";

    const templateRaw = isWhatsappTemplateMetadata(payload.metadata?.whatsappTemplate)
      ? payload.metadata.whatsappTemplate
      : undefined;

    if (!templateRaw?.name) {
      logger.error("dispatchWhatsapp: whatsappTemplate missing in payload metadata", {
        userId: payload.userId,
        eventType: payload.eventType,
      });
      return {
        channel: NotificationChannel.WHATSAPP,
        success: false,
        error: tErrors.whatsappTemplateMissing,
      };
    }

    const components: WhatsappTemplateComponent[] | undefined = templateRaw.paramsOrder
      ? templateRaw.paramsOrder.map(paramName => {
          const paramValue = payload.metadata?.[paramName];
          if (paramValue == null || paramValue === "") {
            // r7-021: Log a warning before substituting with empty string
            // so missing template params are observable — silently sending
            // blank values masks data-integrity bugs.
            logger.warn("dispatchWhatsapp: missing template param substituted with empty string", {
              paramName,
              userId: payload.userId,
              eventType: payload.eventType,
              templateName: templateRaw.name,
            });
          }
          // Safely stringify paramValue to avoid "[object Object]" for objects
          // (paramValue is unknown from Record<string, unknown>)
          const textValue = (() => {
            if (paramValue == null) {
              return "";
            }
            if (Array.isArray(paramValue)) {
              // For arrays, join elements safely - each element stringified
              // Note: we must handle each element individually to avoid "[object Object]"
              // when an array contains objects
              return paramValue
                .map(v => {
                  if (v == null) {
                    return "";
                  }
                  if (typeof v === "object") {
                    return JSON.stringify(v);
                  }
                  return String(v);
                })
                .join(", ");
            }
            if (typeof paramValue === "object") {
              // Plain objects - use JSON.stringify
              return JSON.stringify(paramValue);
            }
            // Primitives (string, number, boolean, etc.)
            return typeof paramValue === "string" ? paramValue : JSON.stringify(paramValue);
          })();
          return {
            type: "body" as const,
            parameters: [
              {
                type: "text" as const,
                text: textValue,
              },
            ],
          };
        })
      : undefined;

    // r7-020: Resolve languageCode from the recipient's locale.
    // The pure builder stamps `languageCode: null` (previously hardcoded "en").
    // If the dispatch layer has a locale, use its language code; fall back to "en"
    // only as a last resort.
    // NOTE: A fully locale-correct selection would look up the synced template
    // row's `languageCode` from the template service (B6) instead of deriving
    // from the locale string alone.
    const languageCode = templateRaw.languageCode ?? (locale ? locale.split("-")[0] : "en");

    const result = await whatsappChannel.send(
      {
        to,
        eventType: payload.eventType,
        userId: payload.userId,
        template: {
          name: templateRaw.name,
          languageCode,
        },
        components,
        metadata: asNotificationMetadata(payload.metadata),
      },
      locale
    );

    return {
      channel: NotificationChannel.WHATSAPP,
      success: result.success,
      providerMessageId: result.providerMessageId,
      error: result.error,
      sendAttempted: result.sendAttempted,
    };
  }

  export async function dispatch(payload: CommunicationPayload, locale?: string): Promise<ChannelDispatchResult> {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    try {
      switch (payload.channel) {
        case NotificationChannel.ON_APP:
          return await dispatchOnApp(payload, locale);
        case NotificationChannel.EMAIL:
        case NotificationChannel.SMS:
          return await dispatchRecipientChannel(payload, locale);
        case NotificationChannel.PUSH:
          return await dispatchPush(payload, locale);
        case NotificationChannel.WHATSAPP:
          return await dispatchWhatsapp(payload, locale);
        default: {
          const exhaustiveCheck: never = payload.channel;
          logger.error(tErrors.unknownCommunicationChannel(String(exhaustiveCheck)), {
            channel: exhaustiveCheck,
            userId: payload.userId,
          });
          return {
            channel: payload.channel,
            success: false,
            error: tErrors.unknownCommunicationChannel(String(exhaustiveCheck)),
          };
        }
      }
    } catch (error) {
      logger.error("CommunicationService.dispatch failed", {
        userId: payload.userId,
        channel: payload.channel,
        eventType: payload.eventType,
        error,
      });

      return {
        channel: payload.channel,
        success: false,
        error: error instanceof Error ? error.message : tErrors.unknownError,
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

    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    const results = await Promise.allSettled(payloads.map(p => dispatch(p, locale)));

    const { dispatchResults, failureCount, whatsappBudgetConsumed } = processDispatchResults(
      results,
      payloads,
      tErrors
    );

    if (failureCount > 0) {
      if ((process.env.NODE_ENV as string) === "test" || process.env.TEST_SERVER === "1") {
        logger.debug("Multi-channel dispatch had failures in test mode", {
          failureCount,
          totalChannels: payloads.length,
        });
      } else {
        logger.error("Multi-channel dispatch had failures", {
          failureCount,
          totalChannels: payloads.length,
        });
      }
    }

    if (whatsappBudgetConsumed > 0) {
      logger.info("WhatsApp tier-budget accounting (Q4)", {
        whatsappBudgetConsumed,
        totalWhatsappPayloads: payloads.filter(p => p.channel === NotificationChannel.WHATSAPP).length,
      });
    }

    const successCount = dispatchResults.filter(r => r.success).length;
    logger.info("Multi-channel dispatch complete", {
      totalChannels: payloads.length,
      successCount,
      failureCount,
      ...(whatsappBudgetConsumed > 0 ? { whatsappBudgetConsumed } : {}),
    });

    return dispatchResults;
  }

  /** Process Promise.allSettled results into dispatch results and accounting metrics. */
  function processDispatchResults(
    results: PromiseSettledResult<ChannelDispatchResult>[],
    payloads: CommunicationPayload[],
    tErrors: ReturnType<typeof getServerTranslations>["errorsTranslations"]
  ): { dispatchResults: ChannelDispatchResult[]; failureCount: number; whatsappBudgetConsumed: number } {
    const dispatchResults: ChannelDispatchResult[] = [];
    let failureCount = 0;
    let whatsappBudgetConsumed = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        dispatchResults.push(result.value);
        if (!result.value.success) {
          failureCount++;
        }
        // Q4: WhatsApp sends that reached Meta consume tier budget even on failure.
        if (result.value.channel === NotificationChannel.WHATSAPP && result.value.sendAttempted) {
          whatsappBudgetConsumed++;
        }
      } else {
        failureCount++;
        dispatchResults.push({
          channel: payloads[i].channel,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : tErrors.unknownDispatchError,
        });
      }
    }

    return { dispatchResults, failureCount, whatsappBudgetConsumed };
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function createManyDeliveries(
    inputs: Parameters<typeof NotificationRepository.createManyDeliveries>[0]
  ): Promise<NotificationDeliverySelectType[]> {
    return NotificationRepository.createManyDeliveries(inputs);
  }
}
