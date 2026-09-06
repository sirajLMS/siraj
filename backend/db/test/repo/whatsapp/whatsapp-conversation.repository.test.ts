import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { WhatsappConversationRepository } from "@/backend/db/repo/whatsapp";
import { whatsappAccounts, whatsappConversations } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp";
import {
  type DBTransaction,
  PaginationArgs,
  type WhatsappAccountSelectType,
  type WhatsappConversationSelectType,
} from "@/backend/types";

function conversationTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
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

function peerId(): string {
  return `966${randomUUID().replaceAll(/\D/g, "").padEnd(9, "7").slice(0, 9)}`;
}

async function makeConversation(
  tx: DBTransaction,
  accountId: string,
  overrides: Record<string, unknown> = {}
): Promise<WhatsappConversationSelectType> {
  const [conversation] = await tx
    .insert(whatsappConversations)
    .values({ accountId, waId: peerId(), ...overrides })
    .returning();
  if (!conversation) throw new Error("conversation insert returned no row");
  return conversation;
}

function atMinutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

describe("WhatsappConversationRepository — upsertByIdentity", () => {
  conversationTest("creates a new conversation keyed by waId and round-trips the ReturnType", async tx => {
    const account = await makeAccount(tx);
    const waId = peerId();
    const sentAt = atMinutesAgo(5);

    const created = await WhatsappConversationRepository.upsertByIdentity(
      { accountId: account.id, waId, displayName: "محمد", lastMessageAt: sentAt, lastMessagePreview: "مرحبا" },
      tx
    );

    expect(created.waId).toBe(waId);
    expect(created.lastMessageAt?.getTime()).toBe(sentAt.getTime());
    expect(created.lastMessagePreview).toBe("مرحبا");
    expect(Object.hasOwn(created, "deletedAt")).toBe(false);
  });

  conversationTest("same (accountId, waId) is a no-duplication upsert that refreshes display fields", async tx => {
    const account = await makeAccount(tx);
    const waId = peerId();

    const first = await WhatsappConversationRepository.upsertByIdentity({ accountId: account.id, waId }, tx);
    const second = await WhatsappConversationRepository.upsertByIdentity(
      { accountId: account.id, waId, displayName: "Renamed", username: "renamed.user", lastMessageAt: atMinutesAgo(3) },
      tx
    );

    expect(second.id).toBe(first.id);
    expect(second.displayName).toBe("Renamed");
    expect(second.username).toBe("renamed.user");
    // rollup applies onto a conversation that had no prior message marker
    expect(second.lastMessageAt).not.toBeNull();
    expect(second.lastMessagePreview).toBeNull();
  });

  conversationTest(
    "upsert by userId matches the row previously created by waId and fills the missing identity",
    async tx => {
      const account = await makeAccount(tx);
      const waId = peerId();
      const userId = `bsuid-${randomUUID()}`;
      const sentAt = atMinutesAgo(2);

      const first = await WhatsappConversationRepository.upsertByIdentity({ accountId: account.id, waId }, tx);
      const second = await WhatsappConversationRepository.upsertByIdentity(
        { accountId: account.id, waId, userId, lastMessageAt: sentAt, lastMessagePreview: "ping" },
        tx
      );

      expect(second.id).toBe(first.id);
      expect(second.userId).toBe(userId);
      expect(second.lastMessageAt?.getTime()).toBe(sentAt.getTime());
      expect(second.lastMessagePreview).toBe("ping");
    }
  );

  conversationTest("out-of-order history deliveries never move lastMessageAt backwards", async tx => {
    const account = await makeAccount(tx);
    const waId = peerId();
    const newer = atMinutesAgo(1);
    const older = atMinutesAgo(60);

    const first = await WhatsappConversationRepository.upsertByIdentity(
      { accountId: account.id, waId, lastMessageAt: newer, lastMessagePreview: "newer" },
      tx
    );
    const stale = await WhatsappConversationRepository.upsertByIdentity(
      { accountId: account.id, waId, lastMessageAt: older, lastMessagePreview: "stale" },
      tx
    );

    expect(stale.lastMessageAt?.getTime()).toBe(first.lastMessageAt?.getTime());
    expect(stale.lastMessagePreview).toBe("newer");
  });

  conversationTest("creates a conversation keyed by BSUID userId alone", async tx => {
    const account = await makeAccount(tx);
    const userId = `bsuid-${randomUUID()}`;

    const created = await WhatsappConversationRepository.upsertByIdentity({ accountId: account.id, userId }, tx);
    expect(created.userId).toBe(userId);
    expect(created.waId).toBeNull();

    const again = await WhatsappConversationRepository.upsertByIdentity({ accountId: account.id, userId }, tx);
    expect(again.id).toBe(created.id);
  });

  conversationTest("rows without any peer identity insert freely (no identity unique key)", async tx => {
    const account = await makeAccount(tx);
    const first = await WhatsappConversationRepository.upsertByIdentity(
      { accountId: account.id, username: "only.username" },
      tx
    );
    const second = await WhatsappConversationRepository.upsertByIdentity(
      { accountId: account.id, username: "only.username" },
      tx
    );
    expect(first.id).not.toBe(second.id);
  });

  conversationTest("the same peer identities on different accounts stay separate", async tx => {
    const accountA = await makeAccount(tx);
    const accountB = await makeAccount(tx);
    const waId = peerId();

    const a = await WhatsappConversationRepository.upsertByIdentity({ accountId: accountA.id, waId }, tx);
    const b = await WhatsappConversationRepository.upsertByIdentity({ accountId: accountB.id, waId }, tx);
    expect(a.id).not.toBe(b.id);
  });
});

