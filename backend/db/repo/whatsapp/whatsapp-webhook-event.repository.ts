import { and, asc, eq, inArray, type SQL, sql } from "drizzle-orm";
import { db, queryDb, withForUpdate } from "@/backend/db";
import { whatsappWebhookEvents } from "@/backend/db/schema";
import { WhatsappWebhookEventStatus } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { coerceJsonRecord, coerceWebhookEventStatus } from "@/backend/lib";
import type {
  DBTransaction,
  WhatsappWebhookEventInsertType,
  WhatsappWebhookEventReturnType,
  WhatsappWebhookEventSelectType,
} from "@/backend/types";

/**
 * Map a raw row to the event queue shape: `status` re-applied with enum
 * typing and the untyped-at-rest `payload` narrowed to a plain record.
 */
function toReturnType(row: WhatsappWebhookEventSelectType): WhatsappWebhookEventReturnType {
  return {
    ...row,
    status: coerceWebhookEventStatus(row.status),
    payload: coerceJsonRecord(row.payload),
  };
}

/**
 * One webhook payload fans out into one event row per change; inserts are
 * chunked so a burst never exceeds this many rows per statement.
 */
const INSERT_BATCH_SIZE = 500;

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/**
 * Insert one batch chunk, then recurse — sequential chunking keeps statements
 * bounded while preserving insert order inside the caller's transaction.
 */
async function insertChunked(
  t: DBTransaction,
  inputs: WhatsappWebhookEventInsertType[],
  offset: number
): Promise<number> {
  const batch = inputs.slice(offset, offset + INSERT_BATCH_SIZE);
  if (batch.length === 0) {
    return 0;
  }
  const rows = await t.insert(whatsappWebhookEvents).values(batch).returning({ id: whatsappWebhookEvents.id });
  return rows.length + (await insertChunked(t, inputs, offset + INSERT_BATCH_SIZE));
}

export namespace WhatsappWebhookEventRepository {
  /**
   * Persist one webhook change before the route acks Meta (persist-first,
   * process-async). Rows start PENDING; the async worker claims them.
   */
  export async function insert(
    input: WhatsappWebhookEventInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappWebhookEventReturnType> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t.insert(whatsappWebhookEvents).values(input).returning();
      return row;
    };
    return toReturnType(await runWithTx(runner, tx));
  }

  /**
   * Persist a burst of changes (one webhook payload fans out into one row per
   * `change`). Inserts in bounded batches to keep statements small; returns
   * the number of rows written.
   */
  export async function insertBatch(inputs: WhatsappWebhookEventInsertType[], tx?: DBTransaction): Promise<number> {
    return runWithTx(t => insertChunked(t, inputs, 0), tx);
  }

  /**
   * Atomically claim up to `limit` oldest PENDING events for processing:
   * `FOR UPDATE SKIP LOCKED` lets multiple workers share the queue, and each
   * claimed row is flipped PENDING → PROCESSING (with `attempts` incremented)
   * inside the same transaction, so a racing worker starting after the first
   * claim commits CANNOT re-claim the row. A row left PROCESSING by a crashed
   * worker becomes re-claimable through `claimBatchWithBackoff` once its
   * backoff horizon elapses (see `parkExhausted` for the poison park).
   */
  export async function claimBatch(limit: number, tx?: DBTransaction): Promise<WhatsappWebhookEventReturnType[]> {
    return claimWhere(undefined, limit, tx);
  }

  /**
   * Backoff-aware claim for the sweeper: a row with `attempts = n` becomes
   * re-claimable only once `backoffBaseMs * (2^n - 1)` milliseconds elapsed
   * since receipt (1×, 3×, 7×, …), so poison events retry less and less often
   * until `parkExhausted` takes them out of the queue. Fresh rows
   * (`attempts = 0`) are always eligible. PROCESSING rows left behind by a
   * crashed worker are equally eligible past the same horizon — the horizon
   * doubles as the stuck-in-PROCESSING timeout.
   */
  export async function claimBatchWithBackoff(
    limit: number,
    backoffBaseMs: number,
    tx?: DBTransaction
  ): Promise<WhatsappWebhookEventReturnType[]> {
    // The horizon is computed in JS (not SQL `now()`) because `receivedAt` is
    // stamped by the JS insert path — comparing against both clocks avoids
    // ties when a row is claimed in the same millisecond it was received.
    const eligibleBefore = new Date();
    const backoffDelay = sql`${whatsappWebhookEvents.receivedAt} <= ${eligibleBefore}::timestamptz - (interval '1 millisecond' * (${backoffBaseMs} * (power(2, ${whatsappWebhookEvents.attempts}::float) - 1)))`;
    return claimWhere(backoffDelay, limit, tx, [
      WhatsappWebhookEventStatus.PENDING,
      WhatsappWebhookEventStatus.PROCESSING,
    ]);
  }

  /** Flip a claimed (PROCESSING) event to its terminal PROCESSED state. */
  export async function markProcessed(id: string, tx?: DBTransaction): Promise<WhatsappWebhookEventReturnType | null> {
    return updateStatus(id, WhatsappWebhookEventStatus.PROCESSED, tx);
  }

  /** Flip a claimed (PROCESSING) event to its terminal FAILED state. */
  export async function markFailed(id: string, tx?: DBTransaction): Promise<WhatsappWebhookEventReturnType | null> {
    return updateStatus(id, WhatsappWebhookEventStatus.FAILED, tx);
  }

  /**
   * Poison park: PENDING/PROCESSING rows whose `attempts` reached
   * `maxAttempts` are moved to FAILED so the queue stops churning on an
   * unprocessable payload instead of silently dropping it. A row parked while
   * a worker is still dispatching it may flip back to PROCESSED on success —
   * that is benign (the payload did process). Returns the number of rows
   * parked.
   */
  export async function parkExhausted(maxAttempts: number, tx?: DBTransaction): Promise<number> {
    const runner = async (t: DBTransaction) => {
      const rows = await t
        .update(whatsappWebhookEvents)
        .set({ status: WhatsappWebhookEventStatus.FAILED, processedAt: new Date() })
        .where(
          and(
            inArray(whatsappWebhookEvents.status, [
              WhatsappWebhookEventStatus.PENDING,
              WhatsappWebhookEventStatus.PROCESSING,
            ]),
            sql`${whatsappWebhookEvents.attempts} >= ${maxAttempts}`
          )
        )
        .returning({ id: whatsappWebhookEvents.id });
      return rows.length;
    };
    return runWithTx(runner, tx);
  }

  /**
   * Exact-replay probe for the short-window dedupe: does this payload hash
   * exist in any status (PENDING/PROCESSING/PROCESSED — FAILED replays are
   * also skipped) since `since`? Used by the route's accept-but-skip short
   * window before inserting new rows.
   */
  export async function existsRecentByHash(payloadHash: string, since: Date, tx?: DBTransaction): Promise<boolean> {
    const q = queryDb(tx);
    const [row] = await q
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(whatsappWebhookEvents)
      .where(
        and(eq(whatsappWebhookEvents.payloadHash, payloadHash), sql`${whatsappWebhookEvents.receivedAt} >= ${since}`)
      );
    return (row?.value ?? 0) > 0;
  }
}

