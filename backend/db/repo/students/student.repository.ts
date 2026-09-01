import { and, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, isSqlite, queryDb, queryWithPagination } from "@/backend/db";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import {
  parents,
  recurringScheduleDays,
  recurringSchedules,
  students,
  teacherAssignments,
  teachers,
  users,
} from "@/backend/db/schema";
import { OrderSortDirection, StudentStatus } from "@/backend/enum";
import { StudentsOrderByColumn } from "@/backend/enum/students";
import { ConflictError } from "@/backend/lib/errors";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { PaginationUtils, StudentFilterUtils, StudentUtils } from "@/backend/utils";
import { parseStudentStatus } from "@/shared/lib/enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

function decodeCursor(after: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(after, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "createdAt" in parsed &&
      "id" in parsed &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.id === "string"
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
  } catch {
    /* ignore invalid cursor */
  }
  return null;
}

function buildStudentFilterBaseQuery() {
  return db
    .select({
      student: students,
      total: sql<number>`count(*) over()`.mapWith(Number),
    })
    .from(students)
    .$dynamic();
}

type StudentFilterBaseQuery = ReturnType<typeof buildStudentFilterBaseQuery>;

function applyCursorCondition(
  query: StudentFilterBaseQuery,
  cursor: { createdAt: string; id: string },
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

async function processStudentQuery(
  query: StudentFilterBaseQuery,
  paginationArgs?: Types.PaginationArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null,
  filters?: Types.StudentFilterArgs | null
): Promise<Types.StudentsWithFiltersResponse> {
  let processedQuery = query;
  processedQuery = StudentFilterUtils.applyFilters(processedQuery, filters);
  processedQuery = StudentFilterUtils.applyOrdering(processedQuery, orderBy);

  const cursor = paginationArgs?.after ? decodeCursor(paginationArgs.after) : null;

  if (cursor) {
    processedQuery = applyCursorCondition(processedQuery, cursor, orderBy);
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
      pageInfo.startCursor = Buffer.from(
        JSON.stringify({ createdAt: firstItem.createdAt.toISOString(), id: firstItem.id })
      ).toString("base64");
      pageInfo.endCursor = Buffer.from(
        JSON.stringify({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id })
      ).toString("base64");
    }
  }

  return { data: items, pageInfo };
}

export namespace StudentRepository {
  /**
   * Helper to acquire an advisory lock for a student
   */
  async function acquireStudentLock(tx: DBTransaction, studentId: string): Promise<void> {
    await acquireAdvisoryLock(tx, `student_${studentId}`);
  }

