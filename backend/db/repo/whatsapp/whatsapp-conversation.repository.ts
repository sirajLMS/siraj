import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, queryDb, queryWithPagination } from "@/backend/db";
import { whatsappAccounts, whatsappConversations } from "@/backend/db/schema";
import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { isValidAccountPurpose } from "@/backend/lib";
import type {
  DBTransaction,
  PaginationArgs,
  WhatsappConversationInsertType,
  WhatsappConversationReturnType,
  WhatsappConversationSelectType,
} from "@/backend/types";

/**
 * Re-apply enum typing to a joined raw `purpose` column. Absent join input
 * (plain row reads) stays undefined; unknown values fall back to GENERAL.
 */
function coerceJoinedPurpose(accountPurpose: string | null | undefined): WhatsappAccountPurpose | undefined {
  if (accountPurpose === null || accountPurpose === undefined) return undefined;
  return isValidAccountPurpose(accountPurpose) ? accountPurpose : WhatsappAccountPurpose.GENERAL;
}

/**
 * Map a raw row to the client-facing shape: `deletedAt` stays internal,
 * enum-like account purpose is re-applied when the read joined accounts.
 */
function toReturnType(row: WhatsappConversationSelectType, accountPurpose?: string | null) {
  const { deletedAt: _deletedAt, ...rest } = row;
  const mapped: WhatsappConversationReturnType = { ...rest, accountPurpose: coerceJoinedPurpose(accountPurpose) };
  return mapped;
}

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/**
 * Builds the (accountId + flexible peer identity) match clause. When neither
 * `waId` nor `userId` is present the condition always fails — such rows are
 * unreachable by identity upsert on purpose.
 */
function identityCondition(accountId: string, waId?: string | null, userId?: string | null) {
  const identityClauses = [
    waId ? eq(whatsappConversations.waId, waId) : undefined,
    userId ? eq(whatsappConversations.userId, userId) : undefined,
  ];
  return and(eq(whatsappConversations.accountId, accountId), or(...identityClauses));
}

/**
 * Conflict target matching the partial unique index of the available
 * identity column (`{col} IS NOT NULL`).
 */
function conflictTargetFor(input: Pick<WhatsappConversationInsertType, "waId" | "userId">) {
  if (input.waId) {
    return {
      target: [whatsappConversations.accountId, whatsappConversations.waId],
      targetWhere: sql`${whatsappConversations.waId} IS NOT NULL`,
    };
  }
  return {
    target: [whatsappConversations.accountId, whatsappConversations.userId],
    targetWhere: sql`${whatsappConversations.userId} IS NOT NULL`,
  };
}

/**
 * Merge set for the upsert's update branch: keep existing identity columns
 * unless the incoming payload carries a non-null replacement; roll
 * `lastMessageAt`/`lastMessagePreview` forward only when the incoming message
 * is newer (out-of-order history chunks must not move the rollup backwards).
 */
function conflictMergeSet(now: Date) {
  const t = whatsappConversations;
  return {
    waId: sql<string | null>`coalesce(${t.waId}, excluded.wa_id)`,
    userId: sql<string | null>`coalesce(${t.userId}, excluded.user_id)`,
    username: sql<string | null>`coalesce(excluded.username, ${t.username})`,
    displayName: sql<string | null>`coalesce(excluded.display_name, ${t.displayName})`,
    lastMessageAt: sql<Date | null>`CASE WHEN excluded.last_message_at IS NULL THEN ${t.lastMessageAt} WHEN ${t.lastMessageAt} IS NULL OR excluded.last_message_at > ${t.lastMessageAt} THEN excluded.last_message_at ELSE ${t.lastMessageAt} END`,
    lastMessagePreview: sql<
      string | null
    >`CASE WHEN excluded.last_message_at IS NULL THEN ${t.lastMessagePreview} WHEN ${t.lastMessageAt} IS NULL OR excluded.last_message_at > ${t.lastMessageAt} THEN excluded.last_message_preview ELSE ${t.lastMessagePreview} END`,
    updatedAt: now,
  };
}

/** Read-path predicate hiding soft-deleted rows from every lookup. */
function notDeleted() {
  return isNull(whatsappConversations.deletedAt);
}

export namespace WhatsappConversationRepository {
  export async function findById(id: string, tx?: DBTransaction): Promise<WhatsappConversationReturnType | null> {
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(whatsappConversations)
      .where(and(eq(whatsappConversations.id, id), notDeleted()))
      .limit(1);
    return rows[0] ? toReturnType(rows[0]) : null;
  }

