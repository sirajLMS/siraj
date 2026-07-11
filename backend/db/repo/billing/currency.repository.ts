import { asc, eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { supportedCurrencies } from "@/backend/db/schema";
import type { CurrencyCode } from "@/backend/enum";
import type {
  SupportedCurrencyReturnType,
  SupportedCurrencySelectType,
  SupportedCurrencyUpsertInput,
} from "@/backend/types/billing/currency.types";

function toReturnType(row: SupportedCurrencySelectType): SupportedCurrencyReturnType {
  return {
    code: row.code,
    symbol: row.symbol,
    countryCode: row.countryCode as SupportedCurrencyReturnType["countryCode"],
    decimals: row.decimals,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export namespace SupportedCurrencyRepository {
  export async function listAll(tx?: DBTransaction): Promise<SupportedCurrencyReturnType[]> {
    const client = tx ?? db;
    const rows = await client
      .select()
      .from(supportedCurrencies)
      .orderBy(asc(supportedCurrencies.sortOrder), asc(supportedCurrencies.code));
    return rows.map(toReturnType);
  }

  export async function listActive(tx?: DBTransaction): Promise<SupportedCurrencyReturnType[]> {
    const client = tx ?? db;
    const rows = await client
      .select()
      .from(supportedCurrencies)
      .where(eq(supportedCurrencies.isActive, true))
      .orderBy(asc(supportedCurrencies.sortOrder), asc(supportedCurrencies.code));
    return rows.map(toReturnType);
  }

  export async function upsertMany(
    inputs: readonly SupportedCurrencyUpsertInput[],
    tx?: DBTransaction
  ): Promise<SupportedCurrencyReturnType[]> {
    const client = tx ?? db;
    const now = new Date();
    const results: SupportedCurrencyReturnType[] = [];

    for (const [index, input] of inputs.entries()) {
      const [row] = await client
        .insert(supportedCurrencies)
        .values({
          code: input.code,
          symbol: input.symbol,
          countryCode: input.countryCode ?? null,
          decimals: input.decimals ?? null,
          sortOrder: input.sortOrder ?? index,
          isActive: input.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: supportedCurrencies.code,
          set: {
            symbol: input.symbol,
            countryCode: input.countryCode ?? null,
            decimals: input.decimals ?? null,
            sortOrder: input.sortOrder ?? index,
            isActive: input.isActive ?? true,
            updatedAt: now,
          },
        })
        .returning();

      if (row) {
        results.push(toReturnType(row));
      }
    }

    return results;
  }

  export async function getByCode(code: CurrencyCode, tx?: DBTransaction): Promise<SupportedCurrencyReturnType | null> {
    const client = tx ?? db;
    const [row] = await client.select().from(supportedCurrencies).where(eq(supportedCurrencies.code, code)).limit(1);
    return row ? toReturnType(row) : null;
  }
}
