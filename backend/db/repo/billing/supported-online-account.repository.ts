import { and, eq, inArray, or } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { supportedOnlineAccounts } from "@/backend/db/schema";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  SupportedOnlineAccountInsertType,
  SupportedOnlineAccountSelectType,
  UpdateSupportedOnlineAccountInput,
} from "@/backend/types/billing/payment-method.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

type AccountRow = typeof supportedOnlineAccounts.$inferSelect;

function toSelectType(row: AccountRow): SupportedOnlineAccountSelectType {
  return row as SupportedOnlineAccountSelectType;
}

type ListActiveFilters = {
  readonly direction?: PaymentDirection;
};

function directionFilter(direction?: PaymentDirection) {
  if (!direction) return undefined;
  return or(
    eq(supportedOnlineAccounts.supportedDirections, direction),
    eq(supportedOnlineAccounts.supportedDirections, "BOTH")
  );
}

export namespace SupportedOnlineAccountRepository {
  export async function listAll(tx?: DBTransaction): Promise<SupportedOnlineAccountSelectType[]> {
    const client = tx ?? db;
    return client
      .select()
      .from(supportedOnlineAccounts)
      .orderBy(supportedOnlineAccounts.slug)
      .then(rows => rows.map(toSelectType));
  }

  export async function listActive(
    filters: ListActiveFilters = {},
    tx?: DBTransaction
  ): Promise<SupportedOnlineAccountSelectType[]> {
    const client = tx ?? db;
    const conditions = [eq(supportedOnlineAccounts.isActive, true), directionFilter(filters.direction)].filter(Boolean);

    return client
      .select()
      .from(supportedOnlineAccounts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(supportedOnlineAccounts.slug)
      .then(rows => rows.map(toSelectType));
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<SupportedOnlineAccountSelectType | null> {
    const client = tx ?? db;
    const [row] = await client
      .select()
      .from(supportedOnlineAccounts)
      .where(eq(supportedOnlineAccounts.id, id))
      .limit(1);
    return row ? toSelectType(row) : null;
  }

  export async function getBySlug(slug: string, tx?: DBTransaction): Promise<SupportedOnlineAccountSelectType | null> {
    const client = tx ?? db;
    const [row] = await client
      .select()
      .from(supportedOnlineAccounts)
      .where(eq(supportedOnlineAccounts.slug, slug))
      .limit(1);
    return row ? toSelectType(row) : null;
  }

  export async function create(
    input: SupportedOnlineAccountInsertType,
    tx?: DBTransaction
  ): Promise<SupportedOnlineAccountSelectType> {
    const client = tx ?? db;
    const now = new Date();
    const [created] = await client
      .insert(supportedOnlineAccounts)
      .values({
        ...input,
        identifierLabel: input.identifierLabel ?? input.name,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create supported online account");
    }

    return toSelectType(created);
  }

  export async function update(
    id: string,
    input: UpdateSupportedOnlineAccountInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<SupportedOnlineAccountSelectType> {
    const client = tx ?? db;
    const [updated] = await client
      .update(supportedOnlineAccounts)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(supportedOnlineAccounts.id, id))
      .returning();

    if (!updated) {
      throw new Error(tErrors.file.recordNotFound({ tableName: "supported_online_accounts", entityId: id }));
    }

    return toSelectType(updated);
  }

  export async function deactivate(
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<SupportedOnlineAccountSelectType> {
    return update(id, { isActive: false }, tErrors, tx);
  }

  export async function listByIds(
    ids: readonly string[],
    tx?: DBTransaction
  ): Promise<SupportedOnlineAccountSelectType[]> {
    if (ids.length === 0) return [];
    const client = tx ?? db;
    return client
      .select()
      .from(supportedOnlineAccounts)
      .where(inArray(supportedOnlineAccounts.id, [...ids]))
      .then(rows => rows.map(toSelectType));
  }

  export async function upsertMany(
    inputs: readonly SupportedOnlineAccountInsertType[],
    tx?: DBTransaction
  ): Promise<SupportedOnlineAccountSelectType[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<SupportedOnlineAccountSelectType[]> => {
      const now = new Date();
      const results: SupportedOnlineAccountSelectType[] = [];

      for (const input of inputs) {
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
