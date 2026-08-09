import { and, count, desc, eq, ilike, isNull, type SQL, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import type { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { complaintFiles, complaints, parents, storageFiles, students, users } from "@/backend/db/schema";
import { type ComplaintCategory, ComplaintStatus } from "@/backend/enum";
import type {
  ComplaintFileReturnType,
  ComplaintMetrics,
  ComplaintQueuePaginatedResult,
  ComplaintQueueResult,
  ComplaintResponseReturnType,
  ComplaintReturnType,
  ComplaintSelectType,
  ComplaintSubmitInput,
  PaginationArgs,
  ParentComplaintPaginatedResult,
} from "@/backend/types";
import { escapeLikeWildcards, PaginationUtils } from "@/backend/utils";

function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  } else if (hours < 24) {
    return `${Math.round(hours)}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  }
}

function buildComplaintQueueConditions(
  options: { search?: string | null; status?: string | null },
  _queryDb: unknown
): SQL | undefined {
  const conditions = [isNull(complaints.deletedAt)];

  if (options.status) {
    conditions.push(eq(complaints.status, options.status as ComplaintStatus));
  }

  if (options.search) {
    conditions.push(ilike(users.name, `%${escapeLikeWildcards(options.search)}%`));
  }

  return and(...conditions);
}

function buildComplaintQueueSelect(q: ReturnType<typeof queryDb>) {
  return (q as typeof db)
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
    category: r.category as ComplaintCategory,
    body: r.body,
    status: r.status as ComplaintStatus,
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
    _locale?: string
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
      throw new Error("Failed to create complaint");
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
      category: r.category as ComplaintCategory,
      body: r.body,
      status: r.status as ComplaintStatus,
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
  ): Promise<ComplaintQueueResult> => {
    const q = queryDb(tx);
    const whereClause = buildComplaintQueueConditions(options, q);

    const rows = await buildComplaintQueueSelect(q)
      .where(whereClause)
      .orderBy(desc(complaints.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const typedRows: ComplaintReturnType[] = rows.map(mapComplaintQueueRow);
    const metrics = await getComplaintMetrics(whereClause, tx);

    return {
      id: `complaint-queue-${Date.now()}`,
      complaints: typedRows,
      metrics,
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

  export const getComplaintMetrics = async (
    whereClause?: SQL,
    txOrDb?: DBTransaction | typeof db
  ): Promise<ComplaintMetrics> => {
    const q = queryDb(typeof txOrDb === "function" ? undefined : txOrDb);

    const baseCondition = isNull(complaints.deletedAt);
    const finalWhereClause = whereClause ? and(baseCondition, whereClause) : baseCondition;

    const statusCounts = await q
      .select({
        status: complaints.status,
        count: count(),
      })
      .from(complaints)
      .leftJoin(parents, eq(complaints.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(finalWhereClause)
      .groupBy(complaints.status);

    const unanswered = statusCounts.find(r => r.status === ComplaintStatus.UNANSWERED)?.count ?? 0;
    const answered = statusCounts.find(r => r.status === ComplaintStatus.ANSWERED)?.count ?? 0;
    const totalCount = statusCounts.reduce((sum, r) => sum + r.count, 0);

    const [avgResult] = await q
      .select({
        avgHours: sql<number>`COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${complaints.updatedAt} - ${complaints.createdAt})) / 3600
          ), 0
        )`.mapWith(Number),
      })
      .from(complaints)
      .where(and(eq(complaints.status, ComplaintStatus.ANSWERED), isNull(complaints.deletedAt)));

    const avgResolutionHours = Math.round((avgResult?.avgHours ?? 0) * 100) / 100;
    const avgResolutionTime = avgResolutionHours > 0 ? formatDuration(avgResolutionHours) : null;

    return {
      id: "complaint-metrics",
      unanswered,
      answered,
      avgResolutionHours,
      avgResolutionTime,
      totalCount,
    };
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
