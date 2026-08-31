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

const USER_ID_1 = "00000000-0000-0000-0000-000000000001";
const USER_ID_2 = "00000000-0000-0000-0000-000000000002";

describe("buildQuotaExpiringSoonPayloads", () => {
  test("returns empty array when affectedUserIds is empty", () => {
    const result = buildQuotaExpiringSoonPayloads({
      affectedUserIds: [],
      quotaName: "Monthly Standard",
      validUntil: "2026-09-15",
      remaining: 3,
    });
    expect(result).toEqual([]);
  });

  test("generates expected payloads for a single user with default English locale", () => {
    const result = buildQuotaExpiringSoonPayloads({
      affectedUserIds: [USER_ID_1],
      quotaName: "Monthly Standard",
      validUntil: "2026-09-15",
      remaining: 3,
    });

    expect(result).toHaveLength(4);
    for (const payload of result) {
      expect(payload.userId).toBe(USER_ID_1);
      expect(payload.eventType).toBe(NotificationEventType.QUOTA_EXPIRING_SOON);
      expect(payload.title).toBe("Quota Expiring Soon");
      expect(payload.body).toBe('Quota "Monthly Standard" expires on 2026-09-15. You have 3 classes remaining.');
      expect(payload.metadata).toEqual({
        category: NotificationEventCategory.REMINDER,
        quotaName: "Monthly Standard",
        validUntil: "2026-09-15",
        remaining: 3,
      });
    }
  });

  test("fans out payloads to multiple users", () => {
    const result = buildQuotaExpiringSoonPayloads({
      affectedUserIds: [USER_ID_1, USER_ID_2],
      quotaName: "Monthly Standard",
      validUntil: "2026-09-15",
      remaining: 3,
    });

    expect(result).toHaveLength(8);
    const user1Payloads = result.filter(p => p.userId === USER_ID_1);
    const user2Payloads = result.filter(p => p.userId === USER_ID_2);
    expect(user1Payloads).toHaveLength(4);
    expect(user2Payloads).toHaveLength(4);
  });

  test("supports custom Arabic locale", () => {
    const result = buildQuotaExpiringSoonPayloads({
      affectedUserIds: [USER_ID_1],
      quotaName: "الباقة الشهرية",
      validUntil: "2026-09-15",
      remaining: 2,
      locale: "ar",
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toBe("حصة تنتهي قريبًا");
    expect(result[0].body).toBe('تنتهي الحصة "الباقة الشهرية" في 2026-09-15. لديك 2 حصص متبقية.');
  });
});

describe("buildQuotaExpiredPayloads", () => {
  test("returns empty array when affectedUserIds is empty", () => {
    const result = buildQuotaExpiredPayloads({
      affectedUserIds: [],
      quotaName: "Monthly Standard",
    });
    expect(result).toEqual([]);
  });

  test("generates expected payloads with INFO category", () => {
    const result = buildQuotaExpiredPayloads({
      affectedUserIds: [USER_ID_1],
      quotaName: "Monthly Standard",
    });

    expect(result).toHaveLength(4);
    for (const payload of result) {
      expect(payload.userId).toBe(USER_ID_1);
      expect(payload.eventType).toBe(NotificationEventType.QUOTA_EXPIRED);
      expect(payload.title).toBe("Quota Expired");
      expect(payload.body).toBe('Quota "Monthly Standard" has expired.');
      expect(payload.metadata).toEqual({
        category: NotificationEventCategory.INFO,
        quotaName: "Monthly Standard",
      });
    }
  });
});

describe("buildQuotaLowBalancePayloads", () => {
  test("returns empty array when affectedUserIds is empty", () => {
    const result = buildQuotaLowBalancePayloads({
      affectedUserIds: [],
      studentName: "John Doe",
      remaining: 1,
      totalClasses: 10,
    });
    expect(result).toEqual([]);
  });

  test("generates expected payloads for quota low balance", () => {
    const result = buildQuotaLowBalancePayloads({
      affectedUserIds: [USER_ID_1],
      studentName: "John Doe",
      remaining: 1,
      totalClasses: 10,
    });

    expect(result).toHaveLength(4);
    for (const payload of result) {
      expect(payload.userId).toBe(USER_ID_1);
      expect(payload.eventType).toBe(NotificationEventType.QUOTA_LOW_BALANCE);
      expect(payload.title).toBe("Quota Low Balance");
      expect(payload.body).toBe("Low quota balance for John Doe: 1 of 10 classes remaining.");
      expect(payload.metadata).toEqual({
        category: NotificationEventCategory.REMINDER,
        studentName: "John Doe",
        remaining: 1,
        totalClasses: 10,
      });
    }
  });
});

describe("buildOndemandInstancePendingCreditPayloads", () => {
  test("returns empty array when affectedUserIds is empty", () => {
    const result = buildOndemandInstancePendingCreditPayloads({
      affectedUserIds: [],
      studentName: "John Doe",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });
    expect(result).toEqual([]);
  });

  test("generates expected payloads with URGENT category", () => {
    const result = buildOndemandInstancePendingCreditPayloads({
      affectedUserIds: [USER_ID_1],
      studentName: "John Doe",
      scheduledStartAt: "2026-09-01T10:00:00Z",
    });

    expect(result).toHaveLength(4);
    for (const payload of result) {
      expect(payload.userId).toBe(USER_ID_1);
      expect(payload.eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_PENDING_CREDIT);
      expect(payload.title).toBe("Class Pending Credit");
      expect(payload.body).toBe(
        "On-demand class for John Doe on 2026-09-01T10:00:00Z needs additional credits."
      );
      expect(payload.metadata).toEqual({
        category: NotificationEventCategory.URGENT,
        studentName: "John Doe",
        scheduledStartAt: "2026-09-01T10:00:00Z",
      });
    }
  });
});

describe("buildOndemandInstanceReminderT3Payloads", () => {
  test("returns empty array when affectedUserIds is empty", () => {
    const result = buildOndemandInstanceReminderT3Payloads({
      affectedUserIds: [],
      studentName: "John Doe",
      scheduledStartAt: "2026-09-04T10:00:00Z",
    });
    expect(result).toEqual([]);
  });

  test("generates expected payloads with REMINDER category", () => {
    const result = buildOndemandInstanceReminderT3Payloads({
      affectedUserIds: [USER_ID_1],
      studentName: "John Doe",
      scheduledStartAt: "2026-09-04T10:00:00Z",
    });

    expect(result).toHaveLength(4);
    for (const payload of result) {
      expect(payload.userId).toBe(USER_ID_1);
      expect(payload.eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T3);
      expect(payload.title).toBe("Upcoming On-Demand Class");
      expect(payload.body).toBe(
        "On-demand class for John Doe is scheduled in 3 days on 2026-09-04T10:00:00Z."
      );
      expect(payload.metadata).toEqual({
        category: NotificationEventCategory.REMINDER,
        studentName: "John Doe",
        scheduledStartAt: "2026-09-04T10:00:00Z",
      });
    }
  });
});

describe("buildOndemandInstanceReminderT1Payloads", () => {
  test("returns empty array when affectedUserIds is empty", () => {
    const result = buildOndemandInstanceReminderT1Payloads({
      affectedUserIds: [],
      studentName: "John Doe",
      scheduledStartAt: "2026-09-02T10:00:00Z",
    });
    expect(result).toEqual([]);
  });

  test("generates expected payloads with URGENT category", () => {
    const result = buildOndemandInstanceReminderT1Payloads({
      affectedUserIds: [USER_ID_1],
      studentName: "John Doe",
      scheduledStartAt: "2026-09-02T10:00:00Z",
    });

    expect(result).toHaveLength(4);
    for (const payload of result) {
      expect(payload.userId).toBe(USER_ID_1);
      expect(payload.eventType).toBe(NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T1);
      expect(payload.title).toBe("Upcoming On-Demand Class Tomorrow");
      expect(payload.body).toBe(
        "On-demand class for John Doe is scheduled tomorrow on 2026-09-02T10:00:00Z."
      );
      expect(payload.metadata).toEqual({
        category: NotificationEventCategory.URGENT,
        studentName: "John Doe",
        scheduledStartAt: "2026-09-02T10:00:00Z",
      });
    }
  });
});

describe("buildOndemandTeacherDailyDigestPayloads", () => {
  test("returns empty array when affectedUserIds is empty", () => {
    const result = buildOndemandTeacherDailyDigestPayloads({
      affectedUserIds: [],
      teacherName: "Jane Smith",
      pendingCount: 5,
    });
    expect(result).toEqual([]);
  });

  test("generates expected payloads with DIGEST category", () => {
    const result = buildOndemandTeacherDailyDigestPayloads({
      affectedUserIds: [USER_ID_1],
      teacherName: "Jane Smith",
      pendingCount: 5,
    });

    expect(result).toHaveLength(4);
    for (const payload of result) {
      expect(payload.userId).toBe(USER_ID_1);
      expect(payload.eventType).toBe(NotificationEventType.ON_DEMAND_TEACHER_DAILY_DIGEST);
      expect(payload.title).toBe("Daily On-Demand Classes Digest");
      expect(payload.body).toBe(
        "Hello Jane Smith, you have 5 on-demand classes pending credit resolution today."
      );
      expect(payload.metadata).toEqual({
        category: NotificationEventCategory.DIGEST,
        teacherName: "Jane Smith",
        pendingCount: 5,
      });
    }
  });
});
