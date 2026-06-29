import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { learningResources, subjectResources } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type { SubjectResourceAttachInput, SubjectResourceReturnType } from "@/backend/types";
import type { DBTransaction } from "../db.types";

export namespace SubjectResourceRepository {
  export async function listResourcesForSubject(
    subjectId: string,
    tx?: DBTransaction
  ): Promise<SubjectResourceReturnType[]> {
    try {
      const client = tx ?? db;
      const rows = await client
        .select({
          id: subjectResources.id,
          subjectId: subjectResources.subjectId,
          learningResourceId: subjectResources.learningResourceId,
          resourceType: subjectResources.resourceType,
          sortOrder: subjectResources.sortOrder,
          displayName: learningResources.displayName,
          filePath: learningResources.filePath,
        })
        .from(subjectResources)
        .leftJoin(learningResources, eq(subjectResources.learningResourceId, learningResources.id))
        .where(eq(subjectResources.subjectId, subjectId))
        .orderBy(asc(subjectResources.sortOrder));

      return rows.map(row => ({
        id: row.id,
        subjectId: row.subjectId,
        learningResourceId: row.learningResourceId,
        resourceType: row.resourceType,
        sortOrder: row.sortOrder,
        displayName: row.displayName ?? null,
        filePath: row.filePath ?? null,
      }));
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
        .select({
          id: subjectResources.id,
          subjectId: subjectResources.subjectId,
          learningResourceId: subjectResources.learningResourceId,
          resourceType: subjectResources.resourceType,
          sortOrder: subjectResources.sortOrder,
          displayName: learningResources.displayName,
          filePath: learningResources.filePath,
        })
        .from(subjectResources)
        .leftJoin(learningResources, eq(subjectResources.learningResourceId, learningResources.id))
        .where(inArray(subjectResources.subjectId, subjectIds))
        .orderBy(asc(subjectResources.subjectId), asc(subjectResources.sortOrder));

      const map = new Map<string, SubjectResourceReturnType[]>();
      for (const row of rows) {
        const arr = map.get(row.subjectId) ?? [];
        arr.push({
          id: row.id,
          subjectId: row.subjectId,
          learningResourceId: row.learningResourceId,
          resourceType: row.resourceType,
          sortOrder: row.sortOrder,
          displayName: row.displayName ?? null,
          filePath: row.filePath ?? null,
        });
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
    const run = async (t: DBTransaction): Promise<SubjectResourceReturnType> => {
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

      return {
        id: result.id,
        subjectId: result.subjectId,
        learningResourceId: result.learningResourceId,
        resourceType: result.resourceType,
        sortOrder: result.sortOrder,
        displayName: null,
        filePath: null,
      };
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
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
    const run = async (t: DBTransaction): Promise<{ id: string }> => {
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
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
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
    const run = async (t: DBTransaction): Promise<{ id: string; sortOrder: number }> => {
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
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error reordering resource ${id}:`, error);
      throw error;
    }
  }
}
