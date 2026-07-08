import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { teachers, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type {
  PaginationArgs,
  TeacherCreateResult,
  TeacherDirectoryMetrics,
  TeacherDirectoryRow,
  TeacherEntityInput,
  TeacherProfileReturnType,
  TeacherProfileUpdateInputType,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import type { AccountStatus, Gender, PaymentMethod } from "@/shared/lib/enum";
import type { DBTransaction } from "../db.types";

export namespace TeacherRepository {
  export async function create(
    input: TeacherEntityInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherCreateResult> {
    const queryDb = tx ?? db;

    const existingTeacher = await queryDb
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.userId, input.userId))
      .limit(1);

    if (existingTeacher.length > 0) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("teacher.alreadyExists"));
    }

    const [created] = await queryDb
      .insert(teachers)
      .values({
        userId: input.userId,
        status: input.status,
        nationality: input.nationality ?? null,
        nationalId: input.nationalId ?? null,
        phone: input.phone ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        gender: input.gender ?? null,
        address: input.address ?? null,
        qualifications: input.qualifications ?? null,
        skypeId: input.skypeId ?? null,
        zoomLink: input.zoomLink ?? null,
        zoomUsername: input.zoomUsername ?? null,
        zoomPassword: input.zoomPassword ?? null,
        countryCode: input.countryCode ?? null,
        timezoneId: input.timezoneId ?? null,
        timezone: input.timezone,
        hourlyRate: input.hourlyRate ?? null,
        rateCurrency: input.rateCurrency ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!created) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("teacher.createFailed"));
    }

    return {
      id: created.id,
      userId: created.userId,
      status: created.status,
      timezone: created.timezone,
      createdAt: created.createdAt,
    };
  }

  export const findByUserId = async (userId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const [teacher] = await queryDb.select().from(teachers).where(eq(teachers.userId, userId)).limit(1);
    return teacher ?? null;
  };

  export const findById = async (id: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const [teacher] = await queryDb.select().from(teachers).where(eq(teachers.id, id)).limit(1);
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
    const queryDb = tx ?? db;

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
      status: teachers.status,
      zoomLink: teachers.zoomLink,
    };

    let rowsQuery = queryDb
      .select(baseSelect)
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(conditions)
      .orderBy(users.name)
      .$dynamic();

    if (paginationArgs) {
      rowsQuery = queryWithPagination(rowsQuery, paginationArgs);
    }

    const countQuery = queryDb
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(conditions);

    const [rawRows, countResult] = await Promise.all([rowsQuery, countQuery]);

    const rows = rawRows.map(row => ({
      ...row,
      status: row.status as AccountStatus,
    }));

    const totalCount = countResult[0]?.count ?? 0;

    return { rows, totalCount };
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
    dateOfBirth: teachers.dateOfBirth,
    gender: teachers.gender,
    address: teachers.address,
    qualifications: teachers.qualifications,
    skypeId: teachers.skypeId,
    zoomLink: teachers.zoomLink,
    zoomUsername: teachers.zoomUsername,
    timezone: teachers.timezone,
    hourlyRate: teachers.hourlyRate,
    rateCurrency: teachers.rateCurrency,
    paymentMethod: teachers.paymentMethod,
    status: teachers.status,
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
    dateOfBirth: string | Date | null;
    gender: Gender | null;
    address: string | null;
    qualifications: string | null;
    skypeId: string | null;
    zoomLink: string | null;
    zoomUsername: string | null;
    timezone: string;
    hourlyRate: string | null;
    rateCurrency: string | null;
    paymentMethod: PaymentMethod | null;
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
    gender: teacher.gender,
    address: teacher.address,
    qualifications: teacher.qualifications,
    skypeId: teacher.skypeId,
    zoomLink: teacher.zoomLink,
    zoomUsername: teacher.zoomUsername,
    timezone: teacher.timezone,
    hourlyRate: teacher.hourlyRate,
    rateCurrency: teacher.rateCurrency,
    paymentMethod: teacher.paymentMethod,
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
    const queryDb = tx ?? db;
    const [teacher] = await queryDb
      .select(buildTeacherProfileSelect())
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!teacher) return null;

    return mapTeacherProfileRow({
      ...teacher,
      gender: teacher.gender as Gender | null,
      paymentMethod: teacher.paymentMethod as PaymentMethod | null,
      status: teacher.status as AccountStatus,
    });
  };

  export const updateTeacherProfile = async (
    teacherId: string,
    input: TeacherProfileUpdateInputType,
    tx?: DBTransaction
  ): Promise<boolean> => {
    const queryDb = tx ?? db;
    const now = new Date();
    const { timezone: tzInput, ...restInput } = input;
    const setInput = {
      ...restInput,
      ...(tzInput == null ? {} : { timezone: tzInput }),
      updatedAt: now,
    };
    const [updated] = await queryDb
      .update(teachers)
      .set(setInput)
      .where(eq(teachers.id, teacherId))
      .returning({ id: teachers.id });
    return !!updated;
  };
}
