import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teachers, users } from "@/backend/db/schema";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export namespace TeacherRepository {
  export type TeacherDirectoryRow = {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    status: string;
    zoomLink: string | null;
  };

  export type TeacherDirectoryMetrics = {
    activated: number;
    deactivated: number;
  };

  export const findByUserId = async (userId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const [teacher] = await queryDb.select().from(teachers).where(eq(teachers.userId, userId)).limit(1);
    return teacher ?? null;
  };

  export const searchTeachers = async (searchQuery: string, limit: number, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    return await queryDb
      .select({
        id: teachers.id,
        name: users.name,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(
        and(
          isNull(users.deletedAt),
          eq(users.isActive, true),
          searchQuery ? ilike(users.name, `%${searchQuery}%`) : undefined
        )
      )
      .limit(limit);
  };

  export const getTeacherDirectory = async (
    options?: { search?: string; limit?: number; offset?: number },
    tx?: DBTransaction
  ): Promise<TeacherDirectoryRow[]> => {
    const queryDb = tx ?? db;

    const conditions = and(
      isNull(users.deletedAt),
      options?.search
        ? or(ilike(users.name, `%${options.search}%`), ilike(users.email, `%${options.search}%`))
        : undefined
    );

    const query = queryDb
      .select({
        id: teachers.id,
        userId: teachers.userId,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: teachers.status,
        zoomLink: teachers.zoomLink,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(conditions)
      .orderBy(users.name);

    let finalQuery = query;
    if (options?.limit !== undefined) {
      finalQuery = finalQuery.limit(options.limit) as typeof finalQuery;
    }
    if (options?.offset !== undefined) {
      finalQuery = finalQuery.offset(options.offset) as typeof finalQuery;
    }

    return finalQuery;
  };

  export const getTeacherDirectoryMetrics = async (tx?: DBTransaction): Promise<TeacherDirectoryMetrics> => {
    const queryDb = tx ?? db;

    const [metrics] = await queryDb
      .select({
        activated: sql<number>`sum(case when ${teachers.status} = 'ACTIVATED' then 1 else 0 end)`.mapWith(Number),
        deactivated: sql<number>`sum(case when ${teachers.status} = 'DEACTIVATED' then 1 else 0 end)`.mapWith(Number),
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(isNull(users.deletedAt));

    return {
      activated: metrics?.activated ?? 0,
      deactivated: metrics?.deactivated ?? 0,
    };
  };
}
