import { describe, expect, test } from "bun:test";
import { NotificationEventCategory, NotificationEventType } from "@/backend/enum";
import {
  buildOndemandInstancePendingCreditPayloads,
  buildOndemandInstanceReminderT1Payloads,
  buildOndemandInstanceReminderT3Payloads,
  buildOndemandTeacherDailyDigestPayloads,
  buildQuotaExpiredPayloads,
  buildQuotaExpiringSoonPayloads,
  buildQuotaLowBalancePayloads,
} from "@/backend/services/notification/quota-notification.builders";

describe("buildQuotaLowBalancePayloads", () => {
  const TEST_USER_1 = "00000000-0000-0000-0000-000000000001";
  const TEST_USER_2 = "00000000-0000-0000-0000-000000000002";

  test("returns empty array when affectedUserIds is empty", () => {
    const payloads = buildQuotaLowBalancePayloads({
      affectedUserIds: [],
      studentName: "John Doe",
      remaining: 2,
      totalClasses: 10,
    });

    expect(payloads).toEqual([]);
  });

  test("builds correct payloads for a single user in English (default locale)", () => {
    const payloads = buildQuotaLowBalancePayloads({
      affectedUserIds: [TEST_USER_1],
      studentName: "John Doe",
      remaining: 2,
      totalClasses: 10,
    });

    expect(payloads).toHaveLength(4);
    for (const payload of payloads) {
      expect(payload.userId).toBe(TEST_USER_1);
      expect(payload.eventType).toBe(NotificationEventType.QUOTA_LOW_BALANCE);
      expect(payload.title).toBe("Quota Low Balance");
      expect(payload.body).toBe("Low quota balance for John Doe: 2 of 10 classes remaining.");
      expect(payload.metadata).toEqual({
        category: NotificationEventCategory.REMINDER,
        studentName: "John Doe",
        remaining: 2,
        totalClasses: 10,
      });
    }
  });

  test("fans out across channels for multiple affected users", () => {
    const payloads = buildQuotaLowBalancePayloads({
      affectedUserIds: [TEST_USER_1, TEST_USER_2],
      studentName: "Jane Smith",
      remaining: 1,
      totalClasses: 12,
    });

    expect(payloads).toHaveLength(8);
    const user1Payloads = payloads.filter(p => p.userId === TEST_USER_1);
    const user2Payloads = payloads.filter(p => p.userId === TEST_USER_2);

    expect(user1Payloads).toHaveLength(4);
    expect(user2Payloads).toHaveLength(4);

    expect(user1Payloads[0].body).toBe("Low quota balance for Jane Smith: 1 of 12 classes remaining.");
    expect(user2Payloads[0].body).toBe("Low quota balance for Jane Smith: 1 of 12 classes remaining.");
  });

  test("supports Arabic locale", () => {
    const payloads = buildQuotaLowBalancePayloads({
      affectedUserIds: [TEST_USER_1],
      studentName: "John Doe",
      remaining: 3,
      totalClasses: 20,
      locale: "ar",
    });

    expect(payloads).toHaveLength(4);
    expect(payloads[0].title).toBe("رصيد حصة منخفض");
    expect(payloads[0].body).toBe("رصيد الحصة منخفض للطالب John Doe: متبقي 3 من أصل 20 حصص.");
  });
});

