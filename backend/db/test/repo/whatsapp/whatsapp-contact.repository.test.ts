import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { WhatsappContactRepository } from "@/backend/db/repo/whatsapp";
import { whatsappAccounts } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import {
  type DBTransaction,
  PaginationArgs,
  type WhatsappAccountSelectType,
  type WhatsappContactSelectType,
  type WhatsappContactSyncInput,
} from "@/backend/types";

function phoneId(): string {
  return `966${randomUUID().replaceAll(/\D/g, "").padEnd(9, "7").slice(0, 9)}`;
}

function contactTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
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

function action(
  account: WhatsappAccountSelectType,
  overrides: Partial<WhatsappContactSyncInput> = {}
): WhatsappContactSyncInput {
  return {
    accountId: account.id,
    phoneNumber: phoneId(),
    fullName: "Contact Name",
    firstName: "Contact",
    action: "add",
    actionAt: new Date(),
    ...overrides,
  };
}

type ActionStep = { at: Date; act: "add" | "remove"; fullName?: string };

/** Apply an ordered sequence of sync actions to one contact identity. */
async function applyActions(
  tx: DBTransaction,
  account: WhatsappAccountSelectType,
  phoneNumber: string,
  steps: ActionStep[]
): Promise<WhatsappContactSelectType[]> {
  const [head, ...rest] = steps;
  if (!head) return [];
  const row = await WhatsappContactRepository.upsertFromSyncAction(
    action(account, {
      phoneNumber,
      actionAt: head.at,
      action: head.act,
      ...(head.fullName === undefined ? {} : { fullName: head.fullName }),
    }),
    tx
  );
  return [row, ...(await applyActions(tx, account, phoneNumber, rest))];
}

describe("WhatsappContactRepository — upsertFromSyncAction LWW", () => {
  contactTest("creates a live contact on add and round-trips bookkeeping fields", async tx => {
    const account = await makeAccount(tx);
    const input = action(account);
    const created = await WhatsappContactRepository.upsertFromSyncAction(input, tx);

    expect(created.phoneNumber).toBe(input.phoneNumber ?? null);
    expect(created.removedAt).toBeNull();
    expect(created.lastActionAt?.getTime()).toBe(input.actionAt.getTime());
  });

  contactTest("remove sets removedAt; a newer add revives the contact (no duplicate rows)", async tx => {
    const account = await makeAccount(tx);
    const t0 = Date.now() - 3_600_000;

    const [added, removed, readded] = await applyActions(tx, account, phoneId(), [
      { at: new Date(t0), act: "add" },
      { at: new Date(t0 + 60_000), act: "remove" },
      { at: new Date(t0 + 120_000), act: "add", fullName: "Renamed" },
    ]);
    expect(removed.id).toBe(added.id);
    expect(removed.removedAt).not.toBeNull();
    expect(readded.id).toBe(added.id);
    expect(readded.removedAt).toBeNull();
    expect(readded.fullName).toBe("Renamed");
  });

  contactTest("last-writer-wins: out-of-order and replayed actions are ignored", async tx => {
    const account = await makeAccount(tx);
    const newest = new Date();

    const [removedNewest, replayedSameTime, staleAdd] = await applyActions(tx, account, phoneId(), [
      { at: newest, act: "remove" },
      { at: newest, act: "add" },
      { at: new Date(newest.getTime() - 60_000), act: "add", fullName: "Stale" },
    ]);
    // equal timestamp is not strictly newer → ignored
    expect(replayedSameTime.removedAt).not.toBeNull();
    expect(staleAdd.id).toBe(removedNewest.id);
    expect(staleAdd.removedAt).not.toBeNull();
    expect(staleAdd.fullName).toBe("Contact Name");
  });

  contactTest("identity resolution works on BSUID userId as well as phone", async tx => {
    const account = await makeAccount(tx);
    const userId = `bsuid-${randomUUID()}`;
    const created = await WhatsappContactRepository.upsertFromSyncAction(
      action(account, { phoneNumber: null, userId, username: "bsuid.user" }),
      tx
    );

    const found = await WhatsappContactRepository.findByIdentity(account.id, { userId }, tx);
    expect(found?.id).toBe(created.id);
    expect(found?.username).toBe("bsuid.user");

    // A follow-up merge by userId updates rather than duplicates
    const merged = await WhatsappContactRepository.upsertFromSyncAction(
      action(account, { userId, phoneNumber: null, actionAt: new Date(Date.now() + 1_000) }),
      tx
    );
    expect(merged.id).toBe(created.id);
  });

  contactTest("findByIdentity guards: no identity → null; unknown identity → null", async tx => {
    const account = await makeAccount(tx);
    expect(await WhatsappContactRepository.findByIdentity(account.id, {}, tx)).toBeNull();
    expect(await WhatsappContactRepository.findByIdentity(account.id, { phoneNumber: "966000000000" }, tx)).toBeNull();
  });
});

describe("WhatsappContactRepository — listByAccount / countByAccount", () => {
  contactTest("lists live contacts by default, includes removed ones on demand, paginates", async tx => {
    const account = await makeAccount(tx);
    const other = await makeAccount(tx);
    const t0 = Date.now();

    const live1 = await WhatsappContactRepository.upsertFromSyncAction(action(account, { fullName: "احمد" }), tx);
    const live2 = await WhatsappContactRepository.upsertFromSyncAction(action(account), tx);
    await WhatsappContactRepository.upsertFromSyncAction(
      action(account, { action: "remove", actionAt: new Date(t0) }),
      tx
    );
    await WhatsappContactRepository.upsertFromSyncAction(action(other), tx);

    const live = await WhatsappContactRepository.listByAccount(account.id, {}, null, tx);
    expect(new Set(live.map(row => row.id))).toEqual(new Set([live1.id, live2.id]));
    expect(live[0]?.fullName).toBeDefined();
    expect(Object.hasOwn(live[0] ?? {}, "removedAt")).toBe(false);

    const withRemoved = await WhatsappContactRepository.listByAccount(account.id, { includeRemoved: true }, null, tx);
    expect(withRemoved).toHaveLength(3);

    const paged = await WhatsappContactRepository.listByAccount(
      account.id,
      { includeRemoved: true },
      new PaginationArgs({ first: 2 }),
      tx
    );
    expect(paged).toHaveLength(2);

    expect(await WhatsappContactRepository.countByAccount(account.id, {}, tx)).toBe(2);
    expect(await WhatsappContactRepository.countByAccount(account.id, { includeRemoved: true }, tx)).toBe(3);
    expect(await WhatsappContactRepository.countByAccount(other.id, {}, tx)).toBe(1);
  });
});
