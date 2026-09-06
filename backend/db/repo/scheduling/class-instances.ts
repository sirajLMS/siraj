import { and, desc, eq, gte, inArray, isNull, lte, notInArray, or, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, db, type QueryDbHandle, queryDb, withForUpdate } from "@/backend/db";
import {
  type ClassInstanceUpsertManyOptions,
  runClassInstanceUpsertMany,
  upsertSeedClassInstance,
} from "@/backend/db/repo/scheduling/class-instance-upsert";
import {
  acquireLocks,
  checkOverlaps,
  type DBTransaction,
  getClassInstanceByIdOrThrow,
  validateTeacherAssignment,
} from "@/backend/db/repo/scheduling/shared";
import { updateInstanceState } from "@/backend/db/repo/scheduling/state-changes";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { classInstances, classSubjects, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import { type CalculationStatus, OnDemandStatus } from "@/backend/enum";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
import type * as Types from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

/**
 * Batch lookup for multiple class instances by ID — eliminates N+1 queries
 * when dispatching notifications for every instance in a recurring schedule.
 * Returns a Map keyed by instance ID. Entries not found are omitted from the
 * map (caller should use `.get(id) ?? null`).
 */
export const getClassInstancesByIds = async (
  ids: readonly string[],
  tx?: DBTransaction
): Promise<Map<string, Awaited<ReturnType<typeof getClassInstanceById>>>> => {
  if (ids.length === 0) return new Map();
  const q = queryDb(tx);
  const rows = await q
    .select()
    .from(classInstances)
    .where(inArray(classInstances.id, [...ids]));
  if (rows.length === 0) return new Map();

  const studentIds = [...new Set(rows.map(r => r.studentId))];
  const teacherIds = [...new Set(rows.map(r => r.teacherId))];
  const subjectIds = [...new Set(rows.map(r => r.subjectId).filter((s): s is string => s != null))];
  const recurringScheduleIds = [...new Set(rows.map(r => r.recurringScheduleId).filter((s): s is string => s != null))];

  const [studentsData, teachersData, subjectsData, recurringData] = await Promise.all([
    q.select().from(students).where(inArray(students.id, studentIds)),
    q
      .select({ teacher: teachers, user: users })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(inArray(teachers.id, teacherIds)),
    subjectIds.length > 0
      ? q.select().from(classSubjects).where(inArray(classSubjects.id, subjectIds))
      : Promise.resolve([]),
    recurringScheduleIds.length > 0
      ? q.select().from(recurringSchedules).where(inArray(recurringSchedules.id, recurringScheduleIds))
      : Promise.resolve([]),
  ]);

  const studentMap = new Map(studentsData.map(s => [s.id, s]));
  const teacherMap = new Map(teachersData.map(tc => [tc.teacher.id, { ...tc.teacher, user: tc.user }]));
  const subjectMap = new Map(subjectsData.map(s => [s.id, s]));
  const recurringMap = new Map(recurringData.map(r => [r.id, r]));

  const result = new Map<string, Awaited<ReturnType<typeof getClassInstanceById>>>();
  for (const row of rows) {
    const subject = row.subjectId ? subjectMap.get(row.subjectId) : undefined;
    const recurring = row.recurringScheduleId ? recurringMap.get(row.recurringScheduleId) : undefined;
    result.set(row.id, {
      ...row,
      subject,
      recurring,
      avatarUrl: resolveClassAvatarUrl(recurring?.avatarUrl, subject?.avatarUrl),
      student: studentMap.get(row.studentId),
      teacher: teacherMap.get(row.teacherId),
    });
  }
  return result;
};

export const getClassInstanceById = async (id: string, tx?: DBTransaction) => {
  const q = queryDb(tx);
  const [row] = await q.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);

  if (!row) return null;

  const studentIds = [row.studentId];
  const teacherIds = [row.teacherId];

  const studentsData = await q.select().from(students).where(inArray(students.id, studentIds));
  const teachersData = await q
    .select({ teacher: teachers, user: users })
    .from(teachers)
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(inArray(teachers.id, teacherIds));

  const studentMap = new Map(studentsData.map(s => [s.id, s]));
  const teacherMap = new Map(teachersData.map(tc => [tc.teacher.id, { ...tc.teacher, user: tc.user }]));

  const subject = row.subjectId
    ? (await q.select().from(classSubjects).where(eq(classSubjects.id, row.subjectId)).limit(1))[0]
    : undefined;
  const recurring = row.recurringScheduleId
    ? (await q.select().from(recurringSchedules).where(eq(recurringSchedules.id, row.recurringScheduleId)).limit(1))[0]
    : undefined;

  return {
    ...row,
    subject,
    recurring,
    avatarUrl: resolveClassAvatarUrl(recurring?.avatarUrl, subject?.avatarUrl),
    student: studentMap.get(row.studentId),
    teacher: teacherMap.get(row.teacherId),
  };
};

