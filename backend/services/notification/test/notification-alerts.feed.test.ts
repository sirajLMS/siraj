import { describe, expect, test } from "bun:test";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import {
  groupRecentDeliveriesByNotification,
  resolveNotificationAlertBody,
} from "@/backend/services/notification/notification-alerts.service";
import type { RecentNotificationRow } from "@/backend/types";

/**
 * Unit tests for the alert-feed delivery grouping helpers.
 *
 * Dispatching one notification creates one `notification_deliveries` row per
 * enabled channel; the email/sms rows store the recipient address in `body`
 * by design. These tests pin the drawer-facing contract: a single dispatch
 * renders once via its ON_APP row, and address-handoff bodies never surface
 * as notification content.
 */

function makeRow(overrides: Partial<RecentNotificationRow> = {}): RecentNotificationRow {
  return {
    id: "delivery-on-app",
    title: "Credit Hours Package Recorded",
    body: "A credit-hours package was recorded for your account.",
    createdAt: new Date("2026-08-30T10:00:00.000Z"),
    status: NotificationDeliveryStatus.PENDING,
    eventType: NotificationEventType.ACCOUNTING_PAYMENT_RECORDED,
    channel: NotificationChannel.ON_APP,
    metadata: { entityKind: "paymentMethod", entityId: "pm-1" },
    openedAt: null,
    ...overrides,
  };
}

describe("groupRecentDeliveriesByNotification", () => {
  test("collapses the ON_APP + EMAIL fan-out of one dispatch into the ON_APP row", () => {
    const onApp = makeRow();
    const email = makeRow({
      id: "delivery-email",
      channel: NotificationChannel.EMAIL,
      body: "parent@example.com",
      createdAt: new Date("2026-08-30T10:00:00.500Z"),
    });

    const grouped = groupRecentDeliveriesByNotification([email, onApp]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].id).toBe("delivery-on-app");
    expect(grouped[0].body).toBe("A credit-hours package was recorded for your account.");
  });

  test("keeps an email-only delivery when the notification has no ON_APP row", () => {
    const email = makeRow({ id: "delivery-email", channel: NotificationChannel.EMAIL, body: "parent@example.com" });

    const grouped = groupRecentDeliveriesByNotification([email]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].id).toBe("delivery-email");
  });

  test("keeps separate dispatches distinct", () => {
    const earlier = makeRow({
      id: "delivery-earlier",
      createdAt: new Date("2026-08-30T09:30:00.000Z"),
    });
    const later = makeRow({ id: "delivery-later", createdAt: new Date("2026-08-30T10:00:00.000Z") });

    const grouped = groupRecentDeliveriesByNotification([earlier, later]);

    expect(grouped).toHaveLength(2);
  });

  test("does not group same-event deliveries targeting different entities", () => {
    const invoiceA = makeRow({ id: "d1", metadata: { entityKind: "invoice", entityId: "inv-1" } });
    const invoiceB = makeRow({ id: "d2", metadata: { entityKind: "invoice", entityId: "inv-2" } });

    const grouped = groupRecentDeliveriesByNotification([invoiceA, invoiceB]);

    expect(grouped).toHaveLength(2);
  });
});

describe("resolveNotificationAlertBody", () => {
  test("suppresses the recipient address stored as body on EMAIL deliveries", () => {
    expect(resolveNotificationAlertBody(NotificationChannel.EMAIL, "parent@example.com")).toBeNull();
  });

  test("suppresses the recipient address stored as body on SMS deliveries", () => {
    expect(resolveNotificationAlertBody(NotificationChannel.SMS, "+15551234567")).toBeNull();
  });

  test("passes through the real message body for ON_APP deliveries", () => {
    expect(resolveNotificationAlertBody(NotificationChannel.ON_APP, "Your class starts soon.")).toBe(
      "Your class starts soon."
    );
  });

  test("passes through null bodies unchanged", () => {
    expect(resolveNotificationAlertBody(NotificationChannel.EMAIL, null)).toBeNull();
  });
});
