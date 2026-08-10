import { and, eq, inArray, or } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { supportedPaymentLinks } from "@/backend/db/schema";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type {
  SupportedPaymentLinkInsertType,
  SupportedPaymentLinkSelectType,
  UpdateSupportedPaymentLinkInput,
} from "@/backend/types/billing/payment-method.types";
import type { ErrorsLabels } from "@/shared/locale";

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
    supportedDirections: isPaymentDirection(row.supportedDirections)
      ? row.supportedDirections
      : PaymentDirection.BOTH,
    logoUrl: row.logoUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type ListActiveFilters = {
  readonly direction?: PaymentDirection;
};

function directionFilter(direction?: PaymentDirection) {
  if (!direction) return undefined;
  return or(
    eq(supportedPaymentLinks.supportedDirections, direction),
    eq(supportedPaymentLinks.supportedDirections, "BOTH")
  );
}

export namespace SupportedPaymentLinkRepository {
  export async function listAll(tx?: DBTransaction): Promise<SupportedPaymentLinkSelectType[]> {
    const client = queryDb(tx);
    return client
      .select()
      .from(supportedPaymentLinks)
      .orderBy(supportedPaymentLinks.slug)
      .then(rows => rows.map(toSelectType));
  }

  export async function listActive(
    filters: ListActiveFilters = {},
    tx?: DBTransaction
  ): Promise<SupportedPaymentLinkSelectType[]> {
    const client = queryDb(tx);
    const conditions = [eq(supportedPaymentLinks.isActive, true), directionFilter(filters.direction)].filter(Boolean);

    return client
      .select()
      .from(supportedPaymentLinks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(supportedPaymentLinks.slug)
      .then(rows => rows.map(toSelectType));
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<SupportedPaymentLinkSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client.select().from(supportedPaymentLinks).where(eq(supportedPaymentLinks.id, id)).limit(1);
    return row ? toSelectType(row) : null;
  }

  export async function getBySlug(slug: string, tx?: DBTransaction): Promise<SupportedPaymentLinkSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client
      .select()
      .from(supportedPaymentLinks)
      .where(eq(supportedPaymentLinks.slug, slug))
      .limit(1);
    return row ? toSelectType(row) : null;
  }

  export async function create(
    input: SupportedPaymentLinkInsertType,
    tx?: DBTransaction
  ): Promise<SupportedPaymentLinkSelectType> {
    const client = tx ?? db;
    const now = new Date();
    const [created] = await client
      .insert(supportedPaymentLinks)
      .values({
        ...input,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create supported payment link");
    }

    return toSelectType(created);
  }

  export async function update(
    id: string,
    input: UpdateSupportedPaymentLinkInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<SupportedPaymentLinkSelectType> {
    const client = tx ?? db;
    const [updated] = await client
      .update(supportedPaymentLinks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(supportedPaymentLinks.id, id))
      .returning();

    if (!updated) {
      throw new Error(tErrors.file.recordNotFound({ tableName: "supported_payment_links", entityId: id }));
    }

    return toSelectType(updated);
  }

  export async function deactivate(
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<SupportedPaymentLinkSelectType> {
    return update(id, { isActive: false }, tErrors, tx);
  }

  export async function listByIds(
    ids: readonly string[],
    tx?: DBTransaction
  ): Promise<SupportedPaymentLinkSelectType[]> {
    if (ids.length === 0) return [];
    const client = queryDb(tx);
    return client
      .select()
      .from(supportedPaymentLinks)
      .where(inArray(supportedPaymentLinks.id, [...ids]))
      .then(rows => rows.map(toSelectType));
  }

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
