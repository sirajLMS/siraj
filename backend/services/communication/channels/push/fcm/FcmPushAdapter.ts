import { cert, deleteApp, getApp, getApps, initializeApp } from "firebase-admin/app";
import type { BatchResponse, Message, SendResponse } from "firebase-admin/messaging";
import { getMessaging } from "firebase-admin/messaging";
import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type { FcmPushContext } from "@/backend/services/communication/channels/push/fcm/fcm.types";
import {
  FCM_INVALID_TOKEN_ERROR,
  FCM_TOKEN_EXPIRED_ERROR,
} from "@/backend/services/communication/channels/push/fcm/fcm.types";
import type {
  IPushChannel,
  PushPayload,
  PushSendResult,
} from "@/backend/services/communication/channels/push/IPushChannel";
import { deliveryFailedMessage } from "@/backend/services/communication/utils";
import type { NotificationDeliverySelectType } from "@/backend/types/notifications/notificationDeliveries.types";
import type { UserDeviceTokenSelectType } from "@/backend/types/users/userDeviceTokens.types";

export class FcmPushAdapter implements IPushChannel {
  private readonly context: FcmPushContext;

  /**
   * Optional dependency-injection constructor.
   *
   * - With no arguments (`new FcmPushAdapter()`), falls back to `getEnvironmentConfig()`
   *   for the Firebase service-account credentials — this preserves backwards compatibility
   *   for existing tests that construct the adapter no-arg.
   * - With `opts` provided (factory path), uses the resolved values directly, bypassing
   *   `getEnvironmentConfig()` so the env-config DB override layer is the single source of
   *   truth for the factory.
   *
   * The same `FIREBASE_* environment variable is required for FcmPushAdapter` errors are
   * thrown regardless of which path supplied the credentials, so the factory can propagate
   * them unchanged to callers.
   */
  constructor(opts?: { projectId?: string; privateKey?: string; clientEmail?: string }) {
    const projectId = opts?.projectId ?? getEnvironmentConfig().firebaseProjectId;
    const privateKey = opts?.privateKey ?? getEnvironmentConfig().firebasePrivateKey;
    const clientEmail = opts?.clientEmail ?? getEnvironmentConfig().firebaseClientEmail;

    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID environment variable is required for FcmPushAdapter");
    }

    if (!privateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY environment variable is required for FcmPushAdapter");
    }

    if (!clientEmail) {
      throw new Error("FIREBASE_CLIENT_EMAIL environment variable is required for FcmPushAdapter");
    }

    const normalizedPrivateKey = privateKey.replaceAll(String.raw`\n`, "\n"); // NoSonar

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          privateKey: normalizedPrivateKey,
          clientEmail,
        }),
      });
    }

    this.context = {
      messaging: getMessaging(getApp()),
      projectId,
    };
  }

  async send(payload: PushPayload, locale = "en"): Promise<PushSendResult> {
    const deviceTokens = await NotificationRepository.getActiveDeviceTokensForUser(payload.userId);

    if (deviceTokens.length === 0) {
      logger.info("No active device tokens found for user", { userId: payload.userId });
      return { success: true, successCount: 0, failureCount: 0 };
    }

    const tokens = deviceTokens.map(dt => dt.token);

    const deliveries = await NotificationRepository.createDeliveriesBatch(
      deviceTokens.map(dt => ({
        userId: payload.userId,
        channel: NotificationChannel.PUSH,
        eventType: payload.eventType,
        deviceTokenId: dt.id,
        title: payload.title,
        body: payload.body,
        metadata: payload.metadata ?? null,
      }))
    );

    try {
      const messages: Message[] = tokens.map(token => ({
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
      }));

      const response = await this.context.messaging.sendEach(messages);

      const result = await this.processMulticastResponse(response, deliveries, deviceTokens, payload.userId, locale);

      logger.info("Push notification multicast completed", {
        userId: payload.userId,
        totalTokens: tokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return result;
    } catch (error) {
      return this.handleMulticastError(payload.userId, deliveries, error, locale);
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const {
        firebaseProjectId: projectId,
        firebasePrivateKey: privateKey,
        firebaseClientEmail: clientEmail,
      } = getEnvironmentConfig();

      return !!projectId && !!privateKey && !!clientEmail;
    } catch (error) {
      logger.error("FCM configuration validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (getApps().length > 0) {
      await deleteApp(getApp());
    }

    logger.info("FcmPushAdapter disconnected");
  }

  private async processMulticastResponse(
    response: BatchResponse,
    deliveries: NotificationDeliverySelectType[],
    deviceTokens: UserDeviceTokenSelectType[],
    userId: string,
    locale: string
  ): Promise<PushSendResult> {
    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    const tasks: Promise<void>[] = [];

    for (let i = 0; i < response.responses.length; i++) {
      const tokenResponse = response.responses[i];
      const delivery = deliveries[i];

      if (!delivery) {
        continue;
      }

      if (tokenResponse.success) {
        successCount++;
        tasks.push(this.markDeliverySent(delivery.id, tokenResponse));
      } else {
        failureCount++;
        tasks.push(
          this.markDeliveryFailed(delivery.id, tokenResponse, errors, locale).then(() =>
            this.deactivateTokenIfNeeded(tokenResponse, deviceTokens[i], userId)
          )
        );
      }
    }

    await Promise.all(tasks);

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async markDeliverySent(deliveryId: string, tokenResponse: SendResponse): Promise<void> {
    await NotificationRepository.updateDeliveryStatus({
      deliveryId,
      status: NotificationDeliveryStatus.SENT,
      providerMessageId: tokenResponse.messageId ?? null,
    });
  }

  private async markDeliveryFailed(
    deliveryId: string,
    tokenResponse: SendResponse,
    errors: string[],
    locale: string
  ): Promise<void> {
    const errorCode = tokenResponse.error?.code ?? "unknown";
    const errorMessage = tokenResponse.error?.message ?? "Unknown FCM error";

    errors.push(deliveryFailedMessage(NotificationChannel.PUSH, locale));
    await NotificationRepository.updateDeliveryStatus({
      deliveryId,
      status: NotificationDeliveryStatus.FAILED,
      failureReason: `${errorCode}: ${errorMessage}`,
    });
  }

  private async deactivateTokenIfNeeded(
    tokenResponse: SendResponse,
    deviceToken: UserDeviceTokenSelectType | undefined,
    userId: string
  ): Promise<void> {
    const errorCode = tokenResponse.error?.code ?? "";

    if (errorCode !== FCM_TOKEN_EXPIRED_ERROR && errorCode !== FCM_INVALID_TOKEN_ERROR) {
      return;
    }

    if (!deviceToken) {
      return;
    }

    await NotificationRepository.deactivateDeviceToken(deviceToken.userId, deviceToken.token);

    logger.info("Deactivated expired/invalid FCM token", {
      userId,
      deviceTokenId: deviceToken.id,
      errorCode,
    });
  }

  private async handleMulticastError(
    userId: string,
    deliveries: NotificationDeliverySelectType[],
    error: unknown,
    locale: string
  ): Promise<PushSendResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Failed to send push notification via FCM", {
      userId,
      error: errorMessage,
    });

    await Promise.all(
      deliveries.map(delivery =>
        NotificationRepository.updateDeliveryStatus({
          deliveryId: delivery.id,
          status: NotificationDeliveryStatus.FAILED,
          failureReason: errorMessage,
        })
      )
    );

    return {
      success: false,
      successCount: 0,
      failureCount: deliveries.length,
      errors: [deliveryFailedMessage(NotificationChannel.PUSH, locale)],
    };
  }
}
