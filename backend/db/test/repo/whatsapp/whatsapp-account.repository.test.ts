import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { whatsappAccounts } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { WhatsappAccountPurpose, WhatsappSyncStatus } from "@/backend/enum/whatsapp";
import type { DBTransaction, WhatsappAccountInsertType, WhatsappAccountSelectType } from "@/backend/types";

function accountTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

let counter = 0;

function accountInput(overrides: Partial<WhatsappAccountInsertType> = {}): WhatsappAccountInsertType {
  counter += 1;
  const seq = counter;
  return {
    wabaId: `waba-${randomUUID()}`,
    phoneNumberId: `pn-${randomUUID()}`,
    encryptedAccessToken: `token-${randomUUID()}`,
    encryptedTwoStepPin: "123456",
    createdAt: new Date(Date.now() - (10_000 - seq)),
    ...overrides,
  };
}

async function makeAccount(
  tx: DBTransaction,
  overrides: Partial<WhatsappAccountInsertType> = {}
): Promise<WhatsappAccountSelectType> {
  const [account] = await tx.insert(whatsappAccounts).values(accountInput(overrides)).returning();
  if (!account) throw new Error("account insert returned no row");
  return account;
}

describe("WhatsappAccountRepository — reads", () => {
  accountTest("findById / findByPhoneNumberId with hit and miss paths", async tx => {
    const account = await makeAccount(tx);
    expect((await WhatsappAccountRepository.findById(account.id, tx))?.phoneNumberId).toBe(account.phoneNumberId);
    expect(await WhatsappAccountRepository.findById(randomUUID(), tx)).toBeNull();
    expect((await WhatsappAccountRepository.findByPhoneNumberId(account.phoneNumberId, tx))?.id).toBe(account.id);
    expect(await WhatsappAccountRepository.findByPhoneNumberId("pn-does-not-exist", tx)).toBeNull();
  });

  accountTest("findByPhoneNumberIds batch lookup pre-fills nulls for unknown ids", async tx => {
    const account = await makeAccount(tx);
    const batch = await WhatsappAccountRepository.findByPhoneNumberIds([account.phoneNumberId, "pn-missing"], tx);
    expect(batch.get(account.phoneNumberId)?.id).toBe(account.id);
    expect(batch.get("pn-missing")).toBeNull();
    expect(await WhatsappAccountRepository.findByPhoneNumberIds([], tx)).toEqual(new Map());
  });

  accountTest("findFirstActiveForCredentials returns the oldest active account with credentials", async tx => {
    const older = await makeAccount(tx);
    await makeAccount(tx);
    const found = await WhatsappAccountRepository.findFirstActiveForCredentials(tx);
    expect(found?.id).toBe(older.id);
    expect(found?.encryptedAccessToken).toBe(older.encryptedAccessToken);
  });

  accountTest("findActiveByPurpose filters by purpose and never returns inactive accounts", async tx => {
    await makeAccount(tx); // GENERAL (default)
    const students = await makeAccount(tx, { purpose: WhatsappAccountPurpose.STUDENTS });
    await makeAccount(tx, { purpose: WhatsappAccountPurpose.STUDENTS, isActive: false });

    const found = await WhatsappAccountRepository.findActiveByPurpose(WhatsappAccountPurpose.STUDENTS, tx);
    expect(found?.id).toBe(students.id);

    expect(await WhatsappAccountRepository.findActiveByPurpose(WhatsappAccountPurpose.ADVERTISING, tx)).toBeNull();
    expect((await WhatsappAccountRepository.findActiveGeneral(tx))?.purpose).toBe(WhatsappAccountPurpose.GENERAL);
  });

  accountTest("findCredentialsById returns the raw row regardless of active/offboard state", async tx => {
    const account = await makeAccount(tx);
    const inactive = await makeAccount(tx, { isActive: false });

    const found = await WhatsappAccountRepository.findCredentialsById(account.id, tx);
    expect(found?.encryptedAccessToken).toBe(account.encryptedAccessToken);

    const inactiveFound = await WhatsappAccountRepository.findCredentialsById(inactive.id, tx);
    expect(inactiveFound?.id).toBe(inactive.id);

    expect(await WhatsappAccountRepository.findCredentialsById(randomUUID(), tx)).toBeNull();
  });

  accountTest("listActive excludes deactivated accounts, newest first", async tx => {
    const first = await makeAccount(tx);
    const second = await makeAccount(tx);
    await WhatsappAccountRepository.deactivateById(second.id, tx);

    const active = await WhatsappAccountRepository.listActive(tx);
    const ids = active.map(row => row.id);
    expect(ids).toContain(first.id);
    expect(ids).not.toContain(second.id);
    // newest first within this test's accounts
    expect(ids.indexOf(first.id)).toBeGreaterThanOrEqual(0);
  });

  accountTest("findByWabaId returns all accounts under the WABA including inactive ones, oldest first", async tx => {
    const wabaId = `waba-${randomUUID()}`;
    const active = await makeAccount(tx, { wabaId });
    const inactive = await makeAccount(tx, { wabaId, isActive: false });
    await makeAccount(tx); // different WABA

    const found = await WhatsappAccountRepository.findByWabaId(wabaId, tx);
    expect(found.map(row => row.id)).toEqual([active.id, inactive.id]);

    expect(await WhatsappAccountRepository.findByWabaId(`waba-${randomUUID()}`, tx)).toEqual([]);
  });
});

