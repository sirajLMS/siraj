import { makeBillingRepo, makeBillingUpsertMany } from "@/backend/db/repo/billing/__shared__/billingRepoFactory";
import { supportedOnlineAccounts } from "@/backend/db/schema";
import { IdentifierKind, PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  SupportedOnlineAccountInsertType,
  SupportedOnlineAccountSelectType,
  UpdateSupportedOnlineAccountInput,
} from "@/backend/types/billing/payment-method.types";

type AccountRow = typeof supportedOnlineAccounts.$inferSelect;

const VALID_IDENTIFIER_KINDS = new Set<string>(Object.values(IdentifierKind));
const VALID_PAYMENT_DIRECTIONS = new Set<string>(Object.values(PaymentDirection));

function isSupportedOnlineAccountSelectType(row: AccountRow): row is SupportedOnlineAccountSelectType {
  return VALID_IDENTIFIER_KINDS.has(row.identifierKind) && VALID_PAYMENT_DIRECTIONS.has(row.supportedDirections);
}

function toSelectType(row: AccountRow): SupportedOnlineAccountSelectType {
  if (isSupportedOnlineAccountSelectType(row)) return row;
  throw new Error(`Invalid account row: unsupported identifierKind or supportedDirections`);
}

type ListActiveFilters = {
  readonly direction?: PaymentDirection;
};

const baseRepo = makeBillingRepo<
  AccountRow,
  SupportedOnlineAccountSelectType,
  SupportedOnlineAccountInsertType,
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
    AccountRow,
    SupportedOnlineAccountSelectType,
    SupportedOnlineAccountInsertType
  >({
    table: supportedOnlineAccounts,
    slug: supportedOnlineAccounts.slug,
    toSelectType,
    buildInsert: (input, now) => ({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      identifierKind: input.identifierKind,
      identifierLabel: input.identifierLabel ?? input.name,
      supportedDirections: input.supportedDirections ?? "BOTH",
      logoUrl: input.logoUrl ?? null,
      isActive: input.isActive ?? true,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    }),
    buildConflictSet: (input, now) => ({
      name: input.name,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      identifierKind: input.identifierKind,
      identifierLabel: input.identifierLabel ?? input.name,
      supportedDirections: input.supportedDirections ?? "BOTH",
      logoUrl: input.logoUrl ?? null,
      isActive: input.isActive ?? true,
      updatedAt: now,
    }),
  });
}
