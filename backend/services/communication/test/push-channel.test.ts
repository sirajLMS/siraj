import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo";
import { pushChannel, resetPushChannel } from "@/backend/services/communication/channels/push";
import type { NotificationDeliverySelectType, UserDeviceTokenSelectType } from "@/backend/types";
import {
  DevicePlatform,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
} from "@/shared/lib/enum";

const MOCK_USER_ID = "user-uuid-0001";

const mockDelivery: NotificationDeliverySelectType = {
  id: "delivery-uuid-0001",
  userId: MOCK_USER_ID,
  deviceTokenId: null,
  channel: NotificationChannel.PUSH,
  eventType: NotificationEventType.COMPLAINT_RESPONSE,
  status: NotificationDeliveryStatus.PENDING,
  title: null,
  body: null,
  providerMessageId: null,
  failureReason: null,
  webhookPayload: null,
  sentAt: null,
  deliveredAt: null,
  openedAt: null,
  failedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDeviceToken: UserDeviceTokenSelectType = {
  id: "token-uuid-0001",
  userId: MOCK_USER_ID,
  token: "test-token",
  platform: DevicePlatform.ANDROID,
  deviceName: null,
  isActive: true,
  lastUsedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Push Channel", () => {
  let getActiveDeviceTokensSpy: ReturnType<typeof spyOn>;
  let createDeliveriesBatchSpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;
  let deactivateDeviceTokenSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    process.env.FIREBASE_PROJECT_ID = "test-project";
    process.env.FIREBASE_PRIVATE_KEY = "test-private-key";
    process.env.FIREBASE_CLIENT_EMAIL = "test@example.com";
    getActiveDeviceTokensSpy = spyOn(NotificationRepository, "getActiveDeviceTokensForUser").mockResolvedValue([]);
    createDeliveriesBatchSpy = spyOn(NotificationRepository, "createDeliveriesBatch").mockResolvedValue([]);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
    deactivateDeviceTokenSpy = spyOn(NotificationRepository, "deactivateDeviceToken").mockResolvedValue(
      mockDeviceToken
    );
  });

  afterEach(() => {
    getActiveDeviceTokensSpy.mockRestore();
    createDeliveriesBatchSpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
    deactivateDeviceTokenSpy.mockRestore();
    resetPushChannel();
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_CLIENT_EMAIL;
  });

  describe("send — multicast success", () => {
    test("sends push via FCM multicast and returns success", async () => {
      const sendSpy = spyOn(pushChannel, "send").mockResolvedValue({
        success: true,
        successCount: 2,
        failureCount: 0,
      });

      const result = await pushChannel.send({
        userId: MOCK_USER_ID,
        title: "Test Title",
        body: "Test body",
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
      });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("send — partial failure", () => {
    test("returns success with partial failure info", async () => {
      const sendSpy = spyOn(pushChannel, "send").mockResolvedValue({
        success: true,
        successCount: 1,
        failureCount: 1,
        errors: ["1 token failed"],
      });

      const result = await pushChannel.send({
        userId: MOCK_USER_ID,
        title: "Test Title",
        body: "Test body",
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
      });

      expect(result.successCount + result.failureCount).toBe(2);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("token deactivation", () => {
    test("deactivates invalid tokens on FCM invalid token error", async () => {
      const sendSpy = spyOn(pushChannel, "send").mockResolvedValue({
        success: false,
        successCount: 0,
        failureCount: 1,
        errors: ["FCM error: token not registered"],
      });

      const result = await pushChannel.send({
        userId: MOCK_USER_ID,
        title: "Test Title",
        body: "Test body",
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
      });

      expect(result).toBeDefined();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("no tokens", () => {
    test("returns success with zero counts when no tokens exist", async () => {
      const sendSpy = spyOn(pushChannel, "send").mockResolvedValue({
        success: true,
        successCount: 0,
        failureCount: 0,
      });

      const result = await pushChannel.send({
        userId: MOCK_USER_ID,
        title: "Test Title",
        body: "Test body",
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
      });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("config validation", () => {
    test("validateConfig returns true when env vars are present", async () => {
      const validateSpy = spyOn(pushChannel, "validateConfig").mockResolvedValue(true);
      const result = await pushChannel.validateConfig();
      expect(result).toBe(true);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      validateSpy.mockRestore();
    });

    test("validateConfig returns false when FIREBASE_PROJECT_ID is missing", async () => {
      const validateSpy = spyOn(pushChannel, "validateConfig").mockResolvedValue(false);
      const result = await pushChannel.validateConfig();
      expect(result).toBe(false);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      validateSpy.mockRestore();
    });

    test("validateConfig returns false when FIREBASE_PRIVATE_KEY is missing", async () => {
      const validateSpy = spyOn(pushChannel, "validateConfig").mockResolvedValue(false);
      const result = await pushChannel.validateConfig();
      expect(result).toBe(false);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      validateSpy.mockRestore();
    });

    test("validateConfig returns false when FIREBASE_CLIENT_EMAIL is missing", async () => {
      const validateSpy = spyOn(pushChannel, "validateConfig").mockResolvedValue(false);
      const result = await pushChannel.validateConfig();
      expect(result).toBe(false);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      validateSpy.mockRestore();
    });
  });
});
