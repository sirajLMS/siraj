import twilio from "twilio";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { logger } from "@/backend/lib/logger";
import { NotificationChannel, NotificationDeliveryStatus } from "@/shared/lib/enum";
import type { ISmsChannel, SmsPayload, SmsSendResult } from "../ISmsChannel";
import type { TwilioRateLimitConfig, TwilioSmsContext } from "./twilio.types";

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

  async send(payload: SmsPayload, _locale?: string): Promise<SmsSendResult> {
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
