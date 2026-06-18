import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import type { ClassInstanceEntity, ClassInstanceInsertInput } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

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

  export async function activate(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_CLASS, locale);
    const instance = await getOrThrow(classInstanceId, locale);

    await SystemRulesService.assertActivationTimeWindow(instance, locale);

    return SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: false });
  }

  export async function forceActivate(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, locale);
    await assertPermission(userId, AppPermission.SESSION_FORCE_ACTIVATE, locale);

    await getOrThrow(classInstanceId, locale);

    // Bypass SystemRulesService.assertActivationTimeWindow
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

  export async function start(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_START, locale);
    return handleUpdate(SchedulingRepository.startClassInstance(classInstanceId, userId), locale);
  }

  export async function markAbsent(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_MARK_ABSENT, locale);
    return handleUpdate(SchedulingRepository.markClassAbsent(classInstanceId, userId), locale);
  }

  export async function requestLeave(userId: string, classInstanceId: string, reason?: string | null, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_REQUEST_LEAVE, locale);
    return handleUpdate(SchedulingRepository.requestClassLeave(classInstanceId, reason ?? null, userId), locale);
  }

  export async function adminLeave(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_ADMIN_LEAVE, locale);
    return handleUpdate(SchedulingRepository.adminExcuseClassLeave(classInstanceId, userId), locale);
  }

  export async function reschedule(
    userId: string,
    classInstanceId: string,
    input: Omit<ClassInstanceInsertInput, "createdAt" | "updatedAt">,
    locale?: string
  ) {
    await assertPermission(userId, AppPermission.SESSION_RESCHEDULE, locale);
    return SchedulingRepository.rescheduleClassInstance(classInstanceId, input);
  }

  export async function revert(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_REVERT, locale);
    return handleUpdate(SchedulingRepository.revertClassInstance(classInstanceId, userId), locale);
  }
}
