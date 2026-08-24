import { and, count, desc, eq, isNull, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, type db, isSqlite, type QueryDbHandle, queryDb, queryWithPagination } from "@/backend/db";
import { complaintFiles, complaints, parents, storageFiles, students, users } from "@/backend/db/schema";
import { ComplaintStatus } from "@/backend/enum";
import { assertComplaintCategory, assertComplaintStatus } from "@/backend/lib";
import type {
  ComplaintFileReturnType,
  ComplaintQueuePaginatedResult,
  ComplaintQueueRawResult,
  ComplaintResponseReturnType,
  ComplaintReturnType,
  ComplaintSelectType,
  ComplaintSubmitInput,
  DBTransaction,
  PaginationArgs,
  ParentComplaintPaginatedResult,
} from "@/backend/types";
import { escapeLikeWildcards, PaginationUtils } from "@/backend/utils";
import { getServerTranslations } from "@/shared/locale/server-graphql";

function buildComplaintQueueConditions(
  options: { search?: string | null; status?: string | null },
  _queryDb: unknown
): SQL | undefined {
  const conditions = [isNull(complaints.deletedAt)];

  if (options.status) {
    conditions.push(eq(complaints.status, assertComplaintStatus(options.status)));
  }

  if (options.search) {
    conditions.push(caseInsensitiveLike(users.name, `%${escapeLikeWildcards(options.search)}%`));
  }

  return and(...conditions);
}

function buildComplaintQueueSelect(q: QueryDbHandle | DBTransaction) {
  return q
    .select({
      id: complaints.id,
      parentId: complaints.parentId,
      parentName: users.name,
      parentAvatarUrl: users.avatarUrl,
      studentId: complaints.studentId,
      studentName: students.name,
      category: complaints.category,
      submitterEmail: complaints.submitterEmail,
      body: complaints.body,
      status: complaints.status,
      responseCount: sql<number>`(
        SELECT COUNT(*) FROM complaint_responses
        WHERE complaint_responses.complaint_id = ${complaints.id}
      )`.mapWith(Number),
      createdAt: complaints.createdAt,
      updatedAt: complaints.updatedAt,
    })
    .from(complaints)
    .leftJoin(parents, eq(complaints.parentId, parents.id))
    .leftJoin(users, eq(parents.userId, users.id))
    .leftJoin(students, eq(complaints.studentId, students.id));
}

function mapComplaintQueueRow(r: {
  id: string;
  parentId: string;
  studentId: string | null;
  category: string;
  submitterEmail: string;
  body: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  parentName: string | null;
  parentAvatarUrl: string | null;
  studentName: string | null;
  responseCount?: number;
}): ComplaintReturnType {
  return {
    id: r.id,
    category: assertComplaintCategory(r.category),
    body: r.body,
    status: assertComplaintStatus(r.status),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    parentName: r.parentName ?? null,
    parentAvatarUrl: r.parentAvatarUrl ?? null,
    studentName: r.studentName ?? null,
    responseCount: r.responseCount,
  };
}

