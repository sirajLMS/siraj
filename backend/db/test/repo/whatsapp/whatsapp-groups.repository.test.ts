import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  WhatsappGroupMessageRepository,
  WhatsappGroupParticipantRepository,
  WhatsappGroupRepository,
} from "@/backend/db/repo/whatsapp";
import {
  whatsappAccounts,
  whatsappGroupMessages,
  whatsappGroupParticipants,
  whatsappGroups,
} from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { WhatsappGroupJoinApprovalMode, WhatsappMessageDirection } from "@/backend/enum/whatsapp";
import {
  type DBTransaction,
  PaginationArgs,
  type WhatsappAccountSelectType,
  type WhatsappGroupInsertType,
  type WhatsappGroupMessageInsertType,
  type WhatsappGroupParticipantInsertType,
} from "@/backend/types";

function groupTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

async function makeAccount(
  tx: DBTransaction,
  overrides: Record<string, unknown> = {}
): Promise<WhatsappAccountSelectType> {
  const [account] = await tx
    .insert(whatsappAccounts)
    .values({
      wabaId: `waba-${randomUUID()}`,
      phoneNumberId: `pn-${randomUUID()}`,
      encryptedAccessToken: `token-${randomUUID()}`,
      encryptedTwoStepPin: "123456",
      ...overrides,
    })
    .returning();
  if (!account) throw new Error("account insert returned no row");
  return account;
}

function groupJid(): string {
  return `gid-${randomUUID()}`;
}

function atMinutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

function makeGroupInput(accountId: string, overrides: Partial<WhatsappGroupInsertType> = {}): WhatsappGroupInsertType {
  return {
    accountId,
    groupJid: groupJid(),
    subject: "Siraj Test Group",
    joinApprovalMode: WhatsappGroupJoinApprovalMode.ApprovalRequired,
    ...overrides,
  };
}

function makeParticipantInput(
  groupId: string,
  overrides: Partial<WhatsappGroupParticipantInsertType> = {}
): WhatsappGroupParticipantInsertType {
  return {
    groupId,
    waId: `9665${randomUUID().replaceAll(/\D/g, "").padEnd(9, "7").slice(0, 9)}`,
    joinedAt: atMinutesAgo(5),
    addedVia: "invite_link",
    ...overrides,
  };
}

function makeMessageInput(
  groupId: string,
  accountId: string,
  overrides: Partial<WhatsappGroupMessageInsertType> = {}
): WhatsappGroupMessageInsertType {
  return {
    groupId,
    accountId,
    wamid: `wamid.${randomUUID().replaceAll("-", "")}`,
    direction: WhatsappMessageDirection.INBOUND,
    type: "text",
    content: { body: "hello group" },
    ...overrides,
  };
}

describe("WhatsappGroupRepository — upsertByGroupJid", () => {
  groupTest("creates a new group keyed by (accountId, groupJid) and round-trips the ReturnType", async tx => {
    const account = await makeAccount(tx);
    const jid = groupJid();

    const created = await WhatsappGroupRepository.upsertByGroupJid(
      makeGroupInput(account.id, {
        groupJid: jid,
        subject: "Alpha One",
        inviteLink: "https://chat.whatsapp.com/abc",
      }),
      tx
    );

    expect(created.accountId).toBe(account.id);
    expect(created.groupJid).toBe(jid);
    expect(created.subject).toBe("Alpha One");
    expect(created.joinApprovalMode).toBe(WhatsappGroupJoinApprovalMode.ApprovalRequired);
    expect(created.inviteLink).toBe("https://chat.whatsapp.com/abc");
    expect(created.suspended).toBe(false);
    expect(created.totalParticipantCount).toBe(0);
    expect(created.pendingJoinRequestCount).toBe(0);
  });

  groupTest("the same (accountId, groupJid) redelivery is an idempotent no-op upsert", async tx => {
    const account = await makeAccount(tx);
    const jid = groupJid();

    const first = await WhatsappGroupRepository.upsertByGroupJid(
      makeGroupInput(account.id, { groupJid: jid, subject: "Original Subject" }),
      tx
    );
    const second = await WhatsappGroupRepository.upsertByGroupJid(
      makeGroupInput(account.id, { groupJid: jid, subject: "Changed Subject" }),
      tx
    );

    expect(second.id).toBe(first.id);
    expect(second.subject).toBe("Original Subject");
  });
});

