import { Resend } from "resend";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { logger } from "@/backend/lib/logger";
import { NotificationChannel, NotificationDeliveryStatus } from "@/shared/lib/enum";
import type { EmailPayload, EmailSendResult, IEmailChannel } from "../IEmailChannel";
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

  async send(payload: EmailPayload, _locale?: string): Promise<EmailSendResult> {
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

      return !!apiKey && !!fromEmail;
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
