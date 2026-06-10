import { and, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { students } from "@/backend/db/schema";
import * as Types from "@/backend/types";
import { PaginationUtils, StudentFilterUtils, StudentUtils } from "@/backend/utils";
import { OrderSortDirection } from "@/lib/enum";

// Extract the transaction type from Drizzle
type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
      // Cursor encodes { createdAt, id } — both are immutable (createdAt is set once, id is a UUID primary key).
      // The DB-level trigger in student_created_at_immutability prevents createdAt from being updated,
      // ensuring cursors remain permanently stable.
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
      // Ignore invalid cursor
    }
  }

  // For cursor-based pagination, only apply LIMIT (not offset)
  // For offset-based pagination, apply both LIMIT and OFFSET
  if (paginationArgs?.after) {
    // Cursor-based: only limit, no offset
    processedQuery = processedQuery.limit(paginationArgs.perPage);
  } else {
    // Offset-based: use the standard queryWithPagination
    processedQuery = queryWithPagination(processedQuery, paginationArgs);
  }

  const results = await (processedQuery as unknown as Promise<{ student: Types.StudentEntity; total: number }[]>);

  const total = results[0]?.total ?? 0;
  const items: Types.StudentDto[] = results
    .map(r => {
      const s: Types.StudentEntity = r.student;
      return StudentUtils.mapEntityToDto(s);
    })
    .filter((s): s is Types.StudentDto => s !== null);

  const pageInfo = PaginationUtils.buildPageInfoFromArgs(paginationArgs, items.length, total);

  if (items.length > 0) {
    const firstItem = items[0];
    const lastItem = items.at(-1);
    // Cursor encodes createdAt + id for stable keyset pagination.
    // createdAt is immutable (enforced by DB trigger), id is a UUID primary key.
    pageInfo.startCursor = Buffer.from(
      JSON.stringify({ createdAt: firstItem.createdAt.toISOString(), id: firstItem.id })
    ).toString("base64");
    pageInfo.endCursor = Buffer.from(
      JSON.stringify({ createdAt: lastItem?.createdAt.toISOString(), id: lastItem?.id })
    ).toString("base64");
  }

  return {
    data: items,
    pageInfo: pageInfo,
  };
};

export namespace StudentRepository {
  /**
   * Helper to acquire an advisory lock for a student
   * to prevent concurrent updates to classes_remaining.
   */
  async function acquireStudentLock(tx: DBTransaction, studentId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('student_' || ${studentId}::text))`);
  }

  export const findById = async (id: string): Promise<Types.StudentEntity | null | undefined> => {
    return await db.query.students.findFirst({
      where: { id: id },
    });
  };

  export const create = async (input: Types.StudentCreateInput): Promise<Types.StudentEntity> => {
    await StudentUtils.validateName(input.name).then(err => {
      if (err) throw new Error(err);
    });

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
      throw new Error("Failed to create student");
    }
  };

  export const createList = async (input: Types.StudentCreateInput[]): Promise<Types.StudentEntity[]> => {
    if (input.length === 0) return [];

    try {
      const result = await Promise.all(input.map(item => create(item)));
      return result;
    } catch (error) {
      throw new Error(`Failed to create students: ${error instanceof Error ? error.message : "Unknown error"}`, {
        cause: error,
      });
    }
  };

  export const loadByIds = async (ids: string[]): Promise<(Types.StudentDto | Error)[]> => {
    if (ids.length === 0) return [];

    const foundStudents = await db.select().from(students).where(inArray(students.id, ids));

    const studentList: (Types.StudentDto | Error)[] = ids.map(id => {
      const s = foundStudents.find(c => c.id === id);
      if (!s) return new Error(`Student ${id} not found`);
      return StudentUtils.mapEntityToDto(s) as Types.StudentDto;
    });
    return studentList;
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

  export const deleteById = async (id: string): Promise<Types.StudentEntity> => {
    const existingStudent = await findById(id);
    if (!existingStudent) {
      throw new Error(`Student ${id} not found`);
    }
    await db.delete(students).where(eq(students.id, id));
    return existingStudent;
  };

  export const partiallyUpdate = async (input: Types.PartialStudentUpdateInput): Promise<Types.StudentEntity> => {
    const existingStudent = await findById(input.id);
    if (!existingStudent) {
      throw new Error(`Student ${input.id} not found`);
    }

    if (input.name) {
      const nameErr = await StudentUtils.validateName(input.name);
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
      throw new Error(`Failed to update student with ID ${input.id}.`);
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

  /**
   * Deducts classes_remaining for a student with optimistic locking.
   * Uses advisory locks to prevent race conditions.
   *
   * @param studentId - The student's ID
   * @param amount - Number of classes to deduct (default: 1)
   * @param expectedVersion - Expected version for optimistic locking (optional)
   * @param tx - Optional transaction context
   * @returns Updated student entity
   * @throws Error if student not found, insufficient classes, or version mismatch
   */
  export const deductClasses = async (
    studentId: string,
    amount: number = 1,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentEntity> => {
    const runner = async (t: DBTransaction) => {
      // Acquire advisory lock to prevent concurrent modifications
      await acquireStudentLock(t, studentId);

      // Fetch current student state
      const results = await t.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (results.length === 0) {
        throw new Error(`Student ${studentId} not found`);
      }
      const current = results[0];

      // Optimistic locking: check version if provided
      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new Error(
          `Version mismatch for student ${studentId}. Expected ${expectedVersion}, got ${current.version}. Please retry.`
        );
      }

      // Check sufficient quota
      if (current.classesRemaining < amount) {
        throw new Error(
          `Insufficient classes for student ${studentId}. Remaining: ${current.classesRemaining}, Required: ${amount}`
        );
      }

      // Update with version increment
      const [updated] = await t
        .update(students)
        .set({
          classesRemaining: sql`${students.classesRemaining} - ${amount}`,
          version: sql`${students.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(students.id, studentId))
        .returning();

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Adds classes_remaining for a student with optimistic locking.
   * Uses advisory locks to prevent race conditions.
   *
   * @param studentId - The student's ID
   * @param amount - Number of classes to add (default: 1)
   * @param expectedVersion - Expected version for optimistic locking (optional)
   * @param tx - Optional transaction context
   * @returns Updated student entity
   * @throws Error if student not found or version mismatch
   */
  export const addClasses = async (
    studentId: string,
    amount: number = 1,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentEntity> => {
    const runner = async (t: DBTransaction) => {
      // Acquire advisory lock to prevent concurrent modifications
      await acquireStudentLock(t, studentId);

      // Fetch current student state
      const results = await t.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (results.length === 0) {
        throw new Error(`Student ${studentId} not found`);
      }
      const current = results[0];

      // Optimistic locking: check version if provided
      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new Error(
          `Version mismatch for student ${studentId}. Expected ${expectedVersion}, got ${current.version}. Please retry.`
        );
      }

      // Update with version increment
      const [updated] = await t
        .update(students)
        .set({
          classesRemaining: sql`${students.classesRemaining} + ${amount}`,
          classesTotal: sql`${students.classesTotal} + ${amount}`,
          version: sql`${students.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(students.id, studentId))
        .returning();

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
}
