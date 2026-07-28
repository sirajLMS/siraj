import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { incrementTeacherLeaveQuota as incrementTeacherLeaveQuotaFn } from "@/backend/db/repo/scheduling/scheduling-queries.repository";
import {
  createRescheduledSuccessor,
  type DBTransaction,
  performRescheduleValidations,
} from "@/backend/db/repo/scheduling/shared";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { classInstances, classStatusEvents, leaveRequests, parents, students, teachers } from "@/backend/db/schema";
import { AppPermission, type CurrencyCode, RateSource } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type * as Types from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale";

export async function updateInstanceState(
  t: DBTransaction,
  id: string,
  actorUserId: string | null,
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
  tErrors: ErrorsLabels
) {
  const isPrivilegedActor = await PermissionsService.hasAnyPermission(actorUserId, [
    AppPermission.SESSION_OVERRIDE_ACTIONS,
    AppPermission.SESSION_ACTIVATE_OVERRIDE,
    AppPermission.SESSION_RESET,
  ]);

  if (isPrivilegedActor) {
    return;
  }

  const [teacher] = await t.select({ id: teachers.id }).from(teachers).where(eq(teachers.userId, actorUserId)).limit(1);

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
    throw new Error(tErrors.unauthorizedAction);
  }
}

async function validateStateTransition(
  existing: Types.ClassInstanceEntity,
  state: Partial<Types.ClassInstanceInsertInput>,
  tErrors: ErrorsLabels
) {
  if (state.executionState === "ACTIVATED") {
    if (existing.executionState !== "NOT_ACTIVATED") {
      throw new Error(tErrors.invalidTransition);
    }
  } else if (state.executionState === "RUNNING") {
    if (existing.executionState !== "ACTIVATED") {
      throw new Error(tErrors.invalidTransition);
    }
  } else if (state.executionState === "COMPLETED") {
    const isValidStandard = existing.executionState === "RUNNING";
    const isValidEarly =
      existing.executionState === "ACTIVATED" && (state.outcome === "ABSENT" || state.outcome === "LEAVE");
    const isValidAutomatedLeave = existing.executionState === "NOT_ACTIVATED" && state.outcome === "LEAVE";
    const isValidAutomatedAbsent = existing.executionState === "NOT_ACTIVATED" && state.outcome === "ABSENT";
    if (!isValidStandard && !isValidEarly && !isValidAutomatedLeave && !isValidAutomatedAbsent) {
      throw new Error(tErrors.invalidTransition);
    }
  }
}

async function runStateChange(
  id: string,
  actorUserId: string,
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
  }>,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceEntity | null> {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) return null;

    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;

    await checkStateChangeAuth(t, existing, actorUserId, tFuncErrors);

    const { state, event } = await logic(t, existing);

    await validateStateTransition(existing, state, tFuncErrors);

    return updateInstanceState(t, id, actorUserId, state, event);
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
}

async function transitionToCompleted(
  id: string,
  actorUserId: string,
  outcome: "ABSENT" | "LEAVE" | "TAKEN",
  description: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
) {
  return runStateChange(
    id,
    actorUserId,
    async (_, existing) => {
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
    },
    tx,
    tErrors
  );
}

async function getRequesterTypeForUser(t: DBTransaction, actorUserId: string): Promise<"TEACHER" | "PARENT" | "ADMIN"> {
  const [teacher] = await t.select({ id: teachers.id }).from(teachers).where(eq(teachers.userId, actorUserId)).limit(1);
  if (teacher) {
    return "TEACHER";
  }
  const [parent] = await t.select({ id: parents.id }).from(parents).where(eq(parents.userId, actorUserId)).limit(1);
  if (parent) {
    return "PARENT";
  }
  return "ADMIN";
}