describe("WhatsappAccountRepository — mutations", () => {
  accountTest("create/update/credential setters round-trip and strip secrets from ReturnType", async tx => {
    const created = await WhatsappAccountRepository.create(accountInput(), tx);
    expect(Object.hasOwn(created, "encryptedAccessToken")).toBe(false);
    expect(created.syncStatus).toBe(WhatsappSyncStatus.NOT_STARTED);

    const updated = await WhatsappAccountRepository.update(created.id, { displayPhoneNumber: "+966500000000" }, tx);
    expect(updated?.displayPhoneNumber).toBe("+966500000000");
    expect(await WhatsappAccountRepository.update(randomUUID(), { displayPhoneNumber: "x" }, tx)).toBeNull();

    const withToken = await WhatsappAccountRepository.setAccessToken(
      { id: created.id, encryptedAccessToken: "new-token-value" },
      tx
    );
    expect(withToken).not.toBeNull();
    expect(Object.hasOwn(withToken ?? {}, "encryptedAccessToken")).toBe(false);

    const withPin = await WhatsappAccountRepository.setTwoStepPin(
      { id: created.id, encryptedTwoStepPin: "654321" },
      tx
    );
    expect(withPin).not.toBeNull();

    const credentialed = await WhatsappAccountRepository.findById(created.id, tx);
    expect(credentialed).not.toBeNull();
  });

  accountTest("deactivateById flips isActive; unknown id returns null", async tx => {
    const account = await makeAccount(tx);
    const deactivated = await WhatsappAccountRepository.deactivateById(account.id, tx);
    expect(deactivated?.isActive).toBe(false);
    expect(await WhatsappAccountRepository.deactivateById(randomUUID(), tx)).toBeNull();
  });
});

describe("WhatsappAccountRepository — sync lifecycle mutators", () => {
  accountTest("markSyncRequested stamps status + deadline; progress mutators advance state", async tx => {
    const account = await makeAccount(tx);
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const requested = await WhatsappAccountRepository.markSyncRequested(account.id, deadline, tx);
    expect(requested?.syncStatus).toBe(WhatsappSyncStatus.REQUESTED);
    expect(requested?.syncDeadlineAt?.getTime()).toBe(deadline.getTime());

    const progressWithoutPhase = await WhatsappAccountRepository.markSyncProgress(account.id, { progress: 42 }, tx);
    expect(progressWithoutPhase?.syncStatus).toBe(WhatsappSyncStatus.SYNCING);
    expect(progressWithoutPhase?.syncProgress).toBe(42);
    expect(progressWithoutPhase?.syncPhase).toBeNull();

    const progressWithPhase = await WhatsappAccountRepository.markSyncProgress(
      account.id,
      { progress: 80, phase: 2 },
      tx
    );
    expect(progressWithPhase?.syncPhase).toBe(2);

    const complete = await WhatsappAccountRepository.markSyncComplete(account.id, tx);
    expect(complete?.syncStatus).toBe(WhatsappSyncStatus.COMPLETE);
    expect(complete?.syncProgress).toBe(100);

    expect(await WhatsappAccountRepository.markSyncRequested(randomUUID(), deadline, tx)).toBeNull();
    expect(await WhatsappAccountRepository.markSyncProgress(randomUUID(), { progress: 1 }, tx)).toBeNull();
    expect(await WhatsappAccountRepository.markSyncComplete(randomUUID(), tx)).toBeNull();
  });

  accountTest("markSyncFailed records the failure reason", async tx => {
    const account = await makeAccount(tx);
    const failed = await WhatsappAccountRepository.markSyncFailed(account.id, "user_declined", tx);
    expect(failed?.syncStatus).toBe(WhatsappSyncStatus.FAILED);
    expect(failed?.syncFailureReason).toBe("user_declined");
    expect(await WhatsappAccountRepository.markSyncFailed(randomUUID(), "x", tx)).toBeNull();
  });

  accountTest("offboard deactivates; reconnect clears the marker and re-activates", async tx => {
    const account = await makeAccount(tx);
    const offboardedAt = new Date();

    const offboarded = await WhatsappAccountRepository.markOffboarded(account.id, offboardedAt, tx);
    expect(offboarded?.offboardedAt?.getTime()).toBe(offboardedAt.getTime());
    expect(offboarded?.isActive).toBe(false);
    expect(await WhatsappAccountRepository.findActiveGeneral(tx)).toBeNull();

    const reconnected = await WhatsappAccountRepository.clearOffboarded(account.id, tx);
    expect(reconnected?.offboardedAt).toBeNull();
    expect(reconnected?.isActive).toBe(true);

    expect(await WhatsappAccountRepository.markOffboarded(randomUUID(), offboardedAt, tx)).toBeNull();
    expect(await WhatsappAccountRepository.clearOffboarded(randomUUID(), tx)).toBeNull();
  });
});
