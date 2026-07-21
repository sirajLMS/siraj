import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ParentRepository } from "@/backend/db/repo/parents/parent.repository";
import {
  type ClassInstanceAffectedUsers,
  classLifecycleAffectedUserIds,
  SchedulingRepository,
} from "@/backend/db/repo/scheduling";
import { ClassStatusEventsRepository } from "@/backend/db/repo/scheduling/class-status-events.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { AppPermission, NotificationEventType } from "@/backend/enum";
import { buildClassInstanceDetail } from "@/backend/graphql/utils/class-session.utils";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import { ClassPerformanceService } from "@/backend/services/performance/class-performance.service";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import type {
  ClassInstanceDetailReturnType,
  ClassInstanceEntity,
  ClassInstanceInsertInput,
  ClassStatusEventReturnType,
} from "@/backend/types";
import type { ClassStatusEventSelectType } from "@/backend/types/scheduling/class-status-event.types";
import { type ErrorsLabels, getServerTranslations, type SessionLabels } from "@/shared/locale";

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

  /**
   * Dispatch a class-lifecycle notification to the parent + teacher of the
   * given class instance. Spec.md requires every dispatch go through
   * `dispatchWithPreferences` (rule #1), every payload through a pure
   * builder (rule #2), and dispatch failures must NOT throw out of the
   * caller — so this helper catches + logs everything (specs.md §5.2).
   *
   * Resolves the affected-user triplet via the S5 repo helper (parent /
   * teacher user ids via `classInstances.studentId → students.parentId →
   * parents.userId` and `classInstances.teacherId → teachers.userId`) and
   * passes `metadata.studentName` so the pure builder can interpolate the
   * student display name without reading the DB itself (specs.md §5.1).
   *
   * @param classInstanceId  The class instance row to dispatch about.
   * @param eventType        One of the 10 CLASS_* lifecycle event types.
   * @param affected         Pre-resolved affected user triplet (use this
   *                        overload from actions that run the soft-delete
   *                        BEFORE the dispatch — e.g. `deleteInstance` —
   *                        so the `deletedAt IS NULL` filter in
   *                        `getClassInstanceAffectedUsers` does not yield
   *                        `null` after the soft-delete commit).
   * @param metadata         Optional metadata bag (_e._g. `override`, `_newStartAt`).
   * @param locale           Optional locale forwarded to `dispatchWithPreferences`.
   */
  async function notifyClassLifecycle(
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

  async function refundCreditIfDeducted(
    instance: { id: string; studentId: string; quotaDeducted: boolean | null },
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx: DBTransaction
  ): Promise<void> {
    if (!instance.quotaDeducted) return;
    const idempotencyKey = `credit-refund:${instance.id}`;
    await CreditService.refundOnCancel(instance.studentId, instance.id, actorUserId, idempotencyKey, tx, tErrors);
  }

  /**
   * Shared post-action dispatch: resolves affected users from the live row
   * and emits the given lifecycle event. Consolidates the duplicated
   * `if (result) { resolve + notify }` block repeated across all state
   * changes whose row stays live after commit. The `dispatch` value is
   * loosely typed so callers can pass either a boolean flag or an
   * optional object that is truthy when the action succeeded.
   */
  async function notifyAffectedForInstance(
    dispatch: unknown,
    classInstanceId: string,
    eventType: NotificationEventType,
    metadata?: Record<string, string>
  ): Promise<void> {
    if (!dispatch) return;
    const affected = await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId);
    await notifyClassLifecycle(classInstanceId, eventType, affected, metadata);
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
    tSession: SessionLabels,
    tErrors: ErrorsLabels
  ): Promise<ClassInstanceDetailReturnType> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await assertClassInstanceViewAccess(userId, instance, tErrors);
    const perf = await ClassPerformanceService.getPerformanceForClass(classInstanceId);
    return buildClassInstanceDetail(instance, perf, tSession, tErrors);
  }

  export async function getClassStatusEvents(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassStatusEventReturnType[]> {
    await assertPermission(userId, AppPermission.SESSION_VIEW_DETAILS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await assertClassInstanceViewAccess(userId, instance, tErrors);
    return SchedulingRepository.getClassStatusEvents(classInstanceId);
  }

  export async function activate(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_CLASS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await SystemRulesService.assertActivationTimeWindow(instance);
    const result = await SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: false });
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_ACTIVATED);
    return result;
  }

  export async function activateOverride(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_OVERRIDE, tErrors);
    await getOrThrow(classInstanceId, tErrors);
    const result = await SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: true });
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_ACTIVATED, {
      override: "true",
    });
    return result;
  }

  export async function stop(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    const result = await SchedulingRepository.stopClassInstance(classInstanceId, userId);
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_COMPLETED);
    return result;
  }

  export async function deleteInstance(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);

    // Resolve affected users BEFORE the soft-delete commits — the helper
    // filters on `classInstances.deletedAt IS NULL`, so a post-delete
    // resolve would yield `null`.
    const affected = await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId);

    const result = await db.transaction(async tx => {
      const deleted = await SchedulingRepository.softDeleteClassInstance(classInstanceId, userId, tx);
      if (!deleted) return false;

      const wasDeducted = instance.quotaDeducted && instance.deletedAt === null;
      if (wasDeducted) {
        await refundCreditIfDeducted(instance, userId, tErrors, tx);
      }
      return true;
    });

    if (result) {
      // Pass the pre-resolved triplet so the helper skips its own fetch (which
      // would fail post-soft-delete on the `deletedAt IS NULL` filter).
      await notifyClassLifecycle(classInstanceId, NotificationEventType.CLASS_CANCELLED, affected);
    }
    return result;
  }

  export const updateStatusStart: ClassActionFn<ClassInstanceEntity> = async (userId, classInstanceId, tErrors) => {
    const result = await runActivatedClassAction(
      userId,
      classInstanceId,
      AppPermission.SESSION_UPDATE_STATUS_START,
      () => SchedulingRepository.startClassInstance(classInstanceId, userId),
      tErrors
    );
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_STARTED);
    return result;
  };

  export const updateStatusAbsent: ClassActionFn<ClassInstanceEntity> = async (userId, classInstanceId, tErrors) => {
    const result = await runActivatedClassAction(
      userId,
      classInstanceId,
      AppPermission.SESSION_UPDATE_STATUS_ABSENT,
      async instance => {
        await SystemRulesService.assertAbsentWaitingPeriod(instance);
        return SchedulingRepository.markClassAbsent(classInstanceId, userId);
      },
      tErrors
    );
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_MARKED_ABSENT);
    return result;
  };

  export async function updateStatusLeave(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels,
    reason?: string | null
  ) {
    await assertPermission(userId, AppPermission.SESSION_UPDATE_STATUS_LEAVE, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await assertSessionActivated(instance, tErrors);
    await SystemRulesService.assertLeaveQuotaAvailable(instance.teacherId);

    const result = await db.transaction(async tx => {
      const processed = await SchedulingRepository.processClassLeave(classInstanceId, reason ?? null, userId, tx);
      if (instance.quotaDeducted) {
        await refundCreditIfDeducted(instance, userId, tErrors, tx);
      }
      return processed;
    });

    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_LEAVE_REQUESTED);
    return result;
  }

  /**
   * Compute a teacher-leave quota warning note for the reschedule. Returns
   * `null` when the existing instance has no teacher or the leave quota is
   * not yet exhausted.
   */
  async function computeLeaveQuotaNote(teacherId: string | null, tSession: SessionLabels): Promise<string | null> {
    if (!teacherId) return null;

    const now = new Date();
    const periodYear = now.getUTCFullYear();
    const periodMonth = now.getUTCMonth() + 1;
    const maxLeaves = await SystemSettingsRepository.getIntValue("teacher_max_leaves", 2);
    const usedLeaves = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacherId, periodYear, periodMonth);

    if (usedLeaves >= maxLeaves) {
      return tSession.teacherQuotaExhaustedNote(usedLeaves, maxLeaves);
    }
    return null;
  }

  /**
   * Combine existing remarks with an appended quota note (if any). Existing
   * remarks are preserved verbatim; the quota note is joined on its own
   * line. Returns `null` when both are absent.
   */
  function buildRescheduleRemarks(existingRemarks: string | null, quotaNote: string | null): string | null {
    const parts: string[] = [];
    if (existingRemarks) parts.push(existingRemarks);
    if (quotaNote) parts.push(quotaNote);
    return parts.length > 0 ? parts.join("\n") : null;
  }

  /**
   * Assemble the successor instance insert payload for `reschedule`. Copies
   * identity/billing fields from the existing instance, resets lifecycle
   * flags, and stamps a unique idempotency key derived from the new start
   * time.
   */
  function buildRescheduleInsert(
    classInstanceId: string,
    existing: Awaited<ReturnType<typeof getOrThrow>>,
    input: { scheduledStartAt: Date; scheduledEndAt: Date; durationMinutes: number },
    finalRemarks: string | null
  ) {
    const idempotencyKey = `manual-reschedule-${classInstanceId}-${input.scheduledStartAt.toISOString()}`;
    return {
      studentId: existing.studentId,
      teacherId: existing.teacherId,
      subjectId: existing.subjectId,
      recurringScheduleId: existing.recurringScheduleId,
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
    };
  }

  export async function reschedule(
    userId: string,
    classInstanceId: string,
    input: {
      scheduledStartAt: Date;
      scheduledEndAt: Date;
      durationMinutes: number;
    },
    tSession: SessionLabels,
    tErrors: ErrorsLabels
  ) {
    await assertPermission(userId, AppPermission.SESSION_RESCHEDULE, tErrors);
    const existing = await getOrThrow(classInstanceId, tErrors);

    const quotaNote = await computeLeaveQuotaNote(existing.teacherId, tSession);
    const finalRemarks = buildRescheduleRemarks(existing.remarks, quotaNote);

    const created = await db.transaction(async tx => {
      const insertPayload = buildRescheduleInsert(classInstanceId, existing, input, finalRemarks);
      const newInstance = await SchedulingRepository.rescheduleClassInstance(classInstanceId, insertPayload, tx);

      if (existing.quotaDeducted && existing.deletedAt === null) {
        const tErrorsLocal = getServerTranslations("ar").errorsTranslations;
        await refundCreditIfDeducted(existing, userId, tErrorsLocal, tx);
      }

      return newInstance;
    });

    // Dispatch against the NEW (successor) instance — its `scheduledStartAt`
    // carries the rescheduled time. Metadata carries `newStartAt` (ISO) +
    // `originalInstanceId` so the body template can interpolate both.
    await notifyClassLifecycle(
      created.id,
      NotificationEventType.CLASS_RESCHEDULED,
      await SchedulingRepository.getClassInstanceAffectedUsers(created.id),
      {
        newStartAt: input.scheduledStartAt.toISOString(),
        originalInstanceId: classInstanceId,
      }
    );

    return created;
  }

  export async function reset(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_RESET, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);

    const resetInstance = await db.transaction(async tx => {
      const resetResult = await SchedulingRepository.resetClassInstance(classInstanceId, userId, tx);
      if (!resetResult) {
        throw new Error(tErrors.notFound);
      }
      if (instance.quotaDeducted) {
        await refundCreditIfDeducted(instance, userId, tErrors, tx);
      }
      return resetResult;
    });

    // Reset keeps the row live (deletedAt stays null); resolve post-commit.
    await notifyClassLifecycle(
      classInstanceId,
      NotificationEventType.CLASS_RESET,
      await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId)
    );
    return resetInstance;
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

export type ClassActionFn<R> = (userId: string, classInstanceId: string, tErrors: ErrorsLabels) => Promise<R>;
