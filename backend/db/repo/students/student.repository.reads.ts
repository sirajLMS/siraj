import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db, queryDb, queryWithPagination } from "@/backend/db";
import { decodeStudentCursor, encodeStudentCursor } from "@/backend/db/repo/students/student.repository.helpers";
import {
  applyStudentCursorCondition,
  buildAssignedStudentsQuery,
  buildStudentDirectoryBaseQuery,
  buildStudentDirectoryCountQuery,
  buildStudentFilterBaseQuery,
  buildStudentProfileSelect,
  mapAssignedStudentRow,
  mapStudentDirectoryRow,
  mapStudentProfileRow,
  type StudentFilterBaseQuery,
  type StudentProfileRow,
} from "@/backend/db/repo/students/student.repository.query-builders";
import { students, teacherAssignments, users } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { PaginationUtils, StudentFilterUtils, StudentUtils } from "@/backend/utils";
import { getServerTranslations } from "@/shared/locale";

async function processStudentQuery(
  query: StudentFilterBaseQuery,
  paginationArgs?: Types.PaginationArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null,
  filters?: Types.StudentFilterArgs | null
): Promise<Types.StudentsWithFiltersResponse> {
  let processedQuery = query;
  processedQuery = StudentFilterUtils.applyFilters(processedQuery, filters);
  processedQuery = StudentFilterUtils.applyOrdering(processedQuery, orderBy);

  const cursor = paginationArgs?.after ? decodeStudentCursor(paginationArgs.after) : null;

  if (cursor) {
    processedQuery = applyStudentCursorCondition(processedQuery, cursor, orderBy);
  }

  if (paginationArgs?.after) {
    processedQuery = processedQuery.limit(paginationArgs.perPage);
  } else {
    processedQuery = queryWithPagination(processedQuery, paginationArgs);
  }

  const results = await processedQuery;

  const total = results[0]?.total ?? 0;
  const items: Types.StudentReturnType[] = results
    .map(r => StudentUtils.mapEntityToDto(r.student))
    .filter((s): s is Types.StudentReturnType => s !== null);

  const pageInfo = PaginationUtils.buildPageInfoFromArgs(paginationArgs, items.length, total);

  if (items.length > 0) {
    const firstItem = results[0]?.student;
    const lastItem = results.at(-1)?.student;
    if (firstItem && lastItem) {
      pageInfo.startCursor = encodeStudentCursor(firstItem.createdAt, firstItem.id);
      pageInfo.endCursor = encodeStudentCursor(lastItem.createdAt, lastItem.id);
    }
  }

  return { data: items, pageInfo };
}

export async function fetchStudentsWithFilters(
  paginationArgs: Types.PaginationArgs | null,
  filters?: Types.StudentFilterArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null
): Promise<Types.StudentsWithFiltersResponse> {
  return await processStudentQuery(buildStudentFilterBaseQuery(), paginationArgs, orderBy, filters);
}

export async function findStudentById(
  id: string,
  tx?: DBTransaction
): Promise<Types.StudentSelectType | null | undefined> {
  const q = queryDb(tx);
  const [row] = await q.select().from(students).where(eq(students.id, id)).limit(1);
  return row ?? null;
}

/**
 * Like `findStudentById`, but treats students whose linked user account was
 * soft-deleted as missing — used by write flows that must not act on
 * removed accounts.
 */
export async function findActiveStudentById(id: string, tx?: DBTransaction): Promise<Types.StudentSelectType | null> {
  const q = queryDb(tx);
  const [row] = await q
    .select({ student: students })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.id, id), isNull(users.deletedAt)))
    .limit(1);
  return row?.student ?? null;
}

export async function findStudentIdByUserId(userId: string, tx?: DBTransaction): Promise<string | null> {
  const q = queryDb(tx);
  const [row] = await q.select({ id: students.id }).from(students).where(eq(students.userId, userId)).limit(1);
  return row?.id ?? null;
}

