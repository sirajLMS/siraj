import type { SQL } from "drizzle-orm";
import { and, desc, eq } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { siteContent } from "@/backend/db/schema/storage/site-content";
import type { SiteContentSelectType, SiteContentUpsertInput } from "@/backend/types/storage/site-content.types";

export namespace SiteContentRepository {
  export async function findBySlug(slug: string, tx?: DBTransaction): Promise<SiteContentSelectType | null> {
    const q = queryDb(tx) as unknown as typeof import("@/backend/db/drizzleDb").db;
    const [row] = await q.select().from(siteContent).where(eq(siteContent.slug, slug)).limit(1);
    return row ?? null;
  }

  export async function findById(id: string, tx?: DBTransaction): Promise<SiteContentSelectType | null> {
    const q = queryDb(tx) as unknown as typeof import("@/backend/db/drizzleDb").db;
    const [row] = await q.select().from(siteContent).where(eq(siteContent.id, id)).limit(1);
    return row ?? null;
  }

  export async function upsert(input: SiteContentUpsertInput, tx?: DBTransaction): Promise<SiteContentSelectType> {
    const q = queryDb(tx) as unknown as typeof import("@/backend/db/drizzleDb").db;
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
    const results: SiteContentSelectType[] = [];
    for (const input of inputs) {
      results.push(await upsert(input, tx));
    }
    return results;
  }

  export async function listAll(tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    const q = queryDb(tx) as unknown as typeof import("@/backend/db/drizzleDb").db;
    const rows = await q.select().from(siteContent).orderBy(desc(siteContent.updatedAt));
    return rows;
  }

  async function _selectOrdered(
    tx: DBTransaction | undefined,
    where: SQL | undefined
  ): Promise<SiteContentSelectType[]> {
    const q = queryDb(tx) as unknown as typeof import("@/backend/db/drizzleDb").db;
    const rows = await q.select().from(siteContent).where(where).orderBy(desc(siteContent.updatedAt));
    return rows;
  }

  export async function _listPublished(tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    return _selectOrdered(tx, eq(siteContent.isPublished, true));
  }

  export async function _listByContentType(contentType: string, tx?: DBTransaction): Promise<SiteContentSelectType[]> {
    return _selectOrdered(tx, eq(siteContent.contentType, contentType));
  }

  export async function _listPublishedByContentType(
    contentType: string,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType[]> {
    return _selectOrdered(tx, and(eq(siteContent.contentType, contentType), eq(siteContent.isPublished, true)));
  }

  export async function _updatePublishState(
    id: string,
    isPublished: boolean,
    tx?: DBTransaction
  ): Promise<SiteContentSelectType | null> {
    const q = queryDb(tx) as unknown as typeof import("@/backend/db/drizzleDb").db;
    const [updated] = await q
      .update(siteContent)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(siteContent.id, id))
      .returning();
    return updated ?? null;
  }

  export async function _deleteById(id: string, tx?: DBTransaction): Promise<boolean> {
    const q = queryDb(tx) as unknown as typeof import("@/backend/db/drizzleDb").db;
    try {
      const deleted = await q.delete(siteContent).where(eq(siteContent.id, id)).returning();
      return deleted.length > 0;
    } catch {
      return false;
    }
  }

  export async function _deleteBySlug(slug: string, tx?: DBTransaction): Promise<boolean> {
    const q = queryDb(tx) as unknown as typeof import("@/backend/db/drizzleDb").db;
    try {
      const deleted = await q.delete(siteContent).where(eq(siteContent.slug, slug)).returning();
      return deleted.length > 0;
    } catch {
      return false;
    }
  }
}