/**
 * Shared claim engine behind `claimBatch` / `claimBatchWithBackoff`: selects
 * the oldest claimable rows with `FOR UPDATE SKIP LOCKED`, then in the same
 * transaction bumps `attempts` and flips the claimed ids to PROCESSING so no
 * second worker can claim them after this transaction commits.
 */
async function claimWhere(
  extraCondition: SQL | undefined,
  limit: number,
  tx?: DBTransaction,
  statuses: WhatsappWebhookEventStatus[] = [WhatsappWebhookEventStatus.PENDING]
): Promise<WhatsappWebhookEventReturnType[]> {
  const runner = async (t: DBTransaction) => {
    const claimed = await withForUpdate(
      t
        .select({ id: whatsappWebhookEvents.id })
        .from(whatsappWebhookEvents)
        .where(and(inArray(whatsappWebhookEvents.status, statuses), extraCondition))
        .orderBy(asc(whatsappWebhookEvents.receivedAt)),
      { skipLocked: true }
    ).limit(limit);
    if (claimed.length === 0) {
      return [];
    }
    const ids = claimed.map(row => row.id);
    return t
      .update(whatsappWebhookEvents)
      .set({
        attempts: sql<number>`${whatsappWebhookEvents.attempts} + 1`,
        status: WhatsappWebhookEventStatus.PROCESSING,
      })
      .where(inArray(whatsappWebhookEvents.id, ids))
      .returning();
  };
  const rows = await runWithTx(runner, tx);
  return rows.map(toReturnType);
}

async function updateStatus(
  id: string,
  status: WhatsappWebhookEventStatus.PROCESSED | WhatsappWebhookEventStatus.FAILED,
  tx?: DBTransaction
): Promise<WhatsappWebhookEventReturnType | null> {
  const runner = async (t: DBTransaction) => {
    const [row] = await t
      .update(whatsappWebhookEvents)
      .set({ status, processedAt: new Date() })
      .where(eq(whatsappWebhookEvents.id, id))
      .returning();
    return row;
  };
  const row = await runWithTx(runner, tx);
  return row ? toReturnType(row) : null;
}