export const createClassInstance = async (
  input: Omit<Types.ClassInstanceInsertType, "createdAt" | "updatedAt">,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const studentId = input.studentId ?? "";
    const teacherId = input.teacherId ?? "";
    await acquireLocks(t, teacherId, studentId);
    await validateTeacherAssignment(t, studentId, teacherId, input.scheduledStartAt, tFuncErrors);
    await AvailabilityService.validateBookingAvailability(
      teacherId,
      input.scheduledStartAt,
      input.scheduledEndAt,
      t,
      "ar"
    );

    await checkOverlaps(
      t,
      {
        studentId,
        teacherId,
        startTime: input.scheduledStartAt,
        endTime: input.scheduledEndAt,
        meetingJoinUrl: input.meetingJoinUrl,
      },
      tFuncErrors
    );

    // Quota operations handled by QuotaService + quota_ledger at service layer

    const [created] = await t
      .insert(classInstances)
      .values({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const updateClassInstance = async (
  id: string,
  input: Partial<Omit<Types.ClassInstanceInsertType, "createdAt" | "updatedAt">>,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const existing = await getClassInstanceByIdOrThrow(t, id, tFuncErrors);

    const studentId = input.studentId ?? existing.studentId;
    const teacherId = input.teacherId ?? existing.teacherId;
    const startTime = input.scheduledStartAt ?? existing.scheduledStartAt;
    const endTime = input.scheduledEndAt ?? existing.scheduledEndAt;
    const isBeingSoftDeleted = Boolean(input.deletedAt);

    await acquireLocks(t, teacherId, studentId);

    if (!isBeingSoftDeleted) {
      await validateTeacherAssignment(t, studentId, teacherId, startTime, tFuncErrors);
      await AvailabilityService.validateBookingAvailability(teacherId, startTime, endTime, t, "ar");
      await checkOverlaps(
        t,
        {
          studentId,
          teacherId,
          startTime,
          endTime,
          excludeId: id,
          meetingJoinUrl: input.meetingJoinUrl ?? existing.meetingJoinUrl,
        },
        tFuncErrors
      );
    }

    // Quota adjustments are handled by QuotaService + quota_ledger

    const [updated] = await t
      .update(classInstances)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(classInstances.id, id))
      .returning();

    return updated;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const deleteClassInstance = async (
  id: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    await getClassInstanceByIdOrThrow(t, id, tFuncErrors);

    const { entity: deleted } = await SoftDeleteRepository.softDeleteClassInstance(id, null, t);

    // Quota restoration handled by QuotaService + quota_ledger at service layer

    return deleted;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const softDeleteClassInstance = async (id: string, actorUserId: string, tx?: DBTransaction) => {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) return null;
    const tFuncSession = getServerTranslations("en").sessionTranslations;

    const updated = await updateInstanceState(
      t,
      id,
      actorUserId,
      { deletedAt: new Date() },
      {
        fromState: { executionState: existing.executionState, outcome: existing.outcome, deleted: false },
        toState: { executionState: existing.executionState, outcome: existing.outcome, deleted: true },
        description: tFuncSession.softDeleteDescription,
      }
    );

    // Quota adjustment handled by QuotaService + quota_ledger at service layer
    return updated;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export async function upsertManyForSeed(
  instances: Types.ClassInstanceInsertType[],
  options?: ClassInstanceUpsertManyOptions
): Promise<Types.ClassInstanceSelectType[]> {
  return runClassInstanceUpsertMany(instances, upsertSeedClassInstance, options);
}

/**
 * Returns up to `limit` pending-credit on-demand class instances for a
 * student, ordered by scheduled start time (oldest first). Used by
 * `QuotaService.refreshStudentOndemandInstances` to flip PENDING_CREDIT
 * instances to AVAILABLE after credits/quota are replenished.
 */
export async function getOndemandPendingInstances(
  tx: DBTransaction,
  studentId: string,
  limit: number
): Promise<Types.ClassInstanceSelectType[]> {
  if (limit <= 0) return [];
  return tx
    .select()
    .from(classInstances)
    .where(
      and(
        eq(classInstances.studentId, studentId),
        isNull(classInstances.deletedAt),
        eq(classInstances.ondemandStatus, OnDemandStatus.PENDING_CREDIT)
      )
    )
    .orderBy(classInstances.scheduledStartAt)
    .limit(limit);
}

/**
 * Returns non-deleted upcoming class instances (`scheduledStartAt >= now`)
 * for a given recurring schedule ID. Selects only the fields needed by
 * `RecurringClassService.cancelSchedule` and `switchSchedulingMode` to
 * release/refund quota — `id`, `studentId`, and `quotaDeducted`.
 */
export async function findUpcomingInstancesByScheduleId(
  recurringScheduleId: string,
  now: Date,
  tx?: DBTransaction
): Promise<{ id: string; studentId: string; quotaDeducted: boolean }[]> {
  const q = queryDb(tx);
  return q
    .select({
      id: classInstances.id,
      studentId: classInstances.studentId,
      quotaDeducted: classInstances.quotaDeducted,
    })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.recurringScheduleId, recurringScheduleId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, now)
      )
    );
}

/**
 * Builds the shared WHERE conditions for overlap detection queries.
 * Both `hasOverlappingInstance` and `findOverlappingInstancesForRange`
 * use this to avoid code duplication.
 */
function buildOverlapConditions(
  studentId: string,
  teacherId: string,
  rangeStart: Date,
  rangeEnd: Date,
  ignoreInstanceIds: string[] = []
) {
  const conditions = [
    isNull(classInstances.deletedAt),
    sql`${classInstances.scheduledStartAt} < ${rangeEnd}`,
    sql`${classInstances.scheduledEndAt} > ${rangeStart}`,
    sql`(${classInstances.studentId} = ${studentId} OR ${classInstances.teacherId} = ${teacherId})`,
  ];
  if (ignoreInstanceIds.length > 0) {
    conditions.push(notInArray(classInstances.id, ignoreInstanceIds));
  }
  return conditions;
}

/**
 * Point-checks whether any non-deleted class instance overlaps the given
 * time range for `studentId` or `teacherId`. Returns `true` if a conflict
 * exists (slot NOT available), `false` otherwise.
 */
export async function hasOverlappingInstance(
  studentId: string,
  teacherId: string,
  startAt: Date,
  endAt: Date,
  ignoreInstanceIds: string[] = [],
  tx?: DBTransaction
): Promise<boolean> {
  const q = queryDb(tx);
  const conditions = buildOverlapConditions(studentId, teacherId, startAt, endAt, ignoreInstanceIds);
  const conflicts = await q
    .select({ id: classInstances.id })
    .from(classInstances)
    .where(and(...conditions))
    .limit(1);
  return conflicts.length > 0;
}

/**
 * Returns the `scheduledStartAt` and `scheduledEndAt` of all non-deleted class
 * instances that overlap the given `[rangeStart, rangeEnd]` window for
 * `studentId` or `teacherId`. Used by `AvailabilityService.assertSchedulePatternAvailable`
 * to pre-fetch overlapping instances in a single query.
 */
export async function findOverlappingInstancesForRange(
  studentId: string,
  teacherId: string,
  rangeStart: Date,
  rangeEnd: Date,
  ignoreInstanceIds: string[] = [],
  tx?: DBTransaction
): Promise<{ scheduledStartAt: Date; scheduledEndAt: Date }[]> {
  const q = queryDb(tx);
  const conditions = buildOverlapConditions(studentId, teacherId, rangeStart, rangeEnd, ignoreInstanceIds);
  return q
    .select({
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
    })
    .from(classInstances)
    .where(and(...conditions));
}

/**
 * Batch-updates the execution state and on-demand status of multiple class
 * instances in a single UPDATE. Used by `QuotaService.refreshStudentOndemandInstances`
 * to flip PENDING_CREDIT instances to AVAILABLE, and by
 * `ClassSessionService.markNoCreditsBatch` for no-credits resolution. The WHERE
 * clause guards on `ondemandStatus = guardOndemandStatus` AND
 * `deletedAt IS NULL` to prevent TOCTOU races (a concurrent transaction may
 * have already flipped an instance or soft-deleted it).
 *
 * @returns Count of rows actually updated.
 */
export async function updateOndemandStatusBatch(
  instanceIds: string[],
  updates: { executionState: string; ondemandStatus: OnDemandStatus; updatedAt: Date },
  guardOndemandStatus: OnDemandStatus,
  tx: DBTransaction
): Promise<number> {
  if (instanceIds.length === 0) return 0;
  return tUpdateOndemandStatusBatch(tx, instanceIds, updates, guardOndemandStatus);
}

// Inline helper to keep the exported function signature clean
async function tUpdateOndemandStatusBatch(
  tx: DBTransaction,
  instanceIds: string[],
  updates: { executionState: string; ondemandStatus: OnDemandStatus; updatedAt: Date },
  guardOndemandStatus: OnDemandStatus
): Promise<number> {
  const updated = await tx
    .update(classInstances)
    .set({
      executionState: updates.executionState,
      ondemandStatus: updates.ondemandStatus,
      updatedAt: updates.updatedAt,
    })
    .where(
      and(
        inArray(classInstances.id, instanceIds),
        eq(classInstances.ondemandStatus, guardOndemandStatus),
        isNull(classInstances.deletedAt)
      )
    )
    .returning({ id: classInstances.id });
  return updated.length;
}
// ---------------------------------------------------------------------------
// Payroll calculation reads & writes
// ---------------------------------------------------------------------------

/**
 * Payroll snapshot columns that may be written by a calculation or an
 * operator override. Deliberately narrow: payroll writes can never touch
 * scheduling, state-machine, or rate-snapshot columns through this method.
 */
export type PayrollCalculationPatch = Partial<
  Pick<
    Types.ClassInstanceSelectType,
    | "calculationStatus"
    | "calculatedDuration"
    | "teacherPaidAmount"
    | "teacherPaidCurrency"
    | "isPartialPercentage"
    | "payrollNote"
    | "payrollCalculatedAt"
    | "payrollCalculatedBy"
  >
>;

/** Read options for single-instance lookups. */
export interface GetClassInstanceOptions {
  /**
   * Locks the row with `SELECT ... FOR UPDATE`. Requires `tx` (the call
   * throws otherwise): the lock is held until that transaction commits or
   * rolls back, so a payroll write in the same transaction cannot race with
   * a concurrent calculator or override.
   */
  forUpdate?: boolean;
}

/**
 * Fetches a single class instance row by ID without hydration joins.
 * Unlike `getClassInstanceById` this returns the bare row, which keeps the
 * read cheap enough to sit on the payroll write path.
 */
export async function getById(
  id: string,
  tx?: DBTransaction,
  opts?: GetClassInstanceOptions
): Promise<Types.ClassInstanceSelectType | null> {
  // Fail fast over a silent no-op: without a transaction the FOR UPDATE lock
  // is released the moment the statement finishes, so the caller would think
  // the row is locked while nothing is.
  if (opts?.forUpdate && tx == null) {
    throw new Error(
      "getById with forUpdate requires a transaction: the row lock only exists inside the caller transaction"
    );
  }
  const q = queryDb(tx);
  const base = q.select().from(classInstances).where(eq(classInstances.id, id));
  const [row] = await (opts?.forUpdate ? withForUpdate(base) : base).limit(1);
  return row ?? null;
}

/** Optional guards for payroll snapshot updates. */
export interface UpdatePayrollCalculationOptions {
  /**
   * Only fire the update while the row still carries this calculation
   * status. A caller that read the row without holding its lock uses the
   * precondition so a concurrent writer's committed transition (for
   * example a forced override) is never stomped: the update then matches
   * zero rows and this helper returns `null`, telling the caller to skip
   * the follow-up write instead of overwriting the newer state.
   */
  expectedStatus?: CalculationStatus;
}

/**
 * Applies a partial payroll-snapshot update to one class instance and returns
 * the updated row. `null` means the update matched no row: either the
 * instance does not exist, or — when `expectedStatus` is supplied — the
 * row's calculation status no longer matches, i.e. a concurrent writer
 * already transitioned it. Callers that locked the row first with
 * `getById(id, tx, { forUpdate: true })` may omit the precondition; callers
 * reading without the lock should always pass one.
 */
export async function updatePayrollCalculation(
  tx: DBTransaction,
  id: string,
  patch: PayrollCalculationPatch,
  options?: UpdatePayrollCalculationOptions
): Promise<Types.ClassInstanceSelectType | null> {
  const conditions: SQL[] = [eq(classInstances.id, id)];
  if (options?.expectedStatus != null) {
    conditions.push(eq(classInstances.calculationStatus, options.expectedStatus));
  }
  const [updated] = await tx
    .update(classInstances)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(...conditions))
    .returning();
  return updated ?? null;
}

