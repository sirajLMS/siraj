import { eq } from "drizzle-orm";
import { incrementTeacherLeaveQuota as incrementTeacherLeaveQuotaFn } from "@/backend/db/repo/scheduling/scheduling-queries.repository";
import { createRescheduledSuccessor } from "@/backend/db/repo/scheduling/shared";
import {
  runStateChange,
  type StateChangeHooks,
  type StateChangeLogicResult,
} from "@/backend/db/repo/scheduling/state-changes.core";
import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { classInstances, leaveRequests, parents, teachers } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

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

function buildLeaveStateChangePayload(
  existing: Types.ClassInstanceSelectType,
  successorId: string,
  reason: string | null
): StateChangeLogicResult {
  const tFuncSession = getServerTranslations("en").sessionTranslations;
  const now = new Date();
  const msg = tFuncSession.leaveProcessedDescription(successorId);
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
}

async function insertLeaveRequestRecord(
  t: DBTransaction,
  classInstanceId: string,
  actorUserId: string,
  reason: string | null
): Promise<void> {
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

export async function executeProcessClassLeave(
  t: DBTransaction,
  id: string,
  reason: string | null,
  actorUserId: string,
  tErrors: ErrorsLabels,
  hooks?: StateChangeHooks,
  meetingJoinUrl?: string | null
): Promise<{ originalId: string; successorId: string }> {
  const tFuncSession = getServerTranslations("en").sessionTranslations;

  const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
  if (!existing) {
    throw new Error(tErrors.classInstanceNotFound({ id }));
  }

  if (existing.executionState !== "ACTIVATED" && existing.executionState !== "RUNNING") {
    throw new Error(tErrors.sessionNotActivated);
  }

  const offsetDays = await SystemSettingsRepository.getIntValue("session_leave_reschedule_offset_days", 7, t);
  const successor = await createRescheduledSuccessor(
    t,
    existing,
    offsetDays,
    tFuncSession.leaveRescheduledRemark,
    tErrors,
    meetingJoinUrl
  );

  const updated = await runStateChange(
    id,
    actorUserId,
    async () => buildLeaveStateChangePayload(existing, successor.id, reason),
    t,
    tErrors,
    hooks
  );

  const originalId = updated?.id ?? id;

  await insertLeaveRequestRecord(t, id, actorUserId, reason);

  const [teacherRow] = await t
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.id, existing.teacherId))
    .limit(1);
  if (teacherRow) {
    await incrementTeacherLeaveQuotaFn(teacherRow.id, t);
  }

  return { originalId, successorId: successor.id };
}
