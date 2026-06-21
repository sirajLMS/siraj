import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { invoices, parents, students, users } from "@/backend/db/schema";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export namespace ParentRepository {
  export type ParentDirectoryMetrics = {
    activated: number;
    deactivated: number;
    regular: number;
    onLeave: number;
    suspended: number;
    onTrial: number;
  };

  export type ParentDirectoryRow = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    status: string;
    updatedAt: Date;
    unpaidInvoices: number;
  };

  export type ParentDirectoryResult = {
    metrics: ParentDirectoryMetrics;
    rows: ParentDirectoryRow[];
    totalParents: number;
  };

  export const getParentDirectory = async (
    options: { search?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<ParentDirectoryResult> => {
    const queryDb = tx ?? db;

    // Calculate metrics
    const metricsResult = await queryDb
      .select({
        status: parents.status,
        count: count(),
      })
      .from(parents)
      .groupBy(parents.status);

    const metrics: ParentDirectoryMetrics = {
      activated: metricsResult.find(m => m.status === "ACTIVATED")?.count ?? 0,
      deactivated: metricsResult.find(m => m.status === "DEACTIVATED")?.count ?? 0,
      regular: metricsResult.find(m => m.status === "REGULAR")?.count ?? 0,
      onLeave: metricsResult.find(m => m.status === "ON_LEAVE")?.count ?? 0,
      suspended: metricsResult.find(m => m.status === "SUSPENDED")?.count ?? 0,
      onTrial: metricsResult.find(m => m.status === "ON_TRIAL")?.count ?? 0,
    };

    const conditions = [];
    if (options.search) {
      conditions.push(or(ilike(users.name, `%${options.search}%`), ilike(users.email, `%${options.search}%`)));
    }

    const rowsQuery = queryDb
      .select({
        id: parents.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: parents.status,
        updatedAt: parents.updatedAt,
        unpaidInvoices: sql<number>`COALESCE(
          (SELECT COUNT(*) FROM ${invoices} 
           WHERE ${invoices.parentId} = ${parents.id} 
           AND ${invoices.status} = 'UNPAID'), 0)`.mapWith(Number),
      })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(parents.updatedAt))
      .limit(options.limit)
      .offset(options.offset);

    const rows = await rowsQuery;

    const [totalCount] = await queryDb
      .select({ count: count() })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      metrics,
      rows,
      totalParents: totalCount?.count ?? 0,
    };
  };

  export const getStudentsForParent = async (parentId: string, tx?: DBTransaction): Promise<{ name: string }[]> => {
    const queryDb = tx ?? db;
    return await queryDb.select({ name: students.name }).from(students).where(eq(students.parentId, parentId)).limit(5);
  };
}
