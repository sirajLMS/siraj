import {
  buildCommonConflictFields,
  buildCommonInsertFields,
  makeBillingRepo,
  makeBillingUpsertMany,
} from "@/backend/db/repo/billing/__shared__/billingRepoFactory";
import { supportedOnlineAccounts } from "@/backend/db/schema";
import { IdentifierKind, PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  SupportedOnlineAccountReturnType,
  SupportedOnlineAccountSelectType,
  SupportedOnlineAccountSubmitInput,
  UpdateSupportedOnlineAccountInput,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const VALID_IDENTIFIER_KINDS = new Set<string>(Object.values(IdentifierKind));
const VALID_PAYMENT_DIRECTIONS = new Set<string>(Object.values(PaymentDirection));

function isIdentifierKind(value: string): value is IdentifierKind {
  return VALID_IDENTIFIER_KINDS.has(value);
}

function isPaymentDirection(value: string): value is PaymentDirection {
  return VALID_PAYMENT_DIRECTIONS.has(value);
}

function toSelectType(row: SupportedOnlineAccountSelectType): SupportedOnlineAccountReturnType {
  const { invalidIdentifierKind, invalidSupportedDirections } = getServerTranslations("en").errorsTranslations;
  if (!isIdentifierKind(row.identifierKind)) {
    throw new Error(invalidIdentifierKind(row.identifierKind));
  }
  if (!isPaymentDirection(row.supportedDirections)) {
    throw new Error(invalidSupportedDirections(row.supportedDirections));
  }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    instructions: row.instructions,
    identifierKind: row.identifierKind,
    identifierLabel: row.identifierLabel,
    supportedDirections: row.supportedDirections,
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
  SupportedOnlineAccountSelectType,
  SupportedOnlineAccountReturnType,
  SupportedOnlineAccountSubmitInput,
  UpdateSupportedOnlineAccountInput,
  ListActiveFilters
>({
  shape: {
    table: supportedOnlineAccounts,
    id: supportedOnlineAccounts.id,
    slug: supportedOnlineAccounts.slug,
    isActive: supportedOnlineAccounts.isActive,
    supportedDirections: supportedOnlineAccounts.supportedDirections,
  },
  tableName: "supported_online_accounts",
  toSelectType,
  deactivateInput: { isActive: false },
  prepareInsert: input => ({
    ...input,
    identifierLabel: input.identifierLabel ?? input.name,
  }),
});

export namespace SupportedOnlineAccountRepository {
  export const listAll = baseRepo.listAll;
  export const listActive = baseRepo.listActive;
  export const getById = baseRepo.getById;
  export const getBySlug = baseRepo.getBySlug;
  export const create = baseRepo.create;
  export const update = baseRepo.update;
  export const deactivate = baseRepo.deactivate;
  export const listByIds = baseRepo.listByIds;

  export const upsertMany = makeBillingUpsertMany<
    SupportedOnlineAccountSelectType,
    SupportedOnlineAccountReturnType,
    SupportedOnlineAccountSubmitInput
  >({
    table: supportedOnlineAccounts,
    slug: supportedOnlineAccounts.slug,
    toSelectType,
    buildInsert: (input, now) => ({
      slug: input.slug,
      name: input.name,
      identifierKind: input.identifierKind,
      identifierLabel: input.identifierLabel ?? input.name,
      ...buildCommonInsertFields(input, now),
    }),
    buildConflictSet: (input, now) => ({
      name: input.name,
      identifierKind: input.identifierKind,
      identifierLabel: input.identifierLabel ?? input.name,
      ...buildCommonConflictFields(input, now),
    }),
  });
}
