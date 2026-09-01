import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { appraisalFeedback, monthlyAppraisals, users } from "@/backend/db/schema";
import type {
  AppraisalFeedbackInput,
  AppraisalFeedbackReturnType,
  DBTransaction,
  MonthlyAppraisalReturnType,
  MonthlyAppraisalSelectType,
  MonthlyAppraisalSubmitInput,
} from "@/backend/types";

/**
 * Monthly Appraisal repository — data-access only.
 *
 * Tenancy / ownership is enforced at the service layer (Task 2.2): the repo
 * accepts `studentId` / `teacherId` as plain parameters and trusts whatever
 * the service passes (the service verifies `teacher.teaches(student)` and
 * `parent.owns(student)` before calling).
 *
 * Read paths use `queryDb(tx)` (Neon HTTP rule); write paths use
 * `executor = tx ?? db`. Upsert targets the unique key
 * `(studentId, teacherId, month)` via `onConflictDoUpdate` with an explicit
 * column list (no input spread — BOPLA). Feedback is batch-loaded via a single
 * `inArray(appraisalId, ids)` query (NO prepared statement — `inArray` is
 * incompatible with PG prepared statement protocol).
 */

/**
 * Batch-load feedback rows for a list of appraisal IDs and group them by
 * `appraisalId`. Author names come from a single leftJoin on `users.name`.
 * Returns a Map keyed by `appraisalId` whose values are the chronological
 * feedback arrays (oldest first). Empty array when no feedback exists.
 */
async function loadFeedbackByAppraisalIds(
  appraisalIds: readonly string[],
  tx?: DBTransaction
): Promise<Map<string, AppraisalFeedbackReturnType[]>> {
  const grouped = new Map<string, AppraisalFeedbackReturnType[]>();
  if (appraisalIds.length === 0) return grouped;
  const q = queryDb(tx);
  const rows = await q
    .select({
      id: appraisalFeedback.id,
      appraisalId: appraisalFeedback.appraisalId,
      authorUserId: appraisalFeedback.authorUserId,
      body: appraisalFeedback.body,
      createdAt: appraisalFeedback.createdAt,
      authorName: users.name,
    })
    .from(appraisalFeedback)
    .leftJoin(users, eq(appraisalFeedback.authorUserId, users.id))
    .where(inArray(appraisalFeedback.appraisalId, [...appraisalIds]))
    .orderBy(asc(appraisalFeedback.createdAt));
  for (const row of rows) {
    const list = grouped.get(row.appraisalId) ?? [];
    list.push({
      id: row.id,
      appraisalId: row.appraisalId,
      authorUserId: row.authorUserId,
      body: row.body,
      createdAt: row.createdAt,
      authorName: row.authorName ?? null,
    });
    grouped.set(row.appraisalId, list);
  }
  return grouped;
}

/**
 * Attach the `feedback` array to each appraisal row (mutates the row in place
 * by adding the optional `feedback` property). Sparse rubric fields are left
 * untouched — the UI decides which to render (R1.3).
 */
function withFeedback(
  rows: MonthlyAppraisalSelectType[],
  feedbackMap: Map<string, AppraisalFeedbackReturnType[]>
): MonthlyAppraisalReturnType[] {
  return rows.map(row => ({
    ...row,
    feedback: feedbackMap.get(row.id) ?? null,
  }));
}

export namespace MonthlyAppraisalRepository {
  /**
   * Idempotent upsert by `(studentId, teacherId, month)`. On conflict, the
   * rubric + `learningTargets` fields are overwritten and `updatedAt` is
   * refreshed; `id`, `createdAt`, and the unique-key columns are preserved.
   * Returns the upserted row with its feedback thread attached.
   */
  export async function upsert(
    input: MonthlyAppraisalSubmitInput,
    tx?: DBTransaction
  ): Promise<MonthlyAppraisalReturnType> {
    const executor = tx ?? db;
    const now = new Date();
    const [row] = await executor
      .insert(monthlyAppraisals)
      .values({
        studentId: input.studentId,
        teacherId: input.teacherId,
        month: input.month,
        behaviorGrade: input.behaviorGrade ?? null,
        behaviorComment: input.behaviorComment ?? null,
        attendanceGrade: input.attendanceGrade ?? null,
        attendanceComment: input.attendanceComment ?? null,
        punctualityGrade: input.punctualityGrade ?? null,
        punctualityComment: input.punctualityComment ?? null,
        overallGrade: input.overallGrade ?? null,
        overallComment: input.overallComment ?? null,
        learningTargets: input.learningTargets,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [monthlyAppraisals.studentId, monthlyAppraisals.teacherId, monthlyAppraisals.month],
        set: {
          behaviorGrade: input.behaviorGrade ?? null,
          behaviorComment: input.behaviorComment ?? null,
          attendanceGrade: input.attendanceGrade ?? null,
          attendanceComment: input.attendanceComment ?? null,
          punctualityGrade: input.punctualityGrade ?? null,
          punctualityComment: input.punctualityComment ?? null,
          overallGrade: input.overallGrade ?? null,
          overallComment: input.overallComment ?? null,
          learningTargets: input.learningTargets,
          updatedAt: now,
        },
      })
      .returning();

    if (!row) {
      throw new Error("MonthlyAppraisalRepository.upsert: insert returned no row");
    }

    const feedbackMap = await loadFeedbackByAppraisalIds([row.id], tx);
    return withFeedback([row], feedbackMap)[0];
  }