async function buildLeaveStateChangePayload(
  existing: Types.ClassInstanceEntity,
  successorId: string,
  reason: string | null
) {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  const now = new Date();
  const msg = tFuncSession.leaveProcessedDescription(successorId);
  return {
    state: {
      executionState: "COMPLETED" as const,
      outcome: "LEAVE" as const,
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
}

async function insertLeaveRequestRecord(
  t: DBTransaction,
  classInstanceId: string,
  actorUserId: string,
  reason: string | null
) {
  const requesterType = await getRequesterTypeForUser(t, actorUserId);
  const now = new Date();
  await t
    .insert(leaveRequests)
    .values({
      classInstanceId,
      requestedByUserId: actorUserId,
      requesterType,
      reason,
      status: "RESCHEDULED",
      createdAt: now,
      processedAt: now,
      processedByUserId: actorUserId,
    })
    .onConflictDoNothing();
}

async function executeProcessClassLeave(
  t: DBTransaction,
  id: string,
  reason: string | null,
  actorUserId: string,
  tErrors: ErrorsLabels
): Promise<{ originalId: string; successorId: string }> {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  const tFuncErrors = tErrors;

  const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
  if (!existing) {
    throw new Error(tFuncErrors.classInstanceNotFound({ id }));
  }

  await checkStateChangeAuth(t, existing, actorUserId, tFuncErrors);

  if (existing.executionState !== "ACTIVATED" && existing.executionState !== "RUNNING") {
    throw new Error(tFuncErrors.sessionNotActivated);
  }

  const offsetDays = await SystemSettingsRepository.getIntValue("session_leave_reschedule_offset_days", 7, t);
  const successor = await createRescheduledSuccessor(
    t,
    existing,
    offsetDays,
    tFuncSession.leaveRescheduledRemark,
    tErrors
  );

  const updated = await runStateChange(
    id,
    actorUserId,
    async () => buildLeaveStateChangePayload(existing, successor.id, reason),
    t,
    tErrors
  );

  const originalId = updated?.id ?? id;

  await insertLeaveRequestRecord(t, id, actorUserId, reason);

  const [teacherRow] = await t
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.id, existing.teacherId))
    .limit(1);
  if (teacherRow) {
    await incrementTeacherLeaveQuotaFn(teacherRow.id, t, tErrors);
  }

  return { originalId, successorId: successor.id };
}

async function validateRescheduleState(
  original: Types.ClassInstanceEntity,
  input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
  tErrors: ErrorsLabels
) {
  if (original.id === input.id) {
    throw new Error(tErrors.cannotRescheduleToSelf);
  }
  if (original.executionState === "COMPLETED" || original.outcome === "TAKEN") {
    throw new Error(tErrors.cannotRescheduleCompleted);
  }
  if (original.isRescheduled) {
    throw new Error(tErrors.cannotRescheduleAlreadyRescheduled);
  }
}

async function handleOriginalQuotaRestoration(t: DBTransaction, original: Types.ClassInstanceEntity): Promise<void> {
  // If the original class had quota deducted, refund it when rescheduling
  if (original.quotaDeducted) {
    await t
      .update(students)
      .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
      .where(eq(students.id, original.studentId));
  }
}

export async function adjustQuotaOnUpdate(
  t: DBTransaction,
  existing: Types.ClassInstanceEntity,
  input: Partial<Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">>,
  isBeingSoftDeleted: boolean
): Promise<void> {
  const newQuotaDeducted = input.quotaDeducted ?? existing.quotaDeducted;

  if (isBeingSoftDeleted) {
    if (existing.quotaDeducted) {
      // Refund quota when soft deleting
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, existing.studentId));
    }
    return;
  }

  if (existing.quotaDeducted && !newQuotaDeducted) {
    // Was deducted, now not deducted - refund
    await t
      .update(students)
      .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
      .where(eq(students.id, existing.studentId));
  } else if (!existing.quotaDeducted && newQuotaDeducted) {
    // Was not deducted, now deducted - deduct
    const [student] = await t
      .select({ classesRemaining: students.classesRemaining })
      .from(students)
      .where(eq(students.id, existing.studentId))
      .limit(1);

    if (!student || student.classesRemaining <= 0) {
      throw new Error("Out of quota");
    }

    await t
      .update(students)
      .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
      .where(eq(students.id, existing.studentId));
  }

  // Handle student swap when quota was deducted
  if (input.studentId && input.studentId !== existing.studentId && existing.quotaDeducted) {
    // Refund old student
    await t
      .update(students)
      .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
      .where(eq(students.id, existing.studentId));

    // Deduct from new student
    const [newStudent] = await t
      .select({ classesRemaining: students.classesRemaining })
      .from(students)
      .where(eq(students.id, input.studentId))
      .limit(1);

    if (!newStudent || newStudent.classesRemaining <= 0) {
      throw new Error("Out of quota");
    }

    await t
      .update(students)
      .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
      .where(eq(students.id, input.studentId));
  }
}

