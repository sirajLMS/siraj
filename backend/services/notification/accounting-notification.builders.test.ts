import { describe, expect, test } from "bun:test";
import { NotificationEventCategory, NotificationEventType } from "@/backend/enum";
import {
  buildAccountingLowHoursPayloads,
  buildAccountingPaymentRecordedPayloads,
} from "@/backend/services/notification/accounting-notification.builders";

/**
 * Pure-builder coverage: empty-guard, per-user fan-out, eventType/category,
 * body interpolation, locale selection. No I/O — the builders are pure.
 */

const PAYMENT_RECORDED_INPUT = {
  packageName: "Golden 10",
  creditHours: "10.00",
  amount: "300.00",
  currency: "USD",
};

describe("buildAccountingPaymentRecordedPayloads", () => {
  test("returns [] for an empty recipient list", () => {
    expect(buildAccountingPaymentRecordedPayloads({ affectedUserIds: [], ...PAYMENT_RECORDED_INPUT })).toEqual([]);
  });

  test("fans out one localized payload per channel per user (WhatsApp excluded — no approved template)", () => {
    const payloads = buildAccountingPaymentRecordedPayloads({
      affectedUserIds: ["user-a", "user-b"],
      ...PAYMENT_RECORDED_INPUT,
    });

    // 4 channels (on_app/email/sms/push) × 2 users — ACCOUNTING events have no WhatsApp template.
    expect(payloads).toHaveLength(8);
    expect(new Set(payloads.map(p => p.userId))).toEqual(new Set(["user-a", "user-b"]));

    for (const payload of payloads) {
      expect(payload.eventType).toBe(NotificationEventType.ACCOUNTING_PAYMENT_RECORDED);
      expect(payload.title).toBe("Credit Hours Package Recorded");
      expect(payload.body).toContain("Golden 10");
      expect(payload.body).toContain("10.00");
      expect(payload.body).toContain("300.00");
      expect(payload.metadata).toMatchObject({
        category: NotificationEventCategory.INFO,
        packageName: "Golden 10",
        creditHours: "10.00",
        amount: "300.00",
        currency: "USD",
      });
    }
  });

  test("honors the locale parameter (Arabic body, interpolated params intact)", () => {
    const payloads = buildAccountingPaymentRecordedPayloads({
      affectedUserIds: ["user-ar"],
      locale: "ar",
      ...PAYMENT_RECORDED_INPUT,
    });

    const first = payloads[0];
    expect(first).toBeDefined();
    expect(first?.title).toBe("تم تسجيل باقة ساعات تعليمية");
    expect(first?.body).toContain("Golden 10");
    expect(first?.body).toContain("300.00");
  });
});

describe("buildAccountingLowHoursPayloads", () => {
  test("returns [] for an empty recipient list", () => {
    expect(buildAccountingLowHoursPayloads({ affectedUserIds: [], remaining: "1.00", threshold: "2.00" })).toEqual([]);
  });

  test("emits REMINDER payloads interpolating remaining vs threshold", () => {
    const payloads = buildAccountingLowHoursPayloads({
      affectedUserIds: ["user-low"],
      remaining: "1.50",
      threshold: "2.00",
    });

    expect(payloads).toHaveLength(4);
    for (const payload of payloads) {
      expect(payload.eventType).toBe(NotificationEventType.ACCOUNTING_LOW_HOURS);
      expect(payload.title).toBe("Low Credit-Hour Balance");
      expect(payload.body).toContain("1.50");
      expect(payload.body).toContain("2.00");
      expect(payload.metadata).toMatchObject({
        category: NotificationEventCategory.REMINDER,
        remaining: "1.50",
        threshold: "2.00",
      });
    }
  });
});
