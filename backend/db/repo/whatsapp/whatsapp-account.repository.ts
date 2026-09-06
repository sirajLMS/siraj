import { and, asc, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { whatsappAccounts } from "@/backend/db/schema";
import { WhatsappAccountPurpose, WhatsappSyncStatus } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { buildReturnType as _buildReturnType } from "@/backend/lib";
import type {
  DBTransaction,
  SetWhatsappAccessTokenInput,
  SetWhatsappTwoStepPinInput,
  WhatsappAccountInsertType,
  WhatsappAccountReturnType,
  WhatsappAccountSelectType,
  WhatsappAccountUpdateInput,
} from "@/backend/types";

/**
 * Convert a SelectType row (with encrypted fields and raw enum strings)
 * to ReturnType (sanitized for GraphQL clients).
 * Used by service layer when it needs to return a full entity from a SelectType source.
 */
function toReturnType(row: WhatsappAccountSelectType): WhatsappAccountReturnType {
  const {
    encryptedAccessToken: _at,
    encryptedTwoStepPin: _pin,
    qualityRating,
    portfolioMessagingLimitTier,
    ...rest
  } = row;
  return _buildReturnType(rest, qualityRating, portfolioMessagingLimitTier);
}

/**
 * Repository for the `whatsapp_accounts` table.
 * Pure data-access only — no business logic or permissions.
 * All methods accept an optional `tx` for transaction propagation.
 */
/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 * When `tx` is provided, the runner executes in the caller's transaction;
 * otherwise a new top-level transaction is created.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/**
 * Executes a conditional update — sets a single column, filters by id, and
 * returns the updated row mapped to `ReturnType` (or `null` if not found).
 */
async function updateAndReturn(
  t: DBTransaction,
  id: string,
  setClause: Partial<WhatsappAccountUpdateInput>
): Promise<WhatsappAccountReturnType | null> {
  const [row] = await t.update(whatsappAccounts).set(setClause).where(eq(whatsappAccounts.id, id)).returning();
  return row ? toReturnType(row) : null;
}

/**
 * Helper to find a single raw row matching a where clause (no mapping).
 */
async function findRawRow(
  whereClause: ReturnType<typeof eq>,
  tx?: DBTransaction
): Promise<WhatsappAccountSelectType | null> {
  const q = queryDb(tx);
  const rows = await q.select().from(whatsappAccounts).where(whereClause).limit(1);
  return rows[0] ?? null;
}

/**
 * Helper to find a single row matching a where clause and map it to ReturnType.
 */
async function findSingleRow(
  whereClause: ReturnType<typeof eq>,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  const row = await findRawRow(whereClause, tx);
  return row ? toReturnType(row) : null;
}

/**
 * Wraps `updateAndReturn` in a transaction: the shared engine for the
 * id-targeted mutators (deactivate, sync lifecycle, offboard/reconnect).
 */
function mutateById(
  id: string,
  patch: WhatsappAccountUpdateInput,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  return runWithTx(t => updateAndReturn(t, id, patch), tx);
}

/**
 * First active account (oldest first), optionally narrowed by an extra
 * condition (e.g. routing purpose). Raw SelectType for credential resolution.
 */
async function findFirstActive(
  extraCondition: SQL | undefined,
  tx?: DBTransaction
): Promise<WhatsappAccountSelectType | null> {
  const q = queryDb(tx);
  const rows = await q
    .select()
    .from(whatsappAccounts)
    .where(and(eq(whatsappAccounts.isActive, true), extraCondition))
    .orderBy(asc(whatsappAccounts.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Helper for update operations that return the updated row (or null).
 */
async function updateById(
  id: string,
  setClause: Record<string, unknown>,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  const runner = async (t: DBTransaction) => {
    const [row] = await t.update(whatsappAccounts).set(setClause).where(eq(whatsappAccounts.id, id)).returning();
    return row ? toReturnType(row) : null;
  };
  return runWithTx(runner, tx);
}

/**
 * Helper to query multiple rows with a where clause and map to ReturnType array.
 */
async function findManyRows(
  whereClause: ReturnType<typeof eq>,
  tx?: DBTransaction,
  orderByClause?: ReturnType<typeof asc>
): Promise<WhatsappAccountReturnType[]> {
  const q = queryDb(tx);
  const rows = orderByClause
    ? await q.select().from(whatsappAccounts).where(whereClause).orderBy(orderByClause)
    : await q.select().from(whatsappAccounts).where(whereClause);
  return rows.map(toReturnType);
}

export namespace WhatsappAccountRepository {
  /**
   * Maps a raw select row to the ReturnType by stripping encrypted columns.
   * The `encryptedText` custom type auto-decrypts at the driver boundary,
   * so `SelectType` contains plaintext — we must never return it directly.
   * Coerces varchar columns `quality_rating` / `portfolio_messaging_limit_tier`
   * to their enum types via the shared `coerceQualityRating` / `coerceLimitTier`
   * helpers (defined in the types file).
   */
  export async function findById(id: string, tx?: DBTransaction): Promise<WhatsappAccountReturnType | null> {
    return findSingleRow(eq(whatsappAccounts.id, id), tx);
  }

  /**
   * Raw single-account lookup by primary key.
   *
   * Returns the raw `SelectType` — **includes the decrypted access token**
   * (the `encryptedText` custom type auto-decrypts at the driver boundary).
   * For service-layer credential resolution only; never expose the return
   * value to GraphQL clients.
   */
  export async function findRawById(id: string, tx?: DBTransaction): Promise<WhatsappAccountSelectType | null> {
    return findRawRow(eq(whatsappAccounts.id, id), tx);
  }

  export async function findByPhoneNumberId(
    phoneNumberId: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return findSingleRow(eq(whatsappAccounts.phoneNumberId, phoneNumberId), tx);
  }

  /**
   * Returns the first active WhatsApp account ordered by `createdAt`.
   *
   * Returns the raw `SelectType` — **includes decrypted `encryptedAccessToken`**.
   * Only suitable for service-layer credential resolution that needs the token;
   * never expose the return value to GraphQL clients. See `toReturnType` for why.
   * Legacy single-account fallback retained until purpose resolution is live.
   */
  export async function findFirstActiveForCredentials(tx?: DBTransaction): Promise<WhatsappAccountSelectType | null> {
    return findFirstActive(undefined, tx);
  }

  /**
   * Resolve the first active account of a routing purpose, oldest first —
   * the send-path account resolver mirroring `findFirstActiveForCredentials`.
   *
   * Returns the raw `SelectType` (includes the decrypted access token): for
   * service-layer credential resolution only, never for GraphQL clients.
   */
  export async function findActiveByPurpose(
    purpose: WhatsappAccountPurpose,
    tx?: DBTransaction
  ): Promise<WhatsappAccountSelectType | null> {
    return findFirstActive(eq(whatsappAccounts.purpose, purpose), tx);
  }

  /**
   * The GENERAL-purpose fallback account used when no purpose-specific
   * account is configured. Same credential caveat as `findActiveByPurpose`.
   */
  export async function findActiveGeneral(tx?: DBTransaction): Promise<WhatsappAccountSelectType | null> {
    return findActiveByPurpose(WhatsappAccountPurpose.GENERAL, tx);
  }

  /**
   * Raw credential-bearing lookup by account id. Returns the row as-is
   * (raw `SelectType` with the decrypted access token) regardless of
   * `isActive` / `offboardedAt` so the channel layer can distinguish
   * "missing or inactive" from "offboarded" for fail-fast behavior.
   * Service-layer credential resolution only — never expose to GraphQL clients.
   */
  export async function findCredentialsById(id: string, tx?: DBTransaction): Promise<WhatsappAccountSelectType | null> {
    const q = queryDb(tx);
    const rows = await q.select().from(whatsappAccounts).where(eq(whatsappAccounts.id, id)).limit(1);
    return rows[0] ?? null;
  }

  /**
   * Batch lookup by phone-number IDs — single query with `inArray`.
   * Pre-initializes the map with all requested keys mapped to `null`.
   * Use this instead of multiple `findByPhoneNumberId` calls to reduce
   * round-trips when syncing multiple phone numbers.
   */
  export async function findByPhoneNumberIds(
    phoneNumberIds: string[],
    tx?: DBTransaction
  ): Promise<Map<string, WhatsappAccountReturnType | null>> {
    const result = new Map<string, WhatsappAccountReturnType | null>();
    for (const id of phoneNumberIds) {
      result.set(id, null);
    }
    if (phoneNumberIds.length === 0) {
      return result;
    }
    const q = queryDb(tx);
    const rows = await q.select().from(whatsappAccounts).where(inArray(whatsappAccounts.phoneNumberId, phoneNumberIds));
    for (const row of rows) {
      result.set(row.phoneNumberId, toReturnType(row));
    }
    return result;
  }

  /**
   * All accounts under one WABA, regardless of `isActive`. `account_update`
   * lifecycle webhooks are WABA-scoped (`phone_number`/`waba_id`, no
   * `phone_number_id`), and reconnect events must still find accounts that a
   * prior offboard deactivated — hence no active-only filter.
   */
  export async function findByWabaId(wabaId: string, tx?: DBTransaction): Promise<WhatsappAccountReturnType[]> {
    return findManyRows(eq(whatsappAccounts.wabaId, wabaId), tx, asc(whatsappAccounts.createdAt));
  }

  export async function listActive(tx?: DBTransaction): Promise<WhatsappAccountReturnType[]> {
    return findManyRows(eq(whatsappAccounts.isActive, true), tx, desc(whatsappAccounts.createdAt));
  }

  export async function create(
    input: WhatsappAccountInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t.insert(whatsappAccounts).values(input).returning();
      return row;
    };
    const row = await runWithTx(runner, tx);
    return toReturnType(row);
  }

  export async function update(
    id: string,
    input: WhatsappAccountUpdateInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return mutateById(id, input, tx);
  }

  export async function setAccessToken(
    input: SetWhatsappAccessTokenInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return updateById(input.id, { encryptedAccessToken: input.encryptedAccessToken }, tx);
  }

  export async function setTwoStepPin(
    input: SetWhatsappTwoStepPinInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return updateById(input.id, { encryptedTwoStepPin: input.encryptedTwoStepPin }, tx);
  }

  export async function deactivateById(id: string, tx?: DBTransaction): Promise<WhatsappAccountReturnType | null> {
    return mutateById(id, { isActive: false }, tx);
  }

  /**
   * The one-shot coexistence sync was accepted by Meta: flip to REQUESTED and
   * stamp the 24-hour deadline.
   */
  export async function markSyncRequested(
    id: string,
    deadlineAt: Date,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return mutateById(id, { syncStatus: WhatsappSyncStatus.REQUESTED, syncDeadlineAt: deadlineAt }, tx);
  }

  /**
   * Advance the sync progress counters while history/state chunks stream in.
   */
  export async function markSyncProgress(
    id: string,
    progress: { phase?: number; progress: number },
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return mutateById(
      id,
      {
        syncStatus: WhatsappSyncStatus.SYNCING,
        syncProgress: progress.progress,
        ...(progress.phase === undefined ? {} : { syncPhase: progress.phase }),
      },
      tx
    );
  }

  /** Sync completed: terminal COMPLETE state at 100% progress. */
  export async function markSyncComplete(id: string, tx?: DBTransaction): Promise<WhatsappAccountReturnType | null> {
    return mutateById(id, { syncStatus: WhatsappSyncStatus.COMPLETE, syncProgress: 100 }, tx);
  }

  /** Sync terminally failed (decline / deadline / offboard), with reason. */
  export async function markSyncFailed(
    id: string,
    failureReason: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return mutateById(id, { syncStatus: WhatsappSyncStatus.FAILED, syncFailureReason: failureReason }, tx);
  }

  /**
   * Meta offboarded the number (`account_update`): stamp the timestamp and
   * deactivate the account so the send path fails fast.
   */
  export async function markOffboarded(
    id: string,
    offboardedAt: Date,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return mutateById(id, { offboardedAt, isActive: false }, tx);
  }

  /** Reconnect clears the offboard marker and re-activates the account. */
  export async function clearOffboarded(id: string, tx?: DBTransaction): Promise<WhatsappAccountReturnType | null> {
    return mutateById(id, { offboardedAt: null, isActive: true }, tx);
  }
}
