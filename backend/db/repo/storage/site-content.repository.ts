import { eq } from "drizzle-orm";
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
}
