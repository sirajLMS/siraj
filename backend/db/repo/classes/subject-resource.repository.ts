import { and, asc, eq, inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { learningResources, subjectResources } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type { SubjectResourceAttachInput, SubjectResourceReturnType } from "@/backend/types";

type SubjectResourceRow = {
  id: string;
  subjectId: string;
  learningResourceId: string;
  resourceType: string | null;
  sortOrder: number;
  displayName: string | null;
  filePath: string | null;
};

const resourceSelectColumns = {
  id: subjectResources.id,
  subjectId: subjectResources.subjectId,
  learningResourceId: subjectResources.learningResourceId,
  resourceType: subjectResources.resourceType,
  sortOrder: subjectResources.sortOrder,
  displayName: learningResources.displayName,
  filePath: learningResources.filePath,
};

function mapRowToReturnType(row: SubjectResourceRow): SubjectResourceReturnType {
  return {
    id: row.id,
    subjectId: row.subjectId,
    learningResourceId: row.learningResourceId,
    resourceType: row.resourceType,
    sortOrder: row.sortOrder,
    displayName: row.displayName ?? null,
    filePath: row.filePath ?? null,
  };
}

async function runInTx<T>(tx: DBTransaction | undefined, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
  if (tx) {
    return fn(tx);
  }
  return db.transaction(fn);
}

export namespace SubjectResourceRepository {
  export async function listResourcesForSubject(
    subjectId: string,
    tx?: DBTransaction
  ): Promise<SubjectResourceReturnType[]> {
    try {
      const client = tx ?? db;
      const rows = await client
        .select(resourceSelectColumns)
        .from(subjectResources)
        .leftJoin(learningResources, eq(subjectResources.learningResourceId, learningResources.id))
        .where(eq(subjectResources.subjectId, subjectId))
        .orderBy(asc(subjectResources.sortOrder));

      return rows.map(mapRowToReturnType);
    } catch (error) {
      logger.error(`Error listing resources for subject ${subjectId}:`, error);
      throw error;
    }
  }

  export async function loadResourcesBySubjectIds(
    subjectIds: string[],
    tx?: DBTransaction
  ): Promise<Map<string, SubjectResourceReturnType[]>> {
    try {
      if (subjectIds.length === 0) return new Map();
      const client = tx ?? db;
      const rows = await client
        .select(resourceSelectColumns)
        .from(subjectResources)
        .leftJoin(learningResources, eq(subjectResources.learningResourceId, learningResources.id))
        .where(inArray(subjectResources.subjectId, subjectIds))
        .orderBy(asc(subjectResources.subjectId), asc(subjectResources.sortOrder));

      const map = new Map<string, SubjectResourceReturnType[]>();
      for (const row of rows) {
        const arr = map.get(row.subjectId) ?? [];
        arr.push(mapRowToReturnType(row));
        map.set(row.subjectId, arr);
      }
      return map;
    } catch (error) {
      logger.error("Error loading resources for subjects:", error);
      throw error;
    }
  }

  export async function attachResource(
    input: SubjectResourceAttachInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<SubjectResourceReturnType> {
    try {
      return await runInTx(tx, async t => {
        const [result] = await t
          .insert(subjectResources)
          .values({
            subjectId: input.subjectId,
            learningResourceId: input.learningResourceId,
            resourceType: input.resourceType ?? null,
            sortOrder: input.sortOrder ?? 0,
          })
          .returning();

        if (!result) {
          const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(tFunc("subjectResourceAttachFailed"));
        }

        logger.info("Resource attached to subject", {
          subjectResourceId: result.id,
          subjectId: result.subjectId,
          learningResourceId: result.learningResourceId,
        });

        const [row] = await t
          .select(resourceSelectColumns)
          .from(subjectResources)
          .leftJoin(learningResources, eq(subjectResources.learningResourceId, learningResources.id))
          .where(eq(subjectResources.id, result.id));

        return mapRowToReturnType(row);
      });
    } catch (error) {
      logger.error("Error attaching resource to subject:", error);
      throw error;
    }
  }

  export async function detachResource(
    subjectId: string,
    learningResourceId: string,
    locale?: string,
    tx?: DBTransaction
  ): Promise<{ id: string }> {
    try {
      return await runInTx(tx, async t => {
        const [existing] = await t
          .select({ id: subjectResources.id })
          .from(subjectResources)
          .where(
            and(eq(subjectResources.subjectId, subjectId), eq(subjectResources.learningResourceId, learningResourceId))
          )
          .limit(1);

        if (!existing) {
          const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(tFunc("subjectResourceLinkNotFound"));
        }

        await t
          .delete(subjectResources)
          .where(
            and(eq(subjectResources.subjectId, subjectId), eq(subjectResources.learningResourceId, learningResourceId))
          );

        logger.info("Resource detached from subject", { subjectId, learningResourceId });

        return { id: existing.id };
      });
    } catch (error) {
      logger.error(`Error detaching resource from subject ${subjectId}:`, error);
      throw error;
    }
  }

  export async function reorderResource(
    id: string,
    sortOrder: number,
    locale?: string,
    tx?: DBTransaction
  ): Promise<{ id: string; sortOrder: number }> {
    try {
      return await runInTx(tx, async t => {
        const [updated] = await t
          .update(subjectResources)
          .set({ sortOrder })
          .where(eq(subjectResources.id, id))
          .returning({ id: subjectResources.id, sortOrder: subjectResources.sortOrder });

        if (!updated) {
          const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(tFunc("subjectResourceNotFound"));
        }

        logger.info("Resource reordered", { subjectResourceId: id, sortOrder });

        return updated;
      });
    } catch (error) {
      logger.error(`Error reordering resource ${id}:`, error);
      throw error;
    }
  }

  export async function createMany(
    inputs: readonly SubjectResourceAttachInput[],
    tx?: DBTransaction
  ): Promise<SubjectResourceReturnType[]> {
    if (inputs.length === 0) return [];

    try {
      return await runInTx(tx, async t => {
        const results: SubjectResourceReturnType[] = [];

        for (const input of inputs) {
          const [existing] = await t
            .select()
            .from(subjectResources)
            .where(
              and(
                eq(subjectResources.subjectId, input.subjectId),
                eq(subjectResources.learningResourceId, input.learningResourceId)
              )
            )
            .limit(1);

          if (existing) {
            const [row] = await t
              .select(resourceSelectColumns)
              .from(subjectResources)
              .leftJoin(learningResources, eq(subjectResources.learningResourceId, learningResources.id))
              .where(eq(subjectResources.id, existing.id));

            if (row) {
              results.push(mapRowToReturnType(row));
            }
            continue;
          }

          const [created] = await t
            .insert(subjectResources)
            .values({
              subjectId: input.subjectId,
              learningResourceId: input.learningResourceId,
              resourceType: input.resourceType ?? null,
              sortOrder: input.sortOrder ?? 0,
            })
            .returning();

          if (created) {
            const [row] = await t
              .select(resourceSelectColumns)
              .from(subjectResources)
              .leftJoin(learningResources, eq(subjectResources.learningResourceId, learningResources.id))
              .where(eq(subjectResources.id, created.id));

            if (row) {
              results.push(mapRowToReturnType(row));
            }
          }
        }

        return results;
      });
    } catch (error) {
      logger.error("Error creating subject resources:", error);
      throw error;
    }
  }
}