  /**
   * Batch lookup by conversation ids (DataLoader). Pre-initializes the map
   * with every requested key so callers can distinguish missing rows.
   */
  export async function findByIds(
    ids: string[],
    tx?: DBTransaction
  ): Promise<Map<string, WhatsappConversationReturnType | null>> {
    const result = new Map<string, WhatsappConversationReturnType | null>();
    for (const id of ids) {
      result.set(id, null);
    }
    if (ids.length === 0) {
      return result;
    }
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(whatsappConversations)
      .where(and(inArray(whatsappConversations.id, ids), notDeleted()));
    for (const row of rows) {
      result.set(row.id, toReturnType(row));
    }
    return result;
  }

  /**
   * Find a conversation by its flexible peer identity — `waId` first-class,
   * `userId` (BSUID) also matched so username-migration deliveries hit the
   * same row. Returns `null` when no identity is usable.
   */
  export async function findByIdentity(
    accountId: string,
    identity: { waId?: string | null; userId?: string | null },
    tx?: DBTransaction
  ): Promise<WhatsappConversationReturnType | null> {
    const row = await findRowByIdentity(accountId, identity, tx);
    return row ? toReturnType(row) : null;
  }

  /**
   * Idempotent conversation upsert keyed on (accountId, waId|userId).
   * Existing rows are merged in place; concurrent first-writes are absorbed
   * by `ON CONFLICT` on the present identity's partial unique index.
   */
  export async function upsertByIdentity(
    input: WhatsappConversationInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappConversationReturnType> {
    const runner = async (t: DBTransaction): Promise<WhatsappConversationSelectType> => {
      const existing = await findRowByIdentity(input.accountId, { waId: input.waId, userId: input.userId }, t);
      if (existing) {
        const set = mergeForExisting(existing, input);
        if (Object.keys(set).length === 0) {
          return existing;
        }
        const [row] = await t
          .update(whatsappConversations)
          .set(set)
          .where(eq(whatsappConversations.id, existing.id))
          .returning();
        // `returning()` only yields no row when the row vanished mid-UPDATE (a
        // cascade delete) — fall back to the snapshot we already hold.
        return row ?? existing;
      }
      if (!input.waId && !input.userId) {
        const [row] = await t.insert(whatsappConversations).values(input).returning();
        return row;
      }
      const [row] = await t
        .insert(whatsappConversations)
        .values(input)
        .onConflictDoUpdate({ ...conflictTargetFor(input), set: conflictMergeSet(new Date()) })
        .returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return toReturnType(row);
  }

  /**
   * Atomically roll the inbox rollup columns forward. The guarded `WHERE`
   * makes the update a no-op for out-of-order (older) deliveries while still
   * returning the current row. When `inboundAt` is provided, the inbound-only
   * marker advances under its own guard — an echo posted after the user's
   * message must not refuse the inbound stamp, and a stale replay must not
   * move either column backwards.
   */
  export async function touchLastMessage(
    conversationId: string,
    rollup: { at: Date; preview: string | null; inboundAt?: Date | null },
    tx?: DBTransaction
  ): Promise<WhatsappConversationReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const updated = await t
        .update(whatsappConversations)
        .set({ lastMessageAt: rollup.at, lastMessagePreview: rollup.preview })
        .where(
          and(
            eq(whatsappConversations.id, conversationId),
            or(isNull(whatsappConversations.lastMessageAt), sql`${whatsappConversations.lastMessageAt} <= ${rollup.at}`)
          )
        )
        .returning();
      if (rollup.inboundAt) {
        const inboundTouched = await t
          .update(whatsappConversations)
          .set({ lastInboundMessageAt: rollup.inboundAt })
          .where(
            and(
              eq(whatsappConversations.id, conversationId),
              or(
                isNull(whatsappConversations.lastInboundMessageAt),
                sql`${whatsappConversations.lastInboundMessageAt} <= ${rollup.inboundAt}`
              )
            )
          )
          .returning();
        if (inboundTouched[0]) {
          return inboundTouched[0];
        }
      }
      if (updated[0]) {
        return updated[0];
      }
      const rows = await t
        .select()
        .from(whatsappConversations)
        .where(eq(whatsappConversations.id, conversationId))
        .limit(1);
      return rows[0];
    };
    const row = await runWithTx(runner, tx);
    return row ? toReturnType(row) : null;
  }

