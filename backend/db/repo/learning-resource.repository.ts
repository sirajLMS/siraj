import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { learningResources } from "@/backend/db/schema";
import { learningResourceFiles } from "@/backend/db/schema/storage";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface LearningResourceRow {
  readonly id: string;
  readonly displayName: string;
  readonly filePath: string;
  readonly uploadedByUserId: string;
  readonly uploadedByUserName: string | null;
  readonly fileSize: number | null;
  readonly contentType: string | null;
  readonly createdAt: Date;
}

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

export namespace LearningResourceRepository {
  export async function listResources(tx?: DBTransaction): Promise<LearningResourceListResult> {
    const queryDb = tx ?? db;

    const baseWhere = isNull(learningResources.deletedAt);

    const rowsQuery = queryDb
      .select({
        id: learningResources.id,
        displayName: learningResources.displayName,
        filePath: learningResources.filePath,
        uploadedByUserId: learningResources.uploadedByUserId,
        uploadedByUserName: sql<string | null>`NULL`,
        fileSize: sql<number | null>`NULL`,
        contentType: sql<string | null>`NULL`,
        createdAt: learningResources.createdAt,
      })
      .from(learningResources)
      .where(baseWhere)
      .orderBy(desc(learningResources.createdAt));

    const countQuery = queryDb.select({ count: sql<number>`count(*)::int` }).from(learningResources).where(baseWhere);

    const [rows, countResult] = await Promise.all([rowsQuery, countQuery]);

    const totalCount = countResult[0]?.count ?? 0;

    return { rows, totalCount };
  }

  export async function createResource(
    input: LearningResourceCreateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<LearningResourceRow> {
    const createTx = async (t: DBTransaction): Promise<LearningResourceRow> => {
      const t18n = await getBackendTranslations({ locale, namespace: "errors" });
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
        throw new Error(t18n("resourceCreateFailed"));
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

      return {
        id: resource.id,
        displayName: resource.displayName,
        filePath: resource.filePath,
        uploadedByUserId: resource.uploadedByUserId,
        uploadedByUserName: null,
        fileSize: null,
        contentType: null,
        createdAt: resource.createdAt,
      };
    };

    if (tx) {
      return await createTx(tx);
    }
    return await db.transaction(createTx);
  }

  export async function findById(resourceId: string, tx?: DBTransaction): Promise<LearningResourceRow | null> {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({
        id: learningResources.id,
        displayName: learningResources.displayName,
        filePath: learningResources.filePath,
        uploadedByUserId: learningResources.uploadedByUserId,
        uploadedByUserName: sql<string | null>`NULL`,
        fileSize: sql<number | null>`NULL`,
        contentType: sql<string | null>`NULL`,
        createdAt: learningResources.createdAt,
      })
      .from(learningResources)
      .where(and(eq(learningResources.id, resourceId), isNull(learningResources.deletedAt)))
      .limit(1);

    return results[0] ?? null;
  }
}
