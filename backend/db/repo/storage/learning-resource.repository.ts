import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { learningResources } from "@/backend/db/schema";
import { learningResourceFiles } from "@/backend/db/schema/storage/storage";
import { logger } from "@/backend/lib/logger";
import type { LearningResourceReturnType, PaginationArgs } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export type LearningResourceRow = LearningResourceReturnType;

export interface LearningResourceCreateInput {
  readonly displayName: string;
  readonly filePath: string;
  readonly uploadedByUserId: string;
  readonly fileId: string;
}

export interface LearningResourceListResult {
  readonly rows: LearningResourceRow[];
  readonly totalCount: number;
}

const resourceSelectColumns = {
  id: learningResources.id,
  displayName: learningResources.displayName,
  filePath: learningResources.filePath,
  uploadedByUserId: learningResources.uploadedByUserId,
  uploadedByUserName: sql<string | null>`NULL`,
  fileSize: sql<number | null>`NULL`,
  contentType: sql<string | null>`NULL`,
  createdAt: learningResources.createdAt,
};

function resourceReturnShape(resource: { id: string; displayName: string; filePath: string; uploadedByUserId: string; createdAt: Date }): LearningResourceRow {
  return {
    ...resource,
    uploadedByUserName: null,
    fileSize: null,
    contentType: null,
  };
}

export namespace LearningResourceRepository {
  export async function findByFilePath(filePath: string, tx?: DBTransaction): Promise<LearningResourceRow | null> {
    const q = queryDb(tx);
    const results = await q
      .select(resourceSelectColumns)
      .from(learningResources)
      .where(and(eq(learningResources.filePath, filePath), isNull(learningResources.deletedAt)))
      .limit(1);
    return results[0] ?? null;
  }

  export async function insertResource(
    input: { displayName: string; filePath: string; uploadedByUserId: string; createdAt?: Date },
    tx?: DBTransaction
  ): Promise<LearningResourceRow> {
    const q = queryDb(tx);
    const now = new Date();
    const [resource] = await q
      .insert(learningResources)
      .values({
        displayName: input.displayName,
        filePath: input.filePath,
        uploadedByUserId: input.uploadedByUserId,
        createdAt: input.createdAt ?? now,
      })
      .returning();

    if (!resource) {
      throw new Error("Failed to create seed learning resource");
    }

    return resourceReturnShape(resource);
  }

  export async function listResources(
    pagination?: PaginationArgs | null,
    tx?: DBTransaction
  ): Promise<LearningResourceListResult> {
    const q = queryDb(tx);

    const baseWhere = isNull(learningResources.deletedAt);

    if (pagination) {
      const perPage = pagination.perPage;
      const offset = pagination.offset;

      const [rows, countResult] = await Promise.all([
        q
          .select(resourceSelectColumns)
          .from(learningResources)
          .where(baseWhere)
          .orderBy(desc(learningResources.createdAt))
          .limit(perPage)
          .offset(offset),
        q.select({ count: sql<number>`count(*)::int` }).from(learningResources).where(baseWhere),
      ]);

      const totalCount = countResult[0]?.count ?? 0;

      return { rows, totalCount };
    }

    const rowsQuery = q
      .select(resourceSelectColumns)
      .from(learningResources)
      .where(baseWhere)
      .orderBy(desc(learningResources.createdAt))
      .limit(200);

    const countQuery = q.select({ count: sql<number>`count(*)::int` }).from(learningResources).where(baseWhere);

    const [rows, countResult] = await Promise.all([rowsQuery, countQuery]);

    const totalCount = countResult[0]?.count ?? 0;

    return { rows, totalCount };
  }

  export async function createResource(
    input: LearningResourceCreateInput,
    _locale?: string,
    tx?: DBTransaction
  ): Promise<LearningResourceRow> {
    const createTx = async (t: DBTransaction): Promise<LearningResourceRow> => {
      const now = new Date();

      const [resource] = await t
        .insert(learningResources)
        .values({
          displayName: input.displayName,
          filePath: input.filePath,
          uploadedByUserId: input.uploadedByUserId,
          createdAt: now,
        })
        .returning();

      if (!resource) {
        throw new Error("Failed to create learning resource");
      }

      await t.insert(learningResourceFiles).values({
        fileId: input.fileId,
        learningResourceId: resource.id,
        usageType: "document",
        createdAt: now,
      });

      logger.info("Learning resource created", {
        resourceId: resource.id,
        fileId: input.fileId,
        userId: input.uploadedByUserId,
      });

      return resourceReturnShape(resource);
    };

    if (tx) {
      return await createTx(tx);
    }
    return await db.transaction(createTx);
  }

  export async function findById(resourceId: string, tx?: DBTransaction): Promise<LearningResourceRow | null> {
    const q = queryDb(tx);

    const results = await q
      .select(resourceSelectColumns)
      .from(learningResources)
      .where(and(eq(learningResources.id, resourceId), isNull(learningResources.deletedAt)))
      .limit(1);

    return results[0] ?? null;
  }

  /**
   * Hard deletes a learning resource from the database.
   *
   * @description
   * This method forcefully drops the relational record from the learning_resources table.
   * It intentionally does NOT orchestrate the deletion of the physical file from the
   * storage infrastructure; that responsibility belongs strictly to the Service layer
   * to maintain Separation of Concerns (SoC).
   *
   * @param id - The unique UUID of the learning resource to be deleted.
   * @param locale - The optional locale for localized error messages.
   * @param tx - The optional database transaction.
   * @returns Promise<boolean> - Returns true if the deletion was successful.
   * @throws Error - If the learning resource does not exist prior to deletion.
   */
  export async function deleteResource(id: string, locale?: string, tx?: DBTransaction): Promise<boolean> {
    const execute = async (t: DBTransaction): Promise<boolean> => {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      logger.debug(`[LearningResourceRepository.deleteResource] Attempting deletion for ID: ${id}`);

      // 1. Pre-deletion Verification
      const existingRecord = await t
        .select({
          id: learningResources.id,
          filePath: learningResources.filePath,
          displayName: learningResources.displayName,
        })
        .from(learningResources)
        .where(and(eq(learningResources.id, id), isNull(learningResources.deletedAt)))
        .limit(1);

      // If the array is empty, the record does not exist
      if (existingRecord.length === 0) {
        logger.warn(`[LearningResourceRepository.deleteResource] Resource ID not found: ${id}`);
        throw new Error(errorsTranslations.resourceNotFound);
      }

      // Log the metadata of what we are about to destroy
      logger.info(
        `[LearningResourceRepository.deleteResource] Hard deleting resource: ${existingRecord[0].displayName} (${existingRecord[0].filePath})`
      );

      // 2. Execution of Hard Delete
      await t.delete(learningResources).where(eq(learningResources.id, id));

      logger.debug(`[LearningResourceRepository.deleteResource] Successfully deleted ID: ${id}`);

      return true;
    };

    if (tx) {
      return await execute(tx);
    }
    return await db.transaction(execute);
  }
}
