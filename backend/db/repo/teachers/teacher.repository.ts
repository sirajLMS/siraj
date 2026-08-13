import { and, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db, queryDb, queryWithPagination } from "@/backend/db";
import { teachers, users } from "@/backend/db/schema";
import { AccountStatus, type Gender } from "@/backend/enum";
import type {
  DBTransaction,
  PaginationArgs,
  TeacherCreateReturnType,
  TeacherDirectoryMetrics,
  TeacherDirectoryRow,
  TeacherInsertType,
  TeacherProfileReturnType,
  TeacherProfileUpdateInputType,
  TeacherSelectType,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseAccountStatus, parseGender, parseIanaTimezone } from "@/shared/lib/enum";
import { getServerTranslations } from "@/shared/locale";

export namespace TeacherRepository {
  export async function create(
    input: TeacherInsertType,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherCreateReturnType> {
    const executor = tx ?? db;

    const existingTeacher = await executor
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.userId, input.userId))
      .limit(1);

    if (existingTeacher.length > 0) {
      const { teacher } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(teacher.alreadyExists);
    }

    const [created] = await executor
      .insert(teachers)
      .values({
        ...input,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date(),
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create teacher profile");
    }

    const [userRow] = await executor
      .select({ timezone: users.timezone, status: users.status })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    return {
      id: created.id,
      userId: created.userId,
      phone: created.phone,
      gender: created.gender,
      status: parseAccountStatus(userRow?.status),
      timezone: parseIanaTimezone(userRow?.timezone),
      createdAt: created.createdAt,
    };
  }

  export const findByUserId = async (userId: string, tx?: DBTransaction): Promise<TeacherSelectType | null> => {
    const q = queryDb(tx);
    const [teacher] = await q.select().from(teachers).where(eq(teachers.userId, userId)).limit(1);
    return teacher ?? null;
  };

  export const findById = async (id: string, tx?: DBTransaction) => {
    const q = queryDb(tx);
    const [teacher] = await q.select().from(teachers).where(eq(teachers.id, id)).limit(1);
    return teacher ?? null;
  };

  export const findByUserIds = async (userIds: string[], tx?: DBTransaction): Promise<Map<string, string | null>> => {
    if (userIds.length === 0) return new Map();

    const executor = tx ?? db;
    const rows = await executor
      .select({ userId: teachers.userId, teacherId: teachers.id })
      .from(teachers)
      .where(inArray(teachers.userId, userIds));

    const map = new Map<string, string | null>(userIds.map(id => [id, null]));
    for (const row of rows) {
      map.set(row.userId, row.teacherId);
    }
    return map;
  };

