import { and, eq, inArray, or } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { supportedMobileWallets } from "@/backend/db/schema";
import type { CountryCode } from "@/backend/enum";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import type {
  SupportedMobileWalletInsertType,
  SupportedMobileWalletSelectType,
  UpdateSupportedMobileWalletInput,
} from "@/backend/types/billing/payment-method.types";

type WalletRow = typeof supportedMobileWallets.$inferSelect;

function toSelectType(row: WalletRow): SupportedMobileWalletSelectType {
  return row as SupportedMobileWalletSelectType;
}

type ListActiveFilters = {
  readonly countryCode?: CountryCode;
  readonly direction?: PaymentDirection;
};

function directionFilter(direction?: PaymentDirection) {
  if (!direction) return undefined;
  return or(
    eq(supportedMobileWallets.supportedDirections, direction),
    eq(supportedMobileWallets.supportedDirections, "BOTH")
  );
}

export namespace SupportedMobileWalletRepository {
  export async function listAll(tx?: DBTransaction): Promise<SupportedMobileWalletSelectType[]> {
    const client = tx ?? db;
    return client
      .select()
      .from(supportedMobileWallets)
      .orderBy(supportedMobileWallets.slug)
      .then(rows => rows.map(toSelectType));
  }

  export async function listActive(
    filters: ListActiveFilters = {},
    tx?: DBTransaction
  ): Promise<SupportedMobileWalletSelectType[]> {
    const client = tx ?? db;
    const conditions = [
      eq(supportedMobileWallets.isActive, true),
      filters.countryCode ? eq(supportedMobileWallets.countryCode, filters.countryCode) : undefined,
      directionFilter(filters.direction),
    ].filter(Boolean);

    return client
      .select()
      .from(supportedMobileWallets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(supportedMobileWallets.slug)
      .then(rows => rows.map(toSelectType));
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<SupportedMobileWalletSelectType | null> {
    const client = tx ?? db;
    const [row] = await client.select().from(supportedMobileWallets).where(eq(supportedMobileWallets.id, id)).limit(1);
    return row ? toSelectType(row) : null;
  }

  export async function getBySlug(slug: string, tx?: DBTransaction): Promise<SupportedMobileWalletSelectType | null> {
    const client = tx ?? db;
    const [row] = await client
      .select()
      .from(supportedMobileWallets)
      .where(eq(supportedMobileWallets.slug, slug))
      .limit(1);
    return row ? toSelectType(row) : null;
  }

  export async function create(
    input: SupportedMobileWalletInsertType,
    tx?: DBTransaction
  ): Promise<SupportedMobileWalletSelectType> {
    const client = tx ?? db;
    const now = new Date();
    const [created] = await client
      .insert(supportedMobileWallets)
      .values({
        ...input,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create supported mobile wallet");
    }

    return toSelectType(created);
  }

  export async function update(
    id: string,
    input: UpdateSupportedMobileWalletInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<SupportedMobileWalletSelectType> {
    const client = tx ?? db;
    const [updated] = await client
      .update(supportedMobileWallets)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(supportedMobileWallets.id, id))
      .returning();

    if (!updated) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("recordNotFound", { tableName: "supported_mobile_wallets", entityId: id }));
    }

    return toSelectType(updated);
  }

  export async function deactivate(
    id: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<SupportedMobileWalletSelectType> {
    return update(id, { isActive: false }, tx, locale);
  }

  export async function listByIds(
    ids: readonly string[],
    tx?: DBTransaction
  ): Promise<SupportedMobileWalletSelectType[]> {
    if (ids.length === 0) return [];
    const client = tx ?? db;
    return client
      .select()
      .from(supportedMobileWallets)
      .where(inArray(supportedMobileWallets.id, [...ids]))
      .then(rows => rows.map(toSelectType));
  }

  export async function upsertMany(
    inputs: readonly SupportedMobileWalletInsertType[],
    tx?: DBTransaction
  ): Promise<SupportedMobileWalletSelectType[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<SupportedMobileWalletSelectType[]> => {
      const now = new Date();
      const results: SupportedMobileWalletSelectType[] = [];

      for (const input of inputs) {
        const [row] = await t
          .insert(supportedMobileWallets)
          .values({
            slug: input.slug,
            name: input.name,
            description: input.description ?? null,
            instructions: input.instructions ?? null,
            countryCode: input.countryCode ?? null,
            currencyCode: input.currencyCode ?? null,
            phoneRegion: input.phoneRegion ?? null,
            supportedDirections: input.supportedDirections ?? "BOTH",
            logoUrl: input.logoUrl ?? null,
            isActive: input.isActive ?? true,
            createdAt: input.createdAt ?? now,
            updatedAt: input.updatedAt ?? now,
          })
          .onConflictDoUpdate({
            target: supportedMobileWallets.slug,
            set: {
              name: input.name,
              description: input.description ?? null,
              instructions: input.instructions ?? null,
              countryCode: input.countryCode ?? null,
              currencyCode: input.currencyCode ?? null,
              phoneRegion: input.phoneRegion ?? null,
              supportedDirections: input.supportedDirections ?? "BOTH",
              logoUrl: input.logoUrl ?? null,
              isActive: input.isActive ?? true,
              updatedAt: now,
            },
          })
          .returning();

        if (row) {
          results.push(toSelectType(row));
        }
      }

      return results;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }
}
