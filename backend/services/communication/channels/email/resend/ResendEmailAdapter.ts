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
import { deliveryFailedMessage } from "@/backend/services/communication/utils";
import type { ResendEmailContext } from "@/backend/types";

/** Resend simulator inboxes — integration tests send here intentionally; never redirect. */
const RESEND_SIMULATOR_DOMAIN = "@resend.dev";

/** Dedupes redirected test sends so N reviewers do not burn N API calls to the same inbox. */
const redirectedTestSendKeys = new Set<string>();

/**
 * In `NODE_ENV=test`, redirect outbound email to `RESEND_TEST_TO_EMAIL` so service
 * tests that dispatch without mocks can hit the real adapter without Resend rejecting
 * seed/DB addresses like `@example.com`. Simulator addresses are left unchanged.
 */
function resolveEmailRecipientForTest(to: string): string {
  if (process.env.NODE_ENV !== "test") return to;

  const testTo = process.env.RESEND_TEST_TO_EMAIL?.trim();
  if (!testTo) return to;
  if (to.endsWith(RESEND_SIMULATOR_DOMAIN)) return to;

  return testTo;
}

function shouldSkipRedirectedTestDuplicate(originalTo: string, recipient: string, subject: string): boolean {
  if (process.env.NODE_ENV !== "test") return false;
  if (originalTo === recipient) return false;

  const key = `${recipient}\0${subject}`;
  if (redirectedTestSendKeys.has(key)) return true;
  redirectedTestSendKeys.add(key);
  return false;
}

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

  async send(payload: EmailPayload, locale = "en"): Promise<EmailSendResult> {
    // Defensive guard: a non-empty `to` is required before we touch the
    // provider. This turns a future dispatch path that forgets `metadata.to`
    // into an actionable local failure instead of a cryptic provider error
    // (`Invalid \`to\` field`). We still record a `FAILED` delivery row so the
    // audit trail shows why the payload was dropped.
    if (!payload.to?.trim()) {
      return this.handleEmptyRecipient(payload);
    }

    const originalTo = payload.to.trim();
    const recipient = resolveEmailRecipientForTest(originalTo);

    if (shouldSkipRedirectedTestDuplicate(originalTo, recipient, payload.subject)) {
      return { success: true, providerMessageId: "test-redirect-deduped" };
    }

    const delivery = await this.createEmailDelivery(payload);
    return this.executeSend(delivery, payload, recipient, locale);
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
    payload: EmailPayload,
    recipient: string,
    locale: string
  ): Promise<EmailSendResult> {
    if (
      ((process.env.NODE_ENV as string) === "test" || process.env.TEST_SERVER === "1") &&
      !recipient.endsWith(RESEND_SIMULATOR_DOMAIN)
    ) {
      return this.handleSendSuccess(delivery.id, `mock-resend-msg-${delivery.id}`);
    }

    try {
      const response = await this.context.client.emails.send({
        from: this.context.fromEmail,
        to: recipient,
        subject: payload.subject,
        html: payload.html,
      });

      if (response.error) {
        return this.handleResendApiError(delivery.id, response.error, locale);
      }

      return this.handleSendSuccess(delivery.id, response.data?.id);
    } catch (error) {
      return this.handleSendException(delivery.id, error, locale);
    }
  }

  private async handleResendApiError(
    deliveryId: string,
    error: { name: string; message: string },
    locale: string
  ): Promise<EmailSendResult> {
    const isRateLimit =
      error.name === "rate_limit_exceeded" ||
      error.name?.toLowerCase().includes("rate_limit") ||
      error.message?.toLowerCase().includes("rate limit") ||
      error.message?.includes("429");

    if (isRateLimit) {
      logger.logDomainError("Resend API rate limit exceeded", {
        errorName: error.name,
        errorMessage: error.message,
      });
    } else {
      logger.error("Resend API returned an error", {
        errorName: error.name,
        errorMessage: error.message,
      });
    }

    await NotificationRepository.updateDeliveryStatus({
      deliveryId,
      status: NotificationDeliveryStatus.FAILED,
      failureReason: isRateLimit ? `Rate limit exceeded: ${error.message}` : error.message,
    });

    return {
      success: false,
      rateLimited: isRateLimit,
      error: deliveryFailedMessage(NotificationChannel.EMAIL, locale),
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

  private async handleSendException(deliveryId: string, error: unknown, locale: string): Promise<EmailSendResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = errorMessage.toLowerCase().includes("rate limit") || errorMessage.includes("429");

    if (isRateLimit) {
      logger.logDomainError("Resend email send rate limited", {
        deliveryId,
        error: errorMessage,
      });
    } else {
      logger.error("Failed to send email via Resend", {
        deliveryId,
        error: errorMessage,
      });
    }

    await NotificationRepository.updateDeliveryStatus({
      deliveryId,
      status: NotificationDeliveryStatus.FAILED,
      failureReason: errorMessage,
    });

    return {
      success: false,
      rateLimited: isRateLimit,
      error: deliveryFailedMessage(NotificationChannel.EMAIL, locale),
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
