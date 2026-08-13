import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { NotificationRepository } from "@/backend/db/repo/notifications";
import { notificationDeliveries, userNotificationPreferences } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import type { CreateNotificationDeliveryInput, DBTransaction } from "@/backend/types";

function notificationTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

async function makeUser(tx: DBTransaction, prefix: string) {
  return createTestUser(tx, {
    name: `${prefix} User`,
    email: `${prefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
}

async function insertTestDelivery(tx: DBTransaction, input: CreateNotificationDeliveryInput, createdAt?: Date) {
  await tx.insert(notificationDeliveries).values({
    userId: input.userId,
    channel: input.channel,
    eventType: input.eventType,
    status: NotificationDeliveryStatus.SENT,
    title: input.title ?? null,
    ...(createdAt ? { createdAt, updatedAt: createdAt } : {}),
  });
}

function runSetPreferenceTest(
  name: string,
  prefix: string,
  channel: NotificationChannel,
  eventType: NotificationEventType,
  extraAssert?: (
    result: NonNullable<Awaited<ReturnType<typeof NotificationRepository.setPreference>>>,
    userId: string
  ) => void
) {
  notificationTest(name, async tx => {
    const user = await makeUser(tx, prefix);
    const result = await NotificationRepository.setPreference(user.id, { channel, eventType, enabled: true }, tx);
    expect(result).toBeDefined();
    expect(result.channel).toBe(channel);
    expect(result.eventType).toBe(eventType);
    extraAssert?.(result, user.id);
  });
}

describe("NotificationRepository — getPreference", () => {
  notificationTest("returns preference row for existing user/channel/eventType", async tx => {
    const user = await makeUser(tx, "PrefGet");

    await tx.insert(userNotificationPreferences).values({
      userId: user.id,
      channel: NotificationChannel.EMAIL,
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      enabled: true,
    });

    const result = await NotificationRepository.getPreference(
      user.id,
      NotificationChannel.EMAIL,
      NotificationEventType.COMPLAINT_RESPONSE,
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.userId).toBe(user.id);
    expect(result?.channel).toBe(NotificationChannel.EMAIL);
    expect(result?.eventType).toBe(NotificationEventType.COMPLAINT_RESPONSE);
    expect(result?.enabled).toBe(true);
  });

  notificationTest("returns null when no preference row exists", async tx => {
    const user = await makeUser(tx, "PrefNull");

    const result = await NotificationRepository.getPreference(
      user.id,
      NotificationChannel.SMS,
      NotificationEventType.COMPLAINT_RESPONSE,
      tx
    );

    expect(result).toBeNull();
  });
});

describe("NotificationRepository — setPreference", () => {
  runSetPreferenceTest(
    "creates new preference when none exists",
    "PrefCreate",
    NotificationChannel.EMAIL,
    NotificationEventType.COMPLAINT_RESPONSE,
    (result, userId) => {
      expect(result.userId).toBe(userId);
      expect(result.enabled).toBe(true);
    }
  );

  notificationTest("updates existing preference on conflict", async tx => {
    const user = await makeUser(tx, "PrefUpdate");

    await NotificationRepository.setPreference(
      user.id,
      {
        channel: NotificationChannel.SMS,
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        enabled: true,
      },
      tx
    );

    const updated = await NotificationRepository.setPreference(
      user.id,
      {
        channel: NotificationChannel.SMS,
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        enabled: false,
      },
      tx
    );

    expect(updated.enabled).toBe(false);
  });

  runSetPreferenceTest(
    "creates preference for PUSH channel",
    "PrefPush",
    NotificationChannel.PUSH,
    NotificationEventType.INVOICE_GENERATED
  );
});

describe("NotificationRepository — createDeliveriesBatch", () => {
  notificationTest("creates multiple delivery rows atomically", async tx => {
    const user = await makeUser(tx, "Batch");

    const deliveries = await NotificationRepository.createDeliveriesBatch(
      [
        {
          userId: user.id,
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Email delivery",
          body: "Email body",
        },
        {
          userId: user.id,
          channel: NotificationChannel.PUSH,
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Push delivery",
          body: "Push body",
        },
        {
          userId: user.id,
          channel: NotificationChannel.ON_APP,
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "OnApp delivery",
          body: "OnApp body",
        },
      ],
      tx
    );

    expect(deliveries).toHaveLength(3);
    expect(deliveries.every(d => d.userId === user.id)).toBeTrue();
    expect(deliveries.every(d => d.status === (NotificationDeliveryStatus.PENDING as string))).toBeTrue();
    expect(deliveries[0].channel).toBe(NotificationChannel.EMAIL);
    expect(deliveries[1].channel).toBe(NotificationChannel.PUSH);
    expect(deliveries[2].channel).toBe(NotificationChannel.ON_APP);
  });

  notificationTest("creates empty array when given empty input", async tx => {
    const result = await NotificationRepository.createDeliveriesBatch([], tx);
    expect(result).toEqual([]);
  });

  notificationTest("all created deliveries have PENDING status", async tx => {
    const user = await makeUser(tx, "BatchPend");

    const deliveries = await NotificationRepository.createDeliveriesBatch(
      [
        {
          userId: user.id,
          channel: NotificationChannel.SMS,
          eventType: NotificationEventType.NEW_COMPLAINT,
          title: "SMS pending",
        },
      ],
      tx
    );

    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].status).toBe(NotificationDeliveryStatus.PENDING);
    expect(deliveries[0].title).toBe("SMS pending");
  });
});

describe("NotificationRepository — getSmsCountInLastHour", () => {
  notificationTest("returns correct count within 1-hour window", async tx => {
    const user = await makeUser(tx, "SmsCount");

    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: NotificationChannel.SMS,
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      status: NotificationDeliveryStatus.SENT,
      title: "Recent SMS 1",
      createdAt: thirtyMinAgo,
      updatedAt: thirtyMinAgo,
    });

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: NotificationChannel.SMS,
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      status: NotificationDeliveryStatus.SENT,
      title: "Recent SMS 2",
      createdAt: thirtyMinAgo,
      updatedAt: thirtyMinAgo,
    });

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: NotificationChannel.SMS,
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      status: NotificationDeliveryStatus.SENT,
      title: "Old SMS",
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    });

    const count = await NotificationRepository.getSmsCountInLastHour(user.id, tx);

    expect(count).toBeGreaterThanOrEqual(2);
  });

  notificationTest("returns 0 for user with no SMS deliveries", async tx => {
    const user = await makeUser(tx, "SmsZero");

    const count = await NotificationRepository.getSmsCountInLastHour(user.id, tx);

    expect(count).toBe(0);
  });

  notificationTest("excludes non-SMS channels from count", async tx => {
    const user = await makeUser(tx, "SmsExcl");

    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    await tx.insert(notificationDeliveries).values({
      userId: user.id,
      channel: NotificationChannel.EMAIL,
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      status: NotificationDeliveryStatus.SENT,
      title: "Email not SMS",
      createdAt: thirtyMinAgo,
      updatedAt: thirtyMinAgo,
    });

    const count = await NotificationRepository.getSmsCountInLastHour(user.id, tx);

    expect(count).toBe(0);
  });
});

describe("NotificationRepository — getDeliveriesByUser", () => {
  notificationTest("returns paginated deliveries for the user", async tx => {
    const user = await makeUser(tx, "DelivUser");

    const now = new Date();

    await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        tx.insert(notificationDeliveries).values({
          userId: user.id,
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          status: NotificationDeliveryStatus.SENT,
          title: `Delivery ${i}`,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    const result = await NotificationRepository.getDeliveriesByUser(user.id, { limit: 2, offset: 0 }, tx);

    expect(result.rows.length).toBeLessThanOrEqual(2);
    expect(result.totalCount).toBeGreaterThanOrEqual(3);
    expect(result.rows.every(r => r.userId === user.id)).toBeTrue();
  });

  notificationTest("filters by channel", async tx => {
    const user = await makeUser(tx, "DelivChan");
    const now = new Date();

    await insertTestDelivery(
      tx,
      {
        userId: user.id,
        channel: NotificationChannel.EMAIL,
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        title: "Email delivery filter",
      },
      now
    );

    await insertTestDelivery(
      tx,
      {
        userId: user.id,
        channel: NotificationChannel.PUSH,
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        title: "Push delivery filter",
      },
      now
    );

    const result = await NotificationRepository.getDeliveriesByUser(
      user.id,
      { limit: 50, offset: 0, channel: NotificationChannel.EMAIL },
      tx
    );

    expect(result.rows.every(r => r.channel === (NotificationChannel.EMAIL as string))).toBeTrue();
    expect(result.rows.some(r => r.title === "Email delivery filter")).toBeTrue();
    expect(result.rows.some(r => r.title === "Push delivery filter")).toBeFalse();
  });

  notificationTest("filters by eventType", async tx => {
    const user = await makeUser(tx, "DelivEvent");
    const now = new Date();

    await insertTestDelivery(
      tx,
      {
        userId: user.id,
        channel: NotificationChannel.EMAIL,
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        title: "Complaint event",
      },
      now
    );

    await insertTestDelivery(
      tx,
      {
        userId: user.id,
        channel: NotificationChannel.EMAIL,
        eventType: NotificationEventType.INVOICE_GENERATED,
        title: "Invoice event",
      },
      now
    );

    const result = await NotificationRepository.getDeliveriesByUser(
      user.id,
      { limit: 50, offset: 0, eventType: NotificationEventType.COMPLAINT_RESPONSE },
      tx
    );

    expect(result.rows.every(r => r.eventType === (NotificationEventType.COMPLAINT_RESPONSE as string))).toBeTrue();
    expect(result.rows.some(r => r.title === "Invoice event")).toBeFalse();
  });

  notificationTest("returns empty for unknown user", async tx => {
    const result = await NotificationRepository.getDeliveriesByUser(
      "00000000-0000-0000-0000-000000000000",
      { limit: 50, offset: 0 },
      tx
    );

    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});

describe("NotificationRepository — transaction rollback (Story 15)", () => {
  test("rolls back setPreference on subsequent failure", async () => {
    let prefUserId: string | undefined;

    await runInRollback(async tx => {
      const user = await makeUser(tx, "PrefRB");
      prefUserId = user.id;

      await NotificationRepository.setPreference(
        user.id,
        {
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          enabled: false,
        },
        tx
      );
      throw new Error("Simulated rollback error");
    }).catch(() => null);

    if (prefUserId) {
      const [found] = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, prefUserId))
        .limit(1);
      expect(found).toBeUndefined();
    }
  });

  test("rolls back createDeliveriesBatch on subsequent failure", async () => {
    let createdIds: string[] = [];

    await runInRollback(async tx => {
      const user = await makeUser(tx, "BatchRB");

      const deliveries = await NotificationRepository.createDeliveriesBatch(
        [
          {
            userId: user.id,
            channel: NotificationChannel.EMAIL,
            eventType: NotificationEventType.COMPLAINT_RESPONSE,
            title: "Rollback email",
          },
        ],
        tx
      );
      createdIds = deliveries.map(d => d.id);
      throw new Error("Simulated batch rollback");
    }).catch(() => null);

    const foundRows = await Promise.all(
      createdIds.map(id => db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, id)).limit(1))
    );
    for (const [found] of foundRows) {
      expect(found).toBeUndefined();
    }
  });
});

describe("NotificationRepository — non-transactional coverage fallback (Story 15)", () => {
  test("supports getPreference without tx", async () => {
    const result = await NotificationRepository.getPreference(
      "00000000-0000-0000-0000-000000000000",
      NotificationChannel.EMAIL,
      NotificationEventType.COMPLAINT_RESPONSE
    );
    expect(result).toBeNull();
  });

  test("supports getSmsCountInLastHour without tx", async () => {
    const count = await NotificationRepository.getSmsCountInLastHour("00000000-0000-0000-0000-000000000000");
    expect(count).toBe(0);
  });

  test("supports getDeliveriesByUser without tx", async () => {
    const result = await NotificationRepository.getDeliveriesByUser("00000000-0000-0000-0000-000000000000", {
      limit: 1,
      offset: 0,
    });
    expect(result.rows).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
