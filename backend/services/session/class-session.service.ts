import { ParentRepository } from "@/backend/db/repo/parent.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { AppPermission } from "@/backend/enum";
import { buildClassInstanceDetail } from "@/backend/graphql/utils/class-session.utils";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ClassPerformanceService } from "@/backend/services/performance/class-performance.service";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import type { ClassInstanceDetailReturnType, ClassInstanceEntity, ClassStatusEventReturnType } from "@/backend/types";

/**
 * ClassSessionService
 *
 * This service implements domain-specific business logic for class session management.
 * It is protected by a multi-layered security setup to prevent IDOR and unauthorized state transitions:
 */
export namespace ClassSessionService {
  async function assertPermission(userId: string, permission: AppPermission, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
  }

  async function getOrThrow(classInstanceId: string, locale?: string) {
    const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
    if (!instance) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }
    return instance;
  }

  async function assertClassInstanceViewAccess(
    userId: string,
    instance: NonNullable<Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceById>>>,
    locale?: string
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
    if (parent && instance.student?.parentId === parent.id) {
      return;
    }

    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }

  async function handleUpdate<T>(promise: Promise<T | null>, locale?: string): Promise<T> {
    const result = await promise;
    if (!result) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }
    return result;
  }

  async function assertSessionActivated(
    instance: Awaited<ReturnType<typeof getOrThrow>>,
    locale?: string
  ): Promise<void> {
    const validStates = ["ACTIVATED", "RUNNING"];
    if (!validStates.includes(instance.executionState)) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("sessionNotActivated"));
    }
  }

  async function runActivatedClassAction<T>(
    userId: string,
    classInstanceId: string,
    permission: AppPermission,
    locale: string | undefined,
    action: (instance: Awaited<ReturnType<typeof getOrThrow>>) => Promise<T | null>
  ): Promise<T> {
    await assertPermission(userId, permission, locale);
    const instance = await getOrThrow(classInstanceId, locale);
    await assertSessionActivated(instance, locale);
    return handleUpdate(action(instance), locale);
  }

  export async function getClassInstanceDetail(
    userId: string,
    classInstanceId: string,
    locale?: string
  ): Promise<ClassInstanceDetailReturnType> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, locale);
    const instance = await getOrThrow(classInstanceId, locale);
    await assertClassInstanceViewAccess(userId, instance, locale);
    const perf = await ClassPerformanceService.getPerformanceForClass(classInstanceId);
    return buildClassInstanceDetail(instance, perf, locale);
  }

  export async function getClassStatusEvents(
    userId: string,
    classInstanceId: string,
    locale?: string
  ): Promise<ClassStatusEventReturnType[]> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, locale);
    const instance = await getOrThrow(classInstanceId, locale);
    await assertClassInstanceViewAccess(userId, instance, locale);
    return SchedulingRepository.getClassStatusEvents(classInstanceId);
  }

  export async function activate(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_CLASS, locale);
    const instance = await getOrThrow(classInstanceId, locale);
    await SystemRulesService.assertActivationTimeWindow(instance, locale);
    return SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: false });
  }

  export async function activateOverride(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, locale);
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_OVERRIDE, locale);
    await getOrThrow(classInstanceId, locale);
    return SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: true });
  }

  export async function stop(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, locale);
    return SchedulingRepository.stopClassInstance(classInstanceId, userId);
  }

  export async function deleteInstance(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, locale);
    const deleted = await SchedulingRepository.softDeleteClassInstance(classInstanceId, userId);
    return deleted !== null;
  }

  export const updateStatusStart: ClassActionFn<ClassInstanceEntity> = (userId, classInstanceId, locale) =>
    runActivatedClassAction(userId, classInstanceId, AppPermission.SESSION_UPDATE_STATUS_START, locale, () =>
      SchedulingRepository.startClassInstance(classInstanceId, userId)
    );

  export const updateStatusAbsent: ClassActionFn<ClassInstanceEntity> = (userId, classInstanceId, locale) =>
    runActivatedClassAction(
      userId,
      classInstanceId,
      AppPermission.SESSION_UPDATE_STATUS_ABSENT,
      locale,
      async instance => {
        await SystemRulesService.assertAbsentWaitingPeriod(instance, locale);
        return SchedulingRepository.markClassAbsent(classInstanceId, userId);
      }
    );

  export async function updateStatusLeave(
    userId: string,
    classInstanceId: string,
    reason?: string | null,
    locale?: string
  ) {
    return runActivatedClassAction(
      userId,
      classInstanceId,
      AppPermission.SESSION_UPDATE_STATUS_LEAVE,
      locale,
      async instance => {
        await SystemRulesService.assertLeaveQuotaAvailable(instance.teacherId, locale);
        return SchedulingRepository.processClassLeave(classInstanceId, reason ?? null, userId, undefined, locale);
      }
    );
  }

  export async function reschedule(
    userId: string,
    classInstanceId: string,
    input: {
      scheduledStartAt: Date;
      scheduledEndAt: Date;
      durationMinutes: number;
    },
    locale?: string
  ) {
    await assertPermission(userId, AppPermission.SESSION_RESCHEDULE, locale);
    const existing = await getOrThrow(classInstanceId, locale);

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
        const t = await getBackendTranslations({ locale, namespace: "session" });
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
    return SchedulingRepository.rescheduleClassInstance(classInstanceId, {
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
    });
  }

  export async function reset(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_RESET, locale);
    return handleUpdate(SchedulingRepository.resetClassInstance(classInstanceId, userId), locale);
  }
}

export type ClassActionFn<R> = (userId: string, classInstanceId: string, locale?: string) => Promise<R>;