describe("WhatsappGroupRepository — findById / findByGroupJid", () => {
  groupTest("findById covers hit and miss", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);

    expect((await WhatsappGroupRepository.findById(group.id, tx))?.id).toBe(group.id);
    expect(await WhatsappGroupRepository.findById(randomUUID(), tx)).toBeNull();
    expect(await WhatsappGroupRepository.findByGroupJid(account.id, groupJid(), tx)).toBeNull();
  });

  groupTest("bare read without tx falls back to the default pool", async () => {
    const missing = await WhatsappGroupRepository.findById(randomUUID());
    expect(missing).toBeNull();
  });

  groupTest("soft-deleted groups vanish from findById but stay findable by jid until markActive", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);

    await WhatsappGroupRepository.markDeleted(group.id, tx);

    expect(await WhatsappGroupRepository.findById(group.id, tx)).toBeNull();
    const byJid = await WhatsappGroupRepository.findByGroupJid(account.id, group.groupJid, tx);
    expect(byJid?.id).toBe(group.id);
    expect(byJid?.deletedAt).not.toBeNull();

    await WhatsappGroupRepository.markActive(group.id, tx);
    expect((await WhatsappGroupRepository.findById(group.id, tx))?.id).toBe(group.id);
  });
});

describe("WhatsappGroupRepository — listForAccount / countForAccount", () => {
  groupTest(
    "scopes by account, filters by case-insensitive subject search, paginates, and keeps count parity",
    async tx => {
      const accountA = await makeAccount(tx);
      const accountB = await makeAccount(tx);
      const alpha = await WhatsappGroupRepository.upsertByGroupJid(
        makeGroupInput(accountA.id, { subject: "Alpha One", createdAt: atMinutesAgo(30) }),
        tx
      );
      const beta = await WhatsappGroupRepository.upsertByGroupJid(
        makeGroupInput(accountA.id, { subject: "Beta Two", createdAt: atMinutesAgo(20) }),
        tx
      );
      const gamma = await WhatsappGroupRepository.upsertByGroupJid(
        makeGroupInput(accountA.id, { subject: "Gamma Three", createdAt: atMinutesAgo(10) }),
        tx
      );
      await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(accountB.id, { subject: "Alpha Elsewhere" }), tx);

      const scoped = await WhatsappGroupRepository.listForAccount(
        { accountId: accountA.id, search: null, pagination: null },
        tx
      );
      expect(scoped.rows.map(row => row.id)).toEqual([gamma.id, beta.id, alpha.id]);
      expect(scoped.totalCount).toBe(await WhatsappGroupRepository.countForAccount(accountA.id, tx));

      const searched = await WhatsappGroupRepository.listForAccount(
        { accountId: accountA.id, search: "ALPHA", pagination: null },
        tx
      );
      expect(searched.rows.map(row => row.id)).toEqual([alpha.id]);
      expect(searched.totalCount).toBe(1);

      const paged = await WhatsappGroupRepository.listForAccount(
        { accountId: accountA.id, search: null, pagination: { first: 2 } },
        tx
      );
      expect(paged.rows).toHaveLength(2);
      expect(paged.totalCount).toBe(3);
    }
  );

  groupTest("a null accountId spans every account", async tx => {
    const accountA = await makeAccount(tx);
    const accountB = await makeAccount(tx);
    const a = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(accountA.id), tx);
    const b = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(accountB.id), tx);

    const global = await WhatsappGroupRepository.listForAccount(
      { accountId: null, search: null, pagination: null },
      tx
    );
    const ids = new Set(global.rows.map(row => row.id));
    expect(ids.has(a.id)).toBe(true);
    expect(ids.has(b.id)).toBe(true);
    expect((await WhatsappGroupRepository.countForAccount(null, tx)) >= 2).toBe(true);
  });

  groupTest("soft-deleted groups are excluded from the list and its count", async tx => {
    const account = await makeAccount(tx);
    const kept = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    const gone = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    await WhatsappGroupRepository.markDeleted(gone.id, tx);

    const listed = await WhatsappGroupRepository.listForAccount(
      { accountId: account.id, search: null, pagination: null },
      tx
    );
    expect(listed.rows.map(row => row.id)).toEqual([kept.id]);
    expect(listed.totalCount).toBe(1);
    expect(await WhatsappGroupRepository.countForAccount(account.id, tx)).toBe(1);
  });
});

