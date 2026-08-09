import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { NotificationRepository } from "@/backend/db/repo";
import { notificationDeliveries } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";

function notificationTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

async function makeUser(tx: DBTransaction, prefix: string) {
  return createTestUser(tx, {
    name: `${prefix} User`,
    email: `${prefix.toLowerCase()}-${randomUUID()}@test.com`,
  });
}

const BASE_INPUT = {
  channel: NotificationChannel.EMAIL,
  eventType: NotificationEventType.COMPLAINT_RESPONSE,
} as const;

/**
 * Insert a delivery row with a specific status and providerMessageId,
 * simulating an existing row that a webhook would attempt to update.
 */
async function insertDeliveryWithStatus(
  tx: DBTransaction,
  userId: string,
  providerMessageId: string,
  status: NotificationDeliveryStatus
) {
  const now = new Date();
  const [row] = await tx
    .insert(notificationDeliveries)
    .values({
      userId,
      channel: BASE_INPUT.channel,
      eventType: BASE_INPUT.eventType,
      status,
      providerMessageId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

/** Input payload for the INSERT-path webhook (creates a new row). */
interface InsertPayload {
  providerMessageId: string;
  status: NotificationDeliveryStatus;
  userId: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
}

/** Input payload for the UPDATE-path webhook (updates an existing row). */
interface UpdatePayload {
  providerMessageId: string;
  status: NotificationDeliveryStatus;
  failureReason?: string;
}

/**
 * Run a single-transition rank-guard test: insert a row at `from` status,
 * send a webhook for `to` status, and assert the result status.
 * Uses the UPDATE branch of handleDeliveryWebhook.
 */
async function assertSingleTransition(
  tx: DBTransaction,
  prefix: string,
  from: NotificationDeliveryStatus,
  to: NotificationDeliveryStatus,
  failureReason?: string
) {
  const user = await makeUser(tx, prefix);
  const pmi = `${prefix.toLowerCase()}-${randomUUID()}`;
  const existing = await insertDeliveryWithStatus(tx, user.id, pmi, from);
  expect(existing.status).toBe(from);

  const payload: UpdatePayload = { providerMessageId: pmi, status: to };
  if (failureReason !== undefined) {
    payload.failureReason = failureReason;
  }

  const result = await NotificationRepository.handleDeliveryWebhook(payload, tx);
  expect(result).not.toBeNull();
  expect(result?.status).toBe(to);
  return { result, existing, pmi };
}

/**
 * Run a two-sequential-webhook test: first webhook creates a row at
 * `firstStatus` via the INSERT path, second webhook transitions to
 * `secondStatus` via the UPDATE path, asserting the expected final status.
 * If `expectUnchanged` is true, the second webhook should be rejected and
 * the row stays at `firstStatus`.
 */
async function assertSequentialWebhooks(
  tx: DBTransaction,
  prefix: string,
  firstStatus: NotificationDeliveryStatus,
  secondStatus: NotificationDeliveryStatus,
  expectedFinalStatus: NotificationDeliveryStatus
) {
  const user = await makeUser(tx, prefix);
  const pmi = `${prefix.toLowerCase()}-${randomUUID()}`;

  const insertPayload: InsertPayload = {
    providerMessageId: pmi,
    status: firstStatus,
    userId: user.id,
    channel: BASE_INPUT.channel,
    eventType: BASE_INPUT.eventType,
  };
  const first = await NotificationRepository.handleDeliveryWebhook(insertPayload, tx);
  expect(first).not.toBeNull();
  expect(first?.status).toBe(firstStatus);

  const updatePayload: UpdatePayload = { providerMessageId: pmi, status: secondStatus };
  const second = await NotificationRepository.handleDeliveryWebhook(updatePayload, tx);
  expect(second).not.toBeNull();
  expect(second?.status).toBe(expectedFinalStatus);
  return { first, second, pmi };
}

describe("NotificationRepository — handleDeliveryWebhook rank guard", () => {
  notificationTest("forward upgrade: sent (rank 1) → delivered (rank 2) succeeds", async tx => {
    const user = await makeUser(tx, "RgFwd");
    const pmi = `rgfwd-${randomUUID()}`;

    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.SENT);
    expect(existing.status).toBe(NotificationDeliveryStatus.SENT);

    // The delivery row exists with a FOR UPDATE lock — UPDATE branch fires.
    // Forward transition sent → delivered is valid (rank 2 > rank 1).
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.DELIVERED },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.DELIVERED);
  });

  notificationTest("downgrade rejection: delivered (rank 2) → sent (rank 1) is skipped", async tx => {
    const user = await makeUser(tx, "RgDn");
    const pmi = `rgdn-${randomUUID()}`;

    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.DELIVERED);
    expect(existing.status).toBe(NotificationDeliveryStatus.DELIVERED);

    // Downgrade delivered → sent is rejected by the TS rank guard.
    // The method returns the current row unchanged.
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.SENT },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.DELIVERED);

    // Verify the DB row was not modified.
    const [unchanged] = await tx
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.id, existing.id))
      .limit(1);
    expect(unchanged.status).toBe(NotificationDeliveryStatus.DELIVERED);
  });

  notificationTest("INSERT path creates a new delivery row when none exists", async tx => {
    const user = await makeUser(tx, "RgNew");
    const pmi = `rgnew-${randomUUID()}`;

    // No pre-existing row — INSERT path fires (with ON CONFLICT guard).
    const result = await NotificationRepository.handleDeliveryWebhook(
      {
        providerMessageId: pmi,
        status: NotificationDeliveryStatus.SENT,
        userId: user.id,
        channel: BASE_INPUT.channel,
        eventType: BASE_INPUT.eventType,
      },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.SENT);
    expect(result?.providerMessageId).toBe(pmi);
  });

  notificationTest("two sequential webhooks: first creates SENT, second upgrades to DELIVERED", async tx => {
    await assertSequentialWebhooks(
      tx,
      "RgSeq",
      NotificationDeliveryStatus.SENT,
      NotificationDeliveryStatus.DELIVERED,
      NotificationDeliveryStatus.DELIVERED
    );
  });

  notificationTest("two sequential webhooks: first creates DELIVERED, second downgrade to SENT rejected", async tx => {
    await assertSequentialWebhooks(
      tx,
      "RgSeqDn",
      NotificationDeliveryStatus.DELIVERED,
      NotificationDeliveryStatus.SENT,
      NotificationDeliveryStatus.DELIVERED
    );
  });

  notificationTest("graceful skip: returns null when row not found and required fields are missing", async tx => {
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: `rgskip-${randomUUID()}`, status: NotificationDeliveryStatus.DELIVERED },
      tx
    );
    expect(result).toBeNull();
  });

  // Regression: PENDING → FAILED must be allowed (FAILED rank is -1, so
  // the plain nextRank>currentRank check would reject it). All notification
  // adapters create deliveries at PENDING then call updateDeliveryStatus(FAILED)
  // on send errors — so this transition MUST succeed.
  notificationTest("critical: pending → failed via assertValidStatusTransition is allowed", async tx => {
    const user = await makeUser(tx, "RgPendFail");
    const pmi = `rgpendfail-${randomUUID()}`;

    // Insert a row at PENDING — simulating "delivery created, send about to start".
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.PENDING);
    expect(existing.status).toBe(NotificationDeliveryStatus.PENDING);

    // Update to FAILED via updateDeliveryStatus — this calls
    // assertValidStatusTransition internally.
    // Before the fix this would throw the "invalidTransition" error.
    const updated = await NotificationRepository.updateDeliveryStatus(
      {
        deliveryId: existing.id,
        status: NotificationDeliveryStatus.FAILED,
        failureReason: "send_exception",
      },
      tx
    );

    expect(updated.status).toBe(NotificationDeliveryStatus.FAILED);
    expect(updated.failureReason).toBe("send_exception");
  });

  notificationTest("webhook: pending → failed via handleDeliveryWebhook rank guard is allowed", async tx => {
    const user = await makeUser(tx, "RgPendFailWh");
    const pmi = `rgpendfailwh-${randomUUID()}`;

    // Pre-existing row at PENDING (e.g. dispatch created it then provider
    // reported delivery failure via webhook).
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.PENDING);
    expect(existing.status).toBe(NotificationDeliveryStatus.PENDING);

    // Webhook update to FAILED goes through the isValidTransition branch.
    // Before the fix the guard would reject this (rank -1 < rank 0), skip
    // the update, and return the unchanged row — losing the failure signal.
    const result = await NotificationRepository.handleDeliveryWebhook(
      {
        providerMessageId: pmi,
        status: NotificationDeliveryStatus.FAILED,
        failureReason: "provider_error",
      },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.FAILED);
  });

  notificationTest("assert: failed is reachable from any non-failed state (delivered → failed)", async tx => {
    const user = await makeUser(tx, "RgAnyFail");
    const pmi = `rganyfail-${randomUUID()}`;

    // Start from DELIVERED — a strictly higher rank than PENDING but FAILED
    // (rank -1) is still lower. The fix explicitly allows FAILED from any
    // state, so this should succeed too.
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.DELIVERED);
    expect(existing.status).toBe(NotificationDeliveryStatus.DELIVERED);

    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.FAILED },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.FAILED);
  });

  // r10-058: Rank transition edge cases

  notificationTest("r10-058: failureReason cleared on SENT→DELIVERED after prior FAILED was downgraded", async tx => {
    const user = await makeUser(tx, "RgFailClear");
    const pmi = `rgfailclear-${randomUUID()}`;

    // Step 1: Create row at PENDING
    const pending = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.PENDING);
    expect(pending.status).toBe(NotificationDeliveryStatus.PENDING);

    // Step 2: Transition PENDING → FAILED (allowed: FAILED reachable from any state)
    const failed = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.FAILED, failureReason: "provider_error" },
      tx
    );
    expect(failed).not.toBeNull();
    expect(failed?.status).toBe(NotificationDeliveryStatus.FAILED);
    expect(failed?.failureReason).toBe("provider_error");

    // Step 3: Resurrect FAILED → SENT (allowed: currentRank=-1, nextRank=1 > 0)
    const sent = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.SENT },
      tx
    );
    expect(sent).not.toBeNull();
    expect(sent?.status).toBe(NotificationDeliveryStatus.SENT);
    // failureReason is set to `failureReason ?? null` — with no failureReason passed, it's cleared
    expect(sent?.failureReason).toBeNull();

    // Step 4: Upgrade SENT → DELIVERED (allowed: rank 2 > 1)
    const delivered = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.DELIVERED },
      tx
    );
    expect(delivered).not.toBeNull();
    expect(delivered?.status).toBe(NotificationDeliveryStatus.DELIVERED);
    // failureReason should still be null after the DELIVERED transition
    expect(delivered?.failureReason).toBeNull();
  });

  notificationTest("r10-058: OPENED (read) rank relative to DELIVERED — DELIVERED→OPENED succeeds", async tx => {
    await assertSingleTransition(
      tx,
      "RgOpened",
      NotificationDeliveryStatus.DELIVERED,
      NotificationDeliveryStatus.OPENED
    );
  });

  notificationTest("r10-058: idempotent same-rank status (DELIVERED→DELIVERED) is a no-op", async tx => {
    const { result, existing } = await assertSingleTransition(
      tx,
      "RgIdem",
      NotificationDeliveryStatus.DELIVERED,
      NotificationDeliveryStatus.DELIVERED
    );
    expect(result?.id).toBe(existing.id);
  });

  notificationTest("r10-058: FAILED→SENT resurrection is allowed (rank 1 > -1)", async tx => {
    await assertSingleTransition(tx, "RgResurrect", NotificationDeliveryStatus.FAILED, NotificationDeliveryStatus.SENT);
  });

  // r10-059: Additional transition coverage

  notificationTest("r10-059: PENDING→SENT transition succeeds (rank 1 > 0)", async tx => {
    await assertSingleTransition(tx, "RgPs", NotificationDeliveryStatus.PENDING, NotificationDeliveryStatus.SENT);
  });

  notificationTest("r10-059: SENT→OPENED transition succeeds (rank 3 > 1)", async tx => {
    await assertSingleTransition(tx, "RgSo", NotificationDeliveryStatus.SENT, NotificationDeliveryStatus.OPENED);
  });

  notificationTest("r10-059: DELIVERED→OPENED transition succeeds (rank 3 > 2)", async tx => {
    await assertSingleTransition(tx, "RgDo", NotificationDeliveryStatus.DELIVERED, NotificationDeliveryStatus.OPENED);
  });
});
