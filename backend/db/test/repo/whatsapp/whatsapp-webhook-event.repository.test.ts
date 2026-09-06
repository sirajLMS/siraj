import { describe, expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { WhatsappWebhookEventRepository } from "@/backend/db/repo/whatsapp";
import { whatsappAccounts, whatsappWebhookEvents } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { WhatsappWebhookEventStatus } from "@/backend/enum/whatsapp";
import type { DBTransaction, WhatsappAccountSelectType, WhatsappWebhookEventInsertType } from "@/backend/types";

function eventTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

async function makeAccount(tx: DBTransaction): Promise<WhatsappAccountSelectType> {
  const [account] = await tx
    .insert(whatsappAccounts)
    .values({
      wabaId: `waba-${randomUUID()}`,
      phoneNumberId: `pn-${randomUUID()}`,
      encryptedAccessToken: `token-${randomUUID()}`,
      encryptedTwoStepPin: "123456",
    })
    .returning();
  if (!account) throw new Error("account insert returned no row");
  return account;
}

function eventInput(
  accountId: string,
  overrides: Partial<WhatsappWebhookEventInsertType> = {}
): WhatsappWebhookEventInsertType {
  return {
    accountId,
    field: "messages",
    payload: { value: { messaging_product: "whatsapp" } },
    payloadHash: createHash("sha256").update(randomUUID()).digest("hex"),
    ...overrides,
  };
}

/**
 * Claim `times` times sequentially (each claim increments attempts). Uses the
 * sweeper path with a zero backoff base so re-claims of the PROCESSING row
 * are instant — the plain claimBatch deliberately cannot re-claim it.
 */
async function claimRepeatedTimes(times: number, tx: DBTransaction): Promise<void> {
  if (times === 0) return;
  await WhatsappWebhookEventRepository.claimBatchWithBackoff(100, 0, tx);
  await claimRepeatedTimes(times - 1, tx);
}

describe("WhatsappWebhookEventRepository — insert / insertBatch", () => {
  eventTest("insert defaults to PENDING with zero attempts and round-trips the payload", async tx => {
    const account = await makeAccount(tx);
    const row = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);

    expect(row.status).toBe(WhatsappWebhookEventStatus.PENDING);
    expect(row.attempts).toBe(0);
    expect(row.payload).toEqual({ value: { messaging_product: "whatsapp" } });
    expect(row.processedAt).toBeNull();
  });

  eventTest("insertBatch persists multiple changes and handles an empty burst", async tx => {
    const account = await makeAccount(tx);
    const count = await WhatsappWebhookEventRepository.insertBatch(
      [eventInput(account.id, { field: "history" }), eventInput(account.id, { field: "smb_app_state_sync" })],
      tx
    );
    expect(count).toBe(2);
    expect(await WhatsappWebhookEventRepository.insertBatch([], tx)).toBe(0);
  });

  eventTest("claims nothing when every event is in a terminal state", async tx => {
    const account = await makeAccount(tx);
    const event = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);
    await WhatsappWebhookEventRepository.markProcessed(event.id, tx);

    const claimed = await WhatsappWebhookEventRepository.claimBatch(10, tx);
    // none of MY events may be claimed
    expect(claimed.filter(row => row.accountId === account.id)).toEqual([]);
  });
});

describe("WhatsappWebhookEventRepository — claimBatch (SKIP LOCKED)", () => {
  eventTest("claims oldest PENDING first, increments attempts, and skips processed rows", async tx => {
    const account = await makeAccount(tx);
    const oldest = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);
    const newest = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);

    const claimed = await WhatsappWebhookEventRepository.claimBatch(1, tx);
    expect(claimed.length).toBeGreaterThanOrEqual(1);
    // ordered by receivedAt ASC — the row inserted first is claimed first within this test
    const mine = claimed.find(row => row.accountId === account.id);
    expect(mine?.id).toBe(oldest.id);
    expect(mine?.attempts).toBe(1);

    // terminal states are never claimed
    await WhatsappWebhookEventRepository.markProcessed(oldest.id, tx);
    const next = await WhatsappWebhookEventRepository.claimBatch(10, tx);
    const ids = next.map(row => row.id);
    expect(ids).toContain(newest.id);
    expect(ids).not.toContain(oldest.id);
  });

  eventTest("a claimed row flips to PROCESSING and a racing claim cannot re-claim it", async tx => {
    const account = await makeAccount(tx);
    const event = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);

    const first = await WhatsappWebhookEventRepository.claimBatch(10, tx);
    expect(first.find(row => row.id === event.id)?.status).toBe(WhatsappWebhookEventStatus.PROCESSING);

    // Worker A holds the claim after commit; a later competing claimBatch sees nothing.
    const racing = await WhatsappWebhookEventRepository.claimBatch(10, tx);
    expect(racing.map(row => row.id)).not.toContain(event.id);
  });

  eventTest("crash-stale PROCESSING rows become re-claimable through the backoff sweep", async tx => {
    const account = await makeAccount(tx);
    const stale = await WhatsappWebhookEventRepository.insert(
      eventInput(account.id, { receivedAt: new Date(Date.now() - 30 * 60_000) }),
      tx
    );

    // Worker "crashed" after claiming: the row sits in PROCESSING (attempts=1).
    await WhatsappWebhookEventRepository.claimBatch(10, tx);

    const reclaimed = await WhatsappWebhookEventRepository.claimBatchWithBackoff(10, 60_000, tx);
    const mine = reclaimed.find(row => row.id === stale.id);
    expect(mine?.status).toBe(WhatsappWebhookEventStatus.PROCESSING);
    expect(mine?.attempts).toBe(2);
  });
});

