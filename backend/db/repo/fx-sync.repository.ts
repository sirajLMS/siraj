import { desc, eq, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { fxSyncRuns } from "@/backend/db/schema";
import { type FxProvider, FxSyncStatus } from "@/backend/enum/fx/fx-provider.enum";
import type * as Types from "@/backend/types";

export namespace FxSyncRepository {
  type SyncRunInsertInput = {
    provider: FxProvider;
    triggerType: string;
    triggeredByUserId: string | null;
  };

  type CompleteSyncRunPatch = {
    status: FxSyncStatus;
    pairsWritten: number;
    pairsFailed: number;
    errorMessage?: string | null;
    providerResponse?: unknown;
    finishedAt?: Date;
  };

  /**
   * Creates a new fx_sync_runs row in `running` state.
   * `pairsWritten` / `pairsFailed` initialize to "0" (varchar columns).
   */
  export const createSyncRun = async (
    input: SyncRunInsertInput,
    tx?: DBTransaction
  ): Promise<Types.FxSyncRunSelectType> => {
    const dbToQuery = tx ?? db;
    const now = new Date();
    const [row] = await dbToQuery
      .insert(fxSyncRuns)
      .values({
        provider: input.provider,
        status: FxSyncStatus.Running,
        pairsWritten: "0",
        pairsFailed: "0",
        triggerType: input.triggerType,
        triggeredByUserId: input.triggeredByUserId,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return row;
  };

  /**
   * Marks a sync run complete by updating status, pair counts, error info,
   * provider response, and finishedAt. Numbers are stringified for the varchar
   * `pairs_written` / `pairs_failed` columns. `finishedAt` defaults to now.
   */
  export const completeSyncRun = async (
    id: string,
    patch: CompleteSyncRunPatch,
    tx?: DBTransaction
  ): Promise<Types.FxSyncRunSelectType> => {
    const dbToQuery = tx ?? db;
    const now = new Date();
    const [row] = await dbToQuery
      .update(fxSyncRuns)
      .set({
        status: patch.status,
        pairsWritten: String(patch.pairsWritten),
        pairsFailed: String(patch.pairsFailed),
        errorMessage: patch.errorMessage ?? null,
        providerResponse: patch.providerResponse ?? null,
        finishedAt: patch.finishedAt ?? now,
        updatedAt: now,
      })
      .where(eq(fxSyncRuns.id, id))
      .returning();
    return row;
  };

  /**
   * Returns the most recent sync run by `startedAt DESC`, or null if none.
   */
  export const getLatestSyncRun = async (tx?: DBTransaction): Promise<Types.FxSyncRunSelectType | null> => {
    const q = queryDb(tx);
    const rows = await q.select().from(fxSyncRuns).orderBy(desc(fxSyncRuns.startedAt)).limit(1);
    return rows[0] ?? null;
  };

  /**
   * Returns the currently-running sync run, or null if none.
   */
  export const getRunningSyncRun = async (tx?: DBTransaction): Promise<Types.FxSyncRunSelectType | null> => {
    const q = queryDb(tx);
    const rows = await q.select().from(fxSyncRuns).where(eq(fxSyncRuns.status, FxSyncStatus.Running)).limit(1);
    return rows[0] ?? null;
  };

  /**
   * Returns true if a successful sync finished within the last `withinMinutes`
   * minutes (default 30). Used by the idempotency guard (R8).
   */
  export const isRecentSuccess = async (withinMinutes = 30, tx?: DBTransaction): Promise<boolean> => {
    const q = queryDb(tx);
    const rows = await q
      .select({ id: fxSyncRuns.id })
      .from(fxSyncRuns)
      .where(
        sql`${fxSyncRuns.status} = ${FxSyncStatus.Success} AND ${fxSyncRuns.finishedAt} >= NOW() - (${withinMinutes}) * INTERVAL '1 minute'`
      )
      .limit(1);
    return rows.length > 0;
  };
}