describe("WhatsappGroupRepository — updateSettings", () => {
  groupTest("a partial patch writes only the provided fields", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(
      makeGroupInput(account.id, { description: "original", inviteLink: "https://chat.whatsapp.com/xyz" }),
      tx
    );

    const renamed = await WhatsappGroupRepository.updateSettings(group.id, { subject: "Renamed", suspended: true }, tx);
    expect(renamed?.subject).toBe("Renamed");
    expect(renamed?.suspended).toBe(true);
    expect(renamed?.description).toBe("original");
    expect(renamed?.inviteLink).toBe("https://chat.whatsapp.com/xyz");
    expect(renamed?.pendingJoinRequestCount).toBe(0);

    const described = await WhatsappGroupRepository.updateSettings(group.id, { description: "updated" }, tx);
    expect(described?.description).toBe("updated");
    expect(described?.subject).toBe("Renamed");
  });

  groupTest("an empty patch is a read-only no-op and unknown ids return null", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(
      makeGroupInput(account.id, { subject: "Untouched" }),
      tx
    );

    const noOp = await WhatsappGroupRepository.updateSettings(group.id, {}, tx);
    expect(noOp?.id).toBe(group.id);
    expect(noOp?.subject).toBe("Untouched");

    expect(await WhatsappGroupRepository.updateSettings(randomUUID(), {}, tx)).toBeNull();
    expect(await WhatsappGroupRepository.updateSettings(randomUUID(), { subject: "Ghost" }, tx)).toBeNull();
  });
});

describe("WhatsappGroupRepository — adjustPendingJoinRequests", () => {
  groupTest("increments and decrements with a floor clamp at zero; unknown ids return null", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(
      makeGroupInput(account.id, { pendingJoinRequestCount: 2 }),
      tx
    );

    const incremented = await WhatsappGroupRepository.adjustPendingJoinRequests(group.id, 1, tx);
    expect(incremented?.pendingJoinRequestCount).toBe(3);

    const clamped = await WhatsappGroupRepository.adjustPendingJoinRequests(group.id, -5, tx);
    expect(clamped?.pendingJoinRequestCount).toBe(0);

    expect(await WhatsappGroupRepository.adjustPendingJoinRequests(randomUUID(), 1, tx)).toBeNull();
  });
});

describe("WhatsappGroupRepository — markDeleted / markActive transitions", () => {
  groupTest("each transition returns true once and false on repeat", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);

    expect(await WhatsappGroupRepository.markDeleted(group.id, tx)).toBe(true);
    expect(await WhatsappGroupRepository.markDeleted(group.id, tx)).toBe(false);
    expect(await WhatsappGroupRepository.markActive(group.id, tx)).toBe(true);
    expect(await WhatsappGroupRepository.markActive(group.id, tx)).toBe(false);
  });
});

