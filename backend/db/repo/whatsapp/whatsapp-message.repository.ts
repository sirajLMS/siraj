import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { queryDb, queryWithPagination } from "@/backend/db";
import { runWithTx, toWhatsappMessageReturnType, updateByWamidReturning } from "@/backend/db/repo/whatsapp/__shared__";
import { whatsappConversations, whatsappMessages } from "@/backend/db/schema";
import { WhatsappMessageDirection } from "@/backend/enum";
import type {
  DBTransaction,
  PaginationArgs,
  WhatsappMessageInsertType,
  WhatsappMessageReturnType,
  WhatsappMessageSelectType,
} from "@/backend/types";

/**
 * Shared single-mutation helper: update rows matching one wamid and return the
 * updated row mapped to ReturnType (`null` when the message is not seen yet).
 */
async function updateByWamid(
  wamid: string,
  set: Partial<WhatsappMessageInsertType>,
  tx?: DBTransaction
): Promise<WhatsappMessageReturnType | null> {
  const runner = async (t: DBTransaction): Promise<WhatsappMessageSelectType | undefined> => {
    const [row] = await t.update(whatsappMessages).set(set).where(eq(whatsappMessages.wamid, wamid)).returning();
    return row;
  };
  return updateByWamidReturning(runner, toWhatsappMessageReturnType, tx);
}

export namespace WhatsappMessageRepository {
  export async function findByWamid(wamid: string, tx?: DBTransaction): Promise<WhatsappMessageReturnType | null> {
    const q = queryDb(tx);
    const rows = await q.select().from(whatsappMessages).where(eq(whatsappMessages.wamid, wamid)).limit(1);
    return rows[0] ? toWhatsappMessageReturnType(rows[0]) : null;
  }

  /**
   * Batch lookup by Meta message ids (DataLoader). Pre-initializes the map
   * with every requested key mapped to `null`.
   */
  export async function findByWamids(
    wamids: string[],
    tx?: DBTransaction
  ): Promise<Map<string, WhatsappMessageReturnType | null>> {
    const result = new Map<string, WhatsappMessageReturnType | null>();
    for (const wamid of wamids) {
      result.set(wamid, null);
    }
    if (wamids.length === 0) {
      return result;
    }
    const q = queryDb(tx);
    const rows = await q.select().from(whatsappMessages).where(inArray(whatsappMessages.wamid, wamids));
    for (const row of rows) {
      result.set(row.wamid, toWhatsappMessageReturnType(row));
    }
    return result;
  }

  /**
   * Idempotent per-message upsert: Meta's `wamid` is globally unique, so the
   * same message arriving via history sync, live echo, and inbound webhook
   * inserts once and later deliveries are semantically no-ops — the conflict
   * branch self-assigns `wamid` (touching no other column) purely so the row
   * is returned by the same statement.
   * Edit/revoke/media follow-ups mutate through the dedicated methods below.
   */
  export async function upsertByWamid(
    input: WhatsappMessageInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappMessageReturnType> {
    const runner = async (t: DBTransaction): Promise<WhatsappMessageSelectType> => {
      const [row] = await t
        .insert(whatsappMessages)
        .values(input)
        .onConflictDoUpdate({
          target: whatsappMessages.wamid,
          set: { wamid: sql<string>`${whatsappMessages.wamid}` },
        })
        .returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return toWhatsappMessageReturnType(row);
  }

  /**
   * Mark the message revoked-for-everyone (echo `type: "revoke"`). Returns
   * `null` when the original message has not been ingested yet, letting the
   * caller decide whether to persist a pre-revoked stub row.
   */
  export async function markRevoked(
    wamid: string,
    revokedAt: Date,
    tx?: DBTransaction
  ): Promise<WhatsappMessageReturnType | null> {
    return updateByWamid(wamid, { revokedAt }, tx);
  }

  /**
   * Apply an echo `type: "edit"` payload: replace the stored content and
   * stamp the edit time. `null` when the original is not ingested yet.
   */
  export async function applyEdit(
    wamid: string,
    edit: { content: Record<string, unknown>; editedAt: Date },
    tx?: DBTransaction
  ): Promise<WhatsappMessageReturnType | null> {
    return updateByWamid(wamid, { content: edit.content, editedAt: edit.editedAt }, tx);
  }

  /**
   * Attach a fetched media asset to a previously media-placeholder row and
   * clear the placeholder flag. `null` when the message is not ingested yet.
   */
  export async function attachMedia(
    wamid: string,
    media: Pick<WhatsappMessageInsertType, "mediaId" | "mediaMime" | "mediaSha256"> & {
      content?: Record<string, unknown>;
    },
    tx?: DBTransaction
  ): Promise<WhatsappMessageReturnType | null> {
    return updateByWamid(
      wamid,
      {
        mediaId: media.mediaId,
        mediaMime: media.mediaMime ?? null,
        mediaSha256: media.mediaSha256 ?? null,
        mediaPlaceholder: false,
        ...(media.content === undefined ? {} : { content: media.content }),
      },
      tx
    );
  }

  /**
   * History-chunk dedupe probe: whether any message of the given
   * (accountId, phase, chunkOrder) chunk is already stored.
   */
  export async function hasChunk(
    accountId: string,
    phase: number,
    chunkOrder: number,
    tx?: DBTransaction
  ): Promise<boolean> {
    const q = queryDb(tx);
    const [row] = await q
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(whatsappMessages)
      .where(
        and(
          eq(whatsappMessages.accountId, accountId),
          eq(whatsappMessages.phase, phase),
          eq(whatsappMessages.chunkOrder, chunkOrder)
        )
      );
    return (row?.value ?? 0) > 0;
  }

  /**
   * Paginated per-conversation message thread, oldest first. Messages
   * without a Meta timestamp sort after dated ones, then by insert order.
   */
  export async function listByConversation(
    conversationId: string,
    pagination: PaginationArgs | null,
    tx?: DBTransaction
  ): Promise<WhatsappMessageReturnType[]> {
    const q = queryDb(tx);
    const baseQuery = q
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.conversationId, conversationId))
      .orderBy(sql`${whatsappMessages.sentAt} ASC NULLS LAST`, asc(whatsappMessages.createdAt))
      .$dynamic();
    const rows = await queryWithPagination(baseQuery, pagination);
    return rows.map(toWhatsappMessageReturnType);
  }

  /** Count of messages in one conversation (pair for `listByConversation`). */
  export async function countByConversation(conversationId: string, tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const [row] = await q
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.conversationId, conversationId));
    return row?.value ?? 0;
  }

  /**
   * Right-to-be-forgotten scrub: delete the subject-authored message content
   * of every conversation whose `waId` (phone-based WhatsApp id) belongs to
   * the anonymized subject. `INBOUND` and `ECHO` messages are the subject's
   * own content; `API_OUTBOUND` messages are academy-authored replies and
   * stay. Runs inside the caller's transaction.
   */
  export const deleteSubjectContentByWaIds = async (waIds: readonly string[], tx: DBTransaction): Promise<void> => {
    if (waIds.length === 0) return;
    await tx.delete(whatsappMessages).where(
      and(
        inArray(
          whatsappMessages.conversationId,
          tx
            .select({ id: whatsappConversations.id })
            .from(whatsappConversations)
            .where(inArray(whatsappConversations.waId, [...waIds]))
        ),
        inArray(whatsappMessages.direction, [WhatsappMessageDirection.ECHO, WhatsappMessageDirection.INBOUND])
      )
    );
  };
}