  export const findById = async (
    id: string,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType | null | undefined> => {
    const q = queryDb(tx);
    const [row] = await q.select().from(students).where(eq(students.id, id)).limit(1);
    return row ?? null;
  };

  /**
   * Like `findById`, but treats students whose linked user account was
   * soft-deleted as missing — used by write flows that must not act on
   * removed accounts.
   */
  export const findActiveById = async (id: string, tx?: DBTransaction): Promise<Types.StudentSelectType | null> => {
    const q = queryDb(tx);
    const [row] = await q
      .select({ student: students })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.id, id), isNull(users.deletedAt)))
      .limit(1);
    return row?.student ?? null;
  };

  export const getStudentIdByUserId = async (userId: string, tx?: DBTransaction): Promise<string | null> => {
    const q = queryDb(tx);
    const [row] = await q.select({ id: students.id }).from(students).where(eq(students.userId, userId)).limit(1);
    return row?.id ?? null;
  };

  export const create = async (
    input: Types.StudentCreateInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> => {
    const err = await StudentUtils.validateName(input.name);
    if (err) throw new Error(err);

    const insertInput: Types.StudentInsertType = {
      parentId: input.parentId,
      userId: input.userId,
      primaryTeacherId: input.primaryTeacherId ?? null,
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      language: input.language,
      status: input.status,
      classesTotal: input.classesTotal ?? 0,
      classesRemaining: input.classesRemaining ?? 0,
      idempotencyKey: input.idempotencyKey,
      avatarUrl: input.avatarUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      const executor = tx ?? db;
      const [createdStudent] = await executor.insert(students).values(insertInput).returning();
      return createdStudent;
    } catch {
      throw new Error(tErrors.studentCreateFailed);
    }
  };

  export const createTeacherAssignment = async (
    input: {
      readonly studentId: string;
      readonly teacherId: string;
      readonly assignedByUserId?: string | null;
    },
    tx?: DBTransaction
  ): Promise<void> => {
    const executor = tx ?? db;
    await executor.insert(teacherAssignments).values({
      studentId: input.studentId,
      teacherId: input.teacherId,
      assignedAt: new Date(),
      assignedByUserId: input.assignedByUserId ?? null,
    });
  };

  export const loadByIds = async (ids: string[], locale?: string): Promise<(Types.StudentReturnType | Error)[]> => {
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
  };

  export const deleteById = async (id: string, tErrors: ErrorsLabels): Promise<Types.StudentSelectType> => {
    const existingStudent = await findById(id);
    if (!existingStudent) {
      throw new Error(tErrors.studentNotFound(id));
    }
    await db.transaction(async tx => {
      await tx.delete(students).where(eq(students.id, id));
    });
    return existingStudent;
  };

  export const partiallyUpdate = async (
    input: Types.PartialStudentUpdateInput,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<Types.StudentSelectType> => {
    const existingStudent = await findById(input.id);
    if (!existingStudent) {
      throw new Error(tErrors.studentNotFound(input.id));
    }

    if (input.name) {
      const nameErr = await StudentUtils.validateName(input.name, locale);
      if (nameErr) throw new Error(nameErr);
    }

    const updateInput: Types.StudentInsertType = {
      id: input.id,
      parentId: input.parentId ?? existingStudent.parentId,
      userId: existingStudent.userId,
      primaryTeacherId:
        input.primaryTeacherId === null ? null : (input.primaryTeacherId ?? existingStudent.primaryTeacherId),
      name: input.name ?? existingStudent.name,
      dateOfBirth: input.dateOfBirth === null ? null : (input.dateOfBirth ?? existingStudent.dateOfBirth),
      gender: input.gender === null ? null : (input.gender ?? existingStudent.gender),
      language: input.language === null ? null : (input.language ?? existingStudent.language),
      timezoneOverride:
        input.timezoneOverride === null ? null : (input.timezoneOverride ?? existingStudent.timezoneOverride),
      status: input.status ?? existingStudent.status,
      classesTotal: input.classesTotal ?? existingStudent.classesTotal,
      classesRemaining: input.classesRemaining ?? existingStudent.classesRemaining,
      avatarUrl: input.avatarUrl === null ? null : (input.avatarUrl ?? existingStudent.avatarUrl),
      idempotencyKey: existingStudent.idempotencyKey,
      createdAt: existingStudent.createdAt,
      updatedAt: new Date(),
    };

    try {
      const [updatedStudent] = await db.update(students).set(updateInput).where(eq(students.id, input.id)).returning();
      return updatedStudent;
    } catch {
      throw new Error(tErrors.studentUpdateFailed(input.id));
    }
  };

  export const fetchWithFilters = async (
    paginationArgs: Types.PaginationArgs | null,
    filters?: Types.StudentFilterArgs | null,
    orderBy?: Types.StudentsOrderByClause[] | null
  ): Promise<Types.StudentsWithFiltersResponse> => {
    return await processStudentQuery(buildStudentFilterBaseQuery(), paginationArgs, orderBy, filters);
  };

  async function adjustClassesQuota(
    t: DBTransaction,
    studentId: string,
    updateFn: (current: Types.StudentSelectType) => Record<string, unknown> | Promise<Record<string, unknown>>,
    tErrors: ErrorsLabels,
    expectedVersion?: number
  ): Promise<Types.StudentSelectType> {
    await acquireStudentLock(t, studentId);

    const results = await t.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (results.length === 0) {
      throw new Error(tErrors.studentNotFound(studentId));
    }
    const current = results[0];

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new Error(tErrors.studentVersionMismatch({ id: studentId, expectedVersion, gotVersion: current.version }));
    }

    const [updated] = await t
      .update(students)
      .set({
        ...(await updateFn(current)),
        version: sql`${students.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    return updated;
  }

  export const deductClasses = async (
    studentId: string,
    tErrors: ErrorsLabels,
    amount: number = 1,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> =>
    runStudentUpdate(
      studentId,
      () => ({ classesRemaining: sql`${students.classesRemaining} - ${amount}` }),
      tErrors,
      expectedVersion,
      tx
    );

  export const addClasses = async (
    studentId: string,
    tErrors: ErrorsLabels,
    amount: number = 1,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> =>
    runStudentUpdate(
      studentId,
      () => ({
        classesRemaining: sql`${students.classesRemaining} + ${amount}`,
        classesTotal: sql`${students.classesTotal} + ${amount}`,
      }),
      tErrors,
      expectedVersion,
      tx
    );

  function runStudentUpdate(
    studentId: string,
    updates: () => Record<string, unknown>,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> {
    const runner = async (t: DBTransaction) => adjustClassesQuota(t, studentId, updates, tErrors, expectedVersion);
    return tx ? runner(tx) : db.transaction(runner);
  }

  // ─── Credit-hours parallel balance methods ────────────────────────────────
  // Mirror of addClasses/deductClasses on the numeric(12,2) creditHours
  // columns. adjustClassesQuota already acquires acquireStudentLock inside the
  // tx, so the insufficient-hours pre-check runs INSIDE the tx after the lock.

  export const addCreditHours = async (
    studentId: string,
    tErrors: ErrorsLabels,
    amount: number,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> => {
    const runner = (t: DBTransaction) =>
      adjustClassesQuota(
        t,
        studentId,
        () => ({
          creditHoursRemaining: sql`${students.creditHoursRemaining} + ${amount}`,
          creditHoursTotal: sql`${students.creditHoursTotal} + ${amount}`,
        }),
        tErrors,
        expectedVersion
      );
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const deductCreditHours = async (
    studentId: string,
    tErrors: ErrorsLabels,
    amount: number,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> => {
    const runner = (t: DBTransaction) =>
      adjustClassesQuota(
        t,
        studentId,
        current => {
          const remaining = Number(current.creditHoursRemaining);
          if (remaining < amount) {
            throw new ConflictError(tErrors.credit.insufficientHours({ studentId, remaining, required: amount }));
          }
          return { creditHoursRemaining: sql`${students.creditHoursRemaining} - ${amount}` };
        },
        tErrors,
        expectedVersion
      );
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getCreditHourBalance = async (
    studentId: string,
    tx?: DBTransaction
  ): Promise<Types.CreditHourBalanceReturnType> => {
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
  };

  export const setClassesRemaining = async (
    studentId: string,
    newClassesRemaining: number,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> =>
    runStudentUpdate(studentId, () => ({ classesRemaining: newClassesRemaining }), tErrors, expectedVersion, tx);

  export const reassignTeacher = async (
    studentId: string,
    newTeacherId: string,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> =>
    runStudentUpdate(studentId, () => ({ primaryTeacherId: newTeacherId }), tErrors, expectedVersion, tx);
  /**
   * App-layer SQLite fallback for the PG-only hours-per-week recalculation triggers:
   * `trg_recalc_hours_recurring_schedules` + `trg_recalc_hours_recurring_schedule_days`.
   *
   * On PostgreSQL, these triggers auto-recalc `students.hours_per_week` whenever a
   * recurring schedule or its days are inserted/updated/deleted. SQLite cannot register
   * the plpgsql `update_student_hours_per_week()` function, so the app layer must
   * recalc explicitly after mutations.
   *
   * Recalculates `hours_per_week = SUM(recurring_schedules.duration_minutes) / 60.0`
   * across active recurring_schedule_days for the given student, then UPDATEs the
   * students row. NO-OP on PostgreSQL (the triggers handle it; avoids double-work).
   *
   * Service callers should invoke this after inserting/updating/deleting a recurring
   * schedule or recurring_schedule_days row when running on SQLite.
   */
  export const recalcHoursPerWeekIfSqlite = async (studentId: string, tx?: DBTransaction): Promise<void> => {
    if (!isSqlite()) return;
    const executor = tx ?? db;
    const [row] = await executor
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${recurringSchedules.durationMinutes}), 0)`,
      })
      .from(recurringSchedules)
      .innerJoin(recurringScheduleDays, eq(recurringScheduleDays.recurringScheduleId, recurringSchedules.id))
      .where(
        and(
          eq(recurringSchedules.studentId, studentId),
          isNull(recurringSchedules.deletedAt),
          eq(recurringScheduleDays.isActive, true)
        )
      );
    const hoursPerWeek = ((row?.totalMinutes ?? 0) / 60).toFixed(2);
    await executor.update(students).set({ hoursPerWeek, updatedAt: new Date() }).where(eq(students.id, studentId));
  };

  export const changeStatus = async (
    studentId: string,
    newStatus: StudentStatus,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> =>
    runStudentUpdate(studentId, () => ({ status: newStatus }), tErrors, expectedVersion, tx);

  export const getDirectoryRows = async (
    paginationArgs: Types.PaginationArgs | null,
    filters?: Types.StudentFilterArgs | null,
    orderBy?: Types.StudentsOrderByClause[] | null,
    tx?: DBTransaction
  ): Promise<Types.StudentDirectoryResult> => {
    const executor = tx ?? db;

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

    let countQuery = executor
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(students)
      .$dynamic();

    if (filters) {
      countQuery = StudentFilterUtils.applyFilters(countQuery, filters);
    }

    const [rows, countResult] = await Promise.all([baseQuery, countQuery]);

    const totalCount = countResult[0]?.count ?? 0;

    return {
      rows: rows.map(
        r =>
          Object.assign(r, {
            status: parseStudentStatus(r.status) ?? StudentStatus.REGULAR,
            hoursPerWeek: r.hoursPerWeek ? Number.parseFloat(r.hoursPerWeek) : 0,
          }) satisfies Types.StudentDirectory
      ),
      totalCount,
    };
  };

  export const getAssignedToTeacher = async (
    teacherId: string,
    tx?: DBTransaction
  ): Promise<Types.TeacherAssignedStudentsResult> => {
    const executor = tx ?? db;
    const parentUsers = alias(users, "assigned_students_parent_users");

    const assignedStudentIds = executor
      .select({ studentId: teacherAssignments.studentId })
      .from(teacherAssignments)
      .where(and(eq(teacherAssignments.teacherId, teacherId), isNull(teacherAssignments.endedAt)));

    const rows = await executor
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

    return {
      rows: rows.map(row => ({
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
      })),
      totalCount: rows.length,
    };
  };
  export const findByIdempotencyKeys = async (
    keys: string[],
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType[]> => {
    if (keys.length === 0) return [];
    const executor = tx ?? db;
    return executor.select().from(students).where(inArray(students.idempotencyKey, keys));
  };

  export const upsertByIdempotencyKey = async (
    input: {
      parentId: string;
      userId: string;
      primaryTeacherId: string;
      name: string;
      avatarUrl: string | null;
      status: StudentStatus;
      classesTotal: number;
      classesRemaining: number;
      timezoneOverride: string | null;
      idempotencyKey: string;
    },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.StudentSelectType> => {
    const executor = tx ?? db;
    const now = new Date();
    const [row] = await executor
      .insert(students)
      .values({
        parentId: input.parentId,
        userId: input.userId,
        primaryTeacherId: input.primaryTeacherId,
        name: input.name,
        avatarUrl: input.avatarUrl,
        status: input.status,
        classesTotal: input.classesTotal,
        classesRemaining: input.classesRemaining,
        version: 1,
        timezoneOverride: input.timezoneOverride,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: students.idempotencyKey,
        set: {
          name: input.name,
          avatarUrl: input.avatarUrl,
          timezoneOverride: input.timezoneOverride,
          primaryTeacherId: input.primaryTeacherId,
          parentId: input.parentId,
          updatedAt: now,
        },
      })
      .returning();
    if (!row) {
      const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(i18n.student.upsertFailed);
    }
    return row;
  };

  export const hasTeacherAssignment = async (
    studentId: string,
    teacherId: string,
    tx?: DBTransaction
  ): Promise<boolean> => {
    const executor = tx ?? db;
    const [row] = await executor
      .select({ id: teacherAssignments.id })
      .from(teacherAssignments)
      .where(and(eq(teacherAssignments.studentId, studentId), eq(teacherAssignments.teacherId, teacherId)))
      .limit(1);
    return !!row;
  };

  export const ensureTeacherAssignment = async (
    studentId: string,
    teacherId: string,
    assignedAt: Date,
    tx?: DBTransaction
  ): Promise<void> => {
    const exists = await hasTeacherAssignment(studentId, teacherId, tx);
    if (exists) return;
    const executor = tx ?? db;
    await executor.insert(teacherAssignments).values({ studentId, teacherId, assignedAt });
  };

  type StudentProfileRow = {
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

  function buildStudentProfileSelect(executor: typeof db | DBTransaction) {
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

  function mapStudentProfileRow(row: Awaited<ReturnType<typeof buildStudentProfileSelect>>[number]): StudentProfileRow {
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

  export const findProfileById = async (studentId: string, tx?: DBTransaction): Promise<StudentProfileRow | null> => {
    const executor = tx ?? db;

    const results = await buildStudentProfileSelect(executor).where(eq(students.id, studentId)).limit(1);

    if (results.length === 0) {
      return null;
    }

    return mapStudentProfileRow(results[0]);
  };

  /**
   * V3-023: Resolve student IDs for a parent and/or teacher without
   * the caller needing to touch the DB directly. Returns students
   * whose `parentId` matches, whose `primaryTeacherId` matches, or
   * who have an active `teacher_assignments` row for the teacher.
   */
  export const findIdsByParentOrTeacher = async (
    parentId: string | null,
    teacherId: string | null,
    tx?: DBTransaction
  ): Promise<string[]> => {
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
  };
}
