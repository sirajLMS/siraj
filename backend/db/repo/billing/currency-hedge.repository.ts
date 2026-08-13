import { desc, eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { currencyHedges } from "@/backend/db/schema";
import type {
  CurrencyHedgeInsertType,
  CurrencyHedgeSelectType,
  CurrencyHedgeUpdateInput,
  DBTransaction,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

export namespace CurrencyHedgeRepository {
  export async function listAll(tx?: DBTransaction): Promise<CurrencyHedgeSelectType[]> {
    const client = queryDb(tx);
    return client.select().from(currencyHedges).orderBy(desc(currencyHedges.updatedAt));
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<CurrencyHedgeSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client.select().from(currencyHedges).where(eq(currencyHedges.id, id)).limit(1);
    return row ?? null;
  }

  export async function create(
    input: Omit<CurrencyHedgeInsertType, "id">,
    tx?: DBTransaction
  ): Promise<CurrencyHedgeSelectType> {
    const client = tx ?? db;
    const now = new Date();
    const [created] = await client
      .insert(currencyHedges)
      .values({
        ...input,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create currency hedge");
    }

    return created;
  }

  export async function update(
    id: string,
    input: CurrencyHedgeUpdateInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<CurrencyHedgeSelectType> {
    const client = tx ?? db;
    const [updated] = await client
      .update(currencyHedges)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(currencyHedges.id, id))
      .returning();

    if (!updated) {
      throw new Error(tErrors.file.recordNotFound({ tableName: "currency_hedges", entityId: id }));
    }

    return updated;
  }

  export async function deleteById(id: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<boolean> {
    const client = tx ?? db;
    const [deleted] = await client.delete(currencyHedges).where(eq(currencyHedges.id, id)).returning();

    if (!deleted) {
      throw new Error(tErrors.file.recordNotFound({ tableName: "currency_hedges", entityId: id }));
    }

    return true;
  }

  export async function findByCurrencies(
    currencies: readonly CurrencyCode[],
    tx?: DBTransaction
  ): Promise<CurrencyHedgeSelectType[]> {
    if (currencies.length === 0) return [];
    const client = queryDb(tx);
    return client
      .select()
      .from(currencyHedges)
      .where(inArray(currencyHedges.currency, [...currencies]));
  }

  export async function createMany(
    inputs: readonly CurrencyHedgeInsertType[],
    tx?: DBTransaction
  ): Promise<CurrencyHedgeSelectType[]> {
    if (inputs.length === 0) return [];
    const client = tx ?? db;
    const now = new Date();
    return client
      .insert(currencyHedges)
      .values(
        inputs.map(input => ({
          ...input,
          createdAt: input.createdAt ?? now,
          updatedAt: input.updatedAt ?? now,
        }))
      )
      .returning();
  }
}
