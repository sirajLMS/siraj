import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { runInClassTransaction } from "@/backend/db/repo/classes/shared/runInClassTransaction";
import { classSubjects } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  ClassSubjectSelectType,
  ClassSubjectSubmitInput,
  ClassSubjectUpdateInput,
  DBTransaction,
} from "@/backend/types";

// ─── Shared helpers (eliminate intra-file duplication) ──────────────────────

function buildSubjectInsertValues(input: ClassSubjectSubmitInput) {
  return {
    name: input.name,
    slug: input.slug,
    categoryId: input.categoryId,
    description: input.description ?? null,
    avatarUrl: input.avatarUrl ?? null,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
    hourlyRate: input.hourlyRate ?? null,
    rateCurrency: input.rateCurrency ?? null,
  };
}

function buildSubjectConflictSet(input: ClassSubjectSubmitInput, now: Date) {
  return {
    name: input.name,
    categoryId: input.categoryId,
    description: input.description ?? null,
    avatarUrl: input.avatarUrl ?? null,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
    updatedAt: now,
  };
}

async function findExistingSubject(t: DBTransaction, id: string): Promise<ClassSubjectSelectType> {
  const [existing] = await t
    .select()
    .from(classSubjects)
    .where(and(eq(classSubjects.id, id), isNull(classSubjects.deletedAt)))
    .limit(1);
  if (!existing) {
    throw new Error(`Subject ${id} not found`);
  }
  return existing;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export namespace ClassSubjectRepository {
  export async function listSubjects(categoryId?: string, tx?: DBTransaction): Promise<ClassSubjectSelectType[]> {
    try {
      const client = queryDb(tx);
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
      const client = queryDb(tx);
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
    return runInClassTransaction(
      tx,
      async (t): Promise<ClassSubjectSelectType> => {
        const [result] = await t.insert(classSubjects).values(buildSubjectInsertValues(input)).returning();

        if (!result) {
          throw new Error("Failed to create class subject");
        }

        logger.info("Class subject created", { subjectId: result.id, slug: result.slug });

        return result;
      },
      "Error creating class subject:"
    );
  }

  export async function updateSubject(
    id: string,
    input: ClassSubjectUpdateInput,
    _locale?: string,
    tx?: DBTransaction
  ): Promise<ClassSubjectSelectType> {
    return runInClassTransaction(
      tx,
      async (t): Promise<ClassSubjectSelectType> => {
        const existing = await findExistingSubject(t, id);

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
      },
      `Error updating class subject with ID ${id}:`
    );
  }

  export async function deleteSubject(id: string, _locale?: string, tx?: DBTransaction): Promise<{ id: string }> {
    return runInClassTransaction(
      tx,
      async (t): Promise<{ id: string }> => {
        await findExistingSubject(t, id);

        const now = new Date();
        await t.update(classSubjects).set({ deletedAt: now, updatedAt: now }).where(eq(classSubjects.id, id));

        return { id };
      },
      `Error deleting class subject with ID ${id}:`
    );
  }

  export async function findBySlugs(slugs: readonly string[], tx?: DBTransaction): Promise<ClassSubjectSelectType[]> {
    if (slugs.length === 0) return [];
    try {
      const client = queryDb(tx);
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

    return runInClassTransaction(
      tx,
      async (t): Promise<ClassSubjectSelectType[]> => {
        const now = new Date();
        const results: ClassSubjectSelectType[] = [];

        async function upsertNext(index: number): Promise<void> {
          if (index >= inputs.length) return;
          const input = inputs[index];
          const [row] = await t
            .insert(classSubjects)
            .values({
              ...buildSubjectInsertValues(input),
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: classSubjects.slug,
              set: buildSubjectConflictSet(input, now),
            })
            .returning();

          if (row) {
            results.push(row);
          }
          return upsertNext(index + 1);
        }

        await upsertNext(0);

        return results;
      },
      "Error upserting class subjects:"
    );
  }
}
