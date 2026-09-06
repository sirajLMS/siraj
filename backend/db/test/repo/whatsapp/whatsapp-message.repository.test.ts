import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { WhatsappMessageRepository } from "@/backend/db/repo/whatsapp";
import { whatsappAccounts, whatsappConversations } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp";
import {
  type DBTransaction,
  PaginationArgs,
  type WhatsappAccountSelectType,
  type WhatsappConversationSelectType,
  type WhatsappMessageInsertType,
} from "@/backend/types";

function messageTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
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

async function makeConversation(tx: DBTransaction, accountId: string): Promise<WhatsappConversationSelectType> {
  const [conversation] = await tx
    .insert(whatsappConversations)
    .values({ accountId, waId: `wa-${randomUUID().slice(0, 18)}` })
    .returning();
  if (!conversation) throw new Error("conversation insert returned no row");
  return conversation;
}

function msgInput(conversation: WhatsappConversationSelectType, wamid: string): WhatsappMessageInsertType {
  return {
    conversationId: conversation.id,
    accountId: conversation.accountId,
    wamid,
    direction: WhatsappMessageDirection.INBOUND,
    type: "text",
    content: { body: "hello" },
  };
}

async function makeMessage(
  tx: DBTransaction,
  conversation: WhatsappConversationSelectType,
  wamid: string,
  sentAt?: Date,
  direction = WhatsappMessageDirection.INBOUND
) {
  return WhatsappMessageRepository.upsertByWamid(
    { ...msgInput(conversation, wamid), sentAt: sentAt ?? null, direction },
    tx
  );
}

describe("WhatsappMessageRepository — upsertByWamid", () => {
  messageTest("inserts once per global wamid; duplicates are semantic no-ops", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    const wamid = `wamid.${randomUUID()}`;

    const first = await makeMessage(tx, conversation, wamid);
    expect(first.direction).toBe(WhatsappMessageDirection.INBOUND);
    expect(first.content).toEqual({ body: "hello" });
    expect(first.mediaPlaceholder).toBe(false);

    const duplicate = await WhatsappMessageRepository.upsertByWamid(
      { ...msgInput(conversation, wamid), content: { body: "changed" } },
      tx
    );
    expect(duplicate.id).toBe(first.id);
    // Duplicate delivery must not clobber the stored content
    expect(duplicate.content).toEqual({ body: "hello" });

    const found = await WhatsappMessageRepository.findByWamid(wamid, tx);
    expect(found?.id).toBe(first.id);
    expect(await WhatsappMessageRepository.findByWamid(`wamid.${randomUUID()}`, tx)).toBeNull();
  });

  messageTest("boundary: a scalar jsonb content payload coerces to an empty record", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    const weird = await WhatsappMessageRepository.upsertByWamid(
      { ...msgInput(conversation, `wamid.${randomUUID()}`), content: "raw-scalar" },
      tx
    );
    expect(weird.content).toEqual({});
  });

  messageTest("bare read without tx falls back to the default pool", async () => {
    expect(await WhatsappMessageRepository.findByWamid(`wamid.${randomUUID()}`)).toBeNull();
  });
});

describe("WhatsappMessageRepository — findByWamids (DataLoader batch)", () => {
  messageTest("returns a pre-initialized map with nulls for unknown wamids", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    const known = `wamid.${randomUUID()}`;
    await makeMessage(tx, conversation, known);
    const unknown = `wamid.${randomUUID()}`;

    const batch = await WhatsappMessageRepository.findByWamids([known, unknown], tx);
    expect(batch.get(known)?.wamid).toBe(known);
    expect(batch.get(unknown)).toBeNull();
    expect(await WhatsappMessageRepository.findByWamids([], tx)).toEqual(new Map());
  });
});

