import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { caseInsensitiveLike, db, queryDb, queryWithPagination } from "@/backend/db";
import { TeacherProfileRepository } from "@/backend/db/repo/teachers/teacher-profile.repository";
import { teachers, users } from "@/backend/db/schema";
import { AccountStatus } from "@/backend/enum";
import type {
  DBTransaction,
  PaginationArgs,
  TeacherCreateReturnType,
  TeacherDirectoryMetrics,
  TeacherDirectoryRow,
  TeacherInsertType,
  TeacherProfileUpdateInput,
  TeacherSelectType,
} from "@/backend/types";

/**
 * DB-facing update payload: the repository stores `nationalId` as the
 * serialized `countryCode:number` string, so callers serialize the
 * `NationalIdValue` object before calling `updateTeacherProfile`.
 */
export type TeacherProfileUpdateRepoInput = Omit<TeacherProfileUpdateInput, "nationalId"> & {
  readonly nationalId?: string | null;
};

import { escapeLikeWildcards } from "@/backend/utils";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseAccountStatus, parseIanaTimezone } from "@/shared/lib/enum";
import { getServerTranslations } from "@/shared/locale";

export namespace TeacherRepository {
  export async function create(
    input: TeacherInsertType,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherCreateReturnType> {
    const executor = tx ?? db;

    const userId = input.userId ?? "";

    const existingTeacher = await executor
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.userId, userId))
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
      const { teacher } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(teacher.createFailed);
    }

    const [userRow] = await executor
      .select({ timezone: users.timezone, status: users.status })
      .from(users)
      .where(eq(users.id, userId))
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

  export const listByUserIds = async (userIds: string[], tx?: DBTransaction): Promise<TeacherSelectType[]> => {
    if (userIds.length === 0) return [];
    const q = queryDb(tx);
    return q.select().from(teachers).where(inArray(teachers.userId, userIds));
  };

  export const findById = async (id: string, tx?: DBTransaction) => {
    const q = queryDb(tx);
    const [teacher] = await q.select().from(teachers).where(eq(teachers.id, id)).limit(1);
    return teacher ?? null;
  };

  /**
   * Like `findById`, but treats teachers whose linked user account was
   * soft-deleted as missing — used by write flows that must not reference
   * removed staff.
   */
  export const findActiveById = async (id: string, tx?: DBTransaction): Promise<TeacherSelectType | null> => {
    const q = queryDb(tx);
    const [row] = await q
      .select({ teacher: teachers })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(eq(teachers.id, id), isNull(users.deletedAt)))
      .limit(1);
    return row?.teacher ?? null;
  };

  /**
   * Snapshot of whether the teacher's linked user account is deactivated —
   * used when recording pay-side state that must capture account status at
   * write time. Returns `false` when the teacher does not exist.
   */
  export const isDisabled = async (teacherId: string, tx?: DBTransaction): Promise<boolean> => {
    const q = queryDb(tx);
    const [row] = await q
      .select({ status: users.status })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.id, teacherId))
      .limit(1);
    return parseAccountStatus(row?.status) === AccountStatus.DEACTIVATED;
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
          searchQuery ? caseInsensitiveLike(users.name, `%${escapeLikeWildcards(searchQuery)}%`) : undefined
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
            caseInsensitiveLike(users.name, `%${escapeLikeWildcards(search)}%`),
            caseInsensitiveLike(users.email, `%${escapeLikeWildcards(search)}%`)
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

  export const getTeacherProfileForEdit = TeacherProfileRepository.getTeacherProfileForEdit;
  export const updateTeacherProfile = TeacherProfileRepository.updateTeacherProfile;
  export const upsertByUserId = async (
    userId: string,
    extraValues?: { hourlyRate?: string | null; rateCurrency?: CurrencyCode | null },
    tx?: DBTransaction,
    locale?: string
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
      const { teacher } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(teacher.upsertFailed);
    }
    return row;
  };
}
