import { asc, desc, eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { whatsappAccounts } from "@/backend/db/schema";
import type { DBTransaction } from "@/backend/types";
import type {
  SetWhatsappAccessTokenInput,
  SetWhatsappTwoStepPinInput,
  WhatsappAccountInsertType,
  WhatsappAccountReturnType,
  WhatsappAccountSelectType,
  WhatsappAccountUpdateInput,
} from "@/backend/types/whatsapp/whatsapp-account.types";
import { buildReturnType as _buildReturnType } from "@/backend/types/whatsapp/whatsapp-account.types";

// Re-export the type-guard helpers and buildReturnType for backward-compatible imports
// (the webhook handler and other consumers import them from this module).
export {
  buildReturnType,
  isValidLimitTier,
  isValidQualityRating,
} from "@/backend/types/whatsapp/whatsapp-account.types";

/**
 * Convert a SelectType row (with encrypted fields and raw enum strings)
 * to ReturnType (sanitized for GraphQL clients).
 * Used by service layer when it needs to return a full entity from a SelectType source.
 */
export function toReturnType(row: WhatsappAccountSelectType): WhatsappAccountReturnType {
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
 * Helper to find a single row matching a where clause and map it to ReturnType.
 */
async function findSingleRow(
  whereClause: ReturnType<typeof eq>,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  const q = queryDb(tx);
  const rows = await q.select().from(whatsappAccounts).where(whereClause).limit(1);
  return rows[0] ? toReturnType(rows[0]) : null;
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

  export async function findByPhoneNumberId(
    phoneNumberId: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return findSingleRow(eq(whatsappAccounts.phoneNumberId, phoneNumberId), tx);
  }

  /**
   * Returns the first active WhatsApp account ordered by `createdAt` (r11-r01).
   *
   * Returns the raw `SelectType` — **includes decrypted `encryptedAccessToken`**.
   * Only suitable for service-layer credential resolution that needs the token;
   * never expose the return value to GraphQL clients. See `toReturnType` for why.
   */
  export async function findFirstActiveForCredentials(tx?: DBTransaction): Promise<WhatsappAccountSelectType | null> {
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(whatsappAccounts)
      .where(eq(whatsappAccounts.isActive, true))
      .orderBy(asc(whatsappAccounts.createdAt))
      .limit(1);
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

  export async function findByWabaId(wabaId: string, tx?: DBTransaction): Promise<WhatsappAccountReturnType[]> {
    return findManyRows(eq(whatsappAccounts.wabaId, wabaId), tx);
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
    return runWithTx(t => updateAndReturn(t, id, input), tx);
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
    return runWithTx(t => updateAndReturn(t, id, { isActive: false }), tx);
  }
}
