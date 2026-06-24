import { and, count, desc, eq, ilike, isNull, type SQL, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaints, parents, students, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type {
  ComplaintMetrics,
  ComplaintQueueResult,
  ComplaintResponse,
  ComplaintReturnType,
  ComplaintSelectType,
  ComplaintSubmitInput,
} from "@/backend/types";
import { type ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";
import type { DBTransaction } from "../db.types";

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

export namespace ComplaintRepository {
  export const submitComplaint = async (
    input: ComplaintSubmitInput,
    parentId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ComplaintSelectType> => {
    const queryDb = tx ?? db;
    const now = new Date();

    const [created] = await queryDb
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
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("complaint.createFailed"));
    }

    return {
      ...created,
    };
  };

  export const getComplaintsByParent = async (parentId: string, tx?: DBTransaction): Promise<ComplaintReturnType[]> => {
    const queryDb = tx ?? db;

    const results = await queryDb
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
      .where(and(eq(complaints.parentId, parentId), isNull(complaints.deletedAt)))
      .orderBy(desc(complaints.createdAt));

    return results.map(r => ({
      id: r.id,
      parentId: r.parentId,
      studentId: r.studentId ?? null,
      category: r.category as ComplaintCategory,
      submitterEmail: r.submitterEmail,
      body: r.body,
      status: r.status as ComplaintStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      studentName: r.studentName ?? null,
      responses: [] as ReadonlyArray<ComplaintResponse>,
    }));
  };

  export const getComplaintQueue = async (
    options: { search?: string | null; status?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<ComplaintQueueResult> => {
    const queryDb = tx ?? db;

    const conditions = [isNull(complaints.deletedAt)];

    if (options.status) {
      conditions.push(eq(complaints.status, options.status as ComplaintStatus));
    }

    if (options.search) {
      conditions.push(ilike(users.name, `%${options.search}%`));
    }

    const whereClause = and(...conditions);

    const rows = await queryDb
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
      .leftJoin(students, eq(complaints.studentId, students.id))
      .where(whereClause)
      .orderBy(desc(complaints.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const typedRows: ComplaintReturnType[] = rows.map(r => ({
      id: r.id,
      parentId: r.parentId,
      studentId: r.studentId ?? null,
      category: r.category as ComplaintCategory,
      submitterEmail: r.submitterEmail,
      body: r.body,
      status: r.status as ComplaintStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      parentName: r.parentName ?? null,
      studentName: r.studentName ?? null,
      responseCount: r.responseCount,
    }));

    const metrics = await getComplaintMetrics(whereClause, queryDb);

    return {
      id: `complaint-queue-${Date.now()}`,
      complaints: typedRows,
      metrics,
    };
  };

  export const getComplaintById = async (complaintId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;

    const results = await queryDb
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
    whereClause?: SQL | undefined,
    txOrDb?: DBTransaction | typeof db
  ): Promise<ComplaintMetrics> => {
    const queryDb = txOrDb ?? db;

    const baseCondition = isNull(complaints.deletedAt);
    const finalWhereClause = whereClause ? and(baseCondition, whereClause) : baseCondition;

    const statusCounts = await queryDb
      .select({
        status: complaints.status,
        count: count(),
      })
      .from(complaints)
      .where(finalWhereClause)
      .groupBy(complaints.status);

    const unanswered = statusCounts.find(r => r.status === ComplaintStatus.UNANSWERED)?.count ?? 0;
    const answered = statusCounts.find(r => r.status === ComplaintStatus.ANSWERED)?.count ?? 0;
    const totalCount = statusCounts.reduce((sum, r) => sum + r.count, 0);

    const [avgResult] = await queryDb
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
    const queryDb = tx ?? db;

    return queryDb
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
}
