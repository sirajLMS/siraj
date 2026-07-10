import { randomUUID } from "node:crypto";
import { and, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { alias } from "drizzle-orm/pg-core";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { parents, students, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { OrderSortDirection, StudentStatus } from "@/backend/enum";
import { parseStudentStatus } from "@/backend/lib/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import * as Types from "@/backend/types";
import { ALLOWED_STATUS_TRANSITIONS } from "@/backend/types";
import { PaginationUtils, StudentFilterUtils, StudentUtils } from "@/backend/utils";

const _processStudentQuery = async (
  query: PgSelect,
  paginationArgs?: Types.PaginationArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null,
  filters?: Types.StudentFilterArgs | null
): Promise<Types.StudentsWithFiltersResponse> => {
  let processedQuery = query;
  processedQuery = StudentFilterUtils.applyFilters(processedQuery, filters);
  processedQuery = StudentFilterUtils.applyOrdering(processedQuery, orderBy);

  if (paginationArgs?.after) {
    try {
      const decoded = Buffer.from(paginationArgs.after, "base64").toString("utf8");
      const cursorObj = JSON.parse(decoded) as { createdAt?: string; id?: string };
      if (cursorObj.createdAt && cursorObj.id) {
        const cursorDate = new Date(cursorObj.createdAt);
        const cursorId = cursorObj.id;
        const isDesc = orderBy?.some(
          o => o.column === Types.StudentsOrderByColumn.CREATED_AT && o.order === OrderSortDirection.DESC
        );
        if (isDesc) {
          processedQuery = processedQuery.where(
            or(lt(students.createdAt, cursorDate), and(eq(students.createdAt, cursorDate), lt(students.id, cursorId)))
          );
        } else {
          processedQuery = processedQuery.where(
            or(gt(students.createdAt, cursorDate), and(eq(students.createdAt, cursorDate), gt(students.id, cursorId)))
          );
        }
      }
    } catch {
      /* ignore invalid cursor */
    }
  }

  if (paginationArgs?.after) {
    processedQuery = processedQuery.limit(paginationArgs.perPage);
  } else {
    processedQuery = queryWithPagination(processedQuery, paginationArgs);
  }

  const results = await (processedQuery as unknown as Promise<{ student: Types.StudentEntity; total: number }[]>);

  const total = results[0]?.total ?? 0;
  const items: Types.Student[] = results
    .map(r => StudentUtils.mapEntityToDto(r.student))
    .filter((s): s is Types.Student => s !== null);

  const pageInfo = PaginationUtils.buildPageInfoFromArgs(paginationArgs, items.length, total);

  if (items.length > 0) {
    const firstItem = items[0];
    const lastItem = items.at(-1);
    pageInfo.startCursor = Buffer.from(
      JSON.stringify({ createdAt: firstItem.createdAt.toISOString(), id: firstItem.id })
    ).toString("base64");
    pageInfo.endCursor = Buffer.from(
      JSON.stringify({ createdAt: lastItem?.createdAt.toISOString(), id: lastItem?.id })
    ).toString("base64");
  }

  return { data: items, pageInfo };
};

export namespace StudentRepository {
  /**
   * Helper to acquire an advisory lock for a student
   */
  async function acquireStudentLock(tx: DBTransaction, studentId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('student_' || ${studentId}::text))`);
  }

  export const findById = async (id: string): Promise<Types.StudentEntity | null | undefined> => {
    return await db.query.students.findFirst({
      where: { id: id },
    });
  };

  export const create = async (
    input: Types.StudentCreateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<Types.StudentEntity> => {
    const err = await StudentUtils.validateName(input.name, locale);
    if (err) throw new Error(err);

    const insertInput: Types.StudentEntityInput = {
      parentId: input.parentId,
      primaryTeacherId: input.primaryTeacherId ?? null,
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      language: input.language,
      status: input.status,
      classesTotal: input.classesTotal ?? 0,
      classesRemaining: input.classesRemaining ?? 0,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      const executor = tx ?? db;
      const [createdStudent] = await executor.insert(students).values(insertInput).returning();
      return createdStudent;
    } catch {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentCreateFailed"));
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

  export const createList = async (
    input: Types.StudentCreateInput[],
    locale?: string
  ): Promise<Types.StudentEntity[]> => {
    if (input.length === 0) return [];
    try {
      for (const item of input) {
        const nameErr = await StudentUtils.validateName(item.name, locale);
        if (nameErr) throw new Error(nameErr);
      }
      const values: Types.StudentEntityInput[] = input.map(item => ({
        parentId: item.parentId,
        primaryTeacherId: item.primaryTeacherId ?? null,
        name: item.name,
        dateOfBirth: item.dateOfBirth,
        gender: item.gender,
        language: item.language,
        status: item.status,
        classesTotal: item.classesTotal ?? 0,
        classesRemaining: item.classesRemaining ?? 0,
        idempotencyKey: item.idempotencyKey ?? randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      return await db.insert(students).values(values).returning();
    } catch (error) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentCreateFailed"), {
        cause: error,
      });
    }
  };

  export const loadByIds = async (ids: string[], locale?: string): Promise<(Types.Student | Error)[]> => {
    if (ids.length === 0) return [];
    const foundStudents = await db.select().from(students).where(inArray(students.id, ids));
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    return ids.map(id => {
      const s = foundStudents.find(c => c.id === id);
      return s ? (StudentUtils.mapEntityToDto(s) as Types.Student) : new Error(t("studentNotFound", { id }));
    });
  };

  export const existsById = async (id: string): Promise<boolean> => {
    return (await db.$count(students, eq(students.id, id))) > 0;
  };

  export const allExistsByIds = async (ids: string[]): Promise<boolean> => {
    return (await db.$count(students, inArray(students.id, ids))) === ids.length;
  };

  export const countAllStudents = async (): Promise<number> => {
    return await db.$count(students);
  };

  export const deleteById = async (id: string, locale?: string): Promise<Types.StudentEntity> => {
    const existingStudent = await findById(id);
    if (!existingStudent) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentNotFound", { id }));
    }
    await db.transaction(async tx => {
      await tx.delete(students).where(eq(students.id, id));
    });
    return existingStudent;
  };

  export const partiallyUpdate = async (
    input: Types.PartialStudentUpdateInput,
    locale?: string
  ): Promise<Types.StudentEntity> => {
    const existingStudent = await findById(input.id);
    if (!existingStudent) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentNotFound", { id: input.id }));
    }

    if (input.name) {
      const nameErr = await StudentUtils.validateName(input.name, locale);
      if (nameErr) throw new Error(nameErr);
    }

    const updateInput: Types.StudentEntityInput = {
      id: input.id,
      parentId: input.parentId ?? existingStudent.parentId,
      primaryTeacherId:
        input.primaryTeacherId === null ? null : (input.primaryTeacherId ?? existingStudent.primaryTeacherId),
      name: input.name ?? existingStudent.name,
      dateOfBirth: input.dateOfBirth === null ? null : (input.dateOfBirth ?? existingStudent.dateOfBirth),
      gender: input.gender === null ? null : (input.gender ?? existingStudent.gender),
      language: input.language === null ? null : (input.language ?? existingStudent.language),
      status: input.status ?? existingStudent.status,
      classesTotal: input.classesTotal ?? existingStudent.classesTotal,
      classesRemaining: input.classesRemaining ?? existingStudent.classesRemaining,
      idempotencyKey: existingStudent.idempotencyKey,
      createdAt: existingStudent.createdAt,
      updatedAt: new Date(),
    };

    try {
      const [updatedStudent] = await db.update(students).set(updateInput).where(eq(students.id, input.id)).returning();
      return updatedStudent;
    } catch {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentUpdateFailed", { id: input.id }));
    }
  };

  export const fetchWithFilters = async (
    paginationArgs: Types.PaginationArgs | null,
    filters?: Types.StudentFilterArgs | null,
    orderBy?: Types.StudentsOrderByClause[] | null
  ): Promise<Types.StudentsWithFiltersResponse> => {
    const baseQuery = db
      .select({
        student: students,
        total: sql<number>`cast(count(*) over() as int)`,
      })
      .from(students)
      .$dynamic();

    return await _processStudentQuery(baseQuery as unknown as PgSelect, paginationArgs, orderBy, filters);
  };

  async function adjustClassesQuota(
    t: DBTransaction,
    studentId: string,
    updateFn: (current: Types.StudentEntity) => Record<string, unknown> | Promise<Record<string, unknown>>,
    expectedVersion?: number,
    locale?: string
  ): Promise<Types.StudentEntity> {
    await acquireStudentLock(t, studentId);

    const results = await t.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (results.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }
    const current = results[0];

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("studentVersionMismatch", {
          id: studentId,
          expectedVersion,
          gotVersion: current.version,
        })
      );
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
    amount: number = 1,
    expectedVersion?: number,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.StudentEntity> => {
    const runner = async (t: DBTransaction) =>
      adjustClassesQuota(
        t,
        studentId,
        async current => {
          if (current.classesRemaining < amount) {
            const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
            throw new Error(
              tFunc("insufficientClasses", {
                id: studentId,
                remaining: current.classesRemaining,
                required: amount,
              })
            );
          }
          return { classesRemaining: sql`${students.classesRemaining} - ${amount}` };
        },
        expectedVersion,
        locale
      );

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const addClasses = async (
    studentId: string,
    amount: number = 1,
    expectedVersion?: number,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.StudentEntity> => {
    const runner = async (t: DBTransaction) =>
      adjustClassesQuota(
        t,
        studentId,
        () => ({
          classesRemaining: sql`${students.classesRemaining} + ${amount}`,
          classesTotal: sql`${students.classesTotal} + ${amount}`,
        }),
        expectedVersion,
        locale
      );

    return tx ? runner(tx) : db.transaction(runner);
  };

  function runStudentUpdate(
    studentId: string,
    updates: () => Partial<Types.StudentEntity>,
    expectedVersion?: number,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.StudentEntity> {
    const runner = async (t: DBTransaction) => adjustClassesQuota(t, studentId, updates, expectedVersion, locale);
    return tx ? runner(tx) : db.transaction(runner);
  }

  export const setClassesRemaining = async (
    studentId: string,
    newClassesRemaining: number,
    expectedVersion?: number,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.StudentEntity> =>
    runStudentUpdate(studentId, () => ({ classesRemaining: newClassesRemaining }), expectedVersion, tx, locale);

  export const reassignTeacher = async (
    studentId: string,
    newTeacherId: string,
    expectedVersion?: number,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.StudentEntity> =>
    runStudentUpdate(studentId, () => ({ primaryTeacherId: newTeacherId }), expectedVersion, tx, locale);

  export const changeStatus = async (
    studentId: string,
    newStatus: StudentStatus,
    expectedVersion?: number,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.StudentEntity> => {
    const runner = async (t: DBTransaction) =>
      adjustClassesQuota(
        t,
        studentId,
        async current => {
          const currentStatus = parseStudentStatus(current.status) ?? StudentStatus.REGULAR;
          const allowedTargets = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];
          if (!allowedTargets.includes(newStatus)) {
            const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
            throw new Error(
              tFunc("invalidStatusTransition", {
                currentStatus: current.status,
                newStatus,
              })
            );
          }
          return { status: newStatus };
        },
        expectedVersion,
        locale
      );

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getDirectoryRows = async (
    paginationArgs: Types.PaginationArgs | null,
    filters?: Types.StudentFilterArgs | null,
    orderBy?: Types.StudentsOrderByClause[] | null,
    tx?: DBTransaction
  ): Promise<Types.StudentDirectoryResult> => {
    const queryDb = tx ?? db;

    const parentUsers = alias(users, "parent_users");
    const teacherUsers = alias(users, "teacher_users");

    let baseQuery = queryDb
      .select({
        id: students.id,
        name: students.name,
        email: sql<string>`COALESCE(${parentUsers.email}, '')`,
        avatarUrl: students.avatarUrl,
        status: students.status,
        classesRemaining: students.classesRemaining,
        classesTotal: students.classesTotal,
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

    let countQuery = queryDb.select({ count: sql<number>`count(*)::int` }).from(students).$dynamic();

    if (filters) {
      countQuery = StudentFilterUtils.applyFilters(countQuery, filters);
    }

    const [rows, countResult] = await Promise.all([baseQuery, countQuery]);

    const totalCount = countResult[0]?.count ?? 0;

    return {
      rows: rows.map(
        r =>
          ({
            ...r,
            hoursPerWeek: r.hoursPerWeek ? Number.parseFloat(r.hoursPerWeek) : 0,
          }) as Types.StudentDirectory
      ),
      totalCount,
    };
  };

  export const getAssignedToTeacher = async (
    teacherId: string,
    tx?: DBTransaction
  ): Promise<Types.TeacherAssignedStudentsResult> => {
    const queryDb = tx ?? db;
    const parentUsers = alias(users, "assigned_students_parent_users");

    const assignedStudentIds = queryDb
      .select({ studentId: teacherAssignments.studentId })
      .from(teacherAssignments)
      .where(and(eq(teacherAssignments.teacherId, teacherId), isNull(teacherAssignments.endedAt)));

    const rows = await queryDb
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
  export const findByIdempotencyKeys = async (keys: string[], tx?: DBTransaction): Promise<Types.StudentEntity[]> => {
    if (keys.length === 0) return [];
    const executor = tx ?? db;
    return executor.select().from(students).where(inArray(students.idempotencyKey, keys));
  };

  export const upsertByIdempotencyKey = async (
    input: {
      parentId: string;
      primaryTeacherId: string;
      name: string;
      avatarUrl: string | null;
      status: StudentStatus;
      classesTotal: number;
      classesRemaining: number;
      timezoneOverride: string | null;
      idempotencyKey: string;
    },
    tx?: DBTransaction
  ): Promise<Types.StudentEntity> => {
    const executor = tx ?? db;
    const now = new Date();
    const [row] = await executor
      .insert(students)
      .values({
        parentId: input.parentId,
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
    if (!row) throw new Error("Student upsert failed");
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

  export type StudentProfileRow = {
    readonly id: string;
    readonly name: string;
    readonly status: StudentStatus;
    readonly avatarUrl: string | null;
    readonly dateOfBirth: Date | null;
    readonly gender: string | null;
    readonly language: string | null;
    readonly parentId: string;
    readonly parentUserId: string | null;
    readonly parentName: string | null;
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

  export const findProfileById = async (studentId: string, tx?: DBTransaction): Promise<StudentProfileRow | null> => {
    const queryDb = tx ?? db;
    const parentUser = alias(users, "parent_user");

    const results = await queryDb
      .select({
        id: students.id,
        name: students.name,
        status: students.status,
        avatarUrl: students.avatarUrl,
        dateOfBirth: students.dateOfBirth,
        gender: students.gender,
        language: students.language,
        parentId: students.parentId,
        parentUserId: parentUser.id,
        parentName: parentUser.name,
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
      .where(eq(students.id, studentId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      status: parseStudentStatus(row.status) ?? StudentStatus.REGULAR,
      avatarUrl: row.avatarUrl,
      dateOfBirth: row.dateOfBirth,
      gender: row.gender,
      language: row.language,
      parentId: row.parentId,
      parentUserId: row.parentUserId,
      parentName: row.parentName,
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
  };
}
