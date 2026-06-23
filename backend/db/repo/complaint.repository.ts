import { and, count, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaints, parents, students, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { ComplaintStatus } from "@/shared/lib/enum";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ComplaintSubmitInput {
  parentId: string;
  studentId?: string | null;
  category: "REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER";
  submitterEmail: string;
  body: string;
}

export type AdminComplaintQueueRow = {
  id: string;
  parentId: string;
  parentName: string | null;
  studentId: string | null;
  studentName: string | null;
  category: string;
  submitterEmail: string;
  body: string;
  status: string;
  responseCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminComplaintQueueResult = {
  rows: AdminComplaintQueueRow[];
  totalCount: number;
};

export type ComplaintMetrics = {
  unanswered: number;
  answered: number;
  avgResolutionHours: number;
};

export namespace ComplaintRepository {
  export const submitComplaint = async (input: ComplaintSubmitInput, tx?: DBTransaction, locale?: string) => {
    const queryDb = tx ?? db;
    const now = new Date();

    const [created] = await queryDb
      .insert(complaints)
      .values({
        parentId: input.parentId,
        studentId: input.studentId ?? null,
        category: input.category,
        submitterEmail: input.submitterEmail,
        body: input.body,
        status: ComplaintStatus.UNANSWERED,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("complaint.createFailed"));
    }

    return created;
  };

  export const getComplaintsByParent = async (parentId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;

    return queryDb
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
  };

  export const getAdminComplaintQueue = async (
    options: { search?: string | null; status?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<AdminComplaintQueueResult> => {
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

    const [totalCount] = await queryDb
      .select({ count: count() })
      .from(complaints)
      .leftJoin(parents, eq(complaints.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(whereClause);

    return {
      rows,
      totalCount: totalCount?.count ?? 0,
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

  export const getComplaintMetrics = async (tx?: DBTransaction): Promise<ComplaintMetrics> => {
    const queryDb = tx ?? db;

    const statusCounts = await queryDb
      .select({
        status: complaints.status,
        count: count(),
      })
      .from(complaints)
      .where(isNull(complaints.deletedAt))
      .groupBy(complaints.status);

    const unanswered = statusCounts.find(r => r.status === ComplaintStatus.UNANSWERED)?.count ?? 0;
    const answered = statusCounts.find(r => r.status === ComplaintStatus.ANSWERED)?.count ?? 0;

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

    return {
      unanswered,
      answered,
      avgResolutionHours: Math.round((avgResult?.avgHours ?? 0) * 100) / 100,
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
