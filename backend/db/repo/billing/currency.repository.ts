import { asc, eq, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import {
  classInstances,
  currencyExchangeAuditLogs,
  currencyExchangeRates,
  currencyHedges,
  invoices,
  parents,
  payments,
  staffProfiles,
  supportedCurrencies,
  supportedMobileWallets,
  teacherDues,
  teacherPayments,
  teachers,
  users,
} from "@/backend/db/schema";
import { CountryCode } from "@/backend/enum";
import type {
  DBTransaction,
  SupportedCurrencyReturnType,
  SupportedCurrencySelectType,
  SupportedCurrencyUpsertInput,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

const COUNTRY_CODE_VALUES = new Set(Object.values(CountryCode) as string[]);

function isCountryCode(value: string | null): value is CountryCode {
  return value !== null && COUNTRY_CODE_VALUES.has(value);
}

function toReturnType(row: SupportedCurrencySelectType): SupportedCurrencyReturnType {
  const countryCode = isCountryCode(row.countryCode) ? row.countryCode : null;
  return {
    code: row.code,
    symbol: row.symbol,
    countryCode,
    decimals: row.decimals,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export namespace SupportedCurrencyRepository {
  export async function listAll(tx?: DBTransaction): Promise<SupportedCurrencyReturnType[]> {
    const client = queryDb(tx);
    const rows = await client
      .select()
      .from(supportedCurrencies)
      .orderBy(asc(supportedCurrencies.sortOrder), asc(supportedCurrencies.code));
    return rows.map(toReturnType);
  }

  export async function listActive(tx?: DBTransaction): Promise<SupportedCurrencyReturnType[]> {
    const client = queryDb(tx);
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

    async function upsertNext(index: number): Promise<void> {
      if (index >= inputs.length) return;
      const input = inputs[index];
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
      return upsertNext(index + 1);
    }

    await upsertNext(0);

    return results;
  }

  /**
   * Soft-deactivate a supported currency by setting `isActive = false`.
   * Caller must guard with {@link isCurrencyInUse} before invoking.
   */
  export async function deactivateByCode(
    code: CurrencyCode,
    tx?: DBTransaction
  ): Promise<SupportedCurrencyReturnType | null> {
    const client = tx ?? db;
    const now = new Date();
    const [row] = await client
      .update(supportedCurrencies)
      .set({ isActive: false, updatedAt: now })
      .where(eq(supportedCurrencies.code, code))
      .returning();
    return row ? toReturnType(row) : null;
  }

  /**
   * Check whether a currency code is referenced by any table that stores
   * currency values. All references use the `currency_code` Postgres enum
   * directly (no FK to `supported_currencies`), so the DB won't block a
   * soft-deactivate — this guard is service-layer only.
   *
   * Returns `true` if **any** of the referencing tables contain the code.
   */
  export async function isCurrencyInUse(code: CurrencyCode, tx?: DBTransaction): Promise<boolean> {
    const client = queryDb(tx);
    const [row] = await client
      .select({ exists: sql<boolean>`1` })
      .from(
        sql`(
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${invoices} WHERE ${invoices.currency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${payments} WHERE ${payments.currency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${currencyExchangeRates} WHERE ${currencyExchangeRates.fromCurrency} = ${code} OR ${currencyExchangeRates.toCurrency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${currencyExchangeAuditLogs} WHERE ${currencyExchangeAuditLogs.fromCurrency} = ${code} OR ${currencyExchangeAuditLogs.toCurrency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${currencyHedges} WHERE ${currencyHedges.currency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${parents} WHERE ${parents.currency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${teachers} WHERE ${teachers.rateCurrency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${staffProfiles} WHERE ${staffProfiles.rateCurrency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${classInstances} WHERE ${classInstances.rateCurrency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${teacherDues} WHERE ${teacherDues.currency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${teacherPayments} WHERE ${teacherPayments.currency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${users} WHERE ${users.displayCurrency} = ${code})
          UNION ALL
          SELECT 1 WHERE EXISTS (SELECT 1 FROM ${supportedMobileWallets} WHERE ${supportedMobileWallets.currencyCode} = ${code})
          LIMIT 1
        ) AS in_use`
      )
      .limit(1);
    return row != null;
  }
}