// ---------------------------------------------------------------------------
// Carryover linking
// ---------------------------------------------------------------------------

/**
 * Locks and fetches multiple class instance rows in a single
 * `SELECT ... FOR UPDATE`. The rows stay locked until the caller's
 * transaction commits or rolls back, which is what lets carryover
 * aggregation validate-and-link atomically without a concurrent writer
 * re-linking or re-calculating a session mid-transaction. Rows are read in
 * ascending id order (ids are sorted before the IN clause and the statement
 * orders by id) so concurrent callers lock overlapping id sets in the same
 * order, and soft-deleted rows are excluded like every other read path in
 * this repository — a deleted session can never be aggregated into a
 * carryover. Missing ids surface via the caller's count check.
 *
 * `tx` is required — the lock only exists inside an open transaction, so a
 * bare read would feign mutual exclusion it never had. Ids without a
 * matching row are silently absent from the result; callers compare counts
 * to detect missing instances.
 */
export async function getByIdsForUpdate(
  ids: readonly string[],
  tx: DBTransaction
): Promise<Types.ClassInstanceSelectType[]> {
  if (ids.length === 0) return [];
  const sortedIds = [...ids].toSorted((a, b) => a.localeCompare(b));
  const base = tx
    .select()
    .from(classInstances)
    .where(and(inArray(classInstances.id, sortedIds), isNull(classInstances.deletedAt)))
    .orderBy(classInstances.id);
  return withForUpdate(base);
}