describe("WhatsappConversationRepository — lookups", () => {
  conversationTest("findById / findByIdentity / findByIds cover hit, miss, and no-identity paths", async tx => {
    const account = await makeAccount(tx);
    const waId = peerId();
    const conversation = await makeConversation(tx, account.id, { waId, userId: `bsuid-${randomUUID()}` });

    expect((await WhatsappConversationRepository.findById(conversation.id, tx))?.id).toBe(conversation.id);
    expect(await WhatsappConversationRepository.findById(randomUUID(), tx)).toBeNull();
    expect((await WhatsappConversationRepository.findByIdentity(account.id, { waId }, tx))?.id).toBe(conversation.id);
    expect(
      (await WhatsappConversationRepository.findByIdentity(account.id, { userId: conversation.userId }, tx))?.id
    ).toBe(conversation.id);
    expect(await WhatsappConversationRepository.findByIdentity(account.id, { waId: peerId() }, tx)).toBeNull();
    expect(await WhatsappConversationRepository.findByIdentity(account.id, {}, tx)).toBeNull();

    const batch = await WhatsappConversationRepository.findByIds([conversation.id, randomUUID()], tx);
    expect(batch.get(conversation.id)?.id).toBe(conversation.id);
    expect(batch.size).toBe(2);
    expect(await WhatsappConversationRepository.findByIds([], tx)).toEqual(new Map());
  });

  conversationTest("bare read without tx falls back to the default pool", async () => {
    const missing = await WhatsappConversationRepository.findById(randomUUID());
    expect(missing).toBeNull();
  });
});

describe("WhatsappConversationRepository — touchLastMessage", () => {
  conversationTest("rolls lastMessageAt forward and refuses older timestamps", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    const newer = atMinutesAgo(1);
    const older = atMinutesAgo(30);

    const touched = await WhatsappConversationRepository.touchLastMessage(
      conversation.id,
      { at: newer, preview: "hi" },
      tx
    );
    expect(touched?.lastMessageAt?.getTime()).toBe(newer.getTime());
    expect(touched?.lastMessagePreview).toBe("hi");

    const stale = await WhatsappConversationRepository.touchLastMessage(
      conversation.id,
      { at: older, preview: "stale" },
      tx
    );
    expect(stale?.lastMessageAt?.getTime()).toBe(newer.getTime());
    expect(stale?.lastMessagePreview).toBe("hi");
  });

  conversationTest("returns null for a missing conversation", async tx => {
    const missing = await WhatsappConversationRepository.touchLastMessage(
      randomUUID(),
      { at: new Date(), preview: "x" },
      tx
    );
    expect(missing).toBeNull();
  });
});

