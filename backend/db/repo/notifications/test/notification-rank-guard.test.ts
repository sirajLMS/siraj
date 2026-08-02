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
  // eslint-disable-next-line sonarjs/assertions-in-tests -- assertions are inside runInRollback(fn)
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
    const user = await makeUser(tx, "RgSeq");
    const pmi = `rgseq-${randomUUID()}`;

    // First webhook — row doesn't exist, INSERT path creates it with SENT.
    const first = await NotificationRepository.handleDeliveryWebhook(
      {
        providerMessageId: pmi,
        status: NotificationDeliveryStatus.SENT,
        userId: user.id,
        channel: BASE_INPUT.channel,
        eventType: BASE_INPUT.eventType,
      },
      tx
    );
    expect(first).not.toBeNull();
    expect(first?.status).toBe(NotificationDeliveryStatus.SENT);

    // Second webhook — row exists, UPDATE branch upgrades to DELIVERED.
    const second = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.DELIVERED },
      tx
    );
    expect(second).not.toBeNull();
    expect(second?.status).toBe(NotificationDeliveryStatus.DELIVERED);
  });

  notificationTest("two sequential webhooks: first creates DELIVERED, second downgrade to SENT rejected", async tx => {
    const user = await makeUser(tx, "RgSeqDn");
    const pmi = `rgseqdn-${randomUUID()}`;

    // First webhook — creates row with DELIVERED.
    const first = await NotificationRepository.handleDeliveryWebhook(
      {
        providerMessageId: pmi,
        status: NotificationDeliveryStatus.DELIVERED,
        userId: user.id,
        channel: BASE_INPUT.channel,
        eventType: BASE_INPUT.eventType,
      },
      tx
    );
    expect(first).not.toBeNull();
    expect(first?.status).toBe(NotificationDeliveryStatus.DELIVERED);

    // Second webhook — downgrade to SENT is rejected, row stays DELIVERED.
    const second = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.SENT },
      tx
    );
    expect(second).not.toBeNull();
    expect(second?.status).toBe(NotificationDeliveryStatus.DELIVERED);
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
    const user = await makeUser(tx, "RgOpened");
    const pmi = `rgopened-${randomUUID()}`;

    // Start at DELIVERED (rank 2)
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.DELIVERED);
    expect(existing.status).toBe(NotificationDeliveryStatus.DELIVERED);

    // DELIVERED → OPENED: rank 3 > 2, should succeed
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.OPENED },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.OPENED);
  });

  notificationTest("r10-058: idempotent same-rank status (DELIVERED→DELIVERED) is a no-op", async tx => {
    const user = await makeUser(tx, "RgIdem");
    const pmi = `rgidem-${randomUUID()}`;

    // Start at DELIVERED
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.DELIVERED);
    expect(existing.status).toBe(NotificationDeliveryStatus.DELIVERED);

    // Same-status webhook — no-op, return current row unchanged
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.DELIVERED },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.DELIVERED);
    expect(result?.id).toBe(existing.id);
  });

  notificationTest("r10-058: FAILED→SENT resurrection is allowed (rank 1 > -1)", async tx => {
    const user = await makeUser(tx, "RgResurrect");
    const pmi = `rgresurrect-${randomUUID()}`;

    // Start at FAILED
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.FAILED);
    expect(existing.status).toBe(NotificationDeliveryStatus.FAILED);

    // FAILED → SENT: currentRank=-1, nextRank=1 > 0 → allowed (resurrection)
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.SENT },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.SENT);
  });

  // r10-059: Additional transition coverage

  notificationTest("r10-059: PENDING→SENT transition succeeds (rank 1 > 0)", async tx => {
    const user = await makeUser(tx, "RgPs");
    const pmi = `rgps-${randomUUID()}`;

    // Start at PENDING (rank 0)
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.PENDING);
    expect(existing.status).toBe(NotificationDeliveryStatus.PENDING);

    // PENDING → SENT: rank 1 > 0, should succeed
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.SENT },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.SENT);
  });

  notificationTest("r10-059: SENT→OPENED transition succeeds (rank 3 > 1)", async tx => {
    const user = await makeUser(tx, "RgSo");
    const pmi = `rgso-${randomUUID()}`;

    // Start at SENT (rank 1)
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.SENT);
    expect(existing.status).toBe(NotificationDeliveryStatus.SENT);

    // SENT → OPENED: rank 3 > 1, should succeed
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.OPENED },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.OPENED);
  });

  notificationTest("r10-059: DELIVERED→OPENED transition succeeds (rank 3 > 2)", async tx => {
    const user = await makeUser(tx, "RgDo");
    const pmi = `rgdo-${randomUUID()}`;

    // Start at DELIVERED (rank 2)
    const existing = await insertDeliveryWithStatus(tx, user.id, pmi, NotificationDeliveryStatus.DELIVERED);
    expect(existing.status).toBe(NotificationDeliveryStatus.DELIVERED);

    // DELIVERED → OPENED: rank 3 > 2, should succeed
    const result = await NotificationRepository.handleDeliveryWebhook(
      { providerMessageId: pmi, status: NotificationDeliveryStatus.OPENED },
      tx
    );

    expect(result).not.toBeNull();
    expect(result?.status).toBe(NotificationDeliveryStatus.OPENED);
  });
});