/**
 * Returns every class instance currently linked to the given carryover
 * balance. Used by payout and unpay flows that must transition all linked
 * sessions together.
 */
export async function findByCarryoverId(
  carryoverId: string,
  tx?: DBTransaction
): Promise<Types.ClassInstanceSelectType[]> {
  const q = queryDb(tx);
  return q.select().from(classInstances).where(eq(classInstances.carryoverBalanceId, carryoverId));
}

/**
 * Points a batch of class instances at a carryover balance and returns the
 * updated rows. Data access only: validating that the sessions are audited
 * and not already linked belongs to the calling service, together with the
 * `getByIdsForUpdate` row locks that make the validation meaningful.
 */
export async function linkToCarryover(
  instanceIds: readonly string[],
  carryoverId: string,
  tx: DBTransaction
): Promise<Types.ClassInstanceSelectType[]> {
  if (instanceIds.length === 0) return [];
  return tx
    .update(classInstances)
    .set({ carryoverBalanceId: carryoverId, updatedAt: new Date() })
    .where(inArray(classInstances.id, [...instanceIds]))
    .returning();
}

/**
 * Detaches a batch of class instances from their carryover balance by
 * nulling the link column and returns the updated rows. Restoring each
 * session's prior calculation status is orchestrated by the calling
 * service from the carryover's item snapshots.
 */
