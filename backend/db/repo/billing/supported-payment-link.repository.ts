import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { makeBillingRepo } from "@/backend/db/repo/billing/__shared__/billingRepoFactory";
import { supportedPaymentLinks } from "@/backend/db/schema";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  SupportedPaymentLinkInsertType,
  SupportedPaymentLinkSelectType,
  UpdateSupportedPaymentLinkInput,
} from "@/backend/types/billing/payment-method.types";

type LinkRow = typeof supportedPaymentLinks.$inferSelect;

function isPaymentDirection(value: string): value is PaymentDirection {
  return (Object.values(PaymentDirection) as readonly string[]).includes(value);
}

function toSelectType(row: LinkRow): SupportedPaymentLinkSelectType {
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
  LinkRow,
  SupportedPaymentLinkSelectType,
  SupportedPaymentLinkInsertType,
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
  export const listByIds = baseRepo.listByIds;

  export async function upsertMany(
    inputs: readonly SupportedPaymentLinkInsertType[],
    tx?: DBTransaction
  ): Promise<SupportedPaymentLinkSelectType[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<SupportedPaymentLinkSelectType[]> => {
      const now = new Date();
      const results: SupportedPaymentLinkSelectType[] = [];

      const processNext = async (index: number): Promise<void> => {
        if (index >= inputs.length) return;
        const input = inputs[index];
        const [row] = await t
          .insert(supportedPaymentLinks)
          .values({
            slug: input.slug,
            name: input.name,
            description: input.description ?? null,
            instructions: input.instructions ?? null,
            urlAllowlist: input.urlAllowlist,
            urlExample: input.urlExample ?? null,
            supportedDirections: input.supportedDirections ?? "BOTH",
            logoUrl: input.logoUrl ?? null,
            isActive: input.isActive ?? true,
            createdAt: input.createdAt ?? now,
            updatedAt: input.updatedAt ?? now,
          })
          .onConflictDoUpdate({
            target: supportedPaymentLinks.slug,
            set: {
              name: input.name,
              description: input.description ?? null,
              instructions: input.instructions ?? null,
              urlAllowlist: input.urlAllowlist,
              urlExample: input.urlExample ?? null,
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
