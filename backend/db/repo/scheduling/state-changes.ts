import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { incrementTeacherLeaveQuota as incrementTeacherLeaveQuotaFn } from "@/backend/db/repo/scheduling/scheduling-queries.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { classInstances, classStatusEvents, leaveRequests, parents, students, teachers } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";
import { createRescheduledSuccessor, type DBTransaction, performRescheduleValidations } from "./shared";

export async function updateInstanceState(
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
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("unauthorizedAction"));
  }
}

async function validateStateTransition(
  existing: Types.ClassInstanceEntity,
  state: Partial<Types.ClassInstanceInsertInput>,
  locale?: string
) {
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
    const isValidAutomatedLeave = existing.executionState === "NOT_ACTIVATED" && state.outcome === "LEAVE";
    if (!isValidStandard && !isValidEarly && !isValidAutomatedLeave) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidTransition"));
    }
  }
}

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
  reason: string | null,
  locale?: string
) {
  const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });
  const now = new Date();
  const msg = tFuncSession("leaveProcessedDescription", { successorId });
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
  locale?: string
): Promise<{ originalId: string; successorId: string }> {
  const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });
  const tFuncErrors = await getBackendTranslations({ locale, namespace: "errors" });

  const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
  if (!existing) {
    throw new Error(tFuncErrors("classInstanceNotFound", { id }));
  }

  await checkStateChangeAuth(t, existing, actorUserId, locale);

  if (existing.executionState !== "ACTIVATED" && existing.executionState !== "RUNNING") {
    throw new Error(tFuncErrors("sessionNotActivated"));
  }

  const offsetDays = await SystemSettingsRepository.getIntValue("session_leave_reschedule_offset_days", 7, t);
  const successor = await createRescheduledSuccessor(
    t,
    existing,
    offsetDays,
    tFuncSession("leaveRescheduledRemark"),
    locale
  );

  const updated = await runStateChange(id, actorUserId, t, locale, async () =>
    buildLeaveStateChangePayload(existing, successor.id, reason, locale)
  );

  const originalId = updated?.id ?? id;

  if (existing.quotaDeducted) {
    await t
      .update(students)
      .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
      .where(eq(students.id, existing.studentId));
  }

  await insertLeaveRequestRecord(t, id, actorUserId, reason);

  const [teacherRow] = await t
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.id, existing.teacherId))
    .limit(1);
  if (teacherRow) {
    await incrementTeacherLeaveQuotaFn(teacherRow.id, t, locale);
  }

  return { originalId, successorId: successor.id };
}

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

async function handleOriginalQuotaRestoration(t: DBTransaction, original: Types.ClassInstanceEntity) {
  if (original.quotaDeducted && original.deletedAt === null) {
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

export const processClassLeave = async (
  id: string,
  reason: string | null,
  actorUserId: string,
  tx?: DBTransaction,
  locale?: string
) => {
  return tx
    ? await executeProcessClassLeave(tx, id, reason, actorUserId, locale)
    : await db.transaction((t: DBTransaction) => executeProcessClassLeave(t, id, reason, actorUserId, locale));
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

export async function handleQuotaDeduction(
  t: DBTransaction,
  studentId: string,
  quotaDeducted: boolean,
  locale?: string
): Promise<void> {
  if (!quotaDeducted) return;

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
}

export async function processAutomatedClassLeave(
  id: string,
  reason: string | null,
  actorUserId: string,
  tx?: DBTransaction
): Promise<{ originalId: string; successorId: string | null }> {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) {
      const tFunc = await getBackendTranslations({ locale: undefined, namespace: "errors" });
      throw new Error(tFunc("classInstanceNotFound", { id }));
    }
    const offsetDays = await SystemSettingsRepository.getIntValue("session_leave_reschedule_offset_days", 7, t);
    const successor = await createRescheduledSuccessor(t, existing, offsetDays, "Automated leave reschedule");

    const updated = await runStateChange(id, actorUserId, t, undefined, async () =>
      buildLeaveStateChangePayload(existing, successor.id, reason, undefined)
    );

    const originalId = updated?.id ?? id;

    if (existing.quotaDeducted) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, existing.studentId));
    }

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
    if (teacherRow) await incrementTeacherLeaveQuotaFn(teacherRow.id, t);

    return { originalId, successorId: successor.id };
  };
  return tx ? runner(tx) : db.transaction((t: DBTransaction) => runner(t));
}
