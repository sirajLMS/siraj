import { NotificationRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib";
import { OnAppChannel } from "@/backend/services";
import { emailChannel } from "@/backend/services/communication/channels/email";
import { pushChannel } from "@/backend/services/communication/channels/push";
import { smsChannel } from "@/backend/services/communication/channels/sms";
import type { ChannelDispatchResult, CommunicationPayload } from "@/backend/types";
import type { NotificationDeliverySelectType } from "@/backend/types/notifications/notificationDeliveries.types";

export namespace CommunicationService {
  async function dispatchOnApp(payload: CommunicationPayload, locale?: string): Promise<ChannelDispatchResult> {
    await OnAppChannel.send(payload, locale);
    return { channel: "on_app", success: true };
  }

  async function dispatchRecipientChannel(
    payload: CommunicationPayload,
    locale?: string
  ): Promise<ChannelDispatchResult> {
    const to = (payload.metadata?.to as string) ?? "";
    const commonFields = { to, eventType: payload.eventType, userId: payload.userId };

    const isEmail = payload.channel === "email";
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
      },
      locale
    );
    return {
      channel: "push",
      success: result.success,
      error: result.errors?.join("; "),
    };
  }

  export async function dispatch(payload: CommunicationPayload, locale?: string): Promise<ChannelDispatchResult> {
    try {
      switch (payload.channel) {
        case "on_app":
          return await dispatchOnApp(payload, locale);
        case "email":
        case "sms":
          return await dispatchRecipientChannel(payload, locale);
        case "push":
          return await dispatchPush(payload, locale);
        default: {
          const _exhaustiveCheck: never = payload.channel;
          logger.error("Unknown communication channel", {
            channel: _exhaustiveCheck,
            userId: payload.userId,
          });
          return {
            channel: payload.channel,
            success: false,
            error: `Unknown communication channel: ${String(_exhaustiveCheck)}`,
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

    const results = await Promise.allSettled(payloads.map(p => dispatch(p, locale)));

    const dispatchResults: ChannelDispatchResult[] = [];
    let failureCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        dispatchResults.push(result.value);
        if (!result.value.success) {
          failureCount++;
        }
      } else {
        failureCount++;
        dispatchResults.push({
          channel: payloads[i].channel,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : "Unknown dispatch error",
        });
      }
    }

    if (failureCount > 0) {
      logger.error("Multi-channel dispatch had failures", {
        failureCount,
        totalChannels: payloads.length,
      });
    }

    const successCount = dispatchResults.filter(r => r.success).length;
    logger.info("Multi-channel dispatch complete", {
      totalChannels: payloads.length,
      successCount,
      failureCount,
    });

    return dispatchResults;
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function createManyDeliveries(
    inputs: Parameters<typeof NotificationRepository.createManyDeliveries>[0]
  ): Promise<NotificationDeliverySelectType[]> {
    return NotificationRepository.createManyDeliveries(inputs);
  }
}