describe("WhatsappWebhookEventRepository — markProcessed / markFailed", () => {
  eventTest("flips status with processedAt; unknown ids map to null", async tx => {
    const account = await makeAccount(tx);
    const event = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);

    const processed = await WhatsappWebhookEventRepository.markProcessed(event.id, tx);
    expect(processed?.status).toBe(WhatsappWebhookEventStatus.PROCESSED);
    expect(processed?.processedAt).not.toBeNull();

    const failed = await WhatsappWebhookEventRepository.markFailed(event.id, tx);
    expect(failed?.status).toBe(WhatsappWebhookEventStatus.FAILED);

    expect(await WhatsappWebhookEventRepository.markProcessed(randomUUID(), tx)).toBeNull();
    expect(await WhatsappWebhookEventRepository.markFailed(randomUUID(), tx)).toBeNull();
  });

  eventTest("markProcessed accepts the PROCESSING state left by a claim", async tx => {
    const account = await makeAccount(tx);
    const event = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);
    await WhatsappWebhookEventRepository.claimBatch(10, tx);

    const processed = await WhatsappWebhookEventRepository.markProcessed(event.id, tx);
    expect(processed?.status).toBe(WhatsappWebhookEventStatus.PROCESSED);

    const failedId = (await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx)).id;
    await WhatsappWebhookEventRepository.claimBatch(10, tx);
    const failed = await WhatsappWebhookEventRepository.markFailed(failedId, tx);
    expect(failed?.status).toBe(WhatsappWebhookEventStatus.FAILED);
  });
});

describe("WhatsappWebhookEventRepository — parkExhausted (poison park)", () => {
  eventTest("parks exhausted rows regardless of PENDING/PROCESSING state", async tx => {
    const account = await makeAccount(tx);
    const poison = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);

    // exhaust the poison row: 3 claims, worker "crashes" each time
    await claimRepeatedTimes(3, tx);
    const fresh = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);

    const parked = await WhatsappWebhookEventRepository.parkExhausted(3, tx);
    expect(parked).toBe(1);

    const [poisonRow] = await tx
      .select()
      .from(whatsappWebhookEvents)
      .where(eq(whatsappWebhookEvents.id, poison.id))
      .limit(1);
    expect(poisonRow?.status).toBe(WhatsappWebhookEventStatus.FAILED);

    const [freshRow] = await tx
      .select()
      .from(whatsappWebhookEvents)
      .where(eq(whatsappWebhookEvents.id, fresh.id))
      .limit(1);
    expect(freshRow?.status).toBe(WhatsappWebhookEventStatus.PENDING);
  });

  eventTest("parks nothing when nothing is exhausted", async tx => {
    const account = await makeAccount(tx);
    await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);
    expect(await WhatsappWebhookEventRepository.parkExhausted(100, tx)).toBe(0);
  });
});

describe("WhatsappWebhookEventRepository — claimBatchWithBackoff (sweeper retries)", () => {
  eventTest(
    "claims fresh rows regardless of timing, but defers a retried row whose backoff has not elapsed",
    async tx => {
      const account = await makeAccount(tx);
      const recentRetry = await WhatsappWebhookEventRepository.insert(
        eventInput(account.id, { receivedAt: new Date(Date.now() - 30_000) }),
        tx
      );
      const staleRetry = await WhatsappWebhookEventRepository.insert(
        eventInput(account.id, { receivedAt: new Date(Date.now() - 30 * 60_000) }),
        tx
      );

      // One claim each: attempts becomes 1, so a retry needs base*(2^1-1)=base ms since receipt.
      await WhatsappWebhookEventRepository.claimBatch(100, tx);

      const tooEarly = await WhatsappWebhookEventRepository.claimBatchWithBackoff(100, 60_000, tx);
      const tooEarlyMine = tooEarly.filter(row => row.accountId === account.id);
      expect(tooEarlyMine.map(row => row.id)).toContain(staleRetry.id);
      expect(tooEarlyMine.map(row => row.id)).not.toContain(recentRetry.id);
      expect(tooEarlyMine.find(row => row.id === staleRetry.id)?.attempts).toBe(2);
    }
  );

  eventTest("fresh rows pass the backoff predicate immediately (attempts=0 → zero delay)", async tx => {
    const account = await makeAccount(tx);
    const fresh = await WhatsappWebhookEventRepository.insert(eventInput(account.id), tx);

    const claimed = await WhatsappWebhookEventRepository.claimBatchWithBackoff(100, 60_000, tx);
    const mine = claimed.find(row => row.accountId === account.id);
    expect(mine?.id).toBe(fresh.id);
    expect(mine?.attempts).toBe(1);
  });
});

describe("WhatsappWebhookEventRepository — existsRecentByHash (replay window)", () => {
  eventTest("detects the same payload hash only within the short window", async tx => {
    const account = await makeAccount(tx);
    const hash = createHash("sha256").update("exact-body").digest("hex");
    const otherHash = createHash("sha256").update("other-body").digest("hex");

    await WhatsappWebhookEventRepository.insert(eventInput(account.id, { payloadHash: hash }), tx);

    expect(await WhatsappWebhookEventRepository.existsRecentByHash(hash, new Date(Date.now() - 60_000), tx)).toBe(true);
    expect(await WhatsappWebhookEventRepository.existsRecentByHash(hash, new Date(Date.now() + 60_000), tx)).toBe(
      false
    );
    expect(await WhatsappWebhookEventRepository.existsRecentByHash(otherHash, new Date(Date.now() - 60_000), tx)).toBe(
      false
    );
  });
});