export async function unlinkFromCarryover(
  instanceIds: readonly string[],
  tx: DBTransaction
): Promise<Types.ClassInstanceSelectType[]> {
  if (instanceIds.length === 0) return [];
  return tx
    .update(classInstances)
    .set({ carryoverBalanceId: null, updatedAt: new Date() })
    .where(inArray(classInstances.id, [...instanceIds]))
    .returning();
}

/** Start-of-day bound for an inclusive `YYYY-MM-DD` date filter. */
function startOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** End-of-day bound for an inclusive `YYYY-MM-DD` date filter. */
function endOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

/**
 * Shared WHERE conditions for the payroll report. Timestamp bounds are bound
 * as JS Dates so the same SQL runs on PostgreSQL (timestamptz) and SQLite
 * (epoch-millis) without dialect-specific casts. Teacher names live on
 * `users` (via `teachers.userId`); student names live on `students.name`.
 */
function buildPayrollReportConditions(filters: Types.PayrollReportFilters): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [isNull(classInstances.deletedAt)];

  if (filters.teacherId != null) {
    conditions.push(eq(classInstances.teacherId, filters.teacherId));
  }
  if (filters.studentId != null) {
    conditions.push(eq(classInstances.studentId, filters.studentId));
  }
  if (filters.dateFrom != null) {
    conditions.push(gte(classInstances.scheduledStartAt, startOfUtcDay(filters.dateFrom)));
  }
  if (filters.dateTo != null) {
    conditions.push(lte(classInstances.scheduledStartAt, endOfUtcDay(filters.dateTo)));
  }
  if (filters.calculationStatuses != null && filters.calculationStatuses.length > 0) {
    conditions.push(inArray(classInstances.calculationStatus, [...filters.calculationStatuses]));
  }
  const search = filters.search?.trim();
  if (search) {
    const searchPattern = `%${escapeLikeWildcards(search)}%`;
    conditions.push(
      or(caseInsensitiveLike(students.name, searchPattern), caseInsensitiveLike(users.name, searchPattern))
    );
  }
  return conditions;
}

