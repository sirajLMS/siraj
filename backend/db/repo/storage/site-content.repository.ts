import { and, desc, eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { siteContent } from "@/backend/db/schema/storage/site-content";
import type { SiteContentSelectType, SiteContentUpsertInput } from "@/backend/types/storage/site-content.types";

export namespace SiteContentRepository {
  export async function findBySlug(slug: string, tx?: DBTransaction): Promise<SiteContentSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb.select().from(siteContent).where(eq(siteContent.slug, slug)).limit(1);
    return row ?? null;
  }

  export async function upsert(input: SiteContentUpsertInput, tx?: DBTransaction): Promise<SiteContentSelectType> {
    const queryDb = tx ?? db;
    const now = new Date();
    const existing = await findBySlug(input.slug, tx);

    if (existing) {
      const [updated] = await queryDb
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

    const [inserted] = await queryDb
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
    const results: SiteContentSelectType[] = [];
    for (const input of inputs) {
      results.push(await upsert(input, tx));
    }
    return results;
  }

  export async function listAll(tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    const queryDb = tx ?? db;
    return queryDb.select().from(siteContent).orderBy(desc(siteContent.updatedAt));
  }

  function selectOrdered(
    queryDb: DBTransaction | typeof db,
    where: ReturnType<typeof eq> | ReturnType<typeof and>
  ): Promise<SiteContentSelectType[]> {
    return queryDb.select().from(siteContent).where(where).orderBy(desc(siteContent.updatedAt)) as Promise<
      SiteContentSelectType[]
    >;
  }

  export async function listPublished(tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    return selectOrdered(tx ?? db, eq(siteContent.isPublished, true));
  }

  export async function listByContentType(contentType: string, tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    return selectOrdered(tx ?? db, eq(siteContent.contentType, contentType));
  }

  export async function listPublishedByContentType(
    contentType: string,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType[]> {
    return selectOrdered(tx ?? db, and(eq(siteContent.contentType, contentType), eq(siteContent.isPublished, true)));
  }

  export async function findById(id: string, tx?: DBTransaction): Promise<SiteContentSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb.select().from(siteContent).where(eq(siteContent.id, id)).limit(1);
    return row ?? null;
  }

  export async function updatePublishState(
    id: string,
    isPublished: boolean,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType | null> {
    const queryDb = tx ?? db;
    const [updated] = await queryDb
      .update(siteContent)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(siteContent.id, id))
      .returning();
    return updated ?? null;
  }

  export async function deleteById(id: string, tx?: DBTransaction): Promise<boolean> {
    const queryDb = tx ?? db;
    try {
      const deleted = await queryDb.delete(siteContent).where(eq(siteContent.id, id)).returning();
      return deleted.length > 0;
    } catch {
      return false;
    }
  }

  export async function deleteBySlug(slug: string, tx?: DBTransaction): Promise<boolean> {
    const queryDb = tx ?? db;
    try {
      const deleted = await queryDb.delete(siteContent).where(eq(siteContent.slug, slug)).returning();
      return deleted.length > 0;
    } catch {
      return false;
    }
  }
}
