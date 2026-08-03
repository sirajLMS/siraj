import { NotificationRepository } from "@/backend/db/repo";
import { NotificationChannel } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { OnAppChannel } from "@/backend/services";
import { emailChannel } from "@/backend/services/communication/channels/email";
import { pushChannel } from "@/backend/services/communication/channels/push";
import { smsChannel } from "@/backend/services/communication/channels/sms";
import { whatsappChannel } from "@/backend/services/communication/channels/whatsapp";
import type { ChannelDispatchResult, CommunicationPayload, NotificationMetadata } from "@/backend/types";
import type { NotificationDeliverySelectType } from "@/backend/types/notifications/notificationDeliveries.types";
import type { WhatsappTemplateMetadata } from "@/backend/types/whatsapp/whatsapp-account.types";
import type { WhatsappTemplateComponent } from "@/backend/types/whatsapp/whatsapp-channel.types";
import { getServerTranslations } from "@/shared/locale";

function asNotificationMetadata(metadata: Record<string, unknown> | undefined): NotificationMetadata | null {
  if (!metadata || typeof metadata.entityKind !== "string" || typeof metadata.entityId !== "string") {
    return null;
  }
  return metadata as unknown as NotificationMetadata;
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
    const to = (payload.metadata?.to as string) ?? "";
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
        data: payload.metadata?.data as Record<string, string> | undefined,
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
    const to = (payload.metadata?.to as string) ?? "";

    const templateRaw = payload.metadata?.whatsappTemplate as WhatsappTemplateMetadata | undefined;

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
          if (paramValue === undefined || paramValue === null || paramValue === "") {
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
          return {
            type: "body" as const,
            parameters: [
              {
                type: "text" as const,
                text: String(paramValue ?? ""),
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
          const _exhaustiveCheck: never = payload.channel;
          logger.error(tErrors.unknownCommunicationChannel(String(_exhaustiveCheck)), {
            channel: _exhaustiveCheck,
            userId: payload.userId,
          });
          return {
            channel: payload.channel,
            success: false,
            error: tErrors.unknownCommunicationChannel(String(_exhaustiveCheck)),
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
      logger.error("Multi-channel dispatch had failures", {
        failureCount,
        totalChannels: payloads.length,
      });
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
