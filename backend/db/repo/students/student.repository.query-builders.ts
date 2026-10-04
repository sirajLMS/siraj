import { and, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, queryWithPagination } from "@/backend/db";
import type { StudentCursor } from "@/backend/db/repo/students/student.repository.helpers";
import { parents, students, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { OrderSortDirection, StudentStatus } from "@/backend/enum";
import { StudentsOrderByColumn } from "@/backend/enum/students";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { StudentFilterUtils } from "@/backend/utils";
import { parseStudentStatus } from "@/shared/lib/enum";

export function buildStudentFilterBaseQuery() {
  return db
    .select({
      student: students,
      total: sql<number>`count(*) over()`.mapWith(Number),
    })
    .from(students)
    .$dynamic();
}

export type StudentFilterBaseQuery = ReturnType<typeof buildStudentFilterBaseQuery>;

export function applyStudentCursorCondition(
  query: StudentFilterBaseQuery,
  cursor: StudentCursor,
  orderBy?: Types.StudentsOrderByClause[] | null
): StudentFilterBaseQuery {
  const cursorDate = new Date(cursor.createdAt);
  const cursorId = cursor.id;
  const isDesc = orderBy?.some(
    o => o.column === StudentsOrderByColumn.CREATED_AT && o.order === OrderSortDirection.DESC
  );
  if (isDesc) {
    return query.where(
      or(lt(students.createdAt, cursorDate), and(eq(students.createdAt, cursorDate), lt(students.id, cursorId)))
    );
  }
  return query.where(
    or(gt(students.createdAt, cursorDate), and(eq(students.createdAt, cursorDate), gt(students.id, cursorId)))
  );
}

export function buildStudentDirectoryBaseQuery(
  executor: typeof db | DBTransaction,
  filters?: Types.StudentFilterArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null,
  paginationArgs?: Types.PaginationArgs | null
) {
  const parentUsers = alias(users, "parent_users");
  const teacherUsers = alias(users, "teacher_users");

  let baseQuery = executor
    .select({
      id: students.id,
      userId: students.userId,
      name: students.name,
      email: sql<string>`COALESCE(${parentUsers.email}, '')`,
      avatarUrl: students.avatarUrl,
      status: students.status,
      classesRemaining: students.classesRemaining,
      classesTotal: students.classesTotal,
      creditHoursRemaining: students.creditHoursRemaining,
      creditHoursTotal: students.creditHoursTotal,
      hoursPerWeek: students.hoursPerWeek,
      parentName: sql<string>`COALESCE(${parentUsers.name}, '')`,
      primaryTeacherId: students.primaryTeacherId,
      teacherName: sql<string | null>`COALESCE(${teacherUsers.name}, NULL)`,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .innerJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(parentUsers, eq(parents.userId, parentUsers.id))
    .leftJoin(teachers, eq(students.primaryTeacherId, teachers.id))
    .leftJoin(teacherUsers, eq(teachers.userId, teacherUsers.id))
    .$dynamic();

  if (filters) {
    baseQuery = StudentFilterUtils.applyFilters(baseQuery, filters);
  }
  if (orderBy) {
    baseQuery = StudentFilterUtils.applyOrdering(baseQuery, orderBy);
  }
  if (paginationArgs) {
    baseQuery = queryWithPagination(baseQuery, paginationArgs);
  }

  return baseQuery;
}

export function buildStudentDirectoryCountQuery(
  executor: typeof db | DBTransaction,
  filters?: Types.StudentFilterArgs | null
) {
  let countQuery = executor
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(students)
    .$dynamic();

  if (filters) {
    countQuery = StudentFilterUtils.applyFilters(countQuery, filters);
  }

  return countQuery;
}

export function mapStudentDirectoryRow(
  row: Awaited<ReturnType<typeof buildStudentDirectoryBaseQuery>>[number]
): Types.StudentDirectory {
  return Object.assign(row, {
    status: parseStudentStatus(row.status) ?? StudentStatus.REGULAR,
    hoursPerWeek: row.hoursPerWeek ? Number.parseFloat(row.hoursPerWeek) : 0,
  }) satisfies Types.StudentDirectory;
}

export function buildAssignedStudentsQuery(executor: typeof db | DBTransaction, teacherId: string) {
  const parentUsers = alias(users, "assigned_students_parent_users");

  const assignedStudentIds = executor
    .select({ studentId: teacherAssignments.studentId })
    .from(teacherAssignments)
    .where(and(eq(teacherAssignments.teacherId, teacherId), isNull(teacherAssignments.endedAt)));

  return executor
    .select({
      id: students.id,
      name: students.name,
      studentAvatarUrl: students.avatarUrl,
      parentId: parents.id,
      parentUserId: parents.userId,
      parentName: parentUsers.name,
      parentAvatarUrl: parentUsers.avatarUrl,
      className: sql<string | null>`null`,
      status: students.status,
      hoursPerWeek: students.hoursPerWeek,
      classesRemaining: students.classesRemaining,
      classesTotal: students.classesTotal,
    })
    .from(students)
    .innerJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(parentUsers, eq(parents.userId, parentUsers.id))
    .where(or(eq(students.primaryTeacherId, teacherId), inArray(students.id, assignedStudentIds)))
    .orderBy(students.name);
}

export function mapAssignedStudentRow(row: Awaited<ReturnType<typeof buildAssignedStudentsQuery>>[number]) {
  return {
    id: row.id,
    name: row.name,
    studentAvatarUrl: row.studentAvatarUrl,
    parentId: row.parentId,
    parentUserId: row.parentUserId,
    parentName: row.parentName,
    parentAvatarUrl: row.parentAvatarUrl,
    className: row.className,
    status: parseStudentStatus(row.status) ?? StudentStatus.REGULAR,
    hoursPerWeek: row.hoursPerWeek ? Number.parseFloat(row.hoursPerWeek) : 0,
    classesRemaining: row.classesRemaining,
    classesTotal: row.classesTotal,
  };
}

export type StudentProfileRow = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly timezone: string | null;
  readonly displayCurrency: string | null;
  readonly status: StudentStatus;
  readonly avatarUrl: string | null;
  readonly dateOfBirth: Date | null;
  readonly gender: string | null;
  readonly language: string | null;
  readonly timezoneOverride: string | null;
  readonly parentId: string | null;
  readonly parentUserId: string | null;
  readonly parentName: string | null;
  readonly parentEmail: string | null;
  readonly parentPhone: string | null;
  readonly primaryTeacherId: string | null;
  readonly teacherUserId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: string;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export function buildStudentProfileSelect(executor: typeof db | DBTransaction) {
  const parentUser = alias(users, "parent_user");
  const studentUser = alias(users, "student_user");

  return executor
    .select({
      id: students.id,
      userId: students.userId,
      name: students.name,
      email: studentUser.email,
      phone: studentUser.phone,
      timezone: studentUser.timezone,
      displayCurrency: studentUser.displayCurrency,
      status: students.status,
      avatarUrl: students.avatarUrl,
      dateOfBirth: students.dateOfBirth,
      gender: students.gender,
      language: students.language,
      timezoneOverride: students.timezoneOverride,
      parentId: students.parentId,
      parentUserId: parentUser.id,
      parentName: parentUser.name,
      parentEmail: parentUser.email,
      parentPhone: parentUser.phone,
      primaryTeacherId: students.primaryTeacherId,
      teacherUserId: teachers.userId,
      teacherName: users.name,
      hoursPerWeek: students.hoursPerWeek,
      classesRemaining: students.classesRemaining,
      classesTotal: students.classesTotal,
      version: students.version,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .leftJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(parentUser, eq(parents.userId, parentUser.id))
    .leftJoin(teachers, eq(students.primaryTeacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .leftJoin(studentUser, eq(students.userId, studentUser.id));
}

export function mapStudentProfileRow(
  row: Awaited<ReturnType<typeof buildStudentProfileSelect>>[number]
): StudentProfileRow {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    timezone: row.timezone,
    displayCurrency: row.displayCurrency,
    status: parseStudentStatus(row.status) ?? StudentStatus.REGULAR,
    avatarUrl: row.avatarUrl,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    language: row.language,
    timezoneOverride: row.timezoneOverride,
    parentId: row.parentId,
    parentUserId: row.parentUserId,
    parentName: row.parentName,
    parentEmail: row.parentEmail,
    parentPhone: row.parentPhone,
    primaryTeacherId: row.primaryTeacherId,
    teacherUserId: row.teacherUserId,
    teacherName: row.teacherName,
    hoursPerWeek: row.hoursPerWeek,
    classesRemaining: row.classesRemaining,
    classesTotal: row.classesTotal,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