/**
 * Base builder for the payroll report read: a single joined query over
 * `class_instances` + `teachers` → `users` (teacher name) + `students`
 * (student name) + `class_subjects` (subject name). The absence-rule
 * booleans (`isStudentAbsence`, `isTeacherAbsence`) mirror the calculator's
 * branch conditions and are computed in the SELECT clause: student absence
 * requires an absent outcome WITH join telemetry; a row with no join
 * telemetry is a teacher absence whatever the outcome says.
 */
function payrollReportBaseQuery(q: QueryDbHandle | DBTransaction) {
  return q
    .select({
      instanceId: classInstances.id,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      actualStartAt: classInstances.actualStartAt,
      actualEndAt: classInstances.actualEndAt,
      calculatedDuration: classInstances.calculatedDuration,
      teacherPaidAmount: classInstances.teacherPaidAmount,
      teacherPaidCurrency: classInstances.teacherPaidCurrency,
      calculationStatus: classInstances.calculationStatus,
      isPartialPercentage: classInstances.isPartialPercentage,
      payrollNote: classInstances.payrollNote,
      teacherId: classInstances.teacherId,
      teacherName: users.name,
      studentId: classInstances.studentId,
      studentName: students.name,
      subjectId: classInstances.subjectId,
      subjectName: classSubjects.name,
      isStudentAbsence:
        sql<boolean>`(${classInstances.outcome} = ${ClassOutcome.ABSENT} AND ${classInstances.actualStartAt} IS NOT NULL)`.mapWith(
          Boolean
        ),
      isTeacherAbsence: sql<boolean>`(${classInstances.actualStartAt} IS NULL)`.mapWith(Boolean),
    })
    .from(classInstances)
    .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .innerJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id));
}

/**
 * Reads one page of the payroll report. `totalCount` is counted by a
 * parallel query that shares the same joins and filters but no
 * LIMIT/OFFSET, so it always reflects the full filtered set independently
 * of the requested page.
 */
export async function findPayrollReportRows(
  filters: Types.PayrollReportFilters,
  pagination: { limit: number; offset: number },
  tx?: DBTransaction
): Promise<{ rows: Types.PayrollReportRow[]; totalCount: number }> {
  const q = queryDb(tx);
  const conditions = buildPayrollReportConditions(filters);

  const [rows, [{ count: totalCount }]] = await Promise.all([
    payrollReportBaseQuery(q)
      .where(and(...conditions))
      .orderBy(desc(classInstances.scheduledStartAt), classInstances.id)
      .limit(pagination.limit)
      .offset(pagination.offset),
    q
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(classInstances)
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .where(and(...conditions)),
  ]);

  return {
    rows: rows.map(row => ({
      instanceId: row.instanceId,
      scheduledStartAt: row.scheduledStartAt.toISOString(),
      scheduledEndAt: row.scheduledEndAt.toISOString(),
      scheduledDurationMinutes: Math.round((row.scheduledEndAt.getTime() - row.scheduledStartAt.getTime()) / 60_000),
      actualStartAt: row.actualStartAt?.toISOString() ?? null,
      actualEndAt: row.actualEndAt?.toISOString() ?? null,
      calculatedDuration: row.calculatedDuration,
      teacherPaidAmount: row.teacherPaidAmount,
      teacherPaidCurrency: row.teacherPaidCurrency,
      calculationStatus: row.calculationStatus,
      isPartialPercentage: row.isPartialPercentage,
      payrollNote: row.payrollNote,
      teacherId: row.teacherId,
      teacherName: row.teacherName,
      studentId: row.studentId,
      studentName: row.studentName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      isStudentAbsence: row.isStudentAbsence,
      isTeacherAbsence: row.isTeacherAbsence,
    })),
    totalCount,
  };
}
