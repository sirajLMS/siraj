import { eq, type SQL } from "drizzle-orm";
import {
  buildCommonConflictFields,
  buildCommonInsertFields,
  makeBillingRepo,
  makeBillingUpsertMany,
} from "@/backend/db/repo/billing/__shared__/billingRepoFactory";
import { supportedMobileWallets } from "@/backend/db/schema";
import type { CountryCode } from "@/backend/enum";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  SupportedMobileWalletReturnType,
  SupportedMobileWalletSelectType,
  SupportedMobileWalletSubmitInput,
  UpdateSupportedMobileWalletInput,
} from "@/backend/types";

function isPaymentDirection(value: string): value is PaymentDirection {
  return (Object.values(PaymentDirection) as readonly string[]).includes(value);
}

function toSelectType(row: SupportedMobileWalletSelectType): SupportedMobileWalletReturnType {
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
  SupportedMobileWalletSelectType,
  SupportedMobileWalletReturnType,
  SupportedMobileWalletSubmitInput,
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

  export const upsertMany = makeBillingUpsertMany<
    SupportedMobileWalletSelectType,
    SupportedMobileWalletReturnType,
    SupportedMobileWalletSubmitInput
  >({
    table: supportedMobileWallets,
    slug: supportedMobileWallets.slug,
    toSelectType,
    buildInsert: (input, now) => ({
      slug: input.slug,
      name: input.name,
      countryCode: input.countryCode ?? null,
      currencyCode: input.currencyCode ?? null,
      phoneRegion: input.phoneRegion ?? null,
      ...buildCommonInsertFields(input, now),
    }),
    buildConflictSet: (input, now) => ({
      name: input.name,
      countryCode: input.countryCode ?? null,
      currencyCode: input.currencyCode ?? null,
      phoneRegion: input.phoneRegion ?? null,
      ...buildCommonConflictFields(input, now),
    }),
  });
}