export const activateClassInstance = async (
  id: string,
  actorUserId: string,
  options: { force: boolean },
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
) => {
  return runStateChange(
    id,
    actorUserId,
    async () => {
      const tFuncSession = getServerTranslations("en").sessionTranslations;
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
          description: options.force ? tFuncSession.forceActivateDescription : tFuncSession.activateDescription,
        },
      };
    },
    tx,
    tErrors
  );
};

export const stopClassInstance = async (
  id: string,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
) => {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  return transitionToCompleted(id, actorUserId, "TAKEN", tFuncSession.stopDescription, tx, tErrors);
};

export const startClassInstance = async (
  id: string,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
) => {
  return runStateChange(
    id,
    actorUserId,
    async (_, existing) => {
      const tFuncSession = getServerTranslations("en").sessionTranslations;
      return {
        state: { executionState: "RUNNING", outcome: "PENDING", actualStartAt: new Date() },
        event: {
          fromState: { executionState: existing.executionState, outcome: existing.outcome },
          toState: { executionState: "RUNNING", outcome: "PENDING" },
          description: tFuncSession.startDescription,
        },
      };
    },
    tx,
    tErrors
  );
};

export const markClassAbsent = async (id: string, actorUserId: string, tx?: DBTransaction, tErrors?: ErrorsLabels) => {
  return runStateChange(
    id,
    actorUserId,
    async (_, existing) => {
      const tFuncSession = getServerTranslations("en").sessionTranslations;
      const now = new Date();
      return {
        state: {
          executionState: "COMPLETED",
          outcome: "ABSENT",
          actualStartAt: existing.actualStartAt ?? now,
          actualEndAt: now,
          payrollCredited: true,
          remarks: existing.remarks ?? tFuncSession.absentEventDescription,
        },
        event: {
          fromState: { executionState: existing.executionState, outcome: existing.outcome },
          toState: { executionState: "COMPLETED", outcome: "ABSENT" },
          description: tFuncSession.absentEventDescription,
        },
      };
    },
    tx,
    tErrors
  );
};

export const markClassMissedBySystem = async (
  id: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceEntity | null> => {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) {
      return null;
    }

    const tFuncSession = getServerTranslations("en").sessionTranslations;
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const now = new Date();
    const state = {
      executionState: "COMPLETED" as const,
      outcome: "ABSENT" as const,
      actualStartAt: existing.actualStartAt ?? now,
      actualEndAt: now,
      payrollCredited: true,
      remarks: existing.remarks ?? tFuncSession.autoMissedEventDescription,
    };

    await validateStateTransition(existing, state, tFuncErrors);

    return updateInstanceState(t, id, null, state, {
      fromState: { executionState: existing.executionState, outcome: existing.outcome },
      toState: { executionState: "COMPLETED", outcome: "ABSENT" },
      description: tFuncSession.autoMissedEventDescription,
    });
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const processClassLeave = async (
  id: string,
  reason: string | null,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
) => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    return executeProcessClassLeave(t, id, reason, actorUserId, tErrors ?? tFuncErrors);
  };
  return tx ? await runner(tx) : await db.transaction(runner);
};

