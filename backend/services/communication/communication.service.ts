import { NotificationRepository } from "@/backend/db/repo/notifications";
import { NotificationChannel } from "@/backend/enum";
import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { logger } from "@/backend/lib";
import { WhatsappNoSenderForPurposeError } from "@/backend/lib/errors";
import { emailChannel } from "@/backend/services/communication/channels/email";
import { OnAppChannel } from "@/backend/services/communication/channels/on-app.channel";
import { pushChannel } from "@/backend/services/communication/channels/push";
import { smsChannel } from "@/backend/services/communication/channels/sms";
import { getChannelForPurpose } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import {
  asNotificationMetadata,
  buildWhatsappTemplateComponents,
  isStringRecord,
  isWhatsappTemplateMetadata,
} from "@/backend/services/communication/communication.service.helpers";
import type { ChannelDispatchResult, CommunicationPayload, NotificationDeliverySelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

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
   * Dedicated WhatsApp dispatch branch (never routed through the
   * email/sms-shaped `dispatchRecipientChannel`).
   *
   * Reads `metadata.whatsappTemplate` (stamped by `notification-payloads.builders`
   * via `NOTIFICATION_TEMPLATE_MAP`) and resolves the sending account by the
   * template's routing purpose — the active account carrying that purpose,
   * falling back to the active GENERAL account (`getChannelForPurpose` logs
   * the fallback). When no account qualifies the send fails fast with the
   * `whatsapp.noSenderForPurpose` domain code; no delivery row is created.
   *
   * The resolved account is stamped onto the payload (`senderAccountId`,
   * `purpose`) and into the delivery-row metadata for attribution.
   *
   * Fails fast with a clear error if `whatsappTemplate` is missing — this
   * indicates a misconfigured event (event allowlisted for WhatsApp but no
   * template in `NOTIFICATION_TEMPLATE_MAP`).
   *
   * Propagates `result.sendAttempted` so `dispatchMulti` can log tier-budget
   * accounting (failed sends that reached Meta still consume budget), and
   * `result.errorCode` so pre-flight domain failures stay machine-readable.
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

    const purpose = templateRaw.purpose ?? WhatsappAccountPurpose.GENERAL;
    const sender = await getChannelForPurpose(purpose);
    if (!sender) {
      const noSender = new WhatsappNoSenderForPurposeError(tErrors.whatsappNoSenderForPurpose);
      logger.logDomainError("dispatchWhatsapp: no active sender account for purpose", {
        purpose,
        userId: payload.userId,
        eventType: payload.eventType,
        templateName: templateRaw.name,
        errorCode: noSender.code,
      });
      return {
        channel: NotificationChannel.WHATSAPP,
        success: false,
        error: noSender.message,
        errorCode: noSender.code,
        sendAttempted: false,
      };
    }

    logger.info("dispatchWhatsapp: routed send to account", {
      purpose,
      accountId: sender.accountId,
      userId: payload.userId,
      eventType: payload.eventType,
      templateName: templateRaw.name,
    });

    const components = buildWhatsappTemplateComponents(templateRaw, payload);

    // Resolve `languageCode` from the recipient's locale; fall back to "en" only
    // as a last resort. A fully locale-correct selection would look up the
    // synced template row's `languageCode` from the template service instead of
    // deriving it from the locale string alone.
    const languageCode = templateRaw.languageCode ?? (locale ? locale.split("-")[0] : "en");

    const notificationMetadata = asNotificationMetadata(payload.metadata);
    const result = await sender.channel.send(
      {
        to,
        eventType: payload.eventType,
        userId: payload.userId,
        template: {
          name: templateRaw.name,
          languageCode,
        },
        components,
        senderAccountId: sender.accountId,
        purpose,
        metadata: notificationMetadata ? { ...notificationMetadata, senderAccountId: sender.accountId } : null,
      },
      locale
    );

    return {
      channel: NotificationChannel.WHATSAPP,
      success: result.success,
      providerMessageId: result.providerMessageId,
      error: result.error,
      errorCode: result.errorCode,
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
      logger.logDomainError("Multi-channel dispatch had failures", {
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