  /**
   * Fetch a single appraisal by primary key with its feedback thread.
   * Returns `null` when no appraisal matches the id.
   */
  export async function findById(id: string, tx?: DBTransaction): Promise<MonthlyAppraisalReturnType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(monthlyAppraisals).where(eq(monthlyAppraisals.id, id)).limit(1);
    if (!row) return null;
    const feedbackMap = await loadFeedbackByAppraisalIds([row.id], tx);
    return withFeedback([row], feedbackMap)[0];
  }

  /**
   * Exact-month lookup for a student. If multiple teachers authored an
   * appraisal for the same month, the most recent (by `createdAt` DESC) wins
   * — the service may use `listForStudent` for the full set.
   */
  export async function findForStudentMonth(
    studentId: string,
    month: Date,
    tx?: DBTransaction
  ): Promise<MonthlyAppraisalReturnType | null> {
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(monthlyAppraisals)
      .where(and(eq(monthlyAppraisals.studentId, studentId), eq(monthlyAppraisals.month, month)))
      .orderBy(desc(monthlyAppraisals.createdAt))
      .limit(1);
    if (!row) return null;
    const feedbackMap = await loadFeedbackByAppraisalIds([row.id], tx);
    return withFeedback([row], feedbackMap)[0];
  }

  /**
   * All appraisals for a student, newest month first. Caller is responsible
   * for tenant scoping (service layer passes a `studentId` already verified
   * against the caller's family).
   */
  export async function listForStudent(studentId: string, tx?: DBTransaction): Promise<MonthlyAppraisalReturnType[]> {
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(monthlyAppraisals)
      .where(eq(monthlyAppraisals.studentId, studentId))
      .orderBy(desc(monthlyAppraisals.month), desc(monthlyAppraisals.createdAt));
    if (rows.length === 0) return [];
    const feedbackMap = await loadFeedbackByAppraisalIds(
      rows.map(r => r.id),
      tx
    );
    return withFeedback(rows, feedbackMap);
  }

  /**
   * All appraisals authored by a teacher for the given student set (teacher
   * view). Caller is responsible for verifying the teacher owns the listed
   * students (service-layer tenancy).
   */
  export async function listForTeacherStudents(
    teacherId: string,
    studentIds: readonly string[],
    tx?: DBTransaction
  ): Promise<MonthlyAppraisalReturnType[]> {
    if (studentIds.length === 0) return [];
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(monthlyAppraisals)
      .where(and(eq(monthlyAppraisals.teacherId, teacherId), inArray(monthlyAppraisals.studentId, [...studentIds])))
      .orderBy(desc(monthlyAppraisals.month), desc(monthlyAppraisals.createdAt));
    if (rows.length === 0) return [];
    const feedbackMap = await loadFeedbackByAppraisalIds(
      rows.map(r => r.id),
      tx
    );
    return withFeedback(rows, feedbackMap);
  }

  /**
   * Append a feedback row to an existing appraisal (R1.4 feedback loop).
   * `authorUserId` is resolved at the service layer from auth context. The
   * repo trusts whatever is passed. Returns the inserted row with the
   * author's display name joined for UI rendering.
   */
  export async function appendFeedback(
    input: AppraisalFeedbackInput,
    tx?: DBTransaction
  ): Promise<AppraisalFeedbackReturnType> {
    const executor = tx ?? db;
    const [inserted] = await executor
      .insert(appraisalFeedback)
      .values({
        appraisalId: input.appraisalId,
        authorUserId: input.authorUserId,
        body: input.body,
        createdAt: new Date(),
      })
      .returning();
    if (!inserted) {
      throw new Error("MonthlyAppraisalRepository.appendFeedback: insert returned no row");
    }
    // Single-row author name lookup — keeps the return shape consistent with
    // batch-loaded feedback rows (which also carry `authorName`).
    const q = queryDb(tx);
    const [authorRow] = await q
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, inserted.authorUserId))
      .limit(1);
    return {
      ...inserted,
      authorName: authorRow?.name ?? null,
    };
  }
}
