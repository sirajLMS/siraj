import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import type { ClassInstanceEntity } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

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

  async function getOrThrow(classInstanceId: string, locale?: string): Promise<ClassInstanceEntity> {
    const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
    if (!instance) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }
    return instance;
  }

  async function handleUpdate<T>(promise: Promise<T | null>, locale?: string): Promise<T> {
    const result = await promise;
    if (!result) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }
    return result;
  }

  async function assertSessionActivated(instance: ClassInstanceEntity, locale?: string): Promise<void> {
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
    action: (instance: ClassInstanceEntity) => Promise<T | null>
  ): Promise<T> {
    await assertPermission(userId, permission, locale);
    const instance = await getOrThrow(classInstanceId, locale);
    await assertSessionActivated(instance, locale);
    return handleUpdate(action(instance), locale);
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
    return runActivatedClassAction(userId, classInstanceId, AppPermission.SESSION_UPDATE_STATUS_LEAVE, locale, () =>
      SchedulingRepository.processClassLeave(classInstanceId, reason ?? null, userId)
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
      idempotencyKey,
    });
  }

  export async function reset(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_RESET, locale);
    return handleUpdate(SchedulingRepository.resetClassInstance(classInstanceId, userId), locale);
  }
}

export type ClassActionFn<R> = (userId: string, classInstanceId: string, locale?: string) => Promise<R>;
