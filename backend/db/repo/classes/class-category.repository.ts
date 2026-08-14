import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { runInClassTransaction } from "@/backend/db/repo/classes/shared/runInClassTransaction";
import { classCategories } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  ClassCategorySelectType,
  ClassCategorySubmitInput,
  ClassCategoryUpdateInput,
  DBQueryExecutor,
  DBTransaction,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

// ─── Shared helpers (eliminate intra-file duplication) ──────────────────────

function buildCategoryFields(input: ClassCategorySubmitInput) {
  return {
    name: input.name,
    description: input.description ?? null,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  };
}

function buildCategoryInsertValues(input: ClassCategorySubmitInput) {
  const now = new Date();
  return {
    ...buildCategoryFields(input),
    slug: input.slug,
    createdAt: now,
    updatedAt: now,
  };
}

function buildCategoryConflictSet(input: ClassCategorySubmitInput, now: Date) {
  return {
    ...buildCategoryFields(input),
    updatedAt: now,
  };
}

async function findExistingCategory(
  t: DBTransaction,
  id: string,
  tErrors: ErrorsLabels
): Promise<ClassCategorySelectType> {
  const [existing] = await t
    .select()
    .from(classCategories)
    .where(and(eq(classCategories.id, id), isNull(classCategories.deletedAt)))
    .limit(1);
  if (!existing) {
    throw new Error(tErrors.categoryNotFound(id));
  }
  return existing;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export namespace ClassCategoryRepository {
  /**
   * Shared base query builder for non-deleted class categories.
   * Appends additional conditions to the existing `deletedAt IS NULL` filter.
   */
  function selectActiveCategories(client: DBQueryExecutor, extraCondition?: ReturnType<typeof and>) {
    const condition = extraCondition
      ? and(extraCondition, isNull(classCategories.deletedAt))
      : isNull(classCategories.deletedAt);
    return client.select().from(classCategories).where(condition);
  }

  async function executeQuery<T>(
    tx: DBTransaction | undefined,
    errorLabel: string,
    query: (client: DBQueryExecutor) => Promise<T>
  ): Promise<T> {
    try {
      const client = queryDb(tx);
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
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassCategorySelectType> {
    try {
      const client = queryDb(tx);
      const [result] = await client
        .select()
        .from(classCategories)
        .where(and(eq(classCategories.id, id), isNull(classCategories.deletedAt)))
        .limit(1);

      if (!result) {
        throw new Error(tErrors.categoryNotFound(id));
      }

      return result;
    } catch (error) {
      logger.error(`Error fetching class category by ID ${id}:`, error);
      throw error;
    }
  }

  export async function createCategory(
    input: ClassCategorySubmitInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassCategorySelectType> {
    return runInClassTransaction(
      tx,
      async (t): Promise<ClassCategorySelectType> => {
        const [result] = await t.insert(classCategories).values(buildCategoryInsertValues(input)).returning();

        if (!result) {
          throw new Error(tErrors.categoryCreateFailed);
        }

        logger.info("Class category created", { categoryId: result.id, slug: result.slug });

        return result;
      },
      "Error creating class category:"
    );
  }

  export async function updateCategory(
    id: string,
    input: ClassCategoryUpdateInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassCategorySelectType> {
    return runInClassTransaction(
      tx,
      async (t): Promise<ClassCategorySelectType> => {
        const existing = await findExistingCategory(t, id, tErrors);

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
      },
      `Error updating class category with ID ${id}:`
    );
  }

  export async function deleteCategory(id: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<{ id: string }> {
    return runInClassTransaction(
      tx,
      async (t): Promise<{ id: string }> => {
        await findExistingCategory(t, id, tErrors);

        const now = new Date();
        await t.update(classCategories).set({ deletedAt: now, updatedAt: now }).where(eq(classCategories.id, id));

        return { id };
      },
      `Error deleting class category with ID ${id}:`
    );
  }

  export async function findBySlugs(slugs: readonly string[], tx?: DBTransaction): Promise<ClassCategorySelectType[]> {
    if (slugs.length === 0) return [];
    return executeQuery(tx, "Error finding class categories by slugs:", client =>
      selectActiveCategories(client, inArray(classCategories.slug, [...slugs]))
    );
  }

  export async function upsertMany(
    inputs: readonly ClassCategorySubmitInput[],
    tx?: DBTransaction
  ): Promise<ClassCategorySelectType[]> {
    if (inputs.length === 0) return [];

    return runInClassTransaction(
      tx,
      async (t): Promise<ClassCategorySelectType[]> => {
        const now = new Date();
        const results: ClassCategorySelectType[] = [];

        const upsertOne = async (input: ClassCategorySubmitInput): Promise<void> => {
          const [row] = await t
            .insert(classCategories)
            .values({
              ...buildCategoryInsertValues(input),
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: classCategories.slug,
              set: buildCategoryConflictSet(input, now),
            })
            .returning();

          if (row) {
            results.push(row);
          }
        };

        await inputs.reduce((chain, input) => chain.then(() => upsertOne(input)), Promise.resolve());

        return results;
      },
      "Error upserting class categories:"
    );
  }
}
