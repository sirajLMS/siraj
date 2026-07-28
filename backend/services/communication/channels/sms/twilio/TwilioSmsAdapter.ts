import twilio from "twilio";
import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type { ISmsChannel, SmsPayload, SmsSendResult } from "@/backend/services/communication/channels/sms/ISmsChannel";
import type {
  TwilioRateLimitConfig,
  TwilioSmsContext,
} from "@/backend/services/communication/channels/sms/twilio/twilio.types";
import { deliveryFailedMessage } from "@/backend/services/communication/utils";

const DEFAULT_SMS_RATE_LIMIT_PER_HOUR = 3;

export class TwilioSmsAdapter implements ISmsChannel {
  private readonly context: TwilioSmsContext;
  private readonly rateLimitConfig: TwilioRateLimitConfig;

  constructor() {
    const {
      twilioAccountSid: accountSid,
      twilioAuthToken: authToken,
      twilioFromNumber: fromNumber,
    } = getEnvironmentConfig();

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

  async send(payload: SmsPayload, _locale?: string): Promise<SmsSendResult> {
    // Defensive guard: a non-empty `to` is required before we touch the
    // provider. This turns a future dispatch path that forgets `metadata.to`
    // into an actionable local failure instead of a cryptic provider error.
    // We still record a `FAILED` delivery row so the audit trail shows why.
    if (!payload.to?.trim()) {
      logger.error("TwilioSmsAdapter: empty recipient `to` — dropping payload", {
        userId: payload.userId,
        eventType: payload.eventType,
      });

      const delivery = await NotificationRepository.createDelivery({
        userId: payload.userId,
        channel: NotificationChannel.SMS,
        eventType: payload.eventType,
        title: "SMS",
        body: payload.to,
        metadata: payload.metadata ?? null,
      });
      await NotificationRepository.updateDeliveryStatus({
        deliveryId: delivery.id,
        status: NotificationDeliveryStatus.FAILED,
        failureReason: "empty recipient address",
      });

      return {
        success: false,
        error: "empty recipient address",
      };
    }

    const rateLimitResult = await this.checkRateLimit(payload.userId);
    if (rateLimitResult) return rateLimitResult;

    const delivery = await NotificationRepository.createDelivery({
      userId: payload.userId,
      channel: NotificationChannel.SMS,
      eventType: payload.eventType,
      title: "SMS",
      body: payload.to,
      metadata: payload.metadata ?? null,
    });

    return this.sendTwilioMessage(payload, delivery.id);
  }

  private async checkRateLimit(userId: string): Promise<SmsSendResult | null> {
    const smsCount = await NotificationRepository.getSmsCountInLastHour(userId);

    if (smsCount < this.rateLimitConfig.maxSmsPerHour) return null;

    logger.warn("SMS rate limit exceeded for user", {
      userId,
      smsCount,
      maxPerHour: this.rateLimitConfig.maxSmsPerHour,
    });

    return {
      success: false,
      rateLimited: true,
      error: `SMS rate limit exceeded: ${smsCount}/${this.rateLimitConfig.maxSmsPerHour} in the last hour`,
    };
  }

  private async sendTwilioMessage(payload: SmsPayload, deliveryId: string): Promise<SmsSendResult> {
    try {
      const message = await this.context.client.messages.create({
        to: payload.to,
        from: this.context.fromNumber,
        body: payload.body,
      });

      if (message.errorCode) {
        return this.handleTwilioApiError(deliveryId, message);
      }

      await NotificationRepository.updateDeliveryStatus({
        deliveryId,
        status: NotificationDeliveryStatus.SENT,
        providerMessageId: message.sid,
      });

      logger.info("SMS sent successfully via Twilio", {
        deliveryId,
        providerMessageId: message.sid,
      });

      return {
        success: true,
        providerMessageId: message.sid,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("Failed to send SMS via Twilio", {
        deliveryId,
        error: errorMessage,
      });

      await NotificationRepository.updateDeliveryStatus({
        deliveryId,
        status: NotificationDeliveryStatus.FAILED,
        failureReason: errorMessage,
      });

      return {
        success: false,
        error: deliveryFailedMessage("sms"),
      };
    }
  }

  private async handleTwilioApiError(
    deliveryId: string,
    message: { sid: string; errorCode: number | null; errorMessage: string | null }
  ): Promise<SmsSendResult> {
    logger.error("Twilio API returned an error", {
      deliveryId,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    });

    const failureReason = message.errorMessage ?? `Twilio error code: ${message.errorCode}`;

    await NotificationRepository.updateDeliveryStatus({
      deliveryId,
      status: NotificationDeliveryStatus.FAILED,
      providerMessageId: message.sid,
      failureReason,
    });

    return {
      success: false,
      providerMessageId: message.sid,
      error: deliveryFailedMessage("sms"),
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      const {
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken,
        twilioFromNumber: fromNumber,
      } = getEnvironmentConfig();

      return !!accountSid && !!authToken && !!fromNumber;
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
