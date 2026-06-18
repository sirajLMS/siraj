import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import type { ClassInstanceEntity, ClassInstanceInsertInput } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

/**
 * ClassSessionService
 *
 * This service implements domain-specific business logic for class session management.
 * It is protected by a multi-layered security setup to prevent IDOR and unauthorized state transitions:
 *
 * 1. Database Level (RLS Policies): class_instances_rls_policies.sql enforces row-level visibility,
 *    scoping read/update queries to only records belonging to the current user's role (Teacher or Parent).
 * 2. Database Level (Triggers): class_instances_state_transition_trigger.sql prevents invalid state machine
 *    transitions (e.g. COMPLETED -> ACTIVATED) at the lowest layer, triggering a transaction rollback.
 * 3. Repository Layer Assertions: SchedulingRepository implements application-level checks to verify the relationship
 *    of the actorUserId to the class instance (e.g., matching teacherId or studentId). It also explicitly blocks
 *    state transition logic bypasses and checks quota constraints before booking.
 * 4. Service Layer: This layer validates that the user possesses the required AppPermission before
 *    deferring to the Repository Layer.
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

  export async function activate(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_CLASS, locale);
    const instance = await getOrThrow(classInstanceId, locale);

    await SystemRulesService.assertActivationTimeWindow(instance, locale);

    return SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: false });
  }

  async function assertSessionActivated(instance: ClassInstanceEntity, locale?: string): Promise<void> {
    const validStates = ["ACTIVATED", "RUNNING"];
    if (!validStates.includes(instance.executionState)) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("sessionNotActivated"));
    }
  }

  export async function activateOverride(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, locale);
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_OVERRIDE, locale);

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

  export async function updateStatusStart(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_UPDATE_STATUS_START, locale);
    const instance = await getOrThrow(classInstanceId, locale);
    await assertSessionActivated(instance, locale);
    return handleUpdate(SchedulingRepository.startClassInstance(classInstanceId, userId), locale);
  }

  export async function updateStatusAbsent(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_UPDATE_STATUS_ABSENT, locale);
    const instance = await getOrThrow(classInstanceId, locale);
    await assertSessionActivated(instance, locale);
    await SystemRulesService.assertAbsentWaitingPeriod(instance, locale);
    return handleUpdate(SchedulingRepository.markClassAbsent(classInstanceId, userId), locale);
  }

  export async function updateStatusLeave(
    userId: string,
    classInstanceId: string,
    reason?: string | null,
    locale?: string
  ) {
    await assertPermission(userId, AppPermission.SESSION_UPDATE_STATUS_LEAVE, locale);
    const instance = await getOrThrow(classInstanceId, locale);
    await assertSessionActivated(instance, locale);
    return handleUpdate(SchedulingRepository.processClassLeave(classInstanceId, reason ?? null, userId), locale);
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

  export async function reset(userId: string, classInstanceId: string, locale?: string) {
    await assertPermission(userId, AppPermission.SESSION_RESET, locale);
    return handleUpdate(SchedulingRepository.resetClassInstance(classInstanceId, userId), locale);
  }
}

export type ClassActionFn<R> = (userId: string, classInstanceId: string, locale?: string) => Promise<R>;
