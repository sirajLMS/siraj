import { and, count, desc, eq, gte, ilike, inArray, isNull, lt, or, type SQL, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import {
  classInstancePerformance,
  classInstances,
  invoices,
  notificationDeliveries,
  parents,
  siteContent,
  students,
  teachers,
  users,
} from "@/backend/db/schema";
import {
  AccountStatus,
  BookingStatus,
  ClassOutcome,
  type CurrencyCode,
  type ParentStatus,
  StudentStatus,
} from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import {
  parseAccountStatus,
  parseClassExecutionState,
  parseClassOutcome,
  parseCurrencyCode,
  parseIanaTimezone,
  parseParentStatus,
  parseStudentStatus,
} from "@/backend/lib/enum";
import type {
  PaginationArgs,
  ParentCreateResult,
  ParentDashboardMetricsType,
  ParentDashboardScheduleRow,
  ParentDirectoryRawMetrics,
  ParentDirectoryRawRow,
  ParentEntity,
  ParentEntityInput,
  ParentProfileUpdateInput,
  StudentProgressReturnType,
  WorkshopPromoReturnType,
} from "@/backend/types";
import { PaginationUtils } from "@/backend/utils";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export namespace ParentRepository {
  export async function create(
    input: ParentEntityInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ParentCreateResult> {
    const queryDb = tx ?? db;

    // Verify the user exists and doesn't already have a parent profile
    const existingParent = await queryDb
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.userId, input.userId))
      .limit(1);

    if (existingParent.length > 0) {
      const { parent } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(parent.alreadyExists);
    }

    const [created] = await queryDb
      .insert(parents)
      .values({
        userId: input.userId,
        status: input.status,
        nationality: input.nationality ?? null,
        address: input.address ?? null,
        facebook: input.facebook ?? null,
        whatsapp: input.whatsapp ?? null,
        twitter: input.twitter ?? null,
        invoiceType: input.invoiceType ?? null,
        feeAmount: input.feeAmount ?? null,
        currency: input.currency ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!created) {
      const { parent } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(parent.createFailed);
    }

    const [userRow] = await queryDb
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    return {
      id: created.id,
      userId: created.userId,
      status: created.status,
      invoiceType: created.invoiceType,
      feeAmount: created.feeAmount,
      currency: created.currency,
      timezone: parseIanaTimezone(userRow?.timezone),
      createdAt: created.createdAt,
    };
  }

  export type ParentDirectoryMetrics = ParentDirectoryRawMetrics;

  export type ParentDirectoryRow = ParentDirectoryRawRow;

  export type ParentDirectoryResult = {
    metrics: ParentDirectoryMetrics;
    rows: ParentDirectoryRow[];
    totalCount: number;
    pageInfo: import("@/backend/types").PageInfo | null;
  };

  async function fetchDirectoryMetrics(queryDb: typeof db | DBTransaction): Promise<ParentDirectoryMetrics> {
    const metricsResult = await queryDb
      .select({
        status: parents.status,
        count: count(),
      })
      .from(parents)
      .groupBy(parents.status);

    return {
      regular: metricsResult.find(m => m.status === "REGULAR")?.count ?? 0,
      onLeave: metricsResult.find(m => m.status === "ON_LEAVE")?.count ?? 0,
      suspended: metricsResult.find(m => m.status === "SUSPENDED")?.count ?? 0,
      onTrial: metricsResult.find(m => m.status === "ON_TRIAL")?.count ?? 0,
    };
  }

  function buildDirectoryConditions(options: {
    search?: string | null;
    lifecycleStatus?: ParentStatus | null;
  }): (SQL | undefined)[] {
    const conditions: (SQL | undefined)[] = [];
    if (options.search) {
      conditions.push(or(ilike(users.name, `%${options.search}%`), ilike(users.email, `%${options.search}%`)));
    }
    if (options.lifecycleStatus) {
      conditions.push(eq(parents.status, options.lifecycleStatus));
    }
    return conditions;
  }

  async function fetchUnpaidInvoiceCounts(
    queryDb: typeof db | DBTransaction,
    parentIds: string[]
  ): Promise<Map<string, number>> {
    if (parentIds.length === 0) return new Map();

    const unpaidCounts = await queryDb
      .select({
        parentId: invoices.parentId,
        cnt: sql<number>`COUNT(*)::int`.mapWith(Number),
      })
      .from(invoices)
      .where(and(inArray(invoices.parentId, parentIds), eq(invoices.status, "UNPAID")))
      .groupBy(invoices.parentId);

    return new Map(unpaidCounts.map(r => [r.parentId, r.cnt]));
  }

  export const getParentDirectory = async (
    options: { search?: string | null; pagination?: PaginationArgs | null; lifecycleStatus?: ParentStatus | null },
    tx?: DBTransaction
  ): Promise<ParentDirectoryResult> => {
    const queryDb = tx ?? db;

    const metrics = await fetchDirectoryMetrics(queryDb);
    const conditions = buildDirectoryConditions(options);

    let rowsQuery = queryDb
      .select({
        id: parents.id,
        userId: parents.userId,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        lifecycleStatus: parents.status,
        accountStatus: users.status,
        updatedAt: parents.updatedAt,
      })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(parents.updatedAt))
      .$dynamic();

    if (options.pagination) {
      rowsQuery = queryWithPagination(rowsQuery, options.pagination);
    }

    const rows = await rowsQuery;

    const [totalCount, unpaidMap] = await Promise.all([
      queryDb
        .select({ count: count() })
        .from(parents)
        .innerJoin(users, eq(parents.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined),
      fetchUnpaidInvoiceCounts(
        queryDb,
        rows.map(r => r.id)
      ),
    ]);

    const rowsWithUnpaid = rows.map(r => ({
      ...r,
      unpaidInvoices: unpaidMap.get(r.id) ?? 0,
    }));

    const total = totalCount[0]?.count ?? 0;
    const pageInfo = PaginationUtils.buildPageInfoFromArgs(options.pagination ?? null, rowsWithUnpaid.length, total);

    return {
      metrics,
      rows: rowsWithUnpaid,
      totalCount: total,
      pageInfo,
    };
  };

  export const getStudentsForParent = async (parentId: string, tx?: DBTransaction): Promise<{ name: string }[]> => {
    const queryDb = tx ?? db;
    return await queryDb.select({ name: students.name }).from(students).where(eq(students.parentId, parentId)).limit(5);
  };

  export const getStudentsForParents = async (
    parentIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, { name: string }[]>> => {
    const queryDb = tx ?? db;

    if (parentIds.length === 0) {
      return new Map();
    }

    const rows = await queryDb
      .select({
        parentId: students.parentId,
        name: students.name,
      })
      .from(students)
      .where(inArray(students.parentId, [...parentIds]))
      .limit(5 * parentIds.length);

    const result = new Map<string, { name: string }[]>();
    for (const id of parentIds) {
      result.set(id, []);
    }
    for (const row of rows) {
      result.get(row.parentId)?.push({ name: row.name });
    }
    return result;
  };

  export type ParentProfileResult = {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    lifecycleStatus: string;
    accountStatus: AccountStatus;
    phone: string | null;
    nationality: string | null;
    address: string | null;
    facebook: string | null;
    whatsapp: string | null;
    twitter: string | null;
    invoiceType: string | null;
    feeAmount: string | null;
    currency: CurrencyCode | null;
    displayCurrency: CurrencyCode | null;
    timezone: IanaTimezone;
    createdAt: Date;
    updatedAt: Date;
  };

  export const getParentProfile = async (parentId: string, tx?: DBTransaction): Promise<ParentProfileResult | null> => {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({
        id: parents.id,
        userId: parents.userId,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        lifecycleStatus: parents.status,
        accountStatus: users.status,
        phone: users.phone,
        nationality: parents.nationality,
        address: parents.address,
        facebook: parents.facebook,
        whatsapp: parents.whatsapp,
        twitter: parents.twitter,
        invoiceType: parents.invoiceType,
        feeAmount: parents.feeAmount,
        currency: parents.currency,
        displayCurrency: users.displayCurrency,
        timezone: users.timezone,
        createdAt: parents.createdAt,
        updatedAt: parents.updatedAt,
      })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.id, parentId))
      .limit(1);

    if (!results[0]) return null;

    return {
      ...results[0],
      accountStatus: parseAccountStatus(results[0].accountStatus),
      timezone: parseIanaTimezone(results[0].timezone),
      displayCurrency: parseCurrencyCode(results[0].displayCurrency),
    };
  };

  export const updateParentProfile = async (
    parentId: string,
    input: ParentProfileUpdateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ParentProfileResult> => {
    const queryDb = tx ?? db;
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

    const existing = await getParentProfile(parentId, tx);
    if (!existing) {
      throw new Error(errorsTranslations.parentNotFound);
    }

    const now = new Date();
    const parentUpdate: Record<string, unknown> = { updatedAt: now };

    if (input.nationality !== undefined) parentUpdate.nationality = input.nationality;
    if (input.address !== undefined) parentUpdate.address = input.address;
    if (input.facebook !== undefined) parentUpdate.facebook = input.facebook;
    if (input.whatsapp !== undefined) parentUpdate.whatsapp = input.whatsapp;
    if (input.twitter !== undefined) parentUpdate.twitter = input.twitter;
    if (input.invoiceType !== undefined) parentUpdate.invoiceType = input.invoiceType;
    if (input.feeAmount !== undefined) parentUpdate.feeAmount = input.feeAmount;
    if (input.currency !== undefined) parentUpdate.currency = input.currency;

    await queryDb.update(parents).set(parentUpdate).where(eq(parents.id, parentId));

    const updated = await getParentProfile(parentId, tx);
    if (!updated) {
      throw new Error(errorsTranslations.parentNotFound);
    }

    return updated;
  };

  export const findByUserId = async (userId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const [parent] = await queryDb.select().from(parents).where(eq(parents.userId, userId)).limit(1);
    return parent ?? null;
  };

  export const findUserIdByParentId = async (parentId: string, tx?: DBTransaction): Promise<string | null> => {
    const queryDb = tx ?? db;
    const [parent] = await queryDb
      .select({ userId: parents.userId })
      .from(parents)
      .where(eq(parents.id, parentId))
      .limit(1);
    return parent?.userId ?? null;
  };

  export type DeactivatedParentResult = {
    id: string;
    userId: string;
    accountStatus: AccountStatus;
    updatedAt: Date;
  };

  export const deactivateParent = async (
    parentId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<DeactivatedParentResult> => {
    const queryDb = tx ?? db;
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

    const existing = await queryDb
      .select({ id: parents.id, userId: parents.userId, accountStatus: users.status })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.id, parentId))
      .limit(1);

    if (existing.length === 0) {
      throw new Error(errorsTranslations.parentNotFound);
    }

    const current = existing[0];
    if (parseAccountStatus(current.accountStatus) === AccountStatus.DEACTIVATED) {
      throw new Error(errorsTranslations.parentAlreadyDeactivated);
    }

    const updatedUser = await UserRepository.updateStatus(current.userId, AccountStatus.DEACTIVATED, tx, locale);

    const [updatedParent] = await queryDb
      .update(parents)
      .set({ updatedAt: new Date() })
      .where(eq(parents.id, parentId))
      .returning({
        id: parents.id,
        userId: parents.userId,
        updatedAt: parents.updatedAt,
      });

    return {
      id: updatedParent.id,
      userId: updatedParent.userId,
      accountStatus: parseAccountStatus(updatedUser.status),
      updatedAt: updatedParent.updatedAt,
    };
  };

  export const reactivateParent = async (
    parentId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<DeactivatedParentResult> => {
    const queryDb = tx ?? db;
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

    const existing = await queryDb
      .select({ id: parents.id, userId: parents.userId, accountStatus: users.status })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.id, parentId))
      .limit(1);

    if (existing.length === 0) {
      throw new Error(errorsTranslations.parentNotFound);
    }

    const current = existing[0];
    if (parseAccountStatus(current.accountStatus) !== AccountStatus.DEACTIVATED) {
      throw new Error(errorsTranslations.parentAlreadyActivated);
    }

    const updatedUser = await UserRepository.updateStatus(current.userId, AccountStatus.ACTIVATED, tx, locale);

    const [updatedParent] = await queryDb
      .update(parents)
      .set({ updatedAt: new Date() })
      .where(eq(parents.id, parentId))
      .returning({
        id: parents.id,
        userId: parents.userId,
        updatedAt: parents.updatedAt,
      });

    return {
      id: updatedParent.id,
      userId: updatedParent.userId,
      accountStatus: parseAccountStatus(updatedUser.status),
      updatedAt: updatedParent.updatedAt,
    };
  };

  export type ChangeParentLifecycleResult = {
    id: string;
    lifecycleStatus: ParentStatus;
  };

  export const changeLifecycleStatus = async (
    parentId: string,
    newStatus: ParentStatus,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ChangeParentLifecycleResult> => {
    const queryDb = tx ?? db;
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

    const existing = await queryDb.select({ id: parents.id }).from(parents).where(eq(parents.id, parentId)).limit(1);

    if (existing.length === 0) {
      throw new Error(errorsTranslations.parentNotFound);
    }

    const [updated] = await queryDb
      .update(parents)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(parents.id, parentId))
      .returning({
        id: parents.id,
        status: parents.status,
      });

    return {
      id: updated.id,
      lifecycleStatus: parseParentStatus(updated.status) ?? newStatus,
    };
  };

  export type AssociatedStudentRow = {
    id: string;
    name: string;
    studentAvatarUrl: string | null;
    status: StudentStatus;
    primaryTeacherId: string | null;
    teacherUserId: string | null;
    teacherName: string | null;
    teacherAvatarUrl: string | null;
    hoursPerWeek: string;
    classesRemaining: number;
    classesTotal: number;
    language: string | null;
    gender: string | null;
    version: number;
    updatedAt: Date;
  };

  const getAssociatedStudentsBaseQuery = (queryDb: typeof db | DBTransaction) => {
    return queryDb
      .select({
        id: students.id,
        name: students.name,
        studentAvatarUrl: students.avatarUrl,
        status: students.status,
        primaryTeacherId: students.primaryTeacherId,
        teacherUserId: teachers.userId,
        teacherName: users.name,
        teacherAvatarUrl: users.avatarUrl,
        hoursPerWeek: students.hoursPerWeek,
        classesRemaining: students.classesRemaining,
        classesTotal: students.classesTotal,
        language: students.language,
        gender: students.gender,
        version: students.version,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .leftJoin(teachers, eq(students.primaryTeacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id));
  };

  const mapAssociatedStudentRow = (r: {
    id: string;
    name: string;
    studentAvatarUrl: string | null;
    status: string;
    primaryTeacherId: string | null;
    teacherUserId: string | null;
    teacherName: string | null;
    teacherAvatarUrl: string | null;
    hoursPerWeek: string;
    classesRemaining: number;
    classesTotal: number;
    language: string | null;
    gender: string | null;
    version: number;
    updatedAt: Date;
  }): AssociatedStudentRow => ({
    id: r.id,
    name: r.name,
    studentAvatarUrl: r.studentAvatarUrl,
    status: parseStudentStatus(r.status) ?? StudentStatus.REGULAR,
    primaryTeacherId: r.primaryTeacherId,
    teacherUserId: r.teacherUserId,
    teacherName: r.teacherName ?? null,
    teacherAvatarUrl: r.teacherAvatarUrl,
    hoursPerWeek: r.hoursPerWeek,
    classesRemaining: r.classesRemaining,
    classesTotal: r.classesTotal,
    language: r.language ?? null,
    gender: r.gender ?? null,
    version: r.version,
    updatedAt: r.updatedAt,
  });

  export const getAssociatedStudents = async (
    parentId: string,
    tx?: DBTransaction
  ): Promise<AssociatedStudentRow[]> => {
    const queryDb = tx ?? db;

    const results = await getAssociatedStudentsBaseQuery(queryDb)
      .where(eq(students.parentId, parentId))
      .orderBy(students.name);

    return results.map(mapAssociatedStudentRow);
  };

  export const getAssociatedStudentById = async (
    studentId: string,
    tx?: DBTransaction
  ): Promise<AssociatedStudentRow | null> => {
    const queryDb = tx ?? db;

    const results = await getAssociatedStudentsBaseQuery(queryDb).where(eq(students.id, studentId)).limit(1);

    if (results.length === 0) {
      return null;
    }

    return mapAssociatedStudentRow(results[0]);
  };

  export type ParentDashboardScheduleResult = {
    rows: ParentDashboardScheduleRow[];
    totalCount: number;
    pageInfo: import("@/backend/types").PageInfo | null;
  };

  async function fetchParentTimezone(t: DBTransaction, parentId: string): Promise<string> {
    const parentRow = await t
      .select({ timezone: users.timezone })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.id, parentId))
      .limit(1);
    return parentRow[0]?.timezone ?? "UTC";
  }

  async function buildScheduleConditions(
    input: { date?: Date | null; search?: string | null },
    studentIds: string[],
    timezone: string
  ): Promise<SQL | undefined> {
    const conditions: (SQL | undefined)[] = [
      isNull(classInstances.deletedAt),
      inArray(classInstances.studentId, studentIds),
    ];

    if (input.date) {
      const { getDayBoundaries } = await import("@/backend/lib/timezone");
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(input.date, timezone);
      conditions.push(
        gte(classInstances.scheduledStartAt, startOfDayUtc),
        lt(classInstances.scheduledStartAt, endOfDayUtc)
      );
    }

    if (input.search) {
      const searchPattern = `%${input.search}%`;
      const searchCondition = or(ilike(students.name, searchPattern), ilike(users.name, searchPattern));
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return and(...conditions);
  }

  function buildScheduleDataQuery(t: DBTransaction) {
    return t
      .select({
        id: classInstances.id,
        studentId: classInstances.studentId,
        studentName: students.name,
        studentAvatarUrl: students.avatarUrl,
        teacherId: classInstances.teacherId,
        teacherName: sql<string>`COALESCE(${users.name}, '')`,
        teacherAvatarUrl: users.avatarUrl,
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
        durationMinutes: classInstances.durationMinutes,
        isRescheduled: classInstances.isRescheduled,
        executionState: classInstances.executionState,
        outcome: classInstances.outcome,
        meetingJoinUrl: classInstances.meetingJoinUrl,
        isFrozen: classInstances.isFrozen,
      })
      .from(classInstances)
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id));
  }

  async function fetchScheduleCount(t: DBTransaction, whereClause: SQL | undefined): Promise<number> {
    const [countRow] = await t
      .select({ count: count() })
      .from(classInstances)
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(whereClause);
    return countRow?.count ?? 0;
  }

  async function mapScheduleRows(
    queryRows: Awaited<ReturnType<ReturnType<typeof buildScheduleDataQuery>["execute"]>>,
    viewerTimezone: string,
    locale?: string
  ): Promise<ParentDashboardScheduleRow[]> {
    const { formatInstantInTimezone } = await import("@/backend/lib/timezone");

    return queryRows.map(r => {
      const studentName = r.studentName ?? "";
      const initials = studentName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join("");

      return {
        id: r.id,
        studentId: r.studentId,
        studentName,
        studentInitials: initials,
        studentAvatarUrl: r.studentAvatarUrl ?? null,
        teacherId: r.teacherId,
        teacherName: r.teacherName ?? "",
        teacherAvatarUrl: r.teacherAvatarUrl ?? null,
        scheduledStartAt: r.scheduledStartAt,
        scheduledEndAt: r.scheduledEndAt,
        durationMinutes: r.durationMinutes,
        bookingStatus: r.isRescheduled ? BookingStatus.RESCHEDULED : BookingStatus.CONFIRMED,
        executionState: parseClassExecutionState(r.executionState),
        outcome: parseClassOutcome(r.outcome) ?? ClassOutcome.PENDING,
        meetingJoinUrl: r.meetingJoinUrl ?? null,
        isFrozen: r.isFrozen ?? false,
        classTimeFormatted: formatInstantInTimezone(r.scheduledStartAt, viewerTimezone, locale),
      };
    });
  }

  export const getParentDashboardSchedule = async (
    parentId: string,
    input: { date?: Date | null; search?: string | null; pagination?: PaginationArgs | null; locale?: string },
    tx?: DBTransaction
  ): Promise<ParentDashboardScheduleResult> => {
    const runner = async (t: DBTransaction): Promise<ParentDashboardScheduleResult> => {
      const parentStudents = await t.select({ id: students.id }).from(students).where(eq(students.parentId, parentId));
      const studentIds = parentStudents.map(s => s.id);

      if (studentIds.length === 0) {
        const pageInfo = PaginationUtils.buildPageInfoFromArgs(input.pagination, 0, 0);
        return { rows: [], totalCount: 0, pageInfo };
      }

      const timezoneForFormatting = await fetchParentTimezone(t, parentId);
      const viewerTimezone = input.date ? timezoneForFormatting : "UTC";
      const whereClause = await buildScheduleConditions(input, studentIds, viewerTimezone);

      let dataQuery = buildScheduleDataQuery(t).where(whereClause).orderBy(classInstances.scheduledStartAt).$dynamic();

      if (input.pagination) {
        dataQuery = queryWithPagination(dataQuery, input.pagination);
      }

      const [queryRows, totalCount] = await Promise.all([dataQuery, fetchScheduleCount(t, whereClause)]);

      const mappedRows = await mapScheduleRows(queryRows, timezoneForFormatting, input.locale);
      const pageInfo = PaginationUtils.buildPageInfoFromArgs(input.pagination, mappedRows.length, totalCount);

      return { rows: mappedRows, totalCount, pageInfo };
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  async function fetchTodaysClassCount(queryDb: typeof db | DBTransaction, studentIds: string[]): Promise<number> {
    if (studentIds.length === 0) return 0;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [classCountRow] = await queryDb
      .select({ count: count() })
      .from(classInstances)
      .where(
        and(
          inArray(classInstances.studentId, studentIds),
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, todayStart),
          lt(classInstances.scheduledStartAt, todayEnd)
        )
      );
    return classCountRow?.count ?? 0;
  }

  async function fetchPendingInvoiceSummary(
    queryDb: typeof db | DBTransaction,
    parentId: string
  ): Promise<{ count: number; totalAmount: string }> {
    const [invoiceRow] = await queryDb
      .select({
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(${invoices.amount}), '0')`,
      })
      .from(invoices)
      .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)));

    return {
      count: invoiceRow?.count ?? 0,
      totalAmount: invoiceRow?.totalAmount ?? "0",
    };
  }

  async function fetchUnreadMessageCount(queryDb: typeof db | DBTransaction, parentId: string): Promise<number> {
    const [unreadRow] = await queryDb
      .select({ count: count() })
      .from(notificationDeliveries)
      .innerJoin(users, eq(notificationDeliveries.userId, users.id))
      .innerJoin(parents, eq(parents.userId, users.id))
      .where(
        and(
          eq(parents.id, parentId),
          eq(notificationDeliveries.status, "DELIVERED"),
          sql`${notificationDeliveries.openedAt} IS NULL`
        )
      );
    return unreadRow?.count ?? 0;
  }

  async function fetchPerformanceAvg(queryDb: typeof db | DBTransaction, studentIds: string[]): Promise<number> {
    if (studentIds.length === 0) return 0;

    const [avgRow] = await queryDb
      .select({
        avgScore: sql<number>`COALESCE(AVG(${classInstancePerformance.engagementScore}), 0)`,
      })
      .from(classInstancePerformance)
      .innerJoin(classInstances, eq(classInstancePerformance.classInstanceId, classInstances.id))
      .where(
        and(
          inArray(classInstances.studentId, studentIds),
          isNull(classInstances.deletedAt),
          sql`${classInstancePerformance.engagementScore} IS NOT NULL`
        )
      );
    return avgRow?.avgScore ?? 0;
  }

  export const getParentDashboardMetrics = async (
    parentId: string,
    tx?: DBTransaction
  ): Promise<ParentDashboardMetricsType> => {
    const queryDb = tx ?? db;

    const parentStudents = await queryDb
      .select({ id: students.id })
      .from(students)
      .where(eq(students.parentId, parentId));
    const studentIds = parentStudents.map(s => s.id);
    const totalStudents = parentStudents.length;

    const [todaysClasses, invoiceSummary, pendingMessages, avgScore] = await Promise.all([
      fetchTodaysClassCount(queryDb, studentIds),
      fetchPendingInvoiceSummary(queryDb, parentId),
      fetchUnreadMessageCount(queryDb, parentId),
      fetchPerformanceAvg(queryDb, studentIds),
    ]);

    return {
      id: `parent-metrics-${parentId}`,
      totalStudents,
      todaysClasses,
      pendingInvoicesCount: invoiceSummary.count,
      pendingInvoicesAmount: invoiceSummary.totalAmount,
      performanceAvg: Math.round(avgScore),
      performanceAvgMobile: Math.round(avgScore / 10),
      pendingMessages,
    };
  };

  export const getParentStudentProgress = async (
    parentId: string,
    tx?: DBTransaction
  ): Promise<StudentProgressReturnType[]> => {
    const queryDb = tx ?? db;

    const parentStudents = await queryDb
      .select({
        id: students.id,
        name: students.name,
        classesTotal: students.classesTotal,
        classesRemaining: students.classesRemaining,
      })
      .from(students)
      .where(eq(students.parentId, parentId));

    return parentStudents.map(s => ({
      id: s.id,
      name: s.name,
      completionPercent:
        s.classesTotal > 0 ? Math.round(((s.classesTotal - s.classesRemaining) / s.classesTotal) * 100) : 0,
    }));
  };

  export const getParentWorkshopPromo = async (
    _parentId: string,
    tx?: DBTransaction
  ): Promise<WorkshopPromoReturnType | null> => {
    const queryDb = tx ?? db;

    const rows = await queryDb
      .select({
        id: siteContent.id,
        title: siteContent.title,
        body: siteContent.body,
      })
      .from(siteContent)
      .where(and(eq(siteContent.contentType, "workshop_promo"), eq(siteContent.isPublished, true)))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.body,
      imageUrl: "",
    };
  };
  export const upsertByUserId = async (userId: string, status: string, tx?: DBTransaction): Promise<ParentEntity> => {
    const queryDb = tx ?? db;
    const now = new Date();
    const [row] = await queryDb
      .insert(parents)
      .values({ userId, status, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: parents.userId,
        set: { status, updatedAt: now },
      })
      .returning();
    if (!row) {
      throw new Error("Parent upsert failed");
    }
    return row;
  };
}
