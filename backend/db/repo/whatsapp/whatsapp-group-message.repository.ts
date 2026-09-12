import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, queryDb, queryWithPagination } from "@/backend/db";
import { whatsappGroupMessages } from "@/backend/db/schema";
import { coerceJsonRecord, coerceMessageDirection } from "@/backend/lib";
import type {
  DBTransaction,
  PaginationArgs,
  WhatsappGroupMessageInsertType,
  WhatsappGroupMessageReturnType,
  WhatsappGroupMessageSelectType,
} from "@/backend/types";

/**
 * Map a raw row to the client-facing shape: `direction` re-applied with
 * enum typing and `content` narrowed to a plain record.
 */
function toReturnType(row: WhatsappGroupMessageSelectType): WhatsappGroupMessageReturnType {
  return {
    ...row,
    direction: coerceMessageDirection(row.direction),
    content: coerceJsonRecord(row.content),
  };
}

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/**
 * Shared single-mutation helper: update rows matching one wamid and return
 * the updated row mapped to ReturnType (`null` when the message is not
 * ingested yet).
 */
async function updateByWamid(
  wamid: string,
  set: Partial<WhatsappGroupMessageInsertType>,
  tx?: DBTransaction
): Promise<WhatsappGroupMessageReturnType | null> {
  const runner = async (t: DBTransaction) => {
    const [row] = await t
      .update(whatsappGroupMessages)
      .set(set)
      .where(eq(whatsappGroupMessages.wamid, wamid))
      .returning();
    return row;
  };
  const row = await runWithTx(runner, tx);
  return row ? toReturnType(row) : null;
}

export namespace WhatsappGroupMessageRepository {
  /**
   * Idempotent per-message upsert: Meta's `wamid` is globally unique, so the
   * same group message arriving via history sync and inbound webhook inserts
   * once and later deliveries are semantically no-ops — the conflict branch
   * self-assigns `wamid` (touching no other column) purely so the row is
   * returned by the same statement. Status/pin follow-ups mutate through the
   * dedicated methods below.
   */
  export async function upsertByWamid(
    input: WhatsappGroupMessageInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappGroupMessageReturnType> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .insert(whatsappGroupMessages)
        .values(input)
        .onConflictDoUpdate({
          target: whatsappGroupMessages.wamid,
          set: { wamid: sql<string>`${whatsappGroupMessages.wamid}` },
        })
        .returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return toReturnType(row);
  }

  /** Group message by Meta's globally unique `wamid`. */
  export async function findByWamid(wamid: string, tx?: DBTransaction): Promise<WhatsappGroupMessageReturnType | null> {
    const q = queryDb(tx);
    const rows = await q.select().from(whatsappGroupMessages).where(eq(whatsappGroupMessages.wamid, wamid)).limit(1);
    return rows[0] ? toReturnType(rows[0]) : null;
  }

  /**
   * Batch lookup by Meta message ids (DataLoader). Pre-initializes the map
   * with every requested key mapped to `null`.
   */
  export async function findByWamids(
    wamids: string[],
    tx?: DBTransaction
  ): Promise<Map<string, WhatsappGroupMessageReturnType | null>> {
    const result = new Map<string, WhatsappGroupMessageReturnType | null>();
    for (const wamid of wamids) {
      result.set(wamid, null);
    }
    if (wamids.length === 0) {
      return result;
    }
    const q = queryDb(tx);
    const rows = await q.select().from(whatsappGroupMessages).where(inArray(whatsappGroupMessages.wamid, wamids));
    for (const row of rows) {
      result.set(row.wamid, toReturnType(row));
    }
    return result;
  }

  /**
   * Paginated per-group message thread, newest first. Messages without a
   * Meta timestamp sort last, then by insert order.
   */
  export async function listByGroup(
    groupId: string,
    pagination: PaginationArgs | null,
    tx?: DBTransaction
  ): Promise<WhatsappGroupMessageReturnType[]> {
    const q = queryDb(tx);
    const baseQuery = q
      .select()
      .from(whatsappGroupMessages)
      .where(eq(whatsappGroupMessages.groupId, groupId))
      .orderBy(sql`${whatsappGroupMessages.sentAt} DESC NULLS LAST`, desc(whatsappGroupMessages.createdAt))
      .$dynamic();
    const rows = await queryWithPagination(baseQuery, pagination);
    return rows.map(toReturnType);
  }

  /** Count of messages in one group (pair for `listByGroup`). */
  export async function countByGroup(groupId: string, tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const [row] = await q
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(whatsappGroupMessages)
      .where(eq(whatsappGroupMessages.groupId, groupId));
    return row?.value ?? 0;
  }

  /**
   * Set a group message's delivery status (the sent → delivered → read
   * progression guard is the caller's job). `null` when the message is not
   * ingested yet.
   */
  export async function updateStatus(
    wamid: string,
    status: string,
    tx?: DBTransaction
  ): Promise<WhatsappGroupMessageReturnType | null> {
    return updateByWamid(wamid, { status }, tx);
  }

  /**
   * Set or clear the Meta-side pin state of a group message: pass dates to
   * pin, `null`s to unpin. `null` when the message is not ingested yet.
   */
  export async function markPinned(
    wamid: string,
    pinnedAt: Date | null,
    pinExpiresAt: Date | null,
    tx?: DBTransaction
  ): Promise<WhatsappGroupMessageReturnType | null> {
    return updateByWamid(wamid, { pinnedAt, pinExpiresAt }, tx);
  }
}
