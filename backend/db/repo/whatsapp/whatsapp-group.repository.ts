import { and, desc, eq, isNotNull, isNull, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, db, queryDb, queryWithPagination } from "@/backend/db";
import { whatsappGroups } from "@/backend/db/schema";
import { WhatsappGroupJoinApprovalMode } from "@/backend/enum/whatsapp/whatsapp-groups.enum";
import type {
  DBTransaction,
  PaginationInput,
  WhatsappGroupInsertType,
  WhatsappGroupReturnType,
  WhatsappGroupSelectType,
} from "@/backend/types";
import { PaginationArgs } from "@/backend/types/shared/pagination.types";
import { escapeLikeWildcards } from "@/backend/utils";

/**
 * Re-apply the `WhatsappGroupJoinApprovalMode` enum typing to the raw
 * `join_approval_mode` column value (comparison-based, no unsafe assertion).
 * Unrecognized values fall back to `ApprovalRequired`, the conservative
 * moderation default.
 */
function coerceJoinApprovalMode(raw: string): WhatsappGroupJoinApprovalMode {
  // Compare against the Meta wire literal ("auto_approve") — the enum member
  // is `WhatsappGroupJoinApprovalMode.AutoApprove` (oxlint string-literal fix pattern).
  if (raw === "auto_approve") {
    return WhatsappGroupJoinApprovalMode.AutoApprove;
  }
  return WhatsappGroupJoinApprovalMode.ApprovalRequired;
}

/**
 * Map a raw row to the client-facing shape: `joinApprovalMode` re-applied
 * with enum typing.
 */
function toReturnType(row: WhatsappGroupSelectType): WhatsappGroupReturnType {
  return {
    ...row,
    joinApprovalMode: coerceJoinApprovalMode(row.joinApprovalMode),
  };
}

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/** Read-path predicate hiding soft-deleted groups from every lookup. */
function notDeleted() {
  return isNull(whatsappGroups.deletedAt);
}

/** Deleted-group predicate for re-activation paths (`markActive`). */
function deletedOnly() {
  return isNotNull(whatsappGroups.deletedAt);
}

/**
 * Shared single-row group fetch by an arbitrary `where` predicate, used by
 * every find* lookup in this module so they agree on the same select-limit
 * shape. Honors the optional transaction handle via `queryDb(tx)`.
 */
async function findGroupWhere(where: SQL | undefined, tx?: DBTransaction): Promise<WhatsappGroupSelectType | null> {
  const q = queryDb(tx);
  const rows = await q.select().from(whatsappGroups).where(where).limit(1);
  return rows[0] ?? null;
}

/**
 * Shared soft-delete toggle guarded by `guard` (so an already-matched state
 * is a no-op returning `false`). Uses `runWithTx` so the write is atomic
 * when no transaction handle is provided.
 */
async function toggleDeletedAt(
  id: string,
  deletedAt: Date | null,
  guard: SQL | undefined,
  tx?: DBTransaction
): Promise<boolean> {
  const runner = async (t: DBTransaction) => {
    const rows = await t
      .update(whatsappGroups)
      .set({ deletedAt })
      .where(and(eq(whatsappGroups.id, id), guard))
      .returning({ id: whatsappGroups.id });
    return rows.length > 0;
  };
  return runWithTx(runner, tx);
}

/**
 * Shared (accountId + subject search) filter clause for the list and count
 * queries. The search narrows to a wildcard-escaped case-insensitive subject
 * match; an empty search collapses to no filter.
 */
function listFilters(accountId: string | null, search: string | null) {
  const trimmed = search?.trim() ?? "";
  return and(
    accountId ? eq(whatsappGroups.accountId, accountId) : undefined,
    trimmed ? caseInsensitiveLike(whatsappGroups.subject, `%${escapeLikeWildcards(trimmed)}%`) : undefined,
    notDeleted()
  );
}

/**
 * Count of groups matching the list filters, shared between `listForAccount`
 * and `countForAccount` so both always agree on the same scope.
 */
async function countMatching(accountId: string | null, search: string | null, tx?: DBTransaction): Promise<number> {
  const q = queryDb(tx);
  const [row] = await q
    .select({ value: sql<number>`count(*)`.mapWith(Number) })
    .from(whatsappGroups)
    .where(listFilters(accountId, search));
  return row?.value ?? 0;
}

export namespace WhatsappGroupRepository {
  /**
   * Idempotent group upsert keyed on (accountId, groupJid) — Meta's group
   * identifier is unique per account, so the same group arriving via a Graph
   * API sync and a webhook upsert inserts once and later deliveries are
   * semantically no-ops: the conflict branch self-assigns `groupJid`
   * (touching no other column) purely so the row is returned by the same
   * statement. Settings/rollup mutations go through the dedicated methods
   * below.
   */
  export async function upsertByGroupJid(
    input: WhatsappGroupInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappGroupReturnType> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .insert(whatsappGroups)
        .values(input)
        .onConflictDoUpdate({
          target: [whatsappGroups.accountId, whatsappGroups.groupJid],
          set: { groupJid: sql<string>`${whatsappGroups.groupJid}` },
        })
        .returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return toReturnType(row);
  }

