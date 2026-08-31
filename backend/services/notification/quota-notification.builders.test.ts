import { describe, expect, it } from "bun:test";
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

describe("Quota and On-demand Notification Builders", () => {
  describe("buildOndemandInstancePendingCreditPayloads", () => {
    it("returns an empty array when affectedUserIds is empty", () => {
      const payloads = buildOndemandInstancePendingCreditPayloads({
        affectedUserIds: [],
        studentName: "Alice",
        scheduledStartAt: "2026-09-01T10:00:00Z",
      });
      expect(payloads).toEqual([]);
    });

    it("generates payloads for all channels when affectedUserIds is provided", () => {
      const input = {
        affectedUserIds: ["user-1"],
        studentName: "Alice",
        scheduledStartAt: "2026-09-01T10:00:00Z",
      };
      const payloads = buildOndemandInstancePendingCreditPayloads(input);

      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.every(p => p.userId === "user-1")).toBe(true);
      expect(payloads.every(p => p.eventType === NotificationEventType.ON_DEMAND_INSTANCE_PENDING_CREDIT)).toBe(true);

      const metadataCategories = payloads.map(p => p.metadata.category);
      expect(metadataCategories.every(cat => cat === NotificationEventCategory.URGENT)).toBe(true);

      const studentNamesInMeta = payloads.map(p => p.metadata.studentName);
      expect(studentNamesInMeta.every(name => name === "Alice")).toBe(true);

      const startAtsInMeta = payloads.map(p => p.metadata.scheduledStartAt);
      expect(startAtsInMeta.every(time => time === "2026-09-01T10:00:00Z")).toBe(true);
    });

    it("fans out across multiple users", () => {
      const input = {
        affectedUserIds: ["user-1", "user-2"],
        studentName: "Bob",
        scheduledStartAt: "2026-09-02T14:00:00Z",
      };
      const payloads = buildOndemandInstancePendingCreditPayloads(input);

      const user1Payloads = payloads.filter(p => p.userId === "user-1");
      const user2Payloads = payloads.filter(p => p.userId === "user-2");
      expect(user1Payloads.length).toBeGreaterThan(0);
      expect(user2Payloads.length).toBeGreaterThan(0);
      expect(user1Payloads.length).toEqual(user2Payloads.length);
    });

    it("respects locale options for translations", () => {
      const enPayloads = buildOndemandInstancePendingCreditPayloads({
        affectedUserIds: ["user-1"],
        studentName: "Alice",
        scheduledStartAt: "2026-09-01T10:00:00Z",
        locale: "en",
      });

      const arPayloads = buildOndemandInstancePendingCreditPayloads({
        affectedUserIds: ["user-1"],
        studentName: "Alice",
        scheduledStartAt: "2026-09-01T10:00:00Z",
        locale: "ar",
      });

      expect(enPayloads[0].title).not.toEqual(arPayloads[0].title);
      expect(enPayloads[0].body).not.toEqual(arPayloads[0].body);
    });
  });

  describe("buildOndemandInstanceReminderT3Payloads", () => {
    it("returns an empty array when affectedUserIds is empty", () => {
      const payloads = buildOndemandInstanceReminderT3Payloads({
        affectedUserIds: [],
        studentName: "Charlie",
        scheduledStartAt: "2026-09-03T10:00:00Z",
      });
      expect(payloads).toEqual([]);
    });

    it("generates payloads with correct eventType and REMINDER category", () => {
      const payloads = buildOndemandInstanceReminderT3Payloads({
        affectedUserIds: ["user-1"],
        studentName: "Charlie",
        scheduledStartAt: "2026-09-03T10:00:00Z",
      });

      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.every(p => p.eventType === NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T3)).toBe(true);
      expect(payloads.every(p => p.metadata.category === NotificationEventCategory.REMINDER)).toBe(true);
    });
  });

  describe("buildOndemandInstanceReminderT1Payloads", () => {
    it("returns an empty array when affectedUserIds is empty", () => {
      const payloads = buildOndemandInstanceReminderT1Payloads({
        affectedUserIds: [],
        studentName: "Dave",
        scheduledStartAt: "2026-09-04T10:00:00Z",
      });
      expect(payloads).toEqual([]);
    });

    it("generates payloads with correct eventType and URGENT category", () => {
      const payloads = buildOndemandInstanceReminderT1Payloads({
        affectedUserIds: ["user-1"],
        studentName: "Dave",
        scheduledStartAt: "2026-09-04T10:00:00Z",
      });

      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.every(p => p.eventType === NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T1)).toBe(true);
      expect(payloads.every(p => p.metadata.category === NotificationEventCategory.URGENT)).toBe(true);
    });
  });

  describe("buildOndemandTeacherDailyDigestPayloads", () => {
    it("returns an empty array when affectedUserIds is empty", () => {
      const payloads = buildOndemandTeacherDailyDigestPayloads({
        affectedUserIds: [],
        teacherName: "Teacher Sam",
        pendingCount: 3,
      });
      expect(payloads).toEqual([]);
    });

    it("generates payloads with correct eventType, DIGEST category, and metadata", () => {
      const payloads = buildOndemandTeacherDailyDigestPayloads({
        affectedUserIds: ["teacher-1"],
        teacherName: "Teacher Sam",
        pendingCount: 3,
      });

      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.every(p => p.eventType === NotificationEventType.ON_DEMAND_TEACHER_DAILY_DIGEST)).toBe(true);
      expect(payloads.every(p => p.metadata.category === NotificationEventCategory.DIGEST)).toBe(true);
      expect(payloads.every(p => p.metadata.teacherName === "Teacher Sam")).toBe(true);
      expect(payloads.every(p => p.metadata.pendingCount === 3)).toBe(true);
    });
  });

  describe("buildQuotaExpiringSoonPayloads", () => {
    it("returns an empty array when affectedUserIds is empty", () => {
      const payloads = buildQuotaExpiringSoonPayloads({
        affectedUserIds: [],
        quotaName: "Math Package",
        validUntil: "2026-09-10",
        remaining: 2,
      });
      expect(payloads).toEqual([]);
    });

    it("generates payloads with correct eventType, REMINDER category, and metadata", () => {
      const payloads = buildQuotaExpiringSoonPayloads({
        affectedUserIds: ["user-1"],
        quotaName: "Math Package",
        validUntil: "2026-09-10",
        remaining: 2,
      });

      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.every(p => p.eventType === NotificationEventType.QUOTA_EXPIRING_SOON)).toBe(true);
      expect(payloads.every(p => p.metadata.category === NotificationEventCategory.REMINDER)).toBe(true);
      expect(payloads.every(p => p.metadata.quotaName === "Math Package")).toBe(true);
      expect(payloads.every(p => p.metadata.validUntil === "2026-09-10")).toBe(true);
      expect(payloads.every(p => p.metadata.remaining === 2)).toBe(true);
    });
  });

  describe("buildQuotaExpiredPayloads", () => {
    it("returns an empty array when affectedUserIds is empty", () => {
      const payloads = buildQuotaExpiredPayloads({
        affectedUserIds: [],
        quotaName: "Physics Package",
      });
      expect(payloads).toEqual([]);
    });

    it("generates payloads with correct eventType, INFO category, and metadata", () => {
      const payloads = buildQuotaExpiredPayloads({
        affectedUserIds: ["user-1"],
        quotaName: "Physics Package",
      });

      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.every(p => p.eventType === NotificationEventType.QUOTA_EXPIRED)).toBe(true);
      expect(payloads.every(p => p.metadata.category === NotificationEventCategory.INFO)).toBe(true);
      expect(payloads.every(p => p.metadata.quotaName === "Physics Package")).toBe(true);
    });
  });

  describe("buildQuotaLowBalancePayloads", () => {
    it("returns an empty array when affectedUserIds is empty", () => {
      const payloads = buildQuotaLowBalancePayloads({
        affectedUserIds: [],
        studentName: "Eve",
        remaining: 1,
        totalClasses: 10,
      });
      expect(payloads).toEqual([]);
    });

    it("generates payloads with correct eventType, REMINDER category, and metadata", () => {
      const payloads = buildQuotaLowBalancePayloads({
        affectedUserIds: ["user-1"],
        studentName: "Eve",
        remaining: 1,
        totalClasses: 10,
      });

      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.every(p => p.eventType === NotificationEventType.QUOTA_LOW_BALANCE)).toBe(true);
      expect(payloads.every(p => p.metadata.category === NotificationEventCategory.REMINDER)).toBe(true);
      expect(payloads.every(p => p.metadata.studentName === "Eve")).toBe(true);
      expect(payloads.every(p => p.metadata.remaining === 1)).toBe(true);
      expect(payloads.every(p => p.metadata.totalClasses === 10)).toBe(true);
    });
  });
});
