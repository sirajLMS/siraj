import { cert, deleteApp, getApp, getApps, initializeApp } from "firebase-admin/app";
import type { BatchResponse, SendResponse } from "firebase-admin/messaging";
import { getMessaging } from "firebase-admin/messaging";
import { NotificationRepository } from "@/backend/db/repo/notification.repository";
import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type { NotificationDeliverySelectType } from "@/backend/types/notificationDeliveries.types";
import type { UserDeviceTokenSelectType } from "@/backend/types/userDeviceTokens.types";
import { deliveryFailedMessage } from "../../../utils";
import type { IPushChannel, PushPayload, PushSendResult } from "../IPushChannel";
import type { FcmPushContext } from "./fcm.types";
import { FCM_INVALID_TOKEN_ERROR, FCM_TOKEN_EXPIRED_ERROR } from "./fcm.types";

export class FcmPushAdapter implements IPushChannel {
  private readonly context: FcmPushContext;

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

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

  async send(payload: PushPayload, _locale?: string): Promise<PushSendResult> {
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
      }))
    );

    try {
      const response = await this.context.messaging.sendEachForMulticast({
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
      });

      const result = await this.processMulticastResponse(response, deliveries, deviceTokens, payload.userId);

      logger.info("Push notification multicast completed", {
        userId: payload.userId,
        totalTokens: tokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return result;
    } catch (error) {
      return this.handleMulticastError(payload.userId, deliveries, error);
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

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
    userId: string
  ): Promise<PushSendResult> {
    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < response.responses.length; i++) {
      const tokenResponse = response.responses[i];
      const delivery = deliveries[i];

      if (!delivery) {
        continue;
      }

      if (tokenResponse.success) {
        successCount++;
        await this.markDeliverySent(delivery.id, tokenResponse);
      } else {
        failureCount++;
        await this.markDeliveryFailed(delivery.id, tokenResponse, errors);
        await this.deactivateTokenIfNeeded(tokenResponse, deviceTokens[i], userId);
      }
    }

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

  private async markDeliveryFailed(deliveryId: string, tokenResponse: SendResponse, errors: string[]): Promise<void> {
    const errorCode = tokenResponse.error?.code ?? "unknown";
    const errorMessage = tokenResponse.error?.message ?? "Unknown FCM error";

    errors.push(deliveryFailedMessage("push"));

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
    error: unknown
  ): Promise<PushSendResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Failed to send push notification via FCM", {
      userId,
      error: errorMessage,
    });

    for (const delivery of deliveries) {
      await NotificationRepository.updateDeliveryStatus({
        deliveryId: delivery.id,
        status: NotificationDeliveryStatus.FAILED,
        failureReason: errorMessage,
      });
    }

    return {
      success: false,
      successCount: 0,
      failureCount: deliveries.length,
      errors: [deliveryFailedMessage("push")],
    };
  }
}
