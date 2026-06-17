import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teacher-availability.repository";
import { classInstances, students, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";

// Extract the transaction type from Drizzle
type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export namespace SchedulingRepository {
  /**
   * Helper to acquire an advisory lock for a teacher and student
   * to prevent concurrent overlap and quota race conditions.
   */
  async function acquireLocks(tx: DBTransaction, teacherId: string, studentId: string) {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('booking_teacher_' || ${teacherId}::text))`);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('booking_student_' || ${studentId}::text))`);
  }

  /**
   * Validates if a teacher is officially assigned to a student for a given time.
   */
  async function validateTeacherAssignment(
    tx: DBTransaction,
    studentId: string,
    teacherId: string,
    startTime: Date,
    locale?: string
  ) {
    const assignments = await tx
      .select({ id: teacherAssignments.id })
      .from(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.studentId, studentId),
          eq(teacherAssignments.teacherId, teacherId),
          or(isNull(teacherAssignments.endedAt), sql`${teacherAssignments.endedAt} >= ${startTime}`)
        )
      )
      .limit(1);

    if (assignments.length === 0) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        t("teacherNotAssigned", {
          teacherId,
          studentId,
          startTime: startTime.toISOString(),
        })
      );
    }
  }

  /**
   * Parameters for overlap checking
   */
  interface OverlapCheckParams {
    studentId: string;
    teacherId: string;
    startTime: Date;
    endTime: Date;
    zoomUrl?: string | null;
    excludeId?: string;
  }

  /**
   * Checks for overlapping class instances for the teacher, student, or zoom URL.
   */
  async function checkOverlaps(tx: DBTransaction, params: OverlapCheckParams, locale?: string) {
    const { studentId, teacherId, startTime, endTime, zoomUrl, excludeId } = params;
    const overlapCondition = sql`(${classInstances.scheduledStartAt}, ${classInstances.scheduledEndAt}) OVERLAPS (${startTime}, ${endTime})`;

    const teacherOverlaps = await tx
      .select({ id: classInstances.id })
      .from(classInstances)
      .where(
        and(
          eq(classInstances.teacherId, teacherId),
          isNull(classInstances.deletedAt),
          overlapCondition,
          excludeId ? ne(classInstances.id, excludeId) : undefined
        )
      )
      .limit(1);
    if (teacherOverlaps.length > 0) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("teacherBooked"));
    }

    const studentOverlaps = await tx
      .select({ id: classInstances.id })
      .from(classInstances)
      .where(
        and(
          eq(classInstances.studentId, studentId),
          isNull(classInstances.deletedAt),
          overlapCondition,
          excludeId ? ne(classInstances.id, excludeId) : undefined
        )
      )
      .limit(1);
    if (studentOverlaps.length > 0) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentBooked"));
    }

    if (zoomUrl) {
      const zoomOverlaps = await tx
        .select({ id: classInstances.id })
        .from(classInstances)
        .where(
          and(
            eq(classInstances.zoomMeetingUrl, zoomUrl),
            isNull(classInstances.deletedAt),
            overlapCondition,
            excludeId ? ne(classInstances.id, excludeId) : undefined
          )
        )
        .limit(1);
      if (zoomOverlaps.length > 0) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("zoomInUse"));
      }
    }
  }

  /**
   * Helper to adjust student class quota when booking details change.
   */
  async function adjustQuotaOnUpdate(
    t: DBTransaction,
    existing: Types.ClassInstanceEntity,
    input: Partial<Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">>,
    isBeingSoftDeleted: boolean
  ) {
    const studentId = input.studentId ?? existing.studentId;
    const wasDeducted = existing.quotaDeducted && existing.deletedAt === null;
    const effectiveNewDeducted = (input.quotaDeducted ?? existing.quotaDeducted) && !isBeingSoftDeleted;

    if (!wasDeducted && effectiveNewDeducted) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
        .where(eq(students.id, studentId));
    } else if (wasDeducted && !effectiveNewDeducted) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, studentId));
    } else if (wasDeducted && effectiveNewDeducted && input.studentId && input.studentId !== existing.studentId) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, existing.studentId));
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
        .where(eq(students.id, input.studentId));
    }
  }

  export const createClassInstance = async (
    input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.ClassInstanceEntity> => {
    const runner = async (t: DBTransaction) => {
      await acquireLocks(t, input.teacherId, input.studentId);
      await validateTeacherAssignment(t, input.studentId, input.teacherId, input.scheduledStartAt, locale);
      await TeacherAvailabilityRepository.validateBookingAvailability(
        input.teacherId,
        input.scheduledStartAt,
        input.scheduledEndAt,
        t
      );
      await checkOverlaps(
        t,
        {
          studentId: input.studentId,
          teacherId: input.teacherId,
          startTime: input.scheduledStartAt,
          endTime: input.scheduledEndAt,
          zoomUrl: input.zoomMeetingUrl,
        },
        locale
      );

      if (input.quotaDeducted) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
          .where(eq(students.id, input.studentId));
      }

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
    input: Partial<Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">>,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.ClassInstanceEntity> => {
    const runner = async (t: DBTransaction) => {
      const results = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("classInstanceNotFound", { id }));
      }
      const existing = results[0];

      const studentId = input.studentId ?? existing.studentId;
      const teacherId = input.teacherId ?? existing.teacherId;
      const startTime = input.scheduledStartAt ?? existing.scheduledStartAt;
      const endTime = input.scheduledEndAt ?? existing.scheduledEndAt;
      const zoomUrl = input.zoomMeetingUrl === undefined ? existing.zoomMeetingUrl : input.zoomMeetingUrl;
      const isBeingSoftDeleted = Boolean(input.deletedAt);

      await acquireLocks(t, teacherId, studentId);

      if (!isBeingSoftDeleted) {
        await validateTeacherAssignment(t, studentId, teacherId, startTime, locale);
        await TeacherAvailabilityRepository.validateBookingAvailability(teacherId, startTime, endTime, t);
        await checkOverlaps(
          t,
          {
            studentId,
            teacherId,
            startTime,
            endTime,
            zoomUrl,
            excludeId: id,
          },
          locale
        );
      }

      await adjustQuotaOnUpdate(t, existing, input, isBeingSoftDeleted);

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
    locale?: string
  ): Promise<Types.ClassInstanceEntity> => {
    const runner = async (t: DBTransaction) => {
      const results = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("classInstanceNotFound", { id }));
      }
      const existing = results[0];

      if (existing.quotaDeducted && existing.deletedAt === null) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
          .where(eq(students.id, existing.studentId));
      }

      const { entity: deleted } = await SoftDeleteRepository.softDeleteClassInstance(id, null, t);
      return deleted;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  /**
   * Validates if a class instance can be rescheduled.
   */
  async function validateRescheduleState(
    original: Types.ClassInstanceEntity,
    input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
    locale?: string
  ) {
    if (original.id === input.id) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("cannotRescheduleToSelf"));
    }
    if (original.executionState === "COMPLETED" || original.outcome === "TAKEN") {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("cannotRescheduleCompleted"));
    }
    if (original.isRescheduled) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("cannotRescheduleAlreadyRescheduled"));
    }
  }

  /**
   * Performs technical validations for rescheduling (locks, assignments, availability, overlaps).
   */
  async function performRescheduleValidations(
    t: DBTransaction,
    input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
    locale?: string
  ) {
    await acquireLocks(t, input.teacherId, input.studentId);
    await validateTeacherAssignment(t, input.studentId, input.teacherId, input.scheduledStartAt, locale);
    await TeacherAvailabilityRepository.validateBookingAvailability(
      input.teacherId,
      input.scheduledStartAt,
      input.scheduledEndAt,
      t
    );
    await checkOverlaps(
      t,
      {
        studentId: input.studentId,
        teacherId: input.teacherId,
        startTime: input.scheduledStartAt,
        endTime: input.scheduledEndAt,
        zoomUrl: input.zoomMeetingUrl,
      },
      locale
    );
  }

  /**
   * Adjusts student quota if the original class had quota deducted.
   */
  async function handleOriginalQuotaRestoration(t: DBTransaction, original: Types.ClassInstanceEntity) {
    if (original.quotaDeducted && original.deletedAt === null) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, original.studentId));
    }
  }

  export const rescheduleClassInstance = async (
    originalClassId: string,
    input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.ClassInstanceEntity> => {
    const runner = async (t: DBTransaction) => {
      const results = await t.select().from(classInstances).where(eq(classInstances.id, originalClassId)).limit(1);
      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("originalClassNotFound"));
      }
      const original = results[0];

      await validateRescheduleState(original, input, locale);

      const newInstanceInput: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt"> = {
        ...input,
        originalClassId: originalClassId,
        isRescheduled: false,
        quotaDeducted: false,
        rateAmount: input.rateAmount ?? original.rateAmount,
        rateCurrency: input.rateCurrency ?? original.rateCurrency,
      };

      await performRescheduleValidations(t, newInstanceInput, locale);

      const [created] = await t
        .insert(classInstances)
        .values({
          ...newInstanceInput,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await t
        .update(classInstances)
        .set({
          isRescheduled: true,
          quotaDeducted: false,
          outcome: "PENDING",
          executionState: "NOT_ACTIVATED",
          updatedAt: new Date(),
        })
        .where(eq(classInstances.id, originalClassId));

      await handleOriginalQuotaRestoration(t, original);

      return created;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const getDailyMetrics = async (date: Date, teacherId?: string, tx?: DBTransaction, _locale?: string) => {
    const runner = async (t: DBTransaction) => {
      const baseConditions = and(
        isNull(classInstances.deletedAt),
        sql`DATE(${classInstances.scheduledStartAt}) = DATE(${date.toISOString()})`,
        teacherId ? eq(classInstances.teacherId, teacherId) : undefined
      );

      const metrics = await t
        .select({
          total: sql<number>`count(*)`.mapWith(Number),
          regular: sql<number>`sum(case when ${classInstances.classType} = 'REGULAR' then 1 else 0 end)`.mapWith(
            Number
          ),
          trial: sql<number>`sum(case when ${classInstances.classType} = 'TRIAL' then 1 else 0 end)`.mapWith(Number),
          advance: sql<number>`sum(case when ${classInstances.classType} = 'ADVANCE' then 1 else 0 end)`.mapWith(
            Number
          ),
          rescheduled: sql<number>`sum(case when ${classInstances.isRescheduled} = true then 1 else 0 end)`.mapWith(
            Number
          ),
          suspended: sql<number>`sum(case when ${classInstances.isFrozen} = true then 1 else 0 end)`.mapWith(Number),
          taken: sql<number>`sum(case when ${classInstances.outcome} = 'TAKEN' then 1 else 0 end)`.mapWith(Number),
          pending: sql<number>`sum(case when ${classInstances.outcome} = 'PENDING' then 1 else 0 end)`.mapWith(Number),
          activated:
            sql<number>`sum(case when ${classInstances.executionState} = 'ACTIVATED' then 1 else 0 end)`.mapWith(
              Number
            ),
          running:
            sql<number>`sum(case when ${classInstances.executionState} = 'ACTIVATED' and ${classInstances.actualStartAt} is not null and ${classInstances.actualEndAt} is null then 1 else 0 end)`.mapWith(
              Number
            ),
          absent: sql<number>`sum(case when ${classInstances.outcome} = 'ABSENT' then 1 else 0 end)`.mapWith(Number),
          leave: sql<number>`sum(case when ${classInstances.outcome} = 'LEAVE' then 1 else 0 end)`.mapWith(Number),
        })
        .from(classInstances)
        .where(baseConditions);

      return (
        metrics[0] ?? {
          total: 0,
          regular: 0,
          trial: 0,
          advance: 0,
          rescheduled: 0,
          suspended: 0,
          taken: 0,
          pending: 0,
          activated: 0,
          running: 0,
          absent: 0,
          leave: 0,
        }
      );
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const getDailySchedule = async (date: Date, teacherId?: string, tx?: DBTransaction, _locale?: string) => {
    const runner = async (t: DBTransaction) => {
      const baseConditions = and(
        isNull(classInstances.deletedAt),
        sql`DATE(${classInstances.scheduledStartAt}) = DATE(${date.toISOString()})`,
        teacherId ? eq(classInstances.teacherId, teacherId) : undefined
      );

      // Using standard joins because findMany raised type errors with SQL<unknown> and missing relations

      const rows = await t
        .select({
          classInstance: classInstances,
        })
        .from(classInstances)
        .where(baseConditions);

      const studentIds = Array.from(new Set(rows.map(r => r.classInstance.studentId)));
      const teacherIds = Array.from(new Set(rows.map(r => r.classInstance.teacherId)));

      const studentsData =
        studentIds.length > 0 ? await t.select().from(students).where(inArray(students.id, studentIds)) : [];
      const teachersData =
        teacherIds.length > 0
          ? await t
              .select({ teacher: teachers, user: users })
              .from(teachers)
              .innerJoin(users, eq(teachers.userId, users.id))
              .where(inArray(teachers.id, teacherIds))
          : [];

      const studentMap = new Map(studentsData.map(s => [s.id, s]));
      const teacherMap = new Map(teachersData.map(tc => [tc.teacher.id, { ...tc.teacher, user: tc.user }]));

      return rows.map(r => ({
        ...r.classInstance,
        student: studentMap.get(r.classInstance.studentId),
        teacher: teacherMap.get(r.classInstance.teacherId),
      }));
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };
}