  /**
   * Paginated inbox list. When `accountId` is provided the list is scoped to
   * that account; otherwise it spans every account (the service layer gates
   * visibility). Ordered newest-activity-first; conversations that never saw
   * a message sort last.
   */
  export async function listForInbox(
    accountId: string | null,
    pagination: PaginationArgs | null,
    tx?: DBTransaction
  ): Promise<WhatsappConversationReturnType[]> {
    const q = queryDb(tx);
    const baseQuery = q
      .select({ conversation: whatsappConversations, accountPurpose: whatsappAccounts.purpose })
      .from(whatsappConversations)
      .innerJoin(whatsappAccounts, eq(whatsappConversations.accountId, whatsappAccounts.id))
      .where(and(accountId ? eq(whatsappConversations.accountId, accountId) : undefined, notDeleted()))
      .orderBy(sql`${whatsappConversations.lastMessageAt} DESC NULLS LAST`, desc(whatsappConversations.createdAt))
      .$dynamic();
    const rows = await queryWithPagination(baseQuery, pagination);
    return rows.map(row => toReturnType(row.conversation, row.accountPurpose));
  }

  /** Count of conversations matching the same scope as `listForInbox`. */
  export async function countForInbox(accountId: string | null, tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const [row] = await q
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(whatsappConversations)
      .where(and(accountId ? eq(whatsappConversations.accountId, accountId) : undefined, notDeleted()));
    return row?.value ?? 0;
  }

  /**
   * Soft-delete a conversation: stamp `deletedAt` so every read path hides it.
   * The row itself (and its identity unique keys) stays in place for audit;
   * a repeated call on an already-deleted row is a no-op returning `null`.
   */
  export async function softDelete(id: string, tx?: DBTransaction): Promise<WhatsappConversationReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .update(whatsappConversations)
        .set({ deletedAt: new Date() })
        .where(and(eq(whatsappConversations.id, id), notDeleted()))
        .returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return row ? toReturnType(row) : null;
  }

  /**
   * Right-to-be-forgotten scrub: erase the identity and preview columns of
   * every conversation whose `waId` (phone-based WhatsApp id) belongs to the
   * anonymized subject. Nulled `waId` drops the row from the (account, waId)
   * partial unique index, so no constraint conflicts are possible. Runs
   * inside the caller's transaction.
   */
  export const anonymizeByWaIds = async (waIds: readonly string[], tx: DBTransaction): Promise<void> => {
    if (waIds.length === 0) return;
    await tx
      .update(whatsappConversations)
      .set({ waId: null, displayName: null, lastMessagePreview: null })
      .where(inArray(whatsappConversations.waId, [...waIds]));
  };
}

/**
 * Raw (SelectType) identity lookup shared by `findByIdentity` and the upsert
 * merge path — the merge needs the stored `lastMessageAt` for its comparison.
 */
async function findRowByIdentity(
  accountId: string,
  identity: { waId?: string | null; userId?: string | null },
  tx?: DBTransaction
): Promise<WhatsappConversationSelectType | null> {
  if (!identity.waId && !identity.userId) {
    return null;
  }
  const q = queryDb(tx);
  const rows = await q
    .select()
    .from(whatsappConversations)
    .where(and(identityCondition(accountId, identity.waId, identity.userId), notDeleted()))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Merge set when the upsert matched a pre-existing row: fill identity gaps,
 * refresh display fields when provided, and roll the message rollup forward
 * only when the incoming row is newer than the stored one.
 */
function mergeForExisting(
  existing: WhatsappConversationSelectType,
  input: WhatsappConversationInsertType
): Partial<WhatsappConversationInsertType> {
  const set: Partial<WhatsappConversationInsertType> = {};
  if (!existing.waId && input.waId) set.waId = input.waId;
  if (!existing.userId && input.userId) set.userId = input.userId;
  if (input.username) set.username = input.username;
  if (input.displayName) set.displayName = input.displayName;
  const incomingAt = input.lastMessageAt;
  if (incomingAt && (!existing.lastMessageAt || incomingAt > existing.lastMessageAt)) {
    set.lastMessageAt = incomingAt;
    set.lastMessagePreview = input.lastMessagePreview ?? null;
  }
  return set;
}
