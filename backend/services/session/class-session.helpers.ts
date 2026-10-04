import { ParentRepository } from "@/backend/db/repo/parents/parent.repository";
import {
  type ClassInstanceAffectedUsers,
  classLifecycleAffectedUserIds,
  SchedulingRepository,
} from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { AppPermission, type NotificationEventType } from "@/backend/enum";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { invalidateClassLifecycle } from "@/backend/services/cache";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import type { ClassInstanceDetailReturnType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export type ClassInstanceForViewAccess = NonNullable<
  Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceById>>
>;

export async function assertClassSessionPermission(
  userId: string,
  permission: AppPermission,
  tErrors: ErrorsLabels
): Promise<void> {
  const isAuthorized = await PermissionsService.hasPermission(userId, permission);
  if (!isAuthorized) {
    throw new UnauthorizedError(tErrors.unauthorizedAction);
  }
}

export async function getClassInstanceOrThrow(classInstanceId: string, tErrors: ErrorsLabels) {
  const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
  if (!instance) {
    throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
  }
  return instance;
}

async function assertClassInstanceViewAccess(
  userId: string,
  instance: ClassInstanceForViewAccess,
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

  const studentId = await StudentRepository.getStudentIdByUserId(userId);
  if (studentId && studentId === instance.studentId) {
    return;
  }

  throw new UnauthorizedError(tErrors.unauthorizedAction);
}

/**
 * Detail reads: staff/parents use `session.view_details` + relationship check;
 * students use `student.view_own_dashboard` for their own enrolled instances only.
 */
export async function assertClassInstanceDetailViewAuth(
  userId: string,
  instance: ClassInstanceForViewAccess,
  tErrors: ErrorsLabels
): Promise<void> {
  const hasSessionViewDetails = await PermissionsService.hasPermission(userId, AppPermission.SESSION_VIEW_DETAILS);
  if (hasSessionViewDetails) {
    await assertClassInstanceViewAccess(userId, instance, tErrors);
    return;
  }

  const studentId = await StudentRepository.getStudentIdByUserId(userId);
  if (studentId && studentId === instance.studentId) {
    const canViewOwnDashboard = await PermissionsService.hasPermission(
      userId,
      AppPermission.STUDENT_VIEW_OWN_DASHBOARD
    );
    if (canViewOwnDashboard) {
      return;
    }
  }

  throw new UnauthorizedError(tErrors.unauthorizedAction);
}

async function handleClassSessionUpdate<T>(promise: Promise<T | null>, tErrors: ErrorsLabels): Promise<T> {
  const result = await promise;
  if (!result) {
    throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
  }
  return result;
}

/**
 * Dispatch a class-lifecycle notification to the parent + teacher of the
 * given class instance. Every dispatch goes through `dispatchWithPreferences`,
 * every payload through a pure builder, and dispatch failures never throw out
 * of the caller — so this helper catches + logs everything.
 */
export async function notifyClassLifecycle(
  classInstanceId: string,
  eventType: NotificationEventType,
  affected: ClassInstanceAffectedUsers | null,
  metadata?: Record<string, string>,
  locale?: string
): Promise<void> {
  if (!affected) return;

  try {
    const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
    if (!instance) return;

    const teacherId = instance.teacherId ?? undefined;
    const parentId = instance.student?.parentId ?? undefined;

    try {
      await invalidateClassLifecycle(teacherId, parentId);
    } catch (cacheErr) {
      logger.error("Failed to invalidate class lifecycle cache tags", {
        classInstanceId,
        teacherId,
        parentId,
        error: cacheErr,
      });
    }

    const studentName = instance.student?.name ?? "—";
    const affectedUserIds = classLifecycleAffectedUserIds(affected);
    const payloads = buildClassLifecyclePayloads(instance, eventType, affectedUserIds, locale, {
      studentName,
      ...metadata,
    });
    await dispatchWithPreferences(payloads, affectedUserIds, locale);
  } catch (error) {
    logger.error("Class lifecycle notification dispatch failed", {
      classInstanceId,
      eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Shared post-action dispatch: resolves affected users from the live row and
 * emits the given lifecycle event. The `dispatch` value is loosely typed so
 * callers can pass either a boolean flag or an optional object that is truthy
 * when the action succeeded.
 */
export async function notifyAffectedForInstance(
  dispatch: unknown,
  classInstanceId: string,
  eventType: NotificationEventType,
  metadata?: Record<string, string>
): Promise<void> {
  if (!dispatch) return;
  const affected = await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId);
  await notifyClassLifecycle(classInstanceId, eventType, affected, metadata);
}

export async function assertSessionActivated(
  instance: Awaited<ReturnType<typeof getClassInstanceOrThrow>>,
  tErrors: ErrorsLabels
): Promise<void> {
  const validStates = ["ACTIVATED", "RUNNING"];
  if (!validStates.includes(instance.executionState)) {
    throw new ValidationError(tErrors.sessionNotActivated);
  }
}

async function runActivatedClassAction<T>(
  userId: string,
  classInstanceId: string,
  permission: AppPermission,
  action: (instance: Awaited<ReturnType<typeof getClassInstanceOrThrow>>) => Promise<T | null>,
  tErrors: ErrorsLabels
): Promise<T> {
  await assertClassSessionPermission(userId, permission, tErrors);
  const instance = await getClassInstanceOrThrow(classInstanceId, tErrors);
  await assertSessionActivated(instance, tErrors);
  return handleClassSessionUpdate(action(instance), tErrors);
}

export async function runActivatedClassActionWithNotify<T>(
  userId: string,
  classInstanceId: string,
  permission: AppPermission,
  action: (instance: Awaited<ReturnType<typeof getClassInstanceOrThrow>>) => Promise<T | null>,
  tErrors: ErrorsLabels,
  eventType: NotificationEventType
): Promise<T> {
  const result = await runActivatedClassAction(userId, classInstanceId, permission, action, tErrors);
  await notifyAffectedForInstance(result, classInstanceId, eventType);
  return result;
}

/** Payroll snapshot columns carried on the class-instance detail surface. */
const PAYROLL_SNAPSHOT_DETAIL_FIELDS = [
  "calculationStatus",
  "teacherPaidAmount",
  "teacherPaidCurrency",
  "calculatedDuration",
  "isPartialPercentage",
  "payrollNote",
  "payrollCalculatedAt",
  "payrollCalculatedBy",
] as const;

/**
 * Removes the payroll snapshot columns from a class-instance detail. Payroll
 * compensation data is restricted to accounting payroll viewers; teachers and
 * students legitimately reach this shared session surface, so their response
 * must not carry pay amounts or calculation state. Booking-rate data and the
 * payrollCredited scheduling flag stay visible — they are not payroll data.
 */
export function withoutPayrollSnapshot(detail: ClassInstanceDetailReturnType): ClassInstanceDetailReturnType {
  const stripped = { ...detail };
  const strippable: Partial<ClassInstanceDetailReturnType> = stripped;
  for (const field of PAYROLL_SNAPSHOT_DETAIL_FIELDS) {
    delete strippable[field];
  }
  return stripped;
}
