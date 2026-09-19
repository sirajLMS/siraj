import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, queryDb, queryWithPagination } from "@/backend/db";
import { whatsappContacts } from "@/backend/db/schema";
import type {
  DBTransaction,
  PaginationArgs,
  WhatsappContactReturnType,
  WhatsappContactSelectType,
  WhatsappContactSyncInput,
} from "@/backend/types";

/**
 * Map a raw row to the client-facing contact shape: the sync bookkeeping
 * columns (`removedAt` soft-remove marker, `lastActionAt` LWW guard) stay
 * internal and are omitted here.
 */
function toReturnType(row: WhatsappContactSelectType): WhatsappContactReturnType {
  const { removedAt: _removedAt, lastActionAt: _lastActionAt, ...rest } = row;
  return rest;
}

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/**
 * Builds the (accountId + flexible identity) match clause over phone number
 * and BSUID user id.
 */
function identityCondition(accountId: string, phoneNumber?: string | null, userId?: string | null) {
  const identityClauses = [
    phoneNumber ? eq(whatsappContacts.phoneNumber, phoneNumber) : undefined,
    userId ? eq(whatsappContacts.userId, userId) : undefined,
  ];
  return and(eq(whatsappContacts.accountId, accountId), or(...identityClauses));
}

async function findRowByIdentity(
  accountId: string,
  identity: { phoneNumber?: string | null; userId?: string | null },
  tx?: DBTransaction
): Promise<WhatsappContactSelectType | null> {
  if (!identity.phoneNumber && !identity.userId) {
    return null;
  }
  const q = queryDb(tx);
  const rows = await q
    .select()
    .from(whatsappContacts)
    .where(identityCondition(accountId, identity.phoneNumber, identity.userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Invariant breach: the conflicting row vanished between conflict and re-read. */
function raiseConflictLoss(): never {
  throw new Error("whatsapp contact upsert lost its conflict row");
}

/**
 * Insert values for a sync action: remove actions soft-remove immediately
 * (`removedAt` = action time), add actions leave the row live.
 */
function buildInsertValues(input: WhatsappContactSyncInput): typeof whatsappContacts.$inferInsert {
  return {
    accountId: input.accountId,
    phoneNumber: input.phoneNumber ?? null,
    userId: input.userId ?? null,
    username: input.username ?? null,
    fullName: input.fullName ?? null,
    firstName: input.firstName ?? null,
    lastActionAt: input.actionAt,
    removedAt: input.action === "remove" ? input.actionAt : null,
  };
}

/**
 * Conflict branch of the sync upsert: merge identity/display fields and apply
 * the incoming action's timestamps, guarded by last-writer-wins (`setWhere`
 * excludes the update when the stored row is newer).
 */
function buildConflictUpsert(input: WhatsappContactSyncInput) {
  const target = input.phoneNumber
    ? {
        target: [whatsappContacts.accountId, whatsappContacts.phoneNumber],
        targetWhere: sql`${whatsappContacts.phoneNumber} IS NOT NULL`,
      }
    : {
        target: [whatsappContacts.accountId, whatsappContacts.userId],
        targetWhere: sql`${whatsappContacts.userId} IS NOT NULL`,
      };
  return {
    ...target,
    set: {
      username: sql<string | null>`coalesce(excluded.username, ${whatsappContacts.username})`,
      fullName: sql<string | null>`coalesce(excluded.full_name, ${whatsappContacts.fullName})`,
      firstName: sql<string | null>`coalesce(excluded.first_name, ${whatsappContacts.firstName})`,
      lastActionAt: sql<Date>`excluded.last_action_at`,
      removedAt: sql<Date | null>`excluded.removed_at`,
    },
    setWhere: sql`${whatsappContacts.lastActionAt} < excluded.last_action_at`,
  };
}

export namespace WhatsappContactRepository {
  /**
   * Identity lookup including sync bookkeeping columns (internal use).
   * Returns `null` when neither phone nor BSUID identity is supplied.
   */
  export async function findByIdentity(
    accountId: string,
    identity: { phoneNumber?: string | null; userId?: string | null },
    tx?: DBTransaction
  ): Promise<WhatsappContactSelectType | null> {
    return findRowByIdentity(accountId, identity, tx);
  }

  /**
   * Apply one `smb_app_state_sync` action with last-writer-wins ordering on
   * `actionAt` (Meta's `metadata.timestamp`): out-of-order or replayed older
   * actions return the stored row unchanged. Remove actions keep the contact
   * row and set `removedAt`; a later add clears it again.
   */
  export async function upsertFromSyncAction(
    input: WhatsappContactSyncInput,
    tx?: DBTransaction
  ): Promise<WhatsappContactSelectType> {
    const runner = async (t: DBTransaction): Promise<WhatsappContactSelectType> => {
      const existing = await findRowByIdentity(input.accountId, input, t);
      if (existing) {
        return applyToExisting(t, existing, input);
      }
      const [row] = await t
        .insert(whatsappContacts)
        .values(buildInsertValues(input))
        .onConflictDoUpdate(buildConflictUpsert(input))
        .returning();
      if (row) {
        return row;
      }
      // Only reachable when a concurrent transaction inserted a newer row
      // between our identity preselect and this insert (its timestamp won the
      // setWhere guard): the conflicting row necessarily exists, so re-read it.
      return (await findRowByIdentity(input.accountId, input, t)) ?? raiseConflictLoss();
    };
    return runWithTx(runner, tx);
  }

  /**
   * Paginated contact list for one account. By default only live contacts;
   * pass `includeRemoved` to also surface soft-removed rows (sync diagnostics).
   */
  export async function listByAccount(
    accountId: string,
    options: { includeRemoved?: boolean } = {},
    pagination: PaginationArgs | null = null,
    tx?: DBTransaction
  ): Promise<WhatsappContactReturnType[]> {
    const q = queryDb(tx);
    const baseQuery = q
      .select()
      .from(whatsappContacts)
      .where(
        and(
          eq(whatsappContacts.accountId, accountId),
          options.includeRemoved ? undefined : isNull(whatsappContacts.removedAt)
        )
      )
      .orderBy(desc(whatsappContacts.createdAt), desc(whatsappContacts.id))
      .$dynamic();
    const rows = await queryWithPagination(baseQuery, pagination);
    return rows.map(toReturnType);
  }

  /** Count of contacts for one account, mirroring `listByAccount` scoping. */
  export async function countByAccount(
    accountId: string,
    options: { includeRemoved?: boolean } = {},
    tx?: DBTransaction
  ): Promise<number> {
    const q = queryDb(tx);
    const [row] = await q
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(whatsappContacts)
      .where(
        and(
          eq(whatsappContacts.accountId, accountId),
          options.includeRemoved ? undefined : isNull(whatsappContacts.removedAt)
        )
      );
    return row?.value ?? 0;
  }

  /**
   * Right-to-be-forgotten scrub: erase the identity columns of every contact
   * row whose phone number belongs to the anonymized subject. Nulled phone
   * numbers drop the row from the (account, phone) partial unique index, so
   * no constraint conflicts are possible. Runs inside the caller's
   * transaction when `tx` is provided.
   */
  export const anonymizeByPhoneNumbers = async (phoneNumbers: readonly string[], tx: DBTransaction): Promise<void> => {
    if (phoneNumbers.length === 0) return;
    await tx
      .update(whatsappContacts)
      .set({ phoneNumber: null, fullName: null, firstName: null })
      .where(inArray(whatsappContacts.phoneNumber, [...phoneNumbers]));
  };
}

/**
 * Update branch of the sync upsert: stale or equal-timestamp actions are
 * ignored (return stored row); newer actions merge fields and apply the
 * add/remove soft state.
 */
async function applyToExisting(
  t: DBTransaction,
  existing: WhatsappContactSelectType,
  input: WhatsappContactSyncInput
): Promise<WhatsappContactSelectType> {
  if (input.actionAt <= existing.lastActionAt) {
    return existing;
  }
  const [row] = await t
    .update(whatsappContacts)
    .set({
      username: input.username ?? existing.username,
      fullName: input.fullName ?? existing.fullName,
      firstName: input.firstName ?? existing.firstName,
      lastActionAt: input.actionAt,
      removedAt: input.action === "remove" ? input.actionAt : null,
    })
    .where(eq(whatsappContacts.id, existing.id))
    .returning();
  // `returning()` only yields no row on a concurrent delete; fall back to the
  // snapshot already read above.
  return row ?? existing;
}
