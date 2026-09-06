import { and, asc, eq, isNull } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { whatsappSyncRequests } from "@/backend/db/schema";
import { WhatsappSyncRequestStatus } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { coerceSyncRequestStatus, coerceSyncType } from "@/backend/lib";
import type {
  DBTransaction,
  WhatsappSyncRequestEnsureResult,
  WhatsappSyncRequestInsertType,
  WhatsappSyncRequestReturnType,
  WhatsappSyncRequestSelectType,
} from "@/backend/types";

/**
 * Map a raw row to the request shape: `syncType`/`status` re-applied with
 * enum typing.
 */
function toReturnType(row: WhatsappSyncRequestSelectType): WhatsappSyncRequestReturnType {
  return {
    ...row,
    syncType: coerceSyncType(row.syncType),
    status: coerceSyncRequestStatus(row.status),
  };
}

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/** Invariant breach: the conflict row vanished between conflict and re-read. */
function raiseEnsureLoss(): never {
  throw new Error("whatsapp sync request ensure lost its conflict row");
}

export namespace WhatsappSyncRequestRepository {
  /**
   * Idempotent one-shot enqueue: Meta accepts each sync type exactly once per
   * account, and the unique (accountId, syncType) index is the durable guard.
   * `created` distinguishes the first insert from a retry that matched the
   * pre-existing row (no duplicate POST is implied by either outcome — the
   * caller checks `requestId` before calling Meta).
   */
  export async function ensure(
    input: WhatsappSyncRequestInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappSyncRequestEnsureResult> {
    const runner = async (t: DBTransaction) => {
      const [inserted] = await t
        .insert(whatsappSyncRequests)
        .values(input)
        .onConflictDoNothing({ target: [whatsappSyncRequests.accountId, whatsappSyncRequests.syncType] })
        .returning();
      if (inserted) {
        return { row: inserted, created: true };
      }
      const [existing] = await t
        .select()
        .from(whatsappSyncRequests)
        .where(
          and(eq(whatsappSyncRequests.accountId, input.accountId), eq(whatsappSyncRequests.syncType, input.syncType))
        )
        .limit(1);
      return { row: existing, created: false };
    };
    const { row, created } = await runWithTx(runner, tx);
    // The conflict branch guarantees a row exists; the raise path only fires
    // if a concurrent delete won between conflict and re-read.
    return { request: toReturnType(row ?? raiseEnsureLoss()), created };
  }

  /** Find the one-shot request row for an account + sync type. */
  export async function findByAccountAndType(
    accountId: string,
    syncType: WhatsappSyncRequestInsertType["syncType"],
    tx?: DBTransaction
  ): Promise<WhatsappSyncRequestReturnType | null> {
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(whatsappSyncRequests)
      .where(and(eq(whatsappSyncRequests.accountId, accountId), eq(whatsappSyncRequests.syncType, syncType)))
      .limit(1);
    return rows[0] ? toReturnType(rows[0]) : null;
  }

  /** All request rows for an account (both sync types), oldest first. */
  export async function listByAccount(accountId: string, tx?: DBTransaction): Promise<WhatsappSyncRequestReturnType[]> {
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(whatsappSyncRequests)
      .where(eq(whatsappSyncRequests.accountId, accountId))
      .orderBy(asc(whatsappSyncRequests.createdAt));
    return rows.map(toReturnType);
  }

  /**
   * Distinct account IDs holding at least one PENDING request row — the sweep
   * set for the deadline job (expire past the 24h window, retry within it).
   */
  export async function listPendingAccountIds(tx?: DBTransaction): Promise<string[]> {
    const q = queryDb(tx);
    const rows = await q
      .selectDistinct({ accountId: whatsappSyncRequests.accountId })
      .from(whatsappSyncRequests)
      .where(eq(whatsappSyncRequests.status, WhatsappSyncRequestStatus.PENDING));
    return rows.map(row => row.accountId);
  }

  /**
   * Record Meta's accept response (`request_id`) and flip the row to
   * REQUESTED. Guarded by `requestId IS NULL` so a retried enqueue after a
   * transient client failure cannot overwrite the already-accepted id — the
   * POST to Meta is the point of no return.
   * Returns `null` when the row does not exist or already has a requestId.
   */
  export async function recordRequestId(
    id: string,
    requestId: string,
    tx?: DBTransaction
  ): Promise<WhatsappSyncRequestReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .update(whatsappSyncRequests)
        .set({ requestId, status: WhatsappSyncRequestStatus.REQUESTED, requestedAt: new Date() })
        .where(and(eq(whatsappSyncRequests.id, id), isNull(whatsappSyncRequests.requestId)))
        .returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return row ? toReturnType(row) : null;
  }

  /**
   * Transition the request status (STREAMING once chunks flow; COMPLETE /
   * FAILED terminal). Terminal transitions stamp `completedAt`.
   */
  export async function updateStatus(
    id: string,
    status: WhatsappSyncRequestStatus,
    tx?: DBTransaction
  ): Promise<WhatsappSyncRequestReturnType | null> {
    const terminal = status === WhatsappSyncRequestStatus.COMPLETE || status === WhatsappSyncRequestStatus.FAILED;
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .update(whatsappSyncRequests)
        .set({ status, ...(terminal ? { completedAt: new Date() } : {}) })
        .where(eq(whatsappSyncRequests.id, id))
        .returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return row ? toReturnType(row) : null;
  }
}