export const resetClassInstance = async (
  id: string,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
) => {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) return null;

    // Handle quota restoration if the instance was quota-deducted
    if (existing.quotaDeducted) {
      await adjustQuotaOnUpdate(t, existing, { quotaDeducted: false }, false);
    }

    return runStateChange(
      id,
      actorUserId,
      async () => {
        const tFuncSession = getServerTranslations("en").sessionTranslations;
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
            fromState: { executionState: undefined, outcome: undefined },
            toState: { executionState: "NOT_ACTIVATED", outcome: "PENDING" },
            description: tFuncSession.resetDescription,
          },
        };
      },
      t,
      tErrors
    );
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export function buildRescheduledClassInput(
  original: Types.ClassInstanceEntity,
  input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
  originalClassId: string
): Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt"> {
  return {
    ...input,
    subjectId: input.subjectId ?? original.subjectId,
    originalClassId,
    isRescheduled: false,
    quotaDeducted: false,
    rateAmount: input.rateAmount ?? original.rateAmount,
    rateCurrency: input.rateCurrency ?? original.rateCurrency,
    isRateOverridden: input.isRateOverridden ?? original.isRateOverridden,
    rateSource: input.rateSource ?? original.rateSource,
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

/**
 * Admin manual override of a single class instance's hourly rate. Sets
 * `is_rate_overridden = true`, stores the override amount + currency, and
 * marks `rate_source = OVERRIDE`. Send `rateAmount = null` to clear the
 * override (revert to the recurring/subject/teacher cascade) — in that case
 * `is_rate_overridden` is set back to `false` and the snapshot columns are
 * cleared so the resolver recomputes from the cascade at approval time.
 *
 * Returns the updated row, or null if the instance was not found.
 */
export async function overrideClassInstanceRate(
  classInstanceId: string,
  rateAmount: string | null,
  rateCurrency: CurrencyCode | null,
  tx?: DBTransaction
): Promise<Types.ClassInstanceEntity | null> {
  const executor = tx ?? db;
  const isOverridden = rateAmount != null && rateAmount !== "";
  const [updated] = await executor
    .update(classInstances)
    .set({
      rateAmount: isOverridden ? rateAmount : null,
      rateCurrency: isOverridden ? rateCurrency : null,
      isRateOverridden: isOverridden,
      rateSource: isOverridden ? RateSource.OVERRIDE : null,
      updatedAt: new Date(),
    })
    .where(eq(classInstances.id, classInstanceId))
    .returning();
  return updated ?? null;
}

export const rescheduleClassInstance = async (
  originalClassId: string,
  input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceEntity> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const results = await t.select().from(classInstances).where(eq(classInstances.id, originalClassId)).limit(1);
    if (results.length === 0) {
      throw new Error(tFuncErrors.originalClassNotFound);
    }
    const original = results[0];

    await validateRescheduleState(original, input, tFuncErrors);

    const newInstanceInput = buildRescheduledClassInput(original, input, originalClassId);
    const effectiveMeeting = await EffectiveMeetingService.resolveForNewBooking(newInstanceInput.teacherId, {
      recurringScheduleId: newInstanceInput.recurringScheduleId,
      tErrors: tFuncErrors,
      tx: t,
    });
    const instanceWithMeeting = {
      ...newInstanceInput,
      meetingJoinUrl: effectiveMeeting.joinUrl,
    };

    await performRescheduleValidations(t, instanceWithMeeting, tFuncErrors);

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

export async function handleQuotaDeduction(
  t: DBTransaction,
  studentId: string,
  quotaDeducted: boolean,
  tErrors: ErrorsLabels
): Promise<void> {
  if (!quotaDeducted) return;

  const [student] = await t
    .select({ classesRemaining: students.classesRemaining })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student || student.classesRemaining <= 0) {
    throw new Error(tErrors.outOfQuota);
  }

  await t
    .update(students)
    .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
    .where(eq(students.id, studentId));
}

export async function processAutomatedClassLeave(
  id: string,
  reason: string | null,
  actorUserId: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<{ originalId: string; successorId: string | null }> {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) {
      throw new Error(tFuncErrors.classInstanceNotFound({ id }));
    }
    const offsetDays = await SystemSettingsRepository.getIntValue("session_leave_reschedule_offset_days", 7, t);
    const successor = await createRescheduledSuccessor(
      t,
      existing,
      offsetDays,
      "Automated leave reschedule",
      tFuncErrors
    );

    const updated = await runStateChange(
      id,
      actorUserId,
      async () => buildLeaveStateChangePayload(existing, successor.id, reason),
      t,
      tErrors
    );

    const originalId = updated?.id ?? id;

    const now = new Date();
    await t
      .insert(leaveRequests)
      .values({
        classInstanceId: id,
        requestedByUserId: actorUserId,
        requesterType: "ADMIN",
        reason,
        status: "RESCHEDULED",
        createdAt: now,
        processedAt: now,
        processedByUserId: actorUserId,
      })
      .onConflictDoNothing();

    const [teacherRow] = await t
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.id, existing.teacherId))
      .limit(1);
    if (teacherRow) await incrementTeacherLeaveQuotaFn(teacherRow.id, t, tFuncErrors);

    return { originalId, successorId: successor.id };
  };
  return tx ? runner(tx) : db.transaction((t: DBTransaction) => runner(t));
}
