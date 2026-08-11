import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { makeBillingRepo } from "@/backend/db/repo/billing/__shared__/billingRepoFactory";
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

  export async function upsertMany(
    inputs: readonly SupportedOnlineAccountInsertType[],
    tx?: DBTransaction
  ): Promise<SupportedOnlineAccountSelectType[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<SupportedOnlineAccountSelectType[]> => {
      const now = new Date();

      const upsertOne = async (
        input: SupportedOnlineAccountInsertType
      ): Promise<SupportedOnlineAccountSelectType | null> => {
        const [row] = await t
          .insert(supportedOnlineAccounts)
          .values({
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
          })
          .onConflictDoUpdate({
            target: supportedOnlineAccounts.slug,
            set: {
              name: input.name,
              description: input.description ?? null,
              instructions: input.instructions ?? null,
              identifierKind: input.identifierKind,
              identifierLabel: input.identifierLabel ?? input.name,
              supportedDirections: input.supportedDirections ?? "BOTH",
              logoUrl: input.logoUrl ?? null,
              isActive: input.isActive ?? true,
              updatedAt: now,
            },
          })
          .returning();

        return row ? toSelectType(row) : null;
      };

      const upsertNext = async (
        index: number,
        acc: SupportedOnlineAccountSelectType[]
      ): Promise<SupportedOnlineAccountSelectType[]> => {
        if (index >= inputs.length) return acc;
        const result = await upsertOne(inputs[index]);
        if (result) acc.push(result);
        return upsertNext(index + 1, acc);
      };

      return upsertNext(0, []);
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }
}