describe("Other Quota Notification Builders", () => {
  const TEST_USER = "00000000-0000-0000-0000-000000000001";

  test("buildQuotaExpiringSoonPayloads builds expiring soon notification payloads", () => {
    const payloads = buildQuotaExpiringSoonPayloads({
      affectedUserIds: [TEST_USER],
      quotaName: "Monthly Math Package",
      validUntil: "2026-12-31",
      remaining: 3,
    });

    expect(payloads).toHaveLength(4);
    expect(payloads[0].eventType).toBe(NotificationEventType.QUOTA_EXPIRING_SOON);
    expect(payloads[0].title).toBe("Quota Expiring Soon");
    expect(payloads[0].body).toBe(
      'Quota "Monthly Math Package" expires on 2026-12-31. You have 3 classes remaining.'
    );
    expect(payloads[0].metadata).toEqual({
      category: NotificationEventCategory.REMINDER,
      quotaName: "Monthly Math Package",
      validUntil: "2026-12-31",
      remaining: 3,
    });
  });

  test("buildQuotaExpiredPayloads builds expired notification payloads", () => {
    const payloads = buildQuotaExpiredPayloads({
      affectedUserIds: [TEST_USER],
      quotaName: "Summer Science Pass",
    });

    expect(payloads).toHaveLength(4);
    expect(payloads[0].eventType).toBe(NotificationEventType.QUOTA_EXPIRED);
    expect(payloads[0].title).toBe("Quota Expired");
    expect(payloads[0].body).toBe('Quota "Summer Science Pass" has expired.');
    expect(payloads[0].metadata).toEqual({
      category: NotificationEventCategory.INFO,
      quotaName: "Summer Science Pass",
    });
  });

  test("buildOndemandInstancePendingCreditPayloads builds pending credit notification payloads", () => {
    const payloads = buildOndemandInstancePendingCreditPayloads({
      affectedUserIds: [TEST_USER],
      studentName: "Alice",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });

    expect(payloads).toHaveLength(4);
    expect(payloads[0].eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_PENDING_CREDIT);
    expect(payloads[0].title).toBe("Class Pending Credit");
    expect(payloads[0].body).toBe("On-demand class for Alice on 2026-09-01T10:00:00Z needs additional credits.");
    expect(payloads[0].metadata).toEqual({
      category: NotificationEventCategory.URGENT,
      studentName: "Alice",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });
  });

  test("buildOndemandInstanceReminderT3Payloads builds T3 reminder notification payloads", () => {
    const payloads = buildOndemandInstanceReminderT3Payloads({
      affectedUserIds: [TEST_USER],
      studentName: "Bob",
      scheduledStartAt: "2026-09-03T10:00:00Z",
    });

    expect(payloads).toHaveLength(4);
    expect(payloads[0].eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T3);
    expect(payloads[0].title).toBe("Upcoming On-Demand Class");
    expect(payloads[0].body).toBe("On-demand class for Bob is scheduled in 3 days on 2026-09-03T10:00:00Z.");
    expect(payloads[0].metadata).toEqual({
      category: NotificationEventCategory.REMINDER,
      studentName: "Bob",
      scheduledStartAt: "2026-09-03T10:00:00Z",
    });
  });

  test("buildOndemandInstanceReminderT1Payloads builds T1 reminder notification payloads", () => {
    const payloads = buildOndemandInstanceReminderT1Payloads({
      affectedUserIds: [TEST_USER],
      studentName: "Charlie",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });

    expect(payloads).toHaveLength(4);
    expect(payloads[0].eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T1);
    expect(payloads[0].title).toBe("Upcoming On-Demand Class Tomorrow");
    expect(payloads[0].body).toBe("On-demand class for Charlie is scheduled tomorrow on 2026-09-01T10:00:00Z.");
    expect(payloads[0].metadata).toEqual({
      category: NotificationEventCategory.URGENT,
      studentName: "Charlie",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });
  });

  test("buildOndemandTeacherDailyDigestPayloads builds daily digest notification payloads", () => {
    const payloads = buildOndemandTeacherDailyDigestPayloads({
      affectedUserIds: [TEST_USER],
      teacherName: "Mr. Davis",
      pendingCount: 5,
    });

    expect(payloads).toHaveLength(4);
    expect(payloads[0].eventType).toBe(NotificationEventType.ON_DEMAND_TEACHER_DAILY_DIGEST);
    expect(payloads[0].title).toBe("Daily On-Demand Classes Digest");
    expect(payloads[0].body).toBe("Hello Mr. Davis, you have 5 on-demand classes pending credit resolution today.");
    expect(payloads[0].metadata).toEqual({
      category: NotificationEventCategory.DIGEST,
      teacherName: "Mr. Davis",
      pendingCount: 5,
    });
  });
});
