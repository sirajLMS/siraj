import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { WhatsappSyncRequestRepository } from "@/backend/db/repo/whatsapp";
import { whatsappAccounts } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { WhatsappSyncRequestStatus, WhatsappSyncType } from "@/backend/enum/whatsapp";
import type { DBTransaction, WhatsappAccountSelectType } from "@/backend/types";

function syncTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
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

describe("WhatsappSyncRequestRepository — ensure (one-shot guard)", () => {
  syncTest("first ensure creates (PENDING); a retry returns the same row with created=false", async tx => {
    const account = await makeAccount(tx);

    const first = await WhatsappSyncRequestRepository.ensure(
      { accountId: account.id, syncType: WhatsappSyncType.HISTORY },
      tx
    );
    expect(first.created).toBe(true);
    expect(first.request.status).toBe(WhatsappSyncRequestStatus.PENDING);
    expect(first.request.syncType).toBe(WhatsappSyncType.HISTORY);

    const retry = await WhatsappSyncRequestRepository.ensure(
      { accountId: account.id, syncType: WhatsappSyncType.HISTORY },
      tx
    );
    expect(retry.created).toBe(false);
    expect(retry.request.id).toBe(first.request.id);
  });

  syncTest("each syncType gets its own row per account; accounts don't collide", async tx => {
    const accountA = await makeAccount(tx);
    const accountB = await makeAccount(tx);

    const history = await WhatsappSyncRequestRepository.ensure(
      { accountId: accountA.id, syncType: WhatsappSyncType.HISTORY },
      tx
    );
    const stateSync = await WhatsappSyncRequestRepository.ensure(
      { accountId: accountA.id, syncType: WhatsappSyncType.SMB_APP_STATE_SYNC },
      tx
    );
    const otherAccount = await WhatsappSyncRequestRepository.ensure(
      { accountId: accountB.id, syncType: WhatsappSyncType.HISTORY },
      tx
    );
    expect(history.created).toBe(true);
    expect(stateSync.created).toBe(true);
    expect(otherAccount.created).toBe(true);

    const listed = await WhatsappSyncRequestRepository.listByAccount(accountA.id, tx);
    expect(listed).toHaveLength(2);
    expect(listed.map(row => row.syncType)).toContain(WhatsappSyncType.SMB_APP_STATE_SYNC);
    // bare read without tx — nothing rolls back here, reading a random account is safe
    expect(await WhatsappSyncRequestRepository.findByAccountAndType(randomUUID(), WhatsappSyncType.HISTORY)).toBeNull();
  });
});

describe("WhatsappSyncRequestRepository — recordRequestId (retry-safe)", () => {
  syncTest("records Meta's accept request_id exactly once", async tx => {
    const account = await makeAccount(tx);
    const { request } = await WhatsappSyncRequestRepository.ensure(
      { accountId: account.id, syncType: WhatsappSyncType.HISTORY },
      tx
    );

    const recorded = await WhatsappSyncRequestRepository.recordRequestId(request.id, "req-1234-abcd", tx);
    expect(recorded?.requestId).toBe("req-1234-abcd");
    expect(recorded?.status).toBe(WhatsappSyncRequestStatus.REQUESTED);
    expect(recorded?.requestedAt).not.toBeNull();

    // second accept (transient retry after response loss) must not overwrite
    const again = await WhatsappSyncRequestRepository.recordRequestId(request.id, "req-5678-efgh", tx);
    expect(again).toBeNull();

    const read = await WhatsappSyncRequestRepository.findByAccountAndType(account.id, WhatsappSyncType.HISTORY, tx);
    expect(read?.requestId).toBe("req-1234-abcd");
  });
});

describe("WhatsappSyncRequestRepository — updateStatus transitions", () => {
  syncTest("PENDING → REQUESTED → STREAMING → COMPLETE; terminal states stamp completedAt", async tx => {
    const account = await makeAccount(tx);
    const { request } = await WhatsappSyncRequestRepository.ensure(
      { accountId: account.id, syncType: WhatsappSyncType.SMB_APP_STATE_SYNC },
      tx
    );

    const streaming = await WhatsappSyncRequestRepository.updateStatus(
      request.id,
      WhatsappSyncRequestStatus.STREAMING,
      tx
    );
    expect(streaming?.status).toBe(WhatsappSyncRequestStatus.STREAMING);
    expect(streaming?.completedAt).toBeNull();

    const complete = await WhatsappSyncRequestRepository.updateStatus(
      request.id,
      WhatsappSyncRequestStatus.COMPLETE,
      tx
    );
    expect(complete?.completedAt).not.toBeNull();

    const failedOther = await WhatsappSyncRequestRepository.ensure(
      { accountId: account.id, syncType: WhatsappSyncType.HISTORY },
      tx
    );
    const failed = await WhatsappSyncRequestRepository.updateStatus(
      failedOther.request.id,
      WhatsappSyncRequestStatus.FAILED,
      tx
    );
    expect(failed?.completedAt).not.toBeNull();
    expect(failed?.status).toBe(WhatsappSyncRequestStatus.FAILED);

    expect(
      await WhatsappSyncRequestRepository.updateStatus(randomUUID(), WhatsappSyncRequestStatus.PENDING, tx)
    ).toBeNull();
  });
});
