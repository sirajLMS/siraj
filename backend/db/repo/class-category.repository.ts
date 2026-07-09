import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classCategories } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type { ClassCategorySelectType, ClassCategorySubmitInput, ClassCategoryUpdateInput } from "@/backend/types";

export namespace ClassCategoryRepository {
  /**
   * Shared base query builder for non-deleted class categories.
   * Appends additional conditions to the existing `deletedAt IS NULL` filter.
   */
  function selectActiveCategories(client: DBTransaction | typeof db, extraCondition?: ReturnType<typeof and>) {
    const condition = extraCondition
      ? and(extraCondition, isNull(classCategories.deletedAt))
      : isNull(classCategories.deletedAt);
    return client.select().from(classCategories).where(condition);
  }

  async function executeQuery<T>(
    tx: DBTransaction | undefined,
    errorLabel: string,
    query: (client: DBTransaction | typeof db) => Promise<T>
  ): Promise<T> {
    try {
      const client = tx ?? db;
      return await query(client);
    } catch (error) {
      logger.error(errorLabel, error);
      throw error;
    }
  }

  export async function listCategories(tx?: DBTransaction): Promise<ClassCategorySelectType[]> {
    return executeQuery(tx, "Error listing class categories:", client =>
      selectActiveCategories(client).orderBy(asc(classCategories.sortOrder))
    );
  }

  export async function loadByIds(ids: string[], tx?: DBTransaction): Promise<ClassCategorySelectType[]> {
    if (ids.length === 0) return [];
    return executeQuery(tx, "Error loading class categories by IDs:", client =>
      selectActiveCategories(client, inArray(classCategories.id, ids))
    );
  }

  export async function getCategoryById(
    id: string,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ClassCategorySelectType> {
    try {
      const client = tx ?? db;
      const [result] = await client
        .select()
        .from(classCategories)
        .where(and(eq(classCategories.id, id), isNull(classCategories.deletedAt)))
        .limit(1);

      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

      if (!result) {
        throw new Error(tFunc("categoryNotFound", { id }));
      }

      return result;
    } catch (error) {
      logger.error(`Error fetching class category by ID ${id}:`, error);
      throw error;
    }
  }

  export async function createCategory(
    input: ClassCategorySubmitInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ClassCategorySelectType> {
    const run = async (t: DBTransaction): Promise<ClassCategorySelectType> => {
      const [result] = await t
        .insert(classCategories)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning();

      if (!result) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("categoryCreateFailed"));
      }

      logger.info("Class category created", { categoryId: result.id, slug: result.slug });

      return result;
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error("Error creating class category:", error);
      throw error;
    }
  }

  export async function updateCategory(
    id: string,
    input: ClassCategoryUpdateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ClassCategorySelectType> {
    const run = async (t: DBTransaction): Promise<ClassCategorySelectType> => {
      const [existing] = await t
        .select()
        .from(classCategories)
        .where(and(eq(classCategories.id, id), isNull(classCategories.deletedAt)))
        .limit(1);

      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

      if (!existing) {
        throw new Error(tFunc("categoryNotFound", { id }));
      }

      const now = new Date();
      const [updated] = await t
        .update(classCategories)
        .set({
          name: input.name ?? existing.name,
          slug: input.slug ?? existing.slug,
          description: input.description === undefined ? existing.description : input.description,
          isActive: input.isActive ?? existing.isActive,
          sortOrder: input.sortOrder ?? existing.sortOrder,
          updatedAt: now,
        })
        .where(eq(classCategories.id, id))
        .returning();

      return updated;
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error updating class category with ID ${id}:`, error);
      throw error;
    }
  }

  export async function deleteCategory(id: string, locale?: string, tx?: DBTransaction): Promise<{ id: string }> {
    const run = async (t: DBTransaction): Promise<{ id: string }> => {
      const [existing] = await t
        .select()
        .from(classCategories)
        .where(and(eq(classCategories.id, id), isNull(classCategories.deletedAt)))
        .limit(1);

      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

      if (!existing) {
        throw new Error(tFunc("categoryNotFound", { id }));
      }

      const now = new Date();
      await t.update(classCategories).set({ deletedAt: now, updatedAt: now }).where(eq(classCategories.id, id));

      return { id };
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error deleting class category with ID ${id}:`, error);
      throw error;
    }
  }
}
