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

/**
 * Optional explicit overrides for the Resend adapter credentials.
 *
 * When omitted, the adapter falls back to `getEnvironmentConfig()` so that
 * existing tests (`new ResendEmailAdapter()`) keep working unchanged. When
 * provided (e.g. by `EmailChannelFactory.createResendAdapter()`), the
 * DB-resolved values are used directly, bypassing the cached env config.
 */
export interface ResendEmailAdapterOptions {
  apiKey?: string;
  fromEmail?: string;
}

export class ResendEmailAdapter implements IEmailChannel {
  private readonly context: ResendEmailContext;

  constructor(opts?: ResendEmailAdapterOptions) {
    // Resolve from the cached env config only when the caller did not provide an override.
    // Keeping a single `getEnvironmentConfig()` call (vs. two) avoids a duplicate singleton lookup on the no-arg path used by tests.
    const envConfig = opts?.apiKey !== undefined && opts?.fromEmail !== undefined ? null : getEnvironmentConfig();
    const apiKey = opts?.apiKey ?? envConfig?.resendApiKey;
    const fromEmail = opts?.fromEmail ?? envConfig?.resendFromEmail;

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
      return this.handleEmptyRecipient(payload);
    }

    const delivery = await this.createEmailDelivery(payload);
    return this.executeSend(delivery, payload);
  }

  private async handleEmptyRecipient(payload: EmailPayload): Promise<EmailSendResult> {
    logger.error("ResendEmailAdapter: empty recipient `to` — dropping payload", {
      userId: payload.userId,
      eventType: payload.eventType,
    });

    const delivery = await this.createEmailDelivery(payload);
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

  private createEmailDelivery(payload: EmailPayload) {
    return NotificationRepository.createDelivery({
      userId: payload.userId,
      channel: NotificationChannel.EMAIL,
      eventType: payload.eventType,
      title: payload.subject,
      body: payload.to,
      metadata: payload.metadata ?? null,
    });
  }

  private async executeSend(
    delivery: Awaited<ReturnType<typeof NotificationRepository.createDelivery>>,
    payload: EmailPayload
  ): Promise<EmailSendResult> {
    try {
      const response = await this.context.client.emails.send({
        from: this.context.fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      if (response.error) {
        return this.handleResendApiError(delivery.id, response.error);
      }

      return this.handleSendSuccess(delivery.id, response.data?.id);
    } catch (error) {
      return this.handleSendException(delivery.id, error);
    }
  }

  private async handleResendApiError(
    deliveryId: string,
    error: { name: string; message: string }
  ): Promise<EmailSendResult> {
    logger.error("Resend API returned an error", {
      errorName: error.name,
      errorMessage: error.message,
    });

    await NotificationRepository.updateDeliveryStatus({
      deliveryId,
      status: NotificationDeliveryStatus.FAILED,
      failureReason: error.message,
    });

    return {
      success: false,
      error: deliveryFailedMessage("email"),
    };
  }

  private async handleSendSuccess(deliveryId: string, providerMessageId: string | undefined): Promise<EmailSendResult> {
    await NotificationRepository.updateDeliveryStatus({
      deliveryId,
      status: NotificationDeliveryStatus.SENT,
      providerMessageId: providerMessageId ?? null,
    });

    logger.info("Email sent successfully via Resend", {
      deliveryId,
      providerMessageId,
    });

    return {
      success: true,
      providerMessageId,
    };
  }

  private async handleSendException(deliveryId: string, error: unknown): Promise<EmailSendResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Failed to send email via Resend", {
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
      error: deliveryFailedMessage("email"),
    };
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
