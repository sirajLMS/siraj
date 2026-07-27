import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classSubjects } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type { ClassSubjectSelectType, ClassSubjectSubmitInput, ClassSubjectUpdateInput } from "@/backend/types";

export namespace ClassSubjectRepository {
  export async function listSubjects(categoryId?: string, tx?: DBTransaction): Promise<ClassSubjectSelectType[]> {
    try {
      const client = tx ?? db;
      const conditions = [isNull(classSubjects.deletedAt)];
      if (categoryId) {
        conditions.push(eq(classSubjects.categoryId, categoryId));
      }
      return await client
        .select()
        .from(classSubjects)
        .where(and(...conditions))
        .orderBy(asc(classSubjects.sortOrder));
    } catch (error) {
      logger.error("Error listing class subjects:", error);
      throw error;
    }
  }

  async function fetchSubjectByField(
    field: "id" | "slug",
    value: string,
    _locale: string | undefined,
    tx: DBTransaction | undefined
  ): Promise<ClassSubjectSelectType> {
    try {
      const client = tx ?? db;
      const [result] = await client
        .select()
        .from(classSubjects)
        .where(and(eq(classSubjects[field], value), isNull(classSubjects.deletedAt)))
        .limit(1);

      if (!result) {
        throw new Error(`Subject ${value} not found`);
      }

      return result;
    } catch (error) {
      logger.error(`Error fetching class subject by ${field} ${value}:`, error);
      throw error;
    }
  }

  export function getSubjectById(id: string, locale?: string, tx?: DBTransaction): Promise<ClassSubjectSelectType> {
    return fetchSubjectByField("id", id, locale, tx);
  }

  export function getSubjectBySlug(slug: string, locale?: string, tx?: DBTransaction): Promise<ClassSubjectSelectType> {
    return fetchSubjectByField("slug", slug, locale, tx);
  }

  export async function createSubject(
    input: ClassSubjectSubmitInput,
    _locale?: string,
    tx?: DBTransaction
  ): Promise<ClassSubjectSelectType> {
    const run = async (t: DBTransaction): Promise<ClassSubjectSelectType> => {
      const [result] = await t
        .insert(classSubjects)
        .values({
          name: input.name,
          slug: input.slug,
          categoryId: input.categoryId,
          description: input.description ?? null,
          avatarUrl: input.avatarUrl ?? null,
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 0,
          hourlyRate: input.hourlyRate ?? null,
          rateCurrency: input.rateCurrency ?? null,
        })
        .returning();

      if (!result) {
        throw new Error("Failed to create class subject");
      }

      logger.info("Class subject created", { subjectId: result.id, slug: result.slug });

      return result;
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error("Error creating class subject:", error);
      throw error;
    }
  }

  export async function updateSubject(
    id: string,
    input: ClassSubjectUpdateInput,
    _locale?: string,
    tx?: DBTransaction
  ): Promise<ClassSubjectSelectType> {
    const run = async (t: DBTransaction): Promise<ClassSubjectSelectType> => {
      const [existing] = await t
        .select()
        .from(classSubjects)
        .where(and(eq(classSubjects.id, id), isNull(classSubjects.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new Error(`Subject ${id} not found`);
      }

      const now = new Date();
      const [updated] = await t
        .update(classSubjects)
        .set({
          name: input.name ?? existing.name,
          slug: input.slug ?? existing.slug,
          categoryId: input.categoryId ?? existing.categoryId,
          description: input.description === undefined ? existing.description : input.description,
          avatarUrl: input.avatarUrl === undefined ? existing.avatarUrl : input.avatarUrl,
          isActive: input.isActive ?? existing.isActive,
          sortOrder: input.sortOrder ?? existing.sortOrder,
          hourlyRate: input.hourlyRate === undefined ? existing.hourlyRate : input.hourlyRate,
          rateCurrency: input.rateCurrency === undefined ? existing.rateCurrency : input.rateCurrency,
          updatedAt: now,
        })
        .where(eq(classSubjects.id, id))
        .returning();

      return updated;
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error updating class subject with ID ${id}:`, error);
      throw error;
    }
  }

  export async function deleteSubject(id: string, _locale?: string, tx?: DBTransaction): Promise<{ id: string }> {
    const run = async (t: DBTransaction): Promise<{ id: string }> => {
      const [existing] = await t
        .select()
        .from(classSubjects)
        .where(and(eq(classSubjects.id, id), isNull(classSubjects.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new Error(`Subject ${id} not found`);
      }

      const now = new Date();
      await t.update(classSubjects).set({ deletedAt: now, updatedAt: now }).where(eq(classSubjects.id, id));

      return { id };
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error deleting class subject with ID ${id}:`, error);
      throw error;
    }
  }

  export async function findBySlugs(slugs: readonly string[], tx?: DBTransaction): Promise<ClassSubjectSelectType[]> {
    if (slugs.length === 0) return [];
    try {
      const client = tx ?? db;
      return await client
        .select()
        .from(classSubjects)
        .where(and(inArray(classSubjects.slug, [...slugs]), isNull(classSubjects.deletedAt)));
    } catch (error) {
      logger.error("Error finding class subjects by slugs:", error);
      throw error;
    }
  }

  export async function upsertMany(
    inputs: readonly ClassSubjectSubmitInput[],
    tx?: DBTransaction
  ): Promise<ClassSubjectSelectType[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<ClassSubjectSelectType[]> => {
      const now = new Date();
      const results: ClassSubjectSelectType[] = [];

      for (const input of inputs) {
        const [row] = await t
          .insert(classSubjects)
          .values({
            name: input.name,
            slug: input.slug,
            categoryId: input.categoryId,
            description: input.description ?? null,
            avatarUrl: input.avatarUrl ?? null,
            isActive: input.isActive ?? true,
            sortOrder: input.sortOrder ?? 0,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: classSubjects.slug,
            set: {
              name: input.name,
              categoryId: input.categoryId,
              description: input.description ?? null,
              avatarUrl: input.avatarUrl ?? null,
              isActive: input.isActive ?? true,
              sortOrder: input.sortOrder ?? 0,
              updatedAt: now,
            },
          })
          .returning();

        if (row) {
          results.push(row);
        }
      }

      return results;
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error("Error upserting class subjects:", error);
      throw error;
    }
  }
}