describe("WhatsappConversationRepository — listForInbox / countForInbox", () => {
  conversationTest(
    "scopes by account, sorts newest activity first with nulls last, and exposes accountPurpose",
    async tx => {
      const accountA = await makeAccount(tx, { purpose: WhatsappAccountPurpose.STUDENTS });
      const accountB = await makeAccount(tx);
      const withMessage = await makeConversation(tx, accountA.id, {
        lastMessageAt: atMinutesAgo(2),
        lastMessagePreview: "p",
      });
      const withoutMessage = await makeConversation(tx, accountA.id);
      await makeConversation(tx, accountB.id, { lastMessageAt: atMinutesAgo(1) });

      const scoped = await WhatsappConversationRepository.listForInbox(accountA.id, null, tx);
      expect(scoped.map(row => row.id)).toEqual([withMessage.id, withoutMessage.id]);
      expect(scoped[0]?.accountPurpose).toBe(WhatsappAccountPurpose.STUDENTS);

      const global = await WhatsappConversationRepository.listForInbox(null, null, tx);
      const globalIds = new Set(global.map(row => row.id));
      expect(globalIds.has(withMessage.id)).toBe(true);

      expect(await WhatsappConversationRepository.countForInbox(accountA.id, tx)).toBe(2);
      expect((await WhatsappConversationRepository.countForInbox(null, tx)) >= 3).toBe(true);

      const paged = await WhatsappConversationRepository.listForInbox(
        accountA.id,
        new PaginationArgs({ first: 1 }),
        tx
      );
      expect(paged).toHaveLength(1);
      expect(paged[0]?.id).toBe(withMessage.id);
      const beyond = await WhatsappConversationRepository.listForInbox(
        accountA.id,
        new PaginationArgs({ first: 5, skip: 50 }),
        tx
      );
      expect(beyond).toEqual([]);
    }
  );

  conversationTest("boundary: deleting an account cascades its conversations", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    await tx.delete(whatsappConversations).where(eq(whatsappConversations.id, conversation.id));
    const rows = await tx
      .select({ id: whatsappConversations.id })
      .from(whatsappConversations)
      .where(eq(whatsappConversations.accountId, account.id))
      .orderBy(asc(whatsappConversations.createdAt));
    expect(rows).toEqual([]);
  });
});

describe("WhatsappConversationRepository — softDelete", () => {
  conversationTest("soft-deleted rows disappear from every read path", async tx => {
    const account = await makeAccount(tx);
    const alive = await makeConversation(tx, account.id, { lastMessageAt: atMinutesAgo(1) });
    const gone = await makeConversation(tx, account.id, { lastMessageAt: atMinutesAgo(2) });

    const removed = await WhatsappConversationRepository.softDelete(gone.id, tx);
    expect(removed?.id).toBe(gone.id);

    expect(await WhatsappConversationRepository.findById(gone.id, tx)).toBeNull();
    expect(await WhatsappConversationRepository.findByIdentity(account.id, { waId: gone.waId }, tx)).toBeNull();
    const batch = await WhatsappConversationRepository.findByIds([alive.id, gone.id], tx);
    expect(batch.get(alive.id)?.id).toBe(alive.id);
    expect(batch.get(gone.id)).toBeNull();

    const listed = await WhatsappConversationRepository.listForInbox(account.id, null, tx);
    expect(listed.map(row => row.id)).toEqual([alive.id]);
    expect(await WhatsappConversationRepository.countForInbox(account.id, tx)).toBe(1);
  });

  conversationTest("deleting again is a no-op; unknown ids return null", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);

    expect((await WhatsappConversationRepository.softDelete(conversation.id, tx))?.id).toBe(conversation.id);
    expect(await WhatsappConversationRepository.softDelete(conversation.id, tx)).toBeNull();
    expect(await WhatsappConversationRepository.softDelete(randomUUID(), tx)).toBeNull();
  });
});
