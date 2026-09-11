import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { WhatsappTestRecipientRepository } from "@/backend/db/repo/whatsapp";
import { whatsappAccounts, whatsappTestRecipients } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { expectSavepointError, runInRollback } from "@/backend/db/test/test-utils";
import { WhatsappTestRecipientStatus } from "@/backend/enum/whatsapp";
import type { DBTransaction, UserSelectType, WhatsappAccountSelectType } from "@/backend/types";

function recipientTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

async function makeOwnership(tx: DBTransaction): Promise<{
  account: WhatsappAccountSelectType;
  creator: UserSelectType;
}> {
  const creator = await createTestUser(tx);
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
  return { account, creator };
}

function phone(suffix: string): string {
  return `96650000${suffix}`;
}

describe("WhatsappTestRecipientRepository", () => {
  recipientTest("create inserts a PENDING row and find/list/count read it back", async tx => {
    const { account, creator } = await makeOwnership(tx);

    const created = await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0001"), note: "operator phone", createdByUserId: creator.id },
      tx
    );
    expect(created.status).toBe(WhatsappTestRecipientStatus.PENDING);
    expect(created.phoneNumber).toBe(phone("0001"));
    expect(created.note).toBe("operator phone");
    expect(created.lastCheckedAt).toBeNull();
    expect(created.lastErrorCode).toBeNull();

    const found = await WhatsappTestRecipientRepository.findByAccountAndPhone(account.id, phone("0001"), tx);
    expect(found?.id).toBe(created.id);

    const list = await WhatsappTestRecipientRepository.listByAccountId(account.id, tx);
    expect(list.map(row => row.id)).toEqual([created.id]);

    const count = await WhatsappTestRecipientRepository.countByAccountId(account.id, tx);
    expect(count).toBe(1);
  });

  recipientTest("findById returns the row by primary key and null on unknown ids", async tx => {
    const { account, creator } = await makeOwnership(tx);
    const created = await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0100"), createdByUserId: creator.id },
      tx
    );

    const found = await WhatsappTestRecipientRepository.findById(created.id, tx);
    expect(found?.id).toBe(created.id);
    expect(found?.phoneNumber).toBe(phone("0100"));

    const miss = await WhatsappTestRecipientRepository.findById(randomUUID(), tx);
    expect(miss).toBeNull();
  });

  recipientTest("create defaults a missing note to null and reads miss on unknown phone", async tx => {
    const { account, creator } = await makeOwnership(tx);

    const created = await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0002"), createdByUserId: creator.id },
      tx
    );
    expect(created.note).toBeNull();

    const miss = await WhatsappTestRecipientRepository.findByAccountAndPhone(account.id, phone("9999"), tx);
    expect(miss).toBeNull();
  });

  recipientTest("duplicate (accountId, phoneNumber) violates the unique index", async tx => {
    const { account, creator } = await makeOwnership(tx);
    const input = { accountId: account.id, phoneNumber: phone("0003"), createdByUserId: creator.id };

    await WhatsappTestRecipientRepository.create(input, tx);
    const error = await expectSavepointError(() => WhatsappTestRecipientRepository.create(input, tx), tx);
    expect(error).toBeDefined();

    // After the savepoint rollback the first row is still the only one.
    const count = await WhatsappTestRecipientRepository.countByAccountId(account.id, tx);
    expect(count).toBe(1);
  });

  recipientTest("the same phone number is allowed under a different account", async tx => {
    const first = await makeOwnership(tx);
    const second = await makeOwnership(tx);

    await WhatsappTestRecipientRepository.create(
      { accountId: first.account.id, phoneNumber: phone("0004"), createdByUserId: first.creator.id },
      tx
    );
    const other = await WhatsappTestRecipientRepository.create(
      { accountId: second.account.id, phoneNumber: phone("0004"), createdByUserId: second.creator.id },
      tx
    );
    expect(other.accountId).toBe(second.account.id);

    const firstCount = await WhatsappTestRecipientRepository.countByAccountId(first.account.id, tx);
    const secondCount = await WhatsappTestRecipientRepository.countByAccountId(second.account.id, tx);
    expect(firstCount).toBe(1);
    expect(secondCount).toBe(1);
  });

  recipientTest("listByAccountId returns rows oldest-first", async tx => {
    const { account, creator } = await makeOwnership(tx);

    const older = await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0005"), createdByUserId: creator.id },
      tx
    );
    const newer = await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0006"), createdByUserId: creator.id },
      tx
    );
    // Same-transaction inserts can share a createdAt timestamp; pin the two
    // rows apart so the oldest-first ordering is exercised deterministically.
    await tx
      .update(whatsappTestRecipients)
      .set({ createdAt: new Date("2024-01-01T00:00:00Z") })
      .where(eq(whatsappTestRecipients.id, older.id));
    await tx
      .update(whatsappTestRecipients)
      .set({ createdAt: new Date("2024-01-02T00:00:00Z") })
      .where(eq(whatsappTestRecipients.id, newer.id));

    const list = await WhatsappTestRecipientRepository.listByAccountId(account.id, tx);
    expect(list.map(row => row.id)).toEqual([older.id, newer.id]);
  });

  recipientTest("recordVerify flips PENDING to ALLOWED and stores the Meta error code", async tx => {
    const { account, creator } = await makeOwnership(tx);
    const created = await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0007"), createdByUserId: creator.id },
      tx
    );

    const checkedAt = new Date();
    const verified = await WhatsappTestRecipientRepository.recordVerify(
      created.id,
      { allowed: true, errorCode: "131030", checkedAt },
      tx
    );
    expect(verified?.status).toBe(WhatsappTestRecipientStatus.ALLOWED);
    expect(verified?.lastErrorCode).toBe("131030");
    expect(verified?.lastCheckedAt?.getTime()).toBe(checkedAt.getTime());

    const reverted = await WhatsappTestRecipientRepository.recordVerify(
      created.id,
      { allowed: false, errorCode: null, checkedAt: new Date() },
      tx
    );
    expect(reverted?.status).toBe(WhatsappTestRecipientStatus.PENDING);
    expect(reverted?.lastErrorCode).toBeNull();
  });

  recipientTest("recordVerify and deleteById return null for unknown ids", async tx => {
    const missingId = randomUUID();

    const verified = await WhatsappTestRecipientRepository.recordVerify(
      missingId,
      { allowed: true, errorCode: null, checkedAt: new Date() },
      tx
    );
    expect(verified).toBeNull();

    const deleted = await WhatsappTestRecipientRepository.deleteById(missingId, tx);
    expect(deleted).toBeNull();
  });

  recipientTest("deleteById hard-deletes the row and returns it", async tx => {
    const { account, creator } = await makeOwnership(tx);
    const created = await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0008"), createdByUserId: creator.id },
      tx
    );

    const deleted = await WhatsappTestRecipientRepository.deleteById(created.id, tx);
    expect(deleted?.id).toBe(created.id);

    const found = await WhatsappTestRecipientRepository.findByAccountAndPhone(account.id, phone("0008"), tx);
    expect(found).toBeNull();
    const count = await WhatsappTestRecipientRepository.countByAccountId(account.id, tx);
    expect(count).toBe(0);
  });

  recipientTest("an out-of-enum status value narrows back to PENDING on reads", async tx => {
    const { account, creator } = await makeOwnership(tx);
    await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0010"), createdByUserId: creator.id },
      tx
    );
    await tx
      .update(whatsappTestRecipients)
      .set({ status: "LEGACY_UNKNOWN" })
      .where(eq(whatsappTestRecipients.accountId, account.id));

    const found = await WhatsappTestRecipientRepository.findByAccountAndPhone(account.id, phone("0010"), tx);
    expect(found?.status).toBe(WhatsappTestRecipientStatus.PENDING);
  });

  recipientTest("deleting the account cascade-deletes its recipients", async tx => {
    const { account, creator } = await makeOwnership(tx);
    await WhatsappTestRecipientRepository.create(
      { accountId: account.id, phoneNumber: phone("0009"), createdByUserId: creator.id },
      tx
    );

    await tx.delete(whatsappAccounts).where(eq(whatsappAccounts.id, account.id));

    const rows = await tx
      .select({ id: whatsappTestRecipients.id })
      .from(whatsappTestRecipients)
      .where(eq(whatsappTestRecipients.accountId, account.id));
    expect(rows).toEqual([]);
  });
});
