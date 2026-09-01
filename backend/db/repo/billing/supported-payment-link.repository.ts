import {
  buildCommonConflictFields,
  buildCommonInsertFields,
  makeBillingRepo,
  makeBillingUpsertMany,
} from "@/backend/db/repo/billing/__shared__/billingRepoFactory";
import { supportedPaymentLinks } from "@/backend/db/schema";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  SupportedPaymentLinkReturnType,
  SupportedPaymentLinkSelectType,
  SupportedPaymentLinkSubmitInput,
  UpdateSupportedPaymentLinkInput,
} from "@/backend/types";

function isPaymentDirection(value: string): value is PaymentDirection {
  return (Object.values(PaymentDirection) as readonly string[]).includes(value);
}

function toSelectType(row: SupportedPaymentLinkSelectType): SupportedPaymentLinkReturnType {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    instructions: row.instructions,
    urlAllowlist: row.urlAllowlist,
    urlExample: row.urlExample,
    supportedDirections: isPaymentDirection(row.supportedDirections) ? row.supportedDirections : PaymentDirection.BOTH,
    logoUrl: row.logoUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type ListActiveFilters = {
  readonly direction?: PaymentDirection;
};

const baseRepo = makeBillingRepo<
  SupportedPaymentLinkSelectType,
  SupportedPaymentLinkReturnType,
  SupportedPaymentLinkSubmitInput,
  UpdateSupportedPaymentLinkInput,
  ListActiveFilters
>({
  shape: {
    table: supportedPaymentLinks,
    id: supportedPaymentLinks.id,
    slug: supportedPaymentLinks.slug,
    isActive: supportedPaymentLinks.isActive,
    supportedDirections: supportedPaymentLinks.supportedDirections,
  },
  tableName: "supported_payment_links",
  toSelectType,
  deactivateInput: { isActive: false },
});

export namespace SupportedPaymentLinkRepository {
  export const listAll = baseRepo.listAll;
  export const listActive = baseRepo.listActive;
  export const getById = baseRepo.getById;
  export const getBySlug = baseRepo.getBySlug;
  export const create = baseRepo.create;
  export const update = baseRepo.update;
  export const deactivate = baseRepo.deactivate;

  export const upsertMany = makeBillingUpsertMany<
    SupportedPaymentLinkSelectType,
    SupportedPaymentLinkReturnType,
    SupportedPaymentLinkSubmitInput
  >({
    table: supportedPaymentLinks,
    slug: supportedPaymentLinks.slug,
    toSelectType,
    buildInsert: (input, now) => ({
      slug: input.slug,
      name: input.name,
      urlAllowlist: input.urlAllowlist,
      urlExample: input.urlExample ?? null,
      ...buildCommonInsertFields(input, now),
    }),
    buildConflictSet: (input, now) => ({
      name: input.name,
      urlAllowlist: input.urlAllowlist,
      urlExample: input.urlExample ?? null,
      ...buildCommonConflictFields(input, now),
    }),
  });
}
