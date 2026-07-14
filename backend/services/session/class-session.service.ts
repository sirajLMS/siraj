import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ParentRepository } from "@/backend/db/repo/parents/parent.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { ClassStatusEventsRepository } from "@/backend/db/repo/scheduling/class-status-events.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { AppPermission } from "@/backend/enum";
import { buildClassInstanceDetail } from "@/backend/graphql/utils/class-session.utils";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { ClassPerformanceService } from "@/backend/services/performance/class-performance.service";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import type {
  ClassInstanceDetailReturnType,
  ClassInstanceEntity,
  ClassInstanceInsertInput,
  ClassStatusEventReturnType,
} from "@/backend/types";
import type { ClassStatusEventSelectType } from "@/backend/types/scheduling/class-status-event.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

/**
 * ClassSessionService
 *
 * This service implements domain-specific business logic for class session management.
 * It is protected by a multi-layered security setup to prevent IDOR and unauthorized state transitions:
 */
export namespace ClassSessionService {
  async function assertPermission(userId: string, permission: AppPermission, tErrors: ErrorsLabels) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      throw new Error(tErrors.unauthorizedAction);
    }
  }

  async function getOrThrow(classInstanceId: string, tErrors: ErrorsLabels) {
    const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
    if (!instance) {
      throw new Error(tErrors.notFound);
    }
    return instance;
  }

  async function assertClassInstanceViewAccess(
    userId: string,
    instance: NonNullable<Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceById>>>,
    tErrors: ErrorsLabels
  ): Promise<void> {
    const isPrivileged = await PermissionsService.hasAnyPermission(userId, [
      AppPermission.SESSION_OVERRIDE_ACTIONS,
      AppPermission.SESSION_ACTIVATE_OVERRIDE,
      AppPermission.SESSION_RESET,
    ]);

    if (isPrivileged) {
      return;
    }

    const teacher = await SchedulingRepository.getTeacherByUserId(userId);
    if (instance.teacherId === teacher?.id) {
      return;
    }

    const parent = await ParentRepository.findByUserId(userId);
    if (parent?.id === instance.student?.parentId) {
      return;
    }

    throw new Error(tErrors.unauthorizedAction);
  }

  async function handleUpdate<T>(promise: Promise<T | null>, tErrors: ErrorsLabels): Promise<T> {
    const result = await promise;
    if (!result) {
      throw new Error(tErrors.notFound);
    }
    return result;
  }

  async function refundCreditIfDeducted(
    instance: { id: string; studentId: string; quotaDeducted: boolean | null },
    actorUserId: string,
    tx: DBTransaction
  ): Promise<void> {
    if (!instance.quotaDeducted) return;
    const idempotencyKey = `credit-refund:${instance.id}`;
    await CreditService.refundOnCancel(instance.studentId, instance.id, actorUserId, idempotencyKey, tx);
  }

  async function assertSessionActivated(
    instance: Awaited<ReturnType<typeof getOrThrow>>,
    tErrors: ErrorsLabels
  ): Promise<void> {
    const validStates = ["ACTIVATED", "RUNNING"];
    if (!validStates.includes(instance.executionState)) {
      throw new Error(tErrors.sessionNotActivated);
    }
  }

  async function runActivatedClassAction<T>(
    userId: string,
    classInstanceId: string,
    permission: AppPermission,
    action: (instance: Awaited<ReturnType<typeof getOrThrow>>) => Promise<T | null>,
    tErrors: ErrorsLabels
  ): Promise<T> {
    await assertPermission(userId, permission, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await assertSessionActivated(instance, tErrors);
    return handleUpdate(action(instance), tErrors);
  }

  export async function getClassInstanceDetail(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassInstanceDetailReturnType> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await assertClassInstanceViewAccess(userId, instance);
    const perf = await ClassPerformanceService.getPerformanceForClass(classInstanceId);
    return buildClassInstanceDetail(instance, perf);
  }

  export async function getClassStatusEvents(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassStatusEventReturnType[]> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await assertClassInstanceViewAccess(userId, instance);
    return SchedulingRepository.getClassStatusEvents(classInstanceId);
  }

  export async function activate(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_CLASS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await SystemRulesService.assertActivationTimeWindow(instance);
    return SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: false });
  }

  export async function activateOverride(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_OVERRIDE, tErrors);
    await getOrThrow(classInstanceId, tErrors);
    return SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: true });
  }

  export async function stop(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    return SchedulingRepository.stopClassInstance(classInstanceId, userId);
  }

  export async function deleteInstance(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);

    return db.transaction(async tx => {
      const deleted = await SchedulingRepository.softDeleteClassInstance(classInstanceId, userId, tx);
      if (!deleted) return false;

      const wasDeducted = instance.quotaDeducted && instance.deletedAt === null;
      if (wasDeducted) {
        await refundCreditIfDeducted(instance, userId, tx);
      }
      return true;
    });
  }

  export const updateStatusStart: ClassActionFn<ClassInstanceEntity> = (userId, classInstanceId, tErrors) =>
    runActivatedClassAction(
      userId,
      classInstanceId,
      AppPermission.SESSION_UPDATE_STATUS_START,
      () => SchedulingRepository.startClassInstance(classInstanceId, userId),
      tErrors
    );

  export const updateStatusAbsent: ClassActionFn<ClassInstanceEntity> = (userId, classInstanceId, tErrors) =>
    runActivatedClassAction(
      userId,
      classInstanceId,
      AppPermission.SESSION_UPDATE_STATUS_ABSENT,
      async instance => {
        await SystemRulesService.assertAbsentWaitingPeriod(instance);
        return SchedulingRepository.markClassAbsent(classInstanceId, userId);
      },
      tErrors
    );

  export async function updateStatusLeave(
    userId: string,
    classInstanceId: string,
    reason?: string | null,
    tErrors?: ErrorsLabels
  ) {
    await assertPermission(userId, AppPermission.SESSION_UPDATE_STATUS_LEAVE, tErrors!);
    const instance = await getOrThrow(classInstanceId, tErrors!);
    await assertSessionActivated(instance, tErrors!);
    await SystemRulesService.assertLeaveQuotaAvailable(instance.teacherId);

    return db.transaction(async tx => {
      const result = await SchedulingRepository.processClassLeave(classInstanceId, reason ?? null, userId, tx);
      if (instance.quotaDeducted) {
        await refundCreditIfDeducted(instance, userId, tx);
      }
      return result;
    });
  }

  export async function reschedule(
    userId: string,
    classInstanceId: string,
    input: {
      scheduledStartAt: Date;
      scheduledEndAt: Date;
      durationMinutes: number;
    },
    tErrors: ErrorsLabels
  ) {
    await assertPermission(userId, AppPermission.SESSION_RESCHEDULE, tErrors);
    const existing = await getOrThrow(classInstanceId, tErrors);

    let quotaNote: string | null = null;
    if (existing.teacherId) {
      const now = new Date();
      const periodYear = now.getUTCFullYear();
      const periodMonth = now.getUTCMonth() + 1;
      const maxLeaves = await SystemSettingsRepository.getIntValue("teacher_max_leaves", 2);
      const usedLeaves = await SchedulingRepository.getTeacherLeaveQuotaUsage(
        existing.teacherId,
        periodYear,
        periodMonth
      );

      if (usedLeaves >= maxLeaves) {
        const t = await getBackendTranslations({ namespace: "session" });
        quotaNote = t("teacherQuotaExhaustedNote", { used: String(usedLeaves), max: String(maxLeaves) });
      }
    }

    const remarksParts: string[] = [];
    if (existing.remarks) {
      remarksParts.push(existing.remarks);
    }
    if (quotaNote) {
      remarksParts.push(quotaNote);
    }
    const finalRemarks = remarksParts.length > 0 ? remarksParts.join("\n") : null;

    const idempotencyKey = `manual-reschedule-${classInstanceId}-${input.scheduledStartAt.toISOString()}`;
    return db.transaction(async tx => {
      const created = await SchedulingRepository.rescheduleClassInstance(
        classInstanceId,
        {
          studentId: existing.studentId,
          teacherId: existing.teacherId,
          scheduledStartAt: input.scheduledStartAt,
          scheduledEndAt: input.scheduledEndAt,
          durationMinutes: input.durationMinutes,
          classType: existing.classType,
          executionState: "NOT_ACTIVATED" as const,
          outcome: "PENDING" as const,
          isRescheduled: false,
          quotaDeducted: false,
          payrollCredited: false,
          rateAmount: existing.rateAmount,
          rateCurrency: existing.rateCurrency,
          isRateOverridden: existing.isRateOverridden,
          remarks: finalRemarks,
          idempotencyKey,
        },
        tx
      );

      if (existing.quotaDeducted && existing.deletedAt === null) {
        await refundCreditIfDeducted(existing, userId, tx);
      }

      return created;
    });
  }

  export async function reset(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_RESET, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);

    return db.transaction(async tx => {
      const resetInstance = await SchedulingRepository.resetClassInstance(classInstanceId, userId, tx);
      if (!resetInstance) {
        throw new Error(tErrors.notFound);
      }
      if (instance.quotaDeducted) {
        await refundCreditIfDeducted(instance, userId, tx);
      }
      return resetInstance;
    });
  }
  export async function listClassInstancesByIdempotencyKeys(
    keys: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, ClassInstanceEntity>> {
    return SchedulingRepository.listByIdempotencyKeys(keys, tx);
  }

  export async function upsertManyClassInstances(
    instances: ClassInstanceInsertInput[],
    options?: { chunkSize?: number; updatedAt?: Date; tx?: DBTransaction }
  ): Promise<ClassInstanceEntity[]> {
    return SchedulingRepository.upsertMany(instances, options);
  }

  export async function listClassInstanceIdsWithStatusEvents(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Set<string>> {
    return ClassStatusEventsRepository.listClassInstanceIdsWithEvents(classInstanceIds, tx);
  }

  export async function createManyStatusEvents(
    inputs: Parameters<typeof ClassStatusEventsRepository.createMany>[0],
    tx?: DBTransaction
  ): Promise<ClassStatusEventSelectType[]> {
    return ClassStatusEventsRepository.createMany(inputs, tx);
  }

  export async function findStatusEventsByClassInstanceIds(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, ClassStatusEventSelectType>> {
    return ClassStatusEventsRepository.findFirstByClassInstanceIds(classInstanceIds, tx);
  }
}

export type ClassActionFn<R> = (userId: string, classInstanceId: string) => Promise<R>;