  /** Active (non-deleted) group by id. */
  export async function findById(id: string, tx?: DBTransaction): Promise<WhatsappGroupReturnType | null> {
    const row = await findGroupWhere(and(eq(whatsappGroups.id, id), notDeleted()), tx);
    return row ? toReturnType(row) : null;
  }

  /**
   * Group lookup by (accountId, groupJid) that includes soft-deleted rows —
   * webhook ingest needs to find a deleted group to re-activate it through
   * `markActive` instead of colliding with the unique (accountId, groupJid)
   * constraint.
   */
  export async function findByGroupJid(
    accountId: string,
    groupJid: string,
    tx?: DBTransaction
  ): Promise<WhatsappGroupReturnType | null> {
    const row = await findGroupWhere(
      and(eq(whatsappGroups.accountId, accountId), eq(whatsappGroups.groupJid, groupJid)),
      tx
    );
    return row ? toReturnType(row) : null;
  }

  /**
   * Paginated group list. When `accountId` is provided the list is scoped to
   * that account; otherwise it spans every account (the service layer gates
   * visibility). `search` filters by case-insensitive subject match.
   * Ordered newest-created-first.
   */
  export async function listForAccount(
    input: { accountId?: string | null; search?: string | null; pagination: PaginationInput | null },
    tx?: DBTransaction
  ): Promise<{ rows: WhatsappGroupReturnType[]; totalCount: number }> {
    const accountId = input.accountId ?? null;
    const search = input.search ?? null;
    const q = queryDb(tx);
    const baseQuery = q
      .select()
      .from(whatsappGroups)
      .where(listFilters(accountId, search))
      .orderBy(desc(whatsappGroups.createdAt))
      .$dynamic();
    const rows = await queryWithPagination(baseQuery, PaginationArgs.fromArgs(input.pagination));
    const totalCount = await countMatching(accountId, search, tx);
    return { rows: rows.map(toReturnType), totalCount };
  }

  /** Count of active groups matching the same scope as `listForAccount`. */
  export async function countForAccount(accountId?: string | null, tx?: DBTransaction): Promise<number> {
    return countMatching(accountId ?? null, null, tx);
  }

  /**
   * Soft-delete a group: stamp `deletedAt` so every active read path hides
   * it while the (accountId, groupJid) unique keys stay in place for
   * re-activation. Returns `false` for an already-deleted group.
   */
  export async function markDeleted(id: string, tx?: DBTransaction): Promise<boolean> {
    return toggleDeletedAt(id, new Date(), notDeleted(), tx);
  }

  /**
   * Un-delete a group (webhook group re-create). Returns `false` when the
   * group is already active.
   */
  export async function markActive(id: string, tx?: DBTransaction): Promise<boolean> {
    return toggleDeletedAt(id, null, deletedOnly(), tx);
  }

  /**
   * Partial group settings update — only the provided patch fields are
   * written. `null` when the group no longer exists.
   */
  export async function updateSettings(
    id: string,
    patch: {
      subject?: string;
      description?: string | null;
      inviteLink?: string | null;
      suspended?: boolean;
      totalParticipantCount?: number;
      pendingJoinRequestCount?: number;
      syncedAt?: Date | null;
      creationTimestamp?: Date | null;
    },
    tx?: DBTransaction
  ): Promise<WhatsappGroupReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const set: Partial<WhatsappGroupInsertType> = {};
      if (patch.subject !== undefined) set.subject = patch.subject;
      if (patch.description !== undefined) set.description = patch.description;
      if (patch.inviteLink !== undefined) set.inviteLink = patch.inviteLink;
      if (patch.suspended !== undefined) set.suspended = patch.suspended;
      if (patch.totalParticipantCount !== undefined) set.totalParticipantCount = patch.totalParticipantCount;
      if (patch.pendingJoinRequestCount !== undefined) {
        set.pendingJoinRequestCount = patch.pendingJoinRequestCount;
      }
      if (patch.syncedAt !== undefined) set.syncedAt = patch.syncedAt;
      if (patch.creationTimestamp !== undefined) set.creationTimestamp = patch.creationTimestamp;
      if (Object.keys(set).length === 0) {
        const rows = await t.select().from(whatsappGroups).where(eq(whatsappGroups.id, id)).limit(1);
        return rows[0];
      }
      const [row] = await t.update(whatsappGroups).set(set).where(eq(whatsappGroups.id, id)).returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return row ? toReturnType(row) : null;
  }

  /**
   * Atomically increment/decrement the denormalized pending join request
   * rollup, clamped to >= 0 — a rejected request arriving after the
   * decrement must not drive the counter negative.
   */
  export async function adjustPendingJoinRequests(
    id: string,
    delta: number,
    tx?: DBTransaction
  ): Promise<WhatsappGroupReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .update(whatsappGroups)
        .set({
          pendingJoinRequestCount: sql<number>`greatest(0, ${whatsappGroups.pendingJoinRequestCount} + ${delta})`,
        })
        .where(eq(whatsappGroups.id, id))
        .returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return row ? toReturnType(row) : null;
  }
}
