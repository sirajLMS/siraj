import { Resend } from "resend";
import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type {
  EmailPayload,
  EmailSendResult,
  IEmailChannel,
} from "@/backend/services/communication/channels/email/IEmailChannel";
import type { ResendEmailContext } from "@/backend/services/communication/channels/email/resend/resend.types";
import { deliveryFailedMessage } from "@/backend/services/communication/utils";

export class ResendEmailAdapter implements IEmailChannel {
  private readonly context: ResendEmailContext;

  constructor() {
    const { resendApiKey: apiKey, resendFromEmail: fromEmail } = getEnvironmentConfig();

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
    // Defensive guard: a non-empty `to` is required before we touch the
    // provider. This turns a future dispatch path that forgets `metadata.to`
    // into an actionable local failure instead of a cryptic provider error
    // (`Invalid \`to\` field`). We still record a `FAILED` delivery row so the
    // audit trail shows why the payload was dropped.
    if (!payload.to?.trim()) {
      logger.error("ResendEmailAdapter: empty recipient `to` — dropping payload", {
        userId: payload.userId,
        eventType: payload.eventType,
      });

      const delivery = await NotificationRepository.createDelivery({
        userId: payload.userId,
        channel: NotificationChannel.EMAIL,
        eventType: payload.eventType,
        title: payload.subject,
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

    const delivery = await NotificationRepository.createDelivery({
      userId: payload.userId,
      channel: NotificationChannel.EMAIL,
      eventType: payload.eventType,
      title: payload.subject,
      body: payload.to,
      metadata: payload.metadata ?? null,
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
          error: deliveryFailedMessage("email"),
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
        error: deliveryFailedMessage("email"),
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const { resendApiKey: apiKey, resendFromEmail: fromEmail } = getEnvironmentConfig();

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
