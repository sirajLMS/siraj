import { asc, desc, eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { whatsappAccounts } from "@/backend/db/schema";
import type {
  SetWhatsappAccessTokenInput,
  SetWhatsappTwoStepPinInput,
  WhatsappAccountInsertType,
  WhatsappAccountReturnType,
  WhatsappAccountSelectType,
  WhatsappAccountUpdateInput,
} from "@/backend/types/whatsapp/whatsapp-account.types";
import {
  buildReturnType,
  isValidLimitTier,
  isValidQualityRating,
} from "@/backend/types/whatsapp/whatsapp-account.types";

// Re-export the type-guard helpers for backward-compatible imports
// (the webhook handler and other consumers import them from this module).
export { buildReturnType, isValidLimitTier, isValidQualityRating };

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
  return buildReturnType(rest, qualityRating, portfolioMessagingLimitTier);
}

/**
 * Repository for the `whatsapp_accounts` table.
 * Pure data-access only — no business logic or permissions.
 * All methods accept an optional `tx` for transaction propagation.
 */
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
    const q = queryDb(tx);
    const row = await q.select().from(whatsappAccounts).where(eq(whatsappAccounts.id, id)).limit(1);
    return row[0] ? toReturnType(row[0]) : null;
  }

  export async function findByPhoneNumberId(
    phoneNumberId: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    const q = queryDb(tx);
    const row = await q
      .select()
      .from(whatsappAccounts)
      .where(eq(whatsappAccounts.phoneNumberId, phoneNumberId))
      .limit(1);
    return row[0] ? toReturnType(row[0]) : null;
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
    const q = queryDb(tx);
    const rows = await q.select().from(whatsappAccounts).where(eq(whatsappAccounts.wabaId, wabaId));
    return rows.map(toReturnType);
  }

  export async function listActive(tx?: DBTransaction): Promise<WhatsappAccountReturnType[]> {
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(whatsappAccounts)
      .where(eq(whatsappAccounts.isActive, true))
      .orderBy(desc(whatsappAccounts.createdAt));
    return rows.map(toReturnType);
  }

  export async function create(
    input: WhatsappAccountInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t.insert(whatsappAccounts).values(input).returning();
      return row;
    };
    const row = tx ? await runner(tx) : await db.transaction(runner);
    return toReturnType(row);
  }

  export async function update(
    id: string,
    input: WhatsappAccountUpdateInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t.update(whatsappAccounts).set(input).where(eq(whatsappAccounts.id, id)).returning();
      return row ? toReturnType(row) : null;
    };
    return tx ? await runner(tx) : await db.transaction(runner);
  }

  export async function setAccessToken(
    input: SetWhatsappAccessTokenInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .update(whatsappAccounts)
        .set({ encryptedAccessToken: input.encryptedAccessToken })
        .where(eq(whatsappAccounts.id, input.id))
        .returning();
      return row ? toReturnType(row) : null;
    };
    return tx ? await runner(tx) : await db.transaction(runner);
  }

  export async function setTwoStepPin(
    input: SetWhatsappTwoStepPinInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .update(whatsappAccounts)
        .set({ encryptedTwoStepPin: input.encryptedTwoStepPin })
        .where(eq(whatsappAccounts.id, input.id))
        .returning();
      return row ? toReturnType(row) : null;
    };
    return tx ? await runner(tx) : await db.transaction(runner);
  }

  export async function deactivateById(id: string, tx?: DBTransaction): Promise<WhatsappAccountReturnType | null> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .update(whatsappAccounts)
        .set({ isActive: false })
        .where(eq(whatsappAccounts.id, id))
        .returning();
      return row ? toReturnType(row) : null;
    };
    return tx ? await runner(tx) : await db.transaction(runner);
  }
}
