import { and, count, eq, isNull, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, type db, isSqlite, type QueryDbHandle, queryDb } from "@/backend/db";
import { complaints, parents, students, users } from "@/backend/db/schema";
import { ComplaintStatus } from "@/backend/enum";
import { assertComplaintCategory, assertComplaintStatus } from "@/backend/lib";
import type { ComplaintReturnType, DBTransaction } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";

export function buildComplaintQueueConditions(
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

export function buildComplaintQueueSelect(q: QueryDbHandle | DBTransaction) {
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

export function mapComplaintQueueRow(r: {
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
