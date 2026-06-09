import { eq, inArray, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { students } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
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
  processedQuery = queryWithPagination(processedQuery, paginationArgs);

  const results = await (processedQuery as unknown as Promise<{ student: Types.StudentEntity; total: number }[]>);

  const total = results[0]?.total ?? 0;
  const items: Types.StudentDto[] = results
    .map(r => {
      const s: Types.StudentEntity = r.student;
      return StudentUtils.mapEntityToDto(s);
    })
    .filter((s): s is Types.StudentDto => s !== null);

  const pageInfo = PaginationUtils.buildPageInfoFromArgs(paginationArgs, items.length, total);

  return {
    data: items,
    pageInfo: pageInfo,
  };
};

export namespace StudentRepository {
  export const findById = async (id: number): Promise<Types.StudentEntity | null | undefined> => {
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

  export const loadByIds = async (ids: number[]): Promise<(Types.StudentDto | Error)[]> => {
    if (ids.length === 0) return [];

    const foundStudents = await db.select().from(students).where(inArray(students.id, ids));

    const studentList: (Types.StudentDto | Error)[] = ids.map(id => {
      const s = foundStudents.find(c => c.id === id);
      if (!s) return new Error(`Student ${id} not found`);
      return StudentUtils.mapEntityToDto(s) as Types.StudentDto;
    });
    return studentList;
  };

  export const existsById = async (id: number): Promise<boolean> => {
    return (await db.$count(students, eq(students.id, id))) > 0;
  };

  export const allExistsByIds = async (ids: number[]): Promise<boolean> => {
    return (await db.$count(students, inArray(students.id, ids))) === ids.length;
  };

  export const countAllStudents = async (): Promise<number> => {
    return await db.$count(students);
  };

  export const deleteById = async (id: number): Promise<Types.StudentEntity> => {
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
}
