import { and, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { parents, students, teachers, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import * as Types from "@/backend/types";
import { PaginationUtils, StudentFilterUtils, StudentUtils } from "@/backend/utils";
import { OrderSortDirection } from "@/shared/lib/enum";
import type { DBTransaction } from "../db.types";

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
  const items: Types.StudentDto[] = results
    .map(r => StudentUtils.mapEntityToDto(r.student))
    .filter((s): s is Types.StudentDto => s !== null);

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

  export const create = async (input: Types.StudentCreateInput, locale?: string): Promise<Types.StudentEntity> => {
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
      const [createdStudent] = await db.insert(students).values(insertInput).returning();
      return createdStudent;
    } catch {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentCreateFailed"));
    }
  };

  export const createList = async (
    input: Types.StudentCreateInput[],
    locale?: string
  ): Promise<Types.StudentEntity[]> => {
    if (input.length === 0) return [];
    try {
      return await Promise.all(input.map(item => create(item, locale)));
    } catch (error) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentCreateError", { message: error instanceof Error ? error.message : "Unknown error" }), {
        cause: error,
      });
    }
  };

  export const loadByIds = async (ids: string[], locale?: string): Promise<(Types.StudentDto | Error)[]> => {
    if (ids.length === 0) return [];
    const foundStudents = await db.select().from(students).where(inArray(students.id, ids));
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    return ids.map(id => {
      const s = foundStudents.find(c => c.id === id);
      return s ? (StudentUtils.mapEntityToDto(s) as Types.StudentDto) : new Error(t("studentNotFound", { id }));
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
    await db.delete(students).where(eq(students.id, id));
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
    newStatus: Types.StudentEntity["status"],
    expectedVersion?: number,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.StudentEntity> =>
    runStudentUpdate(studentId, () => ({ status: newStatus }), expectedVersion, tx, locale);

  export interface StudentDirectoryRow {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly status: string;
    readonly classesRemaining: number;
    readonly classesTotal: number;
    readonly hoursPerWeek: string;
    readonly parentName: string;
    readonly teacherName: string | null;
    readonly createdAt: Date;
  }

  export interface StudentDirectoryResult {
    readonly rows: StudentDirectoryRow[];
    readonly totalCount: number;
  }

  export const getDirectoryRows = async (
    paginationArgs: Types.PaginationArgs | null,
    filters?: Types.StudentFilterArgs | null,
    orderBy?: Types.StudentsOrderByClause[] | null,
    tx?: DBTransaction
  ): Promise<StudentDirectoryResult> => {
    const queryDb = tx ?? db;

    const parentUsers = alias(users, "parent_users");
    const teacherUsers = alias(users, "teacher_users");

    let baseQuery = queryDb
      .select({
        id: students.id,
        name: students.name,
        email: sql<string>`COALESCE(${parentUsers.email}, '')`,
        status: students.status,
        classesRemaining: students.classesRemaining,
        classesTotal: students.classesTotal,
        hoursPerWeek: students.hoursPerWeek,
        parentName: sql<string>`COALESCE(${parentUsers.name}, '')`,
        teacherName: sql<string | null>`COALESCE(${teacherUsers.name}, NULL)`,
        createdAt: students.createdAt,
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

    return { rows, totalCount };
  };
}
