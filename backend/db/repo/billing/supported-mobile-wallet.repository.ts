import { eq, type SQL } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { makeBillingRepo } from "@/backend/db/repo/billing/__shared__/billingRepoFactory";
import { supportedMobileWallets } from "@/backend/db/schema";
import type { CountryCode } from "@/backend/enum";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  SupportedMobileWalletInsertType,
  SupportedMobileWalletSelectType,
  UpdateSupportedMobileWalletInput,
} from "@/backend/types/billing/payment-method.types";

type WalletRow = typeof supportedMobileWallets.$inferSelect;

function isPaymentDirection(value: string): value is PaymentDirection {
  return (Object.values(PaymentDirection) as readonly string[]).includes(value);
}

function toSelectType(row: WalletRow): SupportedMobileWalletSelectType {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    instructions: row.instructions,
    countryCode: row.countryCode,
    currencyCode: row.currencyCode,
    phoneRegion: row.phoneRegion,
    supportedDirections: isPaymentDirection(row.supportedDirections) ? row.supportedDirections : PaymentDirection.BOTH,
    logoUrl: row.logoUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type ListActiveFilters = {
  readonly countryCode?: CountryCode;
  readonly direction?: PaymentDirection;
};

const baseRepo = makeBillingRepo<
  WalletRow,
  SupportedMobileWalletSelectType,
  SupportedMobileWalletInsertType,
  UpdateSupportedMobileWalletInput,
  ListActiveFilters
>({
  shape: {
    table: supportedMobileWallets,
    id: supportedMobileWallets.id,
    slug: supportedMobileWallets.slug,
    isActive: supportedMobileWallets.isActive,
    supportedDirections: supportedMobileWallets.supportedDirections,
  },
  tableName: "supported_mobile_wallets",
  toSelectType,
  deactivateInput: { isActive: false },
  extraActiveFilters: (filters): SQL | undefined => {
    if (!filters.countryCode) return undefined;
    return eq(supportedMobileWallets.countryCode, filters.countryCode);
  },
});

export namespace SupportedMobileWalletRepository {
  export const listAll = baseRepo.listAll;
  export const listActive = baseRepo.listActive;
  export const getById = baseRepo.getById;
  export const getBySlug = baseRepo.getBySlug;
  export const create = baseRepo.create;
  export const update = baseRepo.update;
  export const deactivate = baseRepo.deactivate;
  export const listByIds = baseRepo.listByIds;

  export async function upsertMany(
    inputs: readonly SupportedMobileWalletInsertType[],
    tx?: DBTransaction
  ): Promise<SupportedMobileWalletSelectType[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<SupportedMobileWalletSelectType[]> => {
      const now = new Date();
      const results: SupportedMobileWalletSelectType[] = [];

      const processNext = async (index: number): Promise<void> => {
        if (index >= inputs.length) return;
        const input = inputs[index];
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
        return processNext(index + 1);
      };

      await processNext(0);
      return results;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }
}
