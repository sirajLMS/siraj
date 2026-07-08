import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { NotificationPreferencesRepository } from "@/backend/db/repo/notification-preferences.repository";
import { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";
import { createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";

function preferencesTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

describe("NotificationPreferencesRepository — getByUserId", () => {
  preferencesTest("returns all stored preferences for a user", async tx => {
    const user = await createTestUser(tx, {
      name: "Prefs User",
      email: `prefs-${randomUUID()}@test.com`,
    });

    await NotificationPreferencesRepository.batchUpsert(
      user.id,
      [
        {
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.CLASS_REMINDER,
          enabled: true,
        },
        {
          channel: NotificationChannel.SMS,
          eventType: NotificationEventType.INVOICE_GENERATED,
          enabled: false,
        },
      ],
      tx
    );

    const results = await NotificationPreferencesRepository.getByUserId(user.id, tx);

    expect(results).toHaveLength(2);
    expect(results.some(row => row.channel === NotificationChannel.EMAIL)).toBe(true);
    expect(results.some(row => row.channel === NotificationChannel.SMS && row.enabled === false)).toBe(true);
  });

  preferencesTest("returns empty array when user has no preferences", async tx => {
    const user = await createTestUser(tx, {
      name: "Prefs Empty",
      email: `prefs-empty-${randomUUID()}@test.com`,
    });

    const results = await NotificationPreferencesRepository.getByUserId(user.id, tx);
    expect(results).toEqual([]);
  });
});

describe("NotificationPreferencesRepository — batchUpsert", () => {
  preferencesTest("upserts multiple preferences in one batch", async tx => {
    const user = await createTestUser(tx, {
      name: "Prefs Batch",
      email: `prefs-batch-${randomUUID()}@test.com`,
    });

    await NotificationPreferencesRepository.batchUpsert(
      user.id,
      [
        {
          channel: NotificationChannel.PUSH,
          eventType: NotificationEventType.NEW_COMPLAINT,
          enabled: true,
        },
      ],
      tx
    );

    const updated = await NotificationPreferencesRepository.batchUpsert(
      user.id,
      [
        {
          channel: NotificationChannel.PUSH,
          eventType: NotificationEventType.NEW_COMPLAINT,
          enabled: false,
        },
      ],
      tx
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]?.enabled).toBe(false);
  });
});