  export const searchTeachers = async (searchQuery: string, limit: number, tx?: DBTransaction) => {
    const executor = tx ?? db;
    return await executor
      .select({
        id: teachers.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(
        and(
          isNull(users.deletedAt),
          eq(users.status, AccountStatus.ACTIVATED),
          searchQuery ? ilike(users.name, `%${escapeLikeWildcards(searchQuery)}%`) : undefined
        )
      )
      .limit(limit);
  };

  export const getTeacherDirectory = async (
    paginationArgs: PaginationArgs | null,
    search?: string,
    tx?: DBTransaction
  ): Promise<{ rows: TeacherDirectoryRow[]; totalCount: number }> => {
    const executor = tx ?? db;

    const conditions = and(
      isNull(users.deletedAt),
      search
        ? or(
            ilike(users.name, `%${escapeLikeWildcards(search)}%`),
            ilike(users.email, `%${escapeLikeWildcards(search)}%`)
          )
        : undefined
    );

    const baseSelect = {
      id: teachers.id,
      userId: teachers.userId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      status: users.status,
    };

    let rowsQuery = executor
      .select(baseSelect)
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(conditions)
      .orderBy(users.name)
      .$dynamic();

    if (paginationArgs) {
      rowsQuery = queryWithPagination(rowsQuery, paginationArgs);
    }

    const countQuery = executor
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(conditions);

    const [rawRows, countResult] = await Promise.all([rowsQuery, countQuery]);

    const rows = rawRows.map(row => Object.assign(row, { status: parseAccountStatus(row.status) }));

    const totalCount = countResult[0]?.count ?? 0;

    return { rows, totalCount };
  };

  export const getTeacherDirectoryMetrics = async (tx?: DBTransaction): Promise<TeacherDirectoryMetrics> => {
    const executor = tx ?? db;

    const [metrics] = await executor
      .select({
        activated: sql<number>`sum(case when ${users.status} = 'ACTIVATED' then 1 else 0 end)`.mapWith(Number),
        deactivated: sql<number>`sum(case when ${users.status} = 'DEACTIVATED' then 1 else 0 end)`.mapWith(Number),
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(isNull(users.deletedAt));

    return {
      id: "teacher-directory-metrics",
      activated: metrics?.activated ?? 0,
      deactivated: metrics?.deactivated ?? 0,
    };
  };

  const buildTeacherProfileSelect = () => ({
    id: teachers.id,
    userId: teachers.userId,
    name: users.name,
    email: users.email,
    phone: teachers.phone,
    nationalId: teachers.nationalId,
    nationality: teachers.nationality,
    countryCode: teachers.countryCode,
    dateOfBirth: teachers.dateOfBirth,
    gender: teachers.gender,
    address: teachers.address,
    qualifications: teachers.qualifications,
    timezone: users.timezone,
    hourlyRate: teachers.hourlyRate,
    rateCurrency: teachers.rateCurrency,
    status: users.status,
    updatedAt: teachers.updatedAt,
    totalClasses: sql<number>`(
      SELECT COUNT(*)
      FROM class_instances
      WHERE class_instances.teacher_id = ${teachers.id}
        AND class_instances.outcome = 'TAKEN'
        AND class_instances.execution_state = 'COMPLETED'
        AND class_instances.deleted_at IS NULL
    )`.mapWith(Number),
    avgEngagementScore: sql<number>`(
      SELECT COALESCE(AVG(class_instance_performance.engagement_score), 0)
      FROM class_instance_performance
      JOIN class_instances ON class_instances.id = class_instance_performance.class_instance_id
      WHERE class_instances.teacher_id = ${teachers.id}
        AND class_instance_performance.engagement_score IS NOT NULL
    )`.mapWith(Number),
  });

  const mapTeacherProfileRow = (teacher: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    nationalId: string | null;
    nationality: string | null;
    countryCode: string | null;
    dateOfBirth: string | Date | null;
    gender: Gender | null;
    address: string | null;
    qualifications: string | null;
    timezone: string;
    hourlyRate: string | null;
    rateCurrency: CurrencyCode | null;
    status: AccountStatus;
    updatedAt: Date;
    totalClasses: number;
    avgEngagementScore: number;
  }): TeacherProfileReturnType => ({
    id: teacher.id,
    userId: teacher.userId,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    nationalId: teacher.nationalId,
    nationality: teacher.nationality,
    countryCode: teacher.countryCode,
    gender: teacher.gender,
    address: teacher.address,
    qualifications: teacher.qualifications,
    timezone: parseIanaTimezone(teacher.timezone),
    hourlyRate: teacher.hourlyRate,
    rateCurrency: teacher.rateCurrency,
    status: teacher.status,
    dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString() : null,
    updatedAt: new Date(teacher.updatedAt).toISOString(),
    totalClasses: teacher.totalClasses,
    avgEngagementScore: teacher.avgEngagementScore,
  });

  export const getTeacherProfileForEdit = async (
    teacherId: string,
    tx?: DBTransaction
  ): Promise<TeacherProfileReturnType | null> => {
    const executor = tx ?? db;
    const [teacher] = await executor
      .select(buildTeacherProfileSelect())
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!teacher) return null;

    return mapTeacherProfileRow({
      ...teacher,
      gender: parseGender(teacher.gender),
      status: parseAccountStatus(teacher.status),
    });
  };

  export const updateTeacherProfile = async (
    teacherId: string,
    input: TeacherProfileUpdateInputType,
    tx?: DBTransaction
  ): Promise<boolean> => {
    const executor = tx ?? db;
    const now = new Date();
    const restInput = Object.fromEntries(
      Object.entries(input).filter(([key]) => key !== "timezone" && key !== "status")
    ) as Omit<TeacherProfileUpdateInputType, "timezone" | "status">;
    const setInput = {
      ...restInput,
      updatedAt: now,
    };
    const [updated] = await executor
      .update(teachers)
      .set(setInput)
      .where(eq(teachers.id, teacherId))
      .returning({ id: teachers.id });
    return !!updated;
  };
  export const upsertByUserId = async (
    userId: string,
    extraValues?: { hourlyRate?: string | null; rateCurrency?: CurrencyCode | null },
    tx?: DBTransaction
  ): Promise<TeacherSelectType> => {
    const executor = tx ?? db;
    const now = new Date();
    const [row] = await executor
      .insert(teachers)
      .values({ userId, createdAt: now, updatedAt: now, ...extraValues })
      .onConflictDoUpdate({
        target: teachers.userId,
        set: { updatedAt: now, ...extraValues },
      })
      .returning();
    if (!row) {
      throw new Error("Teacher upsert failed");
    }
    return row;
  };
}