describe("WhatsappGroupParticipantRepository", () => {
  groupTest("upsertByWaId creates then refreshes joinedAt/addedVia without duplicating", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    const waId = makeParticipantInput(group.id).waId;

    const first = await WhatsappGroupParticipantRepository.upsertByWaId(
      makeParticipantInput(group.id, { waId, joinedAt: atMinutesAgo(10), addedVia: "invite_link" }),
      tx
    );
    const joinedAt = atMinutesAgo(2);
    const second = await WhatsappGroupParticipantRepository.upsertByWaId(
      makeParticipantInput(group.id, { waId, joinedAt, addedVia: "business" }),
      tx
    );

    expect(second.id).toBe(first.id);
    expect(second.joinedAt?.getTime()).toBe(joinedAt.getTime());
    expect(second.addedVia).toBe("business");
    expect(await WhatsappGroupParticipantRepository.countByGroup(group.id, tx)).toBe(1);
  });

  groupTest("listByGroup orders oldest-joined-first, countByGroup matches, removeByWaId flips to false", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    const early = await WhatsappGroupParticipantRepository.upsertByWaId(
      makeParticipantInput(group.id, { joinedAt: atMinutesAgo(30) }),
      tx
    );
    const late = await WhatsappGroupParticipantRepository.upsertByWaId(
      makeParticipantInput(group.id, { joinedAt: atMinutesAgo(5) }),
      tx
    );

    const listed = await WhatsappGroupParticipantRepository.listByGroup(group.id, tx);
    expect(listed.map(row => row.id)).toEqual([early.id, late.id]);
    expect(await WhatsappGroupParticipantRepository.countByGroup(group.id, tx)).toBe(2);

    expect(await WhatsappGroupParticipantRepository.removeByWaId(group.id, early.waId, tx)).toBe(true);
    expect(await WhatsappGroupParticipantRepository.removeByWaId(group.id, early.waId, tx)).toBe(false);
    expect(await WhatsappGroupParticipantRepository.countByGroup(group.id, tx)).toBe(1);
  });

  groupTest("findByGroupAndWaIds maps hits and misses and empty input stays empty", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    const participant = await WhatsappGroupParticipantRepository.upsertByWaId(makeParticipantInput(group.id), tx);

    const batch = await WhatsappGroupParticipantRepository.findByGroupAndWaIds(
      group.id,
      [participant.waId, "966500000000"],
      tx
    );
    expect(batch.size).toBe(2);
    expect(batch.get(participant.waId)?.id).toBe(participant.id);
    expect(batch.get("966500000000")).toBeNull();
    expect(await WhatsappGroupParticipantRepository.findByGroupAndWaIds(group.id, [], tx)).toEqual(new Map());
  });
});