export async function loadStudentsByIds(ids: string[], locale?: string): Promise<(Types.StudentReturnType | Error)[]> {
  if (ids.length === 0) return [];
  const q = queryDb();
  const foundStudents = await q.select().from(students).where(inArray(students.id, ids));
  const { studentNotFound } = getServerTranslations(locale ?? "en").errorsTranslations.student;
  const studentMap = new Map(foundStudents.map(s => [s.id, s]));

  return ids.map(id => {
    const s = studentMap.get(id);
    if (!s) return new Error(studentNotFound(id));
    return StudentUtils.mapEntityToDto(s) ?? new Error(studentNotFound(id));
  });
}

export async function findStudentsByIdempotencyKeys(
  keys: string[],
  tx?: DBTransaction
): Promise<Types.StudentSelectType[]> {
  if (keys.length === 0) return [];
  const executor = tx ?? db;
  return executor.select().from(students).where(inArray(students.idempotencyKey, keys));
}

export async function fetchStudentCreditHourBalance(
  studentId: string,
  tx?: DBTransaction
): Promise<Types.CreditHourBalanceReturnType> {
  const q = queryDb(tx);
  const [row] = await q
    .select({
      creditHoursTotal: students.creditHoursTotal,
      creditHoursRemaining: students.creditHoursRemaining,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  return {
    studentId,
    creditHoursTotal: row?.creditHoursTotal ?? "0",
    creditHoursRemaining: row?.creditHoursRemaining ?? "0",
  };
}

export async function hasStudentTeacherAssignment(
  studentId: string,
  teacherId: string,
  tx?: DBTransaction
): Promise<boolean> {
  const executor = tx ?? db;
  const [row] = await executor
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(and(eq(teacherAssignments.studentId, studentId), eq(teacherAssignments.teacherId, teacherId)))
    .limit(1);
  return !!row;
}

export async function fetchStudentDirectoryRows(
  paginationArgs: Types.PaginationArgs | null,
  filters?: Types.StudentFilterArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null,
  tx?: DBTransaction
): Promise<Types.StudentDirectoryResult> {
  const executor = tx ?? db;
  const baseQuery = buildStudentDirectoryBaseQuery(executor, filters, orderBy, paginationArgs);
  const countQuery = buildStudentDirectoryCountQuery(executor, filters);

  const [rows, countResult] = await Promise.all([baseQuery, countQuery]);
  const totalCount = countResult[0]?.count ?? 0;

  return {
    rows: rows.map(mapStudentDirectoryRow),
    totalCount,
  };
}

export async function fetchStudentsAssignedToTeacher(
  teacherId: string,
  tx?: DBTransaction
): Promise<Types.TeacherAssignedStudentsResult> {
  const executor = tx ?? db;
  const rows = await buildAssignedStudentsQuery(executor, teacherId);
  return {
    rows: rows.map(mapAssignedStudentRow),
    totalCount: rows.length,
  };
}

export async function findStudentProfileById(studentId: string, tx?: DBTransaction): Promise<StudentProfileRow | null> {
  const executor = tx ?? db;

  const results = await buildStudentProfileSelect(executor).where(eq(students.id, studentId)).limit(1);

  if (results.length === 0) {
    return null;
  }

  return mapStudentProfileRow(results[0]);
}

/**
 * Resolve student IDs for a parent and/or teacher without the caller needing
 * to touch the DB directly. Returns students whose `parentId` matches, whose
 * `primaryTeacherId` matches, or who have an active `teacher_assignments`
 * row for the teacher.
 */
export async function findStudentIdsByParentOrTeacher(
  parentId: string | null,
  teacherId: string | null,
  tx?: DBTransaction
): Promise<string[]> {
  if (!parentId && !teacherId) return [];
  const executor = tx ?? db;
  const orConditions: ReturnType<typeof eq>[] = [];
  if (parentId) {
    orConditions.push(eq(students.parentId, parentId));
  }
  if (teacherId) {
    orConditions.push(eq(students.primaryTeacherId, teacherId));
  }

  const rows = await executor
    .select({ id: students.id })
    .from(students)
    .where(or(...orConditions));

  const studentIds = new Set(rows.map(r => r.id));

  if (teacherId) {
    const assignedRows = await executor
      .select({ studentId: teacherAssignments.studentId })
      .from(teacherAssignments)
      .where(and(eq(teacherAssignments.teacherId, teacherId), isNull(teacherAssignments.endedAt)));
    for (const r of assignedRows) {
      studentIds.add(r.studentId);
    }
  }

  return [...studentIds];
}