describe("WhatsappMessageRepository — revoke / edit / media follow-ups", () => {
  messageTest("markRevoked stamps revokedAt on the original", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    const wamid = `wamid.${randomUUID()}`;
    await makeMessage(tx, conversation, wamid);

    const revokedAt = new Date();
    const revoked = await WhatsappMessageRepository.markRevoked(wamid, revokedAt, tx);
    expect(revoked?.revokedAt?.getTime()).toBe(revokedAt.getTime());
  });

  messageTest("markRevoked on an unseen wamid returns null (revoke-before-original)", async tx => {
    const account = await makeAccount(tx);
    await makeConversation(tx, account.id);
    expect(await WhatsappMessageRepository.markRevoked(`wamid.${randomUUID()}`, new Date(), tx)).toBeNull();
  });

  messageTest("applyEdit replaces content and stamps editedAt", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    const wamid = `wamid.${randomUUID()}`;
    await makeMessage(tx, conversation, wamid);

    const editedAt = new Date();
    const edited = await WhatsappMessageRepository.applyEdit(
      wamid,
      { content: { body: "edited — النص المعدل" }, editedAt },
      tx
    );
    expect(edited?.content).toEqual({ body: "edited — النص المعدل" });
    expect(edited?.editedAt?.getTime()).toBe(editedAt.getTime());
    expect(
      await WhatsappMessageRepository.applyEdit(`wamid.${randomUUID()}`, { content: {}, editedAt }, tx)
    ).toBeNull();
  });

  messageTest("attachMedia flips the placeholder flag and persists asset ids", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    const wamid = `wamid.${randomUUID()}`;
    const placeholder = await WhatsappMessageRepository.upsertByWamid(
      {
        ...msgInput(conversation, wamid),
        type: "image",
        content: { media_placeholder: true },
        mediaPlaceholder: true,
      },
      tx
    );
    expect(placeholder.mediaPlaceholder).toBe(true);

    const attached = await WhatsappMessageRepository.attachMedia(
      wamid,
      { mediaId: `media-${randomUUID()}`, mediaMime: "image/jpeg", mediaSha256: "a".repeat(64) },
      tx
    );
    expect(attached?.mediaPlaceholder).toBe(false);
    expect(attached?.mediaMime).toBe("image/jpeg");
    expect(attached?.mediaSha256).toBe("a".repeat(64));

    const withContent = await WhatsappMessageRepository.attachMedia(
      wamid,
      { mediaId: null, content: { body: "cap" } },
      tx
    );
    expect(withContent?.content).toEqual({ body: "cap" });
    expect(await WhatsappMessageRepository.attachMedia(`wamid.${randomUUID()}`, { mediaId: "x" }, tx)).toBeNull();
  });
});

describe("WhatsappMessageRepository — hasChunk (history chunk dedupe)", () => {
  messageTest("detects an existing (accountId, phase, chunkOrder) chunk boundary", async tx => {
    const accountA = await makeAccount(tx);
    const accountB = await makeAccount(tx);
    const conversationA = await makeConversation(tx, accountA.id);
    const conversationB = await makeConversation(tx, accountB.id);

    await WhatsappMessageRepository.upsertByWamid(
      { ...msgInput(conversationA, `wamid.${randomUUID()}`), phase: 1, chunkOrder: 7 },
      tx
    );
    await WhatsappMessageRepository.upsertByWamid(
      { ...msgInput(conversationB, `wamid.${randomUUID()}`), phase: 1, chunkOrder: 7 },
      tx
    );

    expect(await WhatsappMessageRepository.hasChunk(accountA.id, 1, 7, tx)).toBe(true);
    expect(await WhatsappMessageRepository.hasChunk(accountA.id, 1, 8, tx)).toBe(false);
    expect(await WhatsappMessageRepository.hasChunk(accountA.id, 2, 7, tx)).toBe(false);
  });
});

describe("WhatsappMessageRepository — listByConversation / countByConversation", () => {
  messageTest("orders by sentAt with nulls last, paginates, and counts", async tx => {
    const account = await makeAccount(tx);
    const conversation = await makeConversation(tx, account.id);
    const other = await makeConversation(tx, account.id);

    const t1 = new Date(Date.now() - 120_000);
    const t2 = new Date(Date.now() - 60_000);
    const second = await makeMessage(tx, conversation, `wamid.${randomUUID()}`, t2);
    const undated = await makeMessage(
      tx,
      conversation,
      `wamid.${randomUUID()}`,
      undefined,
      WhatsappMessageDirection.ECHO
    );
    const first = await makeMessage(tx, conversation, `wamid.${randomUUID()}`, t1);
    await makeMessage(tx, other, `wamid.${randomUUID()}`, t1);

    expect(undated.direction).toBe(WhatsappMessageDirection.ECHO);
    const thread = await WhatsappMessageRepository.listByConversation(conversation.id, null, tx);
    expect(thread.map(row => row.id)).toEqual([first.id, second.id, undated.id]);
    expect(await WhatsappMessageRepository.countByConversation(conversation.id, tx)).toBe(3);

    const page = await WhatsappMessageRepository.listByConversation(
      conversation.id,
      new PaginationArgs({ first: 2 }),
      tx
    );
    expect(page.map(row => row.id)).toEqual([first.id, second.id]);
    const tail = await WhatsappMessageRepository.listByConversation(
      conversation.id,
      new PaginationArgs({ first: 10, skip: 2 }),
      tx
    );
    expect(tail.map(row => row.id)).toEqual([undated.id]);
  });
});
