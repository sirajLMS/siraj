import { and, eq, gte, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teacher-availability.repository";
import {
  classInstances,
  classStatusEvents,
  leaveRequests,
  parents,
  students,
  teacherAssignments,
  teachers,
  users,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

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

  async function getClassInstanceByIdOrThrow(
    t: DBTransaction,
    id: string,
    locale?: string
  ): Promise<Types.ClassInstanceEntity> {
    const results = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (results.length === 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("classInstanceNotFound", { id }));
    }
    return results[0];
  }

  async function updateInstanceState(
    t: DBTransaction,
    id: string,
    actorUserId: string,
    state: Partial<Types.ClassInstanceInsertInput>,
    event: {
      fromState: Record<string, unknown>;
      toState: Record<string, unknown>;
      description: string;
    }
  ): Promise<Types.ClassInstanceEntity | null> {
    const now = new Date();
    const [updated] = await t
      .update(classInstances)
      .set({
        ...state,
        updatedAt: now,
      })
      .where(eq(classInstances.id, id))
      .returning();

    if (updated) {
      await t.insert(classStatusEvents).values({
        classInstanceId: updated.id,
        eventType: "STATE_CHANGE",
        fromState: event.fromState,
        toState: event.toState,
        description: event.description,
        actorUserId,
        createdAt: now,
      });
    }
    return updated;
  }

  async function checkStateChangeAuth(
    t: DBTransaction,
    existing: Types.ClassInstanceEntity,
    actorUserId: string,
    locale?: string
  ) {
    // Check if actor has privileged permissions that bypass IDOR checks
    const isPrivilegedActor = await PermissionsService.hasAnyPermission(actorUserId, [
      AppPermission.SESSION_OVERRIDE_ACTIONS,
      AppPermission.SESSION_ACTIVATE_OVERRIDE,
      AppPermission.SESSION_RESET,
      // AppPermission.DASHBOARD_VIEW_METRICS,
    ]);

    if (isPrivilegedActor) {
      return;
    }

    // Scoping IDOR checks (Threat 1)
    const [teacher] = await t
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.userId, actorUserId))
      .limit(1);

    const [parent] = await t.select({ id: parents.id }).from(parents).where(eq(parents.userId, actorUserId)).limit(1);

    let isParentOfStudent = false;
    if (parent) {
      const [studentLink] = await t
        .select({ id: students.id })
        .from(students)
        .where(and(eq(students.id, existing.studentId), eq(students.parentId, parent.id)))
        .limit(1);
      if (studentLink) {
        isParentOfStudent = true;
      }
    }

    const isTeacherOfClass = existing.teacherId === teacher?.id;

    if (!isTeacherOfClass && !isParentOfStudent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }
  }

  async function validateStateTransition(
    existing: Types.ClassInstanceEntity,
    state: Partial<Types.ClassInstanceInsertInput>,
    locale?: string
  ) {
    // State Transition checks (Threat 3)
    if (state.executionState === "ACTIVATED") {
      if (existing.executionState !== "NOT_ACTIVATED") {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("invalidTransition"));
      }
    } else if (state.executionState === "RUNNING") {
      if (existing.executionState !== "ACTIVATED") {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("invalidTransition"));
      }
    } else if (state.executionState === "COMPLETED") {
      const isValidStandard = existing.executionState === "RUNNING";
      const isValidEarly =
        existing.executionState === "ACTIVATED" && (state.outcome === "ABSENT" || state.outcome === "LEAVE");
      if (!isValidStandard && !isValidEarly) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("invalidTransition"));
      }
    }
  }

  /**
   * Multi-layer security enforcement for class instance state changes:
   *
   * Layer 1: PostgreSQL RLS policies (class_instances_rls_policies.sql)
   *   - Row-level security enforced at database level
   *
   * Layer 2: Database trigger (fn_enforce_class_instance_transition)
   *   - Validates state machine transitions
   *
   * Layer 3: Repository assertions (teacher/parent IDOR checks with admin bypass)
   *   - Enforces relationship-based access control
   *   - Privileged actors bypass relationship checks
   *
   * Layer 4: Service permission gates (explicit permission checks)
   *   - Services validate specific action permissions before calling repository
   */
  async function runStateChange(
    id: string,
    actorUserId: string,
    tx: DBTransaction | undefined,
    locale: string | undefined,
    logic: (
      t: DBTransaction,
      existing: Types.ClassInstanceEntity
    ) => Promise<{
      state: Partial<Types.ClassInstanceInsertInput>;
      event: {
        fromState: Record<string, unknown>;
        toState: Record<string, unknown>;
        description: string;
      };
    }>
  ): Promise<Types.ClassInstanceEntity | null> {
    const runner = async (t: DBTransaction) => {
      const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
      if (!existing) return null;

      await checkStateChangeAuth(t, existing, actorUserId, locale);

      const { state, event } = await logic(t, existing);

      await validateStateTransition(existing, state, locale);

      return updateInstanceState(t, id, actorUserId, state, event);
    };
    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  }

  /**
   * Internal helper for transition to COMPLETED state.
   */
  async function transitionToCompleted(
    id: string,
    actorUserId: string,
    outcome: "ABSENT" | "LEAVE" | "TAKEN",
    description: string,
    tx?: DBTransaction,
    locale?: string
  ) {
    return runStateChange(id, actorUserId, tx, locale, async (_, existing) => {
      const now = new Date();
      return {
        state: {
          executionState: "COMPLETED",
          outcome,
          actualStartAt: existing.actualStartAt ?? now,
          actualEndAt: now,
        },
        event: {
          fromState: { executionState: existing.executionState, outcome: existing.outcome },
          toState: { executionState: "COMPLETED", outcome },
          description,
        },
      };
    });
  }

  export async function resolveStudentTimezone(studentId: string, tx?: DBTransaction): Promise<string> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select({
        override: students.timezoneOverride,
        parentTimezone: parents.timezone,
      })
      .from(students)
      .innerJoin(parents, eq(students.parentId, parents.id))
      .where(eq(students.id, studentId))
      .limit(1);

    return (
      row?.override ??
      row?.parentTimezone ??
      (await SystemSettingsRepository.getStringValue("default_timezone", "UTC", tx))
    );
  }

  export const activateClassInstance = async (
    id: string,
    actorUserId: string,
    options: { force: boolean },
    tx?: DBTransaction,
    locale?: string
  ) => {
    return runStateChange(id, actorUserId, tx, locale, async () => {
      const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });
      return {
        state: {
          executionState: "ACTIVATED",
          activatedAt: new Date(),
          activatedByUserId: actorUserId,
          forceActivated: options.force,
          forceActivatedByUserId: options.force ? actorUserId : null,
        },
        event: {
          fromState: { executionState: "NOT_ACTIVATED" },
          toState: { executionState: "ACTIVATED" },
          description: options.force ? tFuncSession("forceActivateDescription") : tFuncSession("activateDescription"),
        },
      };
    });
  };

  export const stopClassInstance = async (id: string, actorUserId: string, tx?: DBTransaction, locale?: string) => {
    const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });
    return transitionToCompleted(id, actorUserId, "TAKEN", tFuncSession("stopDescription"), tx, locale);
  };

  export const softDeleteClassInstance = async (
    id: string,
    actorUserId: string,
    tx?: DBTransaction,
    locale?: string
  ) => {
    const runner = async (t: DBTransaction) => {
      const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
      if (!existing) return null;
      const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });

      const updated = await updateInstanceState(
        t,
        id,
        actorUserId,
        { deletedAt: new Date() },
        {
          fromState: { executionState: existing.executionState, outcome: existing.outcome, deleted: false },
          toState: { executionState: existing.executionState, outcome: existing.outcome, deleted: true },
          description: tFuncSession("softDeleteDescription"),
        }
      );

      if (updated) {
        await adjustQuotaOnUpdate(t, existing, { deletedAt: updated.deletedAt }, true, locale);
      }
      return updated;
    };
    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const getClassInstanceById = async (id: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const [row] = await queryDb.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);

    if (!row) return null;

    const studentIds = [row.studentId];
    const teacherIds = [row.teacherId];

    const studentsData = await queryDb.select().from(students).where(inArray(students.id, studentIds));
    const teachersData = await queryDb
      .select({ teacher: teachers, user: users })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(inArray(teachers.id, teacherIds));

    const studentMap = new Map(studentsData.map(s => [s.id, s]));
    const teacherMap = new Map(teachersData.map(tc => [tc.teacher.id, { ...tc.teacher, user: tc.user }]));

    return {
      ...row,
      student: studentMap.get(row.studentId),
      teacher: teacherMap.get(row.teacherId),
    };
  };

  export const startClassInstance = async (id: string, actorUserId: string, tx?: DBTransaction, locale?: string) => {
    return runStateChange(id, actorUserId, tx, locale, async (_, existing) => {
      const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });
      return {
        state: { executionState: "RUNNING", outcome: "PENDING", actualStartAt: new Date() },
        event: {
          fromState: { executionState: existing.executionState, outcome: existing.outcome },
          toState: { executionState: "RUNNING", outcome: "PENDING" },
          description: tFuncSession("startDescription"),
        },
      };
    });
  };

  export const markClassAbsent = async (id: string, actorUserId: string, tx?: DBTransaction, locale?: string) => {
    return runStateChange(id, actorUserId, tx, locale, async (_, existing) => {
      const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });
      const now = new Date();
      return {
        state: {
          executionState: "COMPLETED",
          outcome: "ABSENT",
          actualStartAt: existing.actualStartAt ?? now,
          actualEndAt: now,
          payrollCredited: true,
          remarks: existing.remarks ?? tFuncSession("absentEventDescription"),
        },
        event: {
          fromState: { executionState: existing.executionState, outcome: existing.outcome },
          toState: { executionState: "COMPLETED", outcome: "ABSENT" },
          description: tFuncSession("absentEventDescription"),
        },
      };
    });
  };

  async function getRequesterTypeForUser(t: DBTransaction, actorUserId: string): Promise<"TEACHER" | "PARENT" | "ADMIN"> {
    const [teacher] = await t
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.userId, actorUserId))
      .limit(1);
    if (teacher) {
      return "TEACHER";
    }
    const [parent] = await t
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.userId, actorUserId))
      .limit(1);
    if (parent) {
      return "PARENT";
    }
    return "ADMIN";
  }

  async function createRescheduledSuccessor(
    t: DBTransaction,
    existing: Types.ClassInstanceEntity,
    offsetDays: number,
    remarks: string,
    locale?: string
  ): Promise<Types.ClassInstanceEntity> {
    const offsetMs = offsetDays * 24 * 60 * 60 * 1000;
    const newScheduledStartAt = new Date(existing.scheduledStartAt.getTime() + offsetMs);
    const newScheduledEndAt = new Date(existing.scheduledEndAt.getTime() + offsetMs);

    const successorIdempotencyKey = `leave-reschedule-${existing.id}-${newScheduledStartAt.toISOString()}`;

    const successorInput = {
      studentId: existing.studentId,
      teacherId: existing.teacherId,
      originalClassId: existing.id,
      scheduledStartAt: newScheduledStartAt,
      scheduledEndAt: newScheduledEndAt,
      durationMinutes: existing.durationMinutes,
      classType: existing.classType,
      executionState: "NOT_ACTIVATED" as const,
      outcome: "PENDING" as const,
      isRescheduled: false,
      quotaDeducted: false,
      payrollCredited: false,
      rateAmount: existing.rateAmount,
      rateCurrency: existing.rateCurrency,
      isRateOverridden: existing.isRateOverridden,
      remarks,
      idempotencyKey: successorIdempotencyKey,
    };

    await performRescheduleValidations(t, successorInput, locale);

    const [successor] = await t
      .insert(classInstances)
      .values({
        ...successorInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return successor;
  }

  export const processClassLeave = async (
    id: string,
    reason: string | null,
    actorUserId: string,
    tx?: DBTransaction,
    locale?: string
  ) => {
    const runner = async (t: DBTransaction) => {
      const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });
      const tFuncErrors = await getBackendTranslations({ locale, namespace: "errors" });

      const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
      if (!existing) {
        throw new Error(tFuncErrors("classInstanceNotFound", { id }));
      }

      // 1. Run IDOR check
      await checkStateChangeAuth(t, existing, actorUserId, locale);

      // 2. Validate state matches ACTIVATED or RUNNING
      if (existing.executionState !== "ACTIVATED" && existing.executionState !== "RUNNING") {
        throw new Error(tFuncErrors("sessionNotActivated"));
      }

      // 3. Resolve reschedule offset days
      const offsetDays = await SystemSettingsRepository.getIntValue("session_leave_reschedule_offset_days", 7, t);
      const successor = await createRescheduledSuccessor(
        t,
        existing,
        offsetDays,
        tFuncSession("leaveRescheduledRemark"),
        locale
      );

      // 4. Update original class state
      const updated = await runStateChange(id, actorUserId, t, locale, async () => {
        const now = new Date();
        const msg = tFuncSession("leaveProcessedDescription", { successorId: successor.id });
        return {
          state: {
            executionState: "COMPLETED",
            outcome: "LEAVE",
            actualStartAt: existing.actualStartAt ?? now,
            actualEndAt: now,
            isRescheduled: true,
            quotaDeducted: false,
            payrollCredited: false,
            remarks: reason ? `${reason}\n${msg}` : msg,
          },
          event: {
            fromState: { executionState: existing.executionState, outcome: existing.outcome },
            toState: { executionState: "COMPLETED", outcome: "LEAVE" },
            description: msg,
          },
        };
      });

      const originalId = updated?.id ?? id;

      // 5. Restore student quota exactly once if it was deducted
      if (existing.quotaDeducted) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
          .where(eq(students.id, existing.studentId));
      }

      // 6. Insert/update leaveRequests record
      const requesterType = await getRequesterTypeForUser(t, actorUserId);
      const now = new Date();
      await t
        .insert(leaveRequests)
        .values({
          classInstanceId: id,
          requestedByUserId: actorUserId,
          requesterType,
          reason,
          status: "RESCHEDULED",
          createdAt: now,
          processedAt: now,
          processedByUserId: actorUserId,
        })
        .onConflictDoNothing();

      return { originalId, successorId: successor.id };
    };
    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const resetClassInstance = async (id: string, actorUserId: string, tx?: DBTransaction, locale?: string) => {
    return runStateChange(id, actorUserId, tx, locale, async (t, existing) => {
      const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });
      if (existing.quotaDeducted) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
          .where(eq(students.id, existing.studentId));
      }
      return {
        state: {
          executionState: "NOT_ACTIVATED",
          outcome: "PENDING",
          classType: "REGULAR",
          actualStartAt: null,
          actualEndAt: null,
          activatedAt: null,
          activatedByUserId: null,
          forceActivated: false,
          forceActivatedByUserId: null,
          payrollCredited: false,
          quotaDeducted: false,
          isRescheduled: false,
          remarks: null,
          adminNotes: null,
        },
        event: {
          fromState: { executionState: existing.executionState, outcome: existing.outcome },
          toState: { executionState: "NOT_ACTIVATED", outcome: "PENDING" },
          description: tFuncSession("resetDescription"),
        },
      };
    });
  };

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
    isBeingSoftDeleted: boolean,
    locale?: string
  ) {
    const studentId = input.studentId ?? existing.studentId;
    const wasDeducted = existing.quotaDeducted && existing.deletedAt === null;
    const effectiveNewDeducted = (input.quotaDeducted ?? existing.quotaDeducted) && !isBeingSoftDeleted;

    if (!wasDeducted && effectiveNewDeducted) {
      const [student] = await t
        .select({ classesRemaining: students.classesRemaining })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

      if (!student || student.classesRemaining <= 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("outOfQuota"));
      }

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

      const [newStudent] = await t
        .select({ classesRemaining: students.classesRemaining })
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!newStudent || newStudent.classesRemaining <= 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("outOfQuota"));
      }

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
        const [student] = await t
          .select({ classesRemaining: students.classesRemaining })
          .from(students)
          .where(eq(students.id, input.studentId))
          .limit(1);

        if (!student || student.classesRemaining <= 0) {
          const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(tFunc("outOfQuota"));
        }

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
      const existing = await getClassInstanceByIdOrThrow(t, id, locale);

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
      const existing = await getClassInstanceByIdOrThrow(t, id, locale);

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

  export function buildRescheduledClassInput(
    original: Types.ClassInstanceEntity,
    input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
    originalClassId: string
  ): Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt"> {
    return {
      ...input,
      originalClassId,
      isRescheduled: false,
      quotaDeducted: false,
      rateAmount: input.rateAmount ?? original.rateAmount,
      rateCurrency: input.rateCurrency ?? original.rateCurrency,
      isRateOverridden: input.isRateOverridden ?? original.isRateOverridden,
    };
  }

  export async function markOriginalAsRescheduled(t: DBTransaction, originalClassId: string): Promise<void> {
    await t
      .update(classInstances)
      .set({
        isRescheduled: true,
        quotaDeducted: false,
        updatedAt: new Date(),
      })
      .where(eq(classInstances.id, originalClassId));
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

      const newInstanceInput = buildRescheduledClassInput(original, input, originalClassId);

      await performRescheduleValidations(t, newInstanceInput, locale);

      const [created] = await t
        .insert(classInstances)
        .values({
          ...newInstanceInput,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await markOriginalAsRescheduled(t, originalClassId);

      await handleOriginalQuotaRestoration(t, original);

      return created;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const getDailyMetrics = async (date: Date, teacherId?: string, tx?: DBTransaction) => {
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

  export type DailyScheduleResult = Types.ClassInstanceEntity & {
    student?: Types.StudentEntity;
    teacher?: Types.TeacherEntity & { user: Types.UserEntity };
    yourTimeFormatted?: string;
  };

  export const getDailySchedule = async (
    date: Date,
    options?: string | { teacherId?: string; search?: string; viewerTimezone?: string },
    tx?: DBTransaction
  ): Promise<DailyScheduleResult[]> => {
    const runner = async (t: DBTransaction): Promise<DailyScheduleResult[]> => {
      const teacherId = typeof options === "string" ? options : options?.teacherId;
      const search = typeof options === "object" ? options?.search : undefined;
      const viewerTimezone = typeof options === "object" ? options?.viewerTimezone : undefined;

      const { getDayBoundaries } = await import("@/backend/lib/timezone");
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, viewerTimezone || "UTC");

      const baseConditions = and(
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, startOfDayUtc),
        lt(classInstances.scheduledStartAt, endOfDayUtc),
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

      let results: DailyScheduleResult[] = rows.map(r => ({
        ...r.classInstance,
        student: studentMap.get(r.classInstance.studentId),
        teacher: teacherMap.get(r.classInstance.teacherId),
      }));

      // Apply search if provided
      if (search) {
        const lowerSearch = search.toLowerCase();
        results = results.filter(
          r =>
            r.student?.name?.toLowerCase().includes(lowerSearch) ||
            r.teacher?.user?.name?.toLowerCase().includes(lowerSearch)
        );
      }

      // Apply timezone formatting if provided
      if (viewerTimezone) {
        const { formatInstantInTimezone } = await import("@/backend/lib/timezone");
        return results.map(r => ({
          ...r,
          yourTimeFormatted: formatInstantInTimezone(r.scheduledStartAt, viewerTimezone),
        }));
      }

      return results;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const getClassStatusEvents = async (classInstanceId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(classStatusEvents)
      .where(eq(classStatusEvents.classInstanceId, classInstanceId))
      .orderBy(sql`${classStatusEvents.createdAt} DESC`);
  };

  export const getTeacherProgressFeed = async (teacherId: string, date: Date, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const rows = await queryDb
      .select({
        id: classStatusEvents.id,
        description: classStatusEvents.description,
        eventType: classStatusEvents.eventType,
      })
      .from(classStatusEvents)
      .innerJoin(classInstances, eq(classStatusEvents.classInstanceId, classInstances.id))
      .where(
        and(
          eq(classInstances.teacherId, teacherId),
          sql`${classStatusEvents.createdAt} >= ${startOfDay}`,
          sql`${classStatusEvents.createdAt} <= ${endOfDay}`
        )
      )
      .orderBy(sql`${classStatusEvents.createdAt} DESC`)
      .limit(10);

    return rows.map(r => ({
      id: r.id,
      title: r.description || "Status Updated",
      type: r.eventType === "STATE_CHANGE" ? "SUCCESS" : "UPDATE",
    }));
  };

  export const getRescheduleTrackingRows = async (
    input: Types.RescheduleTrackingInput,
    tx?: DBTransaction
  ): Promise<Types.RescheduleTrackingRow[]> => {
    const runner = async (t: DBTransaction): Promise<Types.RescheduleTrackingRow[]> => {
      const originalClass = alias(classInstances, "original_class");
      const baseConditions = and(isNull(classInstances.deletedAt), sql`${classInstances.originalClassId} IS NOT NULL`);

      let conditions = baseConditions;

      if (input.status === "pending_leave") {
        conditions = and(conditions, eq(originalClass.outcome, "LEAVE"));
      } else if (input.status === "rescheduled") {
        conditions = and(conditions, ne(originalClass.outcome, "LEAVE"));
      }

      if (input.search) {
        const searchPattern = `%${input.search}%`;
        conditions = and(
          conditions,
          or(sql`${users.name} ILIKE ${searchPattern}`, sql`${students.name} ILIKE ${searchPattern}`)
        );
      }

      const query = t
        .select({
          id: classInstances.id,
          originalClassId: classInstances.originalClassId,
          teacherId: classInstances.teacherId,
          teacherName: users.name,
          teacherAvatarUrl: users.avatarUrl,
          studentId: classInstances.studentId,
          studentName: students.name,
          scheduledStartAt: classInstances.scheduledStartAt,
          scheduledEndAt: classInstances.scheduledEndAt,
          remarks: classInstances.remarks,
          originalOutcome: originalClass.outcome,
        })
        .from(classInstances)
        .leftJoin(originalClass, eq(classInstances.originalClassId, originalClass.id))
        .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
        .leftJoin(users, eq(teachers.userId, users.id))
        .leftJoin(students, eq(classInstances.studentId, students.id))
        .where(conditions);

      let finalQuery = query.orderBy(sql`${classInstances.scheduledStartAt} DESC`);
      if (input.limit !== undefined && input.limit !== null) {
        finalQuery = finalQuery.limit(input.limit) as typeof finalQuery;
      }
      if (input.offset !== undefined && input.offset !== null) {
        finalQuery = finalQuery.offset(input.offset) as typeof finalQuery;
      }

      const queryRows = await finalQuery;

      return queryRows.map(row => {
        const isLeave = row.originalOutcome === "LEAVE";
        return {
          id: row.id,
          originalClassId: row.originalClassId,
          teacherId: row.teacherId,
          teacherName: row.teacherName ?? "",
          teacherAvatarUrl: row.teacherAvatarUrl,
          studentId: row.studentId,
          studentName: row.studentName ?? "",
          scheduledStartAt: row.scheduledStartAt,
          scheduledEndAt: row.scheduledEndAt,
          status: isLeave ? ("pending_leave" as const) : ("rescheduled" as const),
          dateLabel: isLeave ? ("leave_request" as const) : ("new_date" as const),
          remarks: row.remarks,
        };
      });
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const getRescheduleTrackingMetrics = async (tx?: DBTransaction) => {
    const runner = async (t: DBTransaction) => {
      const [lrMetrics] = await t
        .select({
          pending: sql<number>`sum(case when status = 'PENDING' then 1 else 0 end)`.mapWith(Number),
          approved: sql<number>`sum(case when status = 'APPROVED' then 1 else 0 end)`.mapWith(Number),
          rescheduled: sql<number>`sum(case when status = 'RESCHEDULED' then 1 else 0 end)`.mapWith(Number),
          cancelled: sql<number>`sum(case when status = 'CANCELLED' then 1 else 0 end)`.mapWith(Number),
          leave: sql<number>`count(*)`.mapWith(Number),
        })
        .from(leaveRequests);

      const [rescheduledCountRow] = await t
        .select({
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(classInstances)
        .where(and(isNull(classInstances.deletedAt), sql`${classInstances.originalClassId} IS NOT NULL`));

      return {
        pending: lrMetrics?.pending ?? 0,
        approved: lrMetrics?.approved ?? 0,
        leave: lrMetrics?.leave ?? 0,
        rescheduled: rescheduledCountRow?.count ?? 0,
        cancelled: lrMetrics?.cancelled ?? 0,
      };
    };
    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };
}