describe("WhatsappGroupMessageRepository", () => {
  groupTest(
    "upsertByWamid creates then a redelivery is an idempotent no-op; findByWamid covers hit and miss",
    async tx => {
      const account = await makeAccount(tx);
      const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
      const input = makeMessageInput(group.id, account.id, { content: { body: "original" } });

      const first = await WhatsappGroupMessageRepository.upsertByWamid(input, tx);
      const redelivered = await WhatsappGroupMessageRepository.upsertByWamid(
        makeMessageInput(group.id, account.id, { wamid: input.wamid, content: { body: "changed" } }),
        tx
      );

      expect(redelivered.id).toBe(first.id);
      expect(redelivered.content).toEqual({ body: "original" });
      expect(redelivered.direction).toBe(WhatsappMessageDirection.INBOUND);

      expect((await WhatsappGroupMessageRepository.findByWamid(input.wamid, tx))?.id).toBe(first.id);
      expect(await WhatsappGroupMessageRepository.findByWamid("wamid.missing", tx)).toBeNull();
    }
  );

  groupTest("findByWamids maps hits and misses and empty input stays empty", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    const message = await WhatsappGroupMessageRepository.upsertByWamid(makeMessageInput(group.id, account.id), tx);

    const batch = await WhatsappGroupMessageRepository.findByWamids([message.wamid, "wamid.missing"], tx);
    expect(batch.size).toBe(2);
    expect(batch.get(message.wamid)?.id).toBe(message.id);
    expect(batch.get("wamid.missing")).toBeNull();
    expect(await WhatsappGroupMessageRepository.findByWamids([], tx)).toEqual(new Map());
  });

  groupTest("listByGroup orders newest-first with nulls last, paginates, and countByGroup matches", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    const newest = await WhatsappGroupMessageRepository.upsertByWamid(
      makeMessageInput(group.id, account.id, { sentAt: atMinutesAgo(1) }),
      tx
    );
    const middle = await WhatsappGroupMessageRepository.upsertByWamid(
      makeMessageInput(group.id, account.id, { sentAt: atMinutesAgo(10) }),
      tx
    );
    const undated = await WhatsappGroupMessageRepository.upsertByWamid(
      makeMessageInput(group.id, account.id, { sentAt: null }),
      tx
    );

    const listed = await WhatsappGroupMessageRepository.listByGroup(group.id, null, tx);
    expect(listed.map(row => row.id)).toEqual([newest.id, middle.id, undated.id]);

    const paged = await WhatsappGroupMessageRepository.listByGroup(group.id, new PaginationArgs({ first: 2 }), tx);
    expect(paged.map(row => row.id)).toEqual([newest.id, middle.id]);
    expect(await WhatsappGroupMessageRepository.countByGroup(group.id, tx)).toBe(3);
  });

  groupTest("updateStatus rewrites the delivery status and markPinned sets and clears pin state", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    const message = await WhatsappGroupMessageRepository.upsertByWamid(
      makeMessageInput(group.id, account.id, { status: "sent" }),
      tx
    );

    const delivered = await WhatsappGroupMessageRepository.updateStatus(message.wamid, "delivered", tx);
    expect(delivered?.status).toBe("delivered");

    const pinnedAt = atMinutesAgo(1);
    const expiry = new Date(pinnedAt.getTime() + 24 * 60 * 60 * 1000);
    const pinned = await WhatsappGroupMessageRepository.markPinned(message.wamid, pinnedAt, expiry, tx);
    expect(pinned?.pinnedAt?.getTime()).toBe(pinnedAt.getTime());
    expect(pinned?.pinExpiresAt?.getTime()).toBe(expiry.getTime());

    const unpinned = await WhatsappGroupMessageRepository.markPinned(message.wamid, null, null, tx);
    expect(unpinned?.pinnedAt).toBeNull();
    expect(unpinned?.pinExpiresAt).toBeNull();

    expect(await WhatsappGroupMessageRepository.updateStatus("wamid.missing", "read", tx)).toBeNull();
    expect(await WhatsappGroupMessageRepository.markPinned("wamid.missing", pinnedAt, expiry, tx)).toBeNull();
  });

  groupTest("boundary: deleting a group cascades its participants and messages", async tx => {
    const account = await makeAccount(tx);
    const group = await WhatsappGroupRepository.upsertByGroupJid(makeGroupInput(account.id), tx);
    await WhatsappGroupParticipantRepository.upsertByWaId(makeParticipantInput(group.id), tx);
    await WhatsappGroupMessageRepository.upsertByWamid(makeMessageInput(group.id, account.id), tx);

    await tx.delete(whatsappGroups).where(eq(whatsappGroups.id, group.id));

    const participantRows = await tx
      .select()
      .from(whatsappGroupParticipants)
      .where(eq(whatsappGroupParticipants.groupId, group.id));
    const messageRows = await tx
      .select()
      .from(whatsappGroupMessages)
      .where(eq(whatsappGroupMessages.groupId, group.id));
    expect(participantRows).toEqual([]);
    expect(messageRows).toEqual([]);
  });
});
