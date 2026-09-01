import { describe, expect, test } from "bun:test";
import { NotificationChannel, NotificationEventCategory, NotificationEventType } from "@/backend/enum";
import {
  buildOndemandInstancePendingCreditPayloads,
  buildOndemandInstanceReminderT1Payloads,
  buildOndemandInstanceReminderT3Payloads,
  buildOndemandTeacherDailyDigestPayloads,
  buildQuotaExpiredPayloads,
  buildQuotaExpiringSoonPayloads,
  buildQuotaLowBalancePayloads,
} from "@/backend/services/notification/quota-notification.builders";

describe("buildQuotaExpiredPayloads", () => {
  const USER_1 = "00000000-0000-0000-0000-000000000001";
  const USER_2 = "00000000-0000-0000-0000-000000000002";

  test("returns empty array when affectedUserIds is empty", () => {
    const result = buildQuotaExpiredPayloads({
      affectedUserIds: [],
      quotaName: "Monthly Standard Plan",
    });
    expect(result).toEqual([]);
  });

  test("returns 4 channel payloads for a single user with default (English) locale", () => {
    const result = buildQuotaExpiredPayloads({
      affectedUserIds: [USER_1],
      quotaName: "Monthly Standard Plan",
    });

    expect(result).toHaveLength(4);

    const channels = result.map(p => p.channel);
    expect(channels).toContain(NotificationChannel.ON_APP);
    expect(channels).toContain(NotificationChannel.EMAIL);
    expect(channels).toContain(NotificationChannel.SMS);
    expect(channels).toContain(NotificationChannel.PUSH);

    for (const payload of result) {
      expect(payload.userId).toBe(USER_1);
      expect(payload.eventType).toBe(NotificationEventType.QUOTA_EXPIRED);
      expect(payload.title).toBeTruthy();
      expect(payload.body).toContain("Monthly Standard Plan");
      expect(payload.metadata).toMatchObject({
        category: NotificationEventCategory.INFO,
        quotaName: "Monthly Standard Plan",
      });
    }
  });

  test("uses specified locale translations when provided", () => {
    const enResult = buildQuotaExpiredPayloads({
      affectedUserIds: [USER_1],
      quotaName: "Monthly Standard Plan",
      locale: "en",
    });

    const arResult = buildQuotaExpiredPayloads({
      affectedUserIds: [USER_1],
      quotaName: "Monthly Standard Plan",
      locale: "ar",
    });

    expect(enResult[0].title).not.toEqual(arResult[0].title);
    expect(arResult[0].body).toContain("Monthly Standard Plan");
  });

  test("fans out payloads across multiple affected user IDs", () => {
    const result = buildQuotaExpiredPayloads({
      affectedUserIds: [USER_1, USER_2],
      quotaName: "Annual Premium",
    });

    expect(result).toHaveLength(8); // 4 channels * 2 users

    const user1Payloads = result.filter(p => p.userId === USER_1);
    const user2Payloads = result.filter(p => p.userId === USER_2);

    expect(user1Payloads).toHaveLength(4);
    expect(user2Payloads).toHaveLength(4);
  });
});

describe("Other quota & on-demand builders", () => {
  const USER_1 = "00000000-0000-0000-0000-000000000001";

  test("buildQuotaExpiringSoonPayloads builds expected payloads", () => {
    const result = buildQuotaExpiringSoonPayloads({
      affectedUserIds: [USER_1],
      quotaName: "Gold Quota",
      validUntil: "2026-12-31",
      remaining: 2,
    });

    expect(result).toHaveLength(4);
    expect(result[0].eventType).toBe(NotificationEventType.QUOTA_EXPIRING_SOON);
    expect(result[0].body).toContain("Gold Quota");
    expect(result[0].metadata).toMatchObject({
      category: NotificationEventCategory.REMINDER,
      quotaName: "Gold Quota",
      validUntil: "2026-12-31",
      remaining: 2,
    });
  });

  test("buildQuotaLowBalancePayloads builds expected payloads", () => {
    const result = buildQuotaLowBalancePayloads({
      affectedUserIds: [USER_1],
      studentName: "John Doe",
      remaining: 1,
      totalClasses: 10,
    });

    expect(result).toHaveLength(4);
    expect(result[0].eventType).toBe(NotificationEventType.QUOTA_LOW_BALANCE);
    expect(result[0].body).toContain("John Doe");
    expect(result[0].metadata).toMatchObject({
      category: NotificationEventCategory.REMINDER,
      studentName: "John Doe",
      remaining: 1,
      totalClasses: 10,
    });
  });

  test("buildOndemandInstancePendingCreditPayloads builds expected payloads", () => {
    const result = buildOndemandInstancePendingCreditPayloads({
      affectedUserIds: [USER_1],
      studentName: "Jane Doe",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });

    expect(result).toHaveLength(4);
    expect(result[0].eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_PENDING_CREDIT);
    expect(result[0].metadata).toMatchObject({
      category: NotificationEventCategory.URGENT,
      studentName: "Jane Doe",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });
  });

  test("buildOndemandInstanceReminderT3Payloads builds expected payloads", () => {
    const result = buildOndemandInstanceReminderT3Payloads({
      affectedUserIds: [USER_1],
      studentName: "Jane Doe",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });

    expect(result).toHaveLength(4);
    expect(result[0].eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T3);
    expect(result[0].metadata).toMatchObject({
      category: NotificationEventCategory.REMINDER,
    });
  });

  test("buildOndemandInstanceReminderT1Payloads builds expected payloads", () => {
    const result = buildOndemandInstanceReminderT1Payloads({
      affectedUserIds: [USER_1],
      studentName: "Jane Doe",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });

    expect(result).toHaveLength(4);
    expect(result[0].eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T1);
    expect(result[0].metadata).toMatchObject({
      category: NotificationEventCategory.URGENT,
    });
  });

  test("buildOndemandTeacherDailyDigestPayloads builds expected payloads", () => {
    const result = buildOndemandTeacherDailyDigestPayloads({
      affectedUserIds: [USER_1],
      teacherName: "Teacher Alex",
      pendingCount: 3,
    });

    expect(result).toHaveLength(4);
    expect(result[0].eventType).toBe(NotificationEventType.ON_DEMAND_TEACHER_DAILY_DIGEST);
    expect(result[0].metadata).toMatchObject({
      category: NotificationEventCategory.DIGEST,
      teacherName: "Teacher Alex",
      pendingCount: 3,
    });
  });
});
