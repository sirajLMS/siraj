import type { SQL } from "drizzle-orm";
import { and, desc, eq } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { siteContent } from "@/backend/db/schema/storage/site-content";
import type { DBTransaction, SiteContentSelectType, SiteContentUpsertInput } from "@/backend/types";

export namespace SiteContentRepository {
  export async function findBySlug(slug: string, tx?: DBTransaction): Promise<SiteContentSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(siteContent).where(eq(siteContent.slug, slug)).limit(1);
    return row ?? null;
  }

  export async function findById(id: string, tx?: DBTransaction): Promise<SiteContentSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(siteContent).where(eq(siteContent.id, id)).limit(1);
    return row ?? null;
  }

  export async function upsert(input: SiteContentUpsertInput, tx?: DBTransaction): Promise<SiteContentSelectType> {
    const q = queryDb(tx);
    const now = new Date();
    const existing = await findBySlug(input.slug, tx);

    if (existing) {
      const [updated] = await q
        .update(siteContent)
        .set({
          title: input.title,
          body: input.body,
          contentType: input.contentType,
          isPublished: input.isPublished,
          updatedByUserId: input.updatedByUserId,
          updatedAt: now,
        })
        .where(eq(siteContent.id, existing.id))
        .returning();
      return updated;
    }

    const [inserted] = await q
      .insert(siteContent)
      .values({
        slug: input.slug,
        title: input.title,
        body: input.body,
        contentType: input.contentType,
        isPublished: input.isPublished,
        updatedByUserId: input.updatedByUserId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return inserted;
  }

  export async function upsertMany(
    inputs: readonly SiteContentUpsertInput[],
    tx?: DBTransaction
  ): Promise<SiteContentSelectType[]> {
    return Promise.all(inputs.map(input => upsert(input, tx)));
  }

  export async function listAll(tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    const q = queryDb(tx);
    const rows = await q.select().from(siteContent).orderBy(desc(siteContent.updatedAt));
    return rows;
  }

  async function selectOrdered(
    tx: DBTransaction | undefined,
    where: SQL | undefined
  ): Promise<SiteContentSelectType[]> {
    const q = queryDb(tx);
    const rows = await q.select().from(siteContent).where(where).orderBy(desc(siteContent.updatedAt));
    return rows;
  }

  export async function listPublished(tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    return selectOrdered(tx, eq(siteContent.isPublished, true));
  }

  export async function listByContentType(contentType: string, tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    return selectOrdered(tx, eq(siteContent.contentType, contentType));
  }

  export async function listPublishedByContentType(
    contentType: string,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType[]> {
    return selectOrdered(tx, and(eq(siteContent.contentType, contentType), eq(siteContent.isPublished, true)));
  }

  export async function updatePublishState(
    id: string,
    isPublished: boolean,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType | null> {
    const q = queryDb(tx);
    const [updated] = await q
      .update(siteContent)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(siteContent.id, id))
      .returning();
    return updated ?? null;
  }

  export async function deleteById(id: string, tx?: DBTransaction): Promise<boolean> {
    const q = queryDb(tx);
    try {
      const deleted = await q.delete(siteContent).where(eq(siteContent.id, id)).returning();
      return deleted.length > 0;
    } catch {
      return false;
    }
  }

  export async function deleteBySlug(slug: string, tx?: DBTransaction): Promise<boolean> {
    const q = queryDb(tx);
    try {
      const deleted = await q.delete(siteContent).where(eq(siteContent.slug, slug)).returning();
      return deleted.length > 0;
    } catch {
      return false;
    }
  }
}