export namespace ComplaintRepository {
  export type ComplaintInsertInput = ComplaintSubmitInput & {
    parentId: string;
    status: ComplaintStatus;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export const insertComplaint = async (
    input: ComplaintInsertInput,
    tx?: DBTransaction
  ): Promise<ComplaintSelectType> => {
    const q = queryDb(tx);
    const now = new Date();

    const [created] = await q
      .insert(complaints)
      .values({
        parentId: input.parentId,
        studentId: input.studentId ?? null,
        category: input.category,
        submitterEmail: input.submitterEmail,
        body: input.body,
        status: input.status,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create seed complaint");
    }

    return created;
  };

  export const submitComplaint = async (
    input: ComplaintSubmitInput,
    parentId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ComplaintSelectType> => {
    const q = queryDb(tx);
    const now = new Date();

    const [created] = await q
      .insert(complaints)
      .values({
        ...input,
        parentId,
        status: ComplaintStatus.UNANSWERED,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(i18n.complaint.createFailed);
    }

    return {
      ...created,
    };
  };

  export const getComplaintsByParent = async (
    parentId: string,
    pagination: PaginationArgs | null = null,
    tx?: DBTransaction
  ): Promise<ParentComplaintPaginatedResult> => {
    const q = queryDb(tx);

    const whereCondition = and(eq(complaints.parentId, parentId), isNull(complaints.deletedAt));

    const baseQuery = q
      .select({
        id: complaints.id,
        parentId: complaints.parentId,
        studentId: complaints.studentId,
        studentName: students.name,
        category: complaints.category,
        submitterEmail: complaints.submitterEmail,
        body: complaints.body,
        status: complaints.status,
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
      })
      .from(complaints)
      .leftJoin(students, eq(complaints.studentId, students.id))
      .where(whereCondition)
      .orderBy(desc(complaints.createdAt))
      .$dynamic();

    const [rows, countResult] = await Promise.all([
      queryWithPagination(baseQuery, pagination),
      q.select({ total: count() }).from(complaints).where(whereCondition),
    ]);

    const total = countResult[0]?.total ?? 0;

    const complaintsList: ComplaintReturnType[] = rows.map(r => ({
      id: r.id,
      category: assertComplaintCategory(r.category),
      body: r.body,
      status: assertComplaintStatus(r.status),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      studentName: r.studentName ?? null,
      responses: [] as ReadonlyArray<ComplaintResponseReturnType>,
    }));

    const pageInfo = PaginationUtils.buildPageInfoFromArgs(pagination, complaintsList.length, total);

    return {
      id: `parent-complaints-${parentId}`,
      complaints: complaintsList,
      totalCount: total,
      pageInfo,
    };
  };

  export const getComplaintQueue = async (
    options: { search?: string | null; status?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<ComplaintQueueRawResult> => {
    const q = queryDb(tx);
    const whereClause = buildComplaintQueueConditions(options, q);

    const rows = await buildComplaintQueueSelect(q)
      .where(whereClause)
      .orderBy(desc(complaints.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const typedRows: ComplaintReturnType[] = rows.map(mapComplaintQueueRow);
    const { statusCounts, avgResolutionHours } = await getComplaintMetricsRaw(whereClause, tx);

    return {
      id: `complaint-queue-${Date.now()}`,
      complaints: typedRows,
      rawMetrics: { statusCounts, avgResolutionHours },
    };
  };

  export const getComplaintQueuePaginated = async (
    options: { search?: string | null; status?: string | null },
    paginationArgs: PaginationArgs | null,
    tx?: DBTransaction
  ): Promise<ComplaintQueuePaginatedResult> => {
    const q = queryDb(tx);
    const whereClause = buildComplaintQueueConditions(options, q);

    let rowsQuery = buildComplaintQueueSelect(q).where(whereClause).orderBy(desc(complaints.createdAt)).$dynamic();

    if (paginationArgs) {
      rowsQuery = queryWithPagination(rowsQuery, paginationArgs);
    }

    const [rows, countResult] = await Promise.all([
      rowsQuery,
      q
        .select({ total: count() })
        .from(complaints)
        .leftJoin(parents, eq(complaints.parentId, parents.id))
        .leftJoin(users, eq(parents.userId, users.id))
        .where(whereClause),
    ]);

    const total = countResult[0]?.total ?? 0;

    const typedRows: ComplaintReturnType[] = rows.map(mapComplaintQueueRow);
    const pageInfo = PaginationUtils.buildPageInfoFromArgs(paginationArgs, typedRows.length, total);

    return {
      rows: typedRows,
      totalCount: total,
      pageInfo,
    };
  };

  export const getComplaintById = async (complaintId: string, tx?: DBTransaction) => {
    const q = queryDb(tx);

    const results = await q
      .select({
        id: complaints.id,
        parentId: complaints.parentId,
        parentName: users.name,
        studentId: complaints.studentId,
        studentName: students.name,
        category: complaints.category,
        submitterEmail: complaints.submitterEmail,
        body: complaints.body,
        status: complaints.status,
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
      })
      .from(complaints)
      .leftJoin(parents, eq(complaints.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .leftJoin(students, eq(complaints.studentId, students.id))
      .where(and(eq(complaints.id, complaintId), isNull(complaints.deletedAt)))
      .limit(1);

    return results[0] ?? null;
  };

  /**
   * Raw status counts for complaint metrics — the service layer
   * (`deriveComplaintMetrics`) computes the final `ComplaintMetrics`.
   */
  export const getComplaintStatusCounts = async (
    whereClause?: SQL,
    txOrDb?: DBTransaction | typeof db
  ): Promise<{ status: string; count: number }[]> => {
    const q = queryDb(typeof txOrDb === "function" ? undefined : txOrDb);

    const baseCondition = isNull(complaints.deletedAt);
    const finalWhereClause = whereClause ? and(baseCondition, whereClause) : baseCondition;

    return q
      .select({
        status: complaints.status,
        count: count(),
      })
      .from(complaints)
      .leftJoin(parents, eq(complaints.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(finalWhereClause)
      .groupBy(complaints.status);
  };

  /**
   * Raw average resolution hours for ANSWERED complaints — the service layer
   * (`deriveComplaintMetrics`) uses this to compute formatted display strings.
   */
  export const getComplaintAvgResolutionHours = async (txOrDb?: DBTransaction | typeof db): Promise<number> => {
    const q = queryDb(typeof txOrDb === "function" ? undefined : txOrDb);

    const epochExpr = isSqlite()
      ? sql<number>`((${complaints.updatedAt} - ${complaints.createdAt}) / 1000.0 / 3600.0)`
      : sql<number>`EXTRACT(EPOCH FROM (${complaints.updatedAt} - ${complaints.createdAt})) / 3600`;

    const [avgResult] = await q
      .select({
        avgHours: sql<number>`COALESCE(AVG(${epochExpr}), 0)`.mapWith(Number),
      })
      .from(complaints)
      .where(and(eq(complaints.status, ComplaintStatus.ANSWERED), isNull(complaints.deletedAt)));

    return avgResult?.avgHours ?? 0;
  };

  /**
   * Convenience wrapper — returns raw status counts and avg hours.
   * The service layer (`ComplaintService`) calls this and then uses
   * `deriveComplaintMetrics` to build the final `ComplaintMetrics`.
   */
  export const getComplaintMetricsRaw = async (
    whereClause?: SQL,
    txOrDb?: DBTransaction | typeof db
  ): Promise<{
    statusCounts: { status: string; count: number }[];
    avgResolutionHours: number;
  }> => {
    const [statusCounts, avgResolutionHours] = await Promise.all([
      getComplaintStatusCounts(whereClause, txOrDb),
      getComplaintAvgResolutionHours(txOrDb),
    ]);
    return { statusCounts, avgResolutionHours };
  };

  export const getUnansweredComplaints = async (limit: number, tx?: DBTransaction) => {
    const q = queryDb(tx);

    return q
      .select({
        id: complaints.id,
        body: complaints.body,
        createdAt: complaints.createdAt,
      })
      .from(complaints)
      .where(and(eq(complaints.status, ComplaintStatus.UNANSWERED), isNull(complaints.deletedAt)))
      .orderBy(desc(complaints.createdAt))
      .limit(limit);
  };

  export const getComplaintFiles = async (
    complaintId: string,
    tx?: DBTransaction
  ): Promise<ComplaintFileReturnType[]> => {
    const q = queryDb(tx);

    return q
      .select({
        fileId: storageFiles.id,
        publicUrl: storageFiles.path,
        isProtected: storageFiles.isProtected,
        usageType: complaintFiles.usageType,
        createdAt: complaintFiles.createdAt,
      })
      .from(complaintFiles)
      .innerJoin(storageFiles, eq(complaintFiles.fileId, storageFiles.id))
      .where(eq(complaintFiles.complaintId, complaintId))
      .orderBy(desc(complaintFiles.createdAt));
  };
}
