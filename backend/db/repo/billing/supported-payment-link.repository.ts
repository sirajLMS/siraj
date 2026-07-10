import { and, eq, inArray, or } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { supportedPaymentLinks } from "@/backend/db/schema";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import type {
  SupportedPaymentLinkInsertType,
  SupportedPaymentLinkSelectType,
  UpdateSupportedPaymentLinkInput,
} from "@/backend/types/billing/payment-method.types";

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
    const client = tx ?? db;
    return client.select().from(supportedPaymentLinks).orderBy(supportedPaymentLinks.slug);
  }

  export async function listActive(
    filters: ListActiveFilters = {},
    tx?: DBTransaction
  ): Promise<SupportedPaymentLinkSelectType[]> {
    const client = tx ?? db;
    const conditions = [eq(supportedPaymentLinks.isActive, true), directionFilter(filters.direction)].filter(Boolean);

    return client
      .select()
      .from(supportedPaymentLinks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(supportedPaymentLinks.slug);
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<SupportedPaymentLinkSelectType | null> {
    const client = tx ?? db;
    const [row] = await client.select().from(supportedPaymentLinks).where(eq(supportedPaymentLinks.id, id)).limit(1);
    return row ?? null;
  }

  export async function getBySlug(slug: string, tx?: DBTransaction): Promise<SupportedPaymentLinkSelectType | null> {
    const client = tx ?? db;
    const [row] = await client
      .select()
      .from(supportedPaymentLinks)
      .where(eq(supportedPaymentLinks.slug, slug))
      .limit(1);
    return row ?? null;
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

    return created;
  }

  export async function update(
    id: string,
    input: UpdateSupportedPaymentLinkInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<SupportedPaymentLinkSelectType> {
    const client = tx ?? db;
    const [updated] = await client
      .update(supportedPaymentLinks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(supportedPaymentLinks.id, id))
      .returning();

    if (!updated) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("recordNotFound", { tableName: "supported_payment_links", entityId: id }));
    }

    return updated;
  }

  export async function deactivate(id: string, tx?: DBTransaction, locale?: string): Promise<SupportedPaymentLinkSelectType> {
    return update(id, { isActive: false }, tx, locale);
  }

  export async function listByIds(ids: readonly string[], tx?: DBTransaction): Promise<SupportedPaymentLinkSelectType[]> {
    if (ids.length === 0) return [];
    const client = tx ?? db;
    return client.select().from(supportedPaymentLinks).where(inArray(supportedPaymentLinks.id, [...ids]));
  }
}
