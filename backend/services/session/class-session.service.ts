import { db } from "@/backend/db/drizzleDb";
import { ParentRepository } from "@/backend/db/repo/parents/parent.repository";
import {
  type ClassInstanceAffectedUsers,
  classLifecycleAffectedUserIds,
  RecurringScheduleRepository,
  SchedulingRepository,
} from "@/backend/db/repo/scheduling";
import { ClassStatusEventsRepository } from "@/backend/db/repo/scheduling/class-status-events.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { AppPermission, NotificationEventType, OnDemandStatus } from "@/backend/enum";
import { buildClassInstanceDetail } from "@/backend/graphql/utils/class-session.utils";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { invalidateClassLifecycle } from "@/backend/services/cache";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import { ClassPerformanceService } from "@/backend/services/performance/class-performance.service";
import {
  checkStateChangeAuth,
  validateRescheduleState,
  validateStateTransition,
} from "@/backend/services/scheduling/state-change-validation.service";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import { PayrollCalculationService } from "@/backend/services/teacher/payroll-calculation.service";
import type {
  ClassInstanceDetailReturnType,
  ClassInstanceInsertType,
  ClassInstanceSelectType,
  ClassStatusEventReturnType,
  ClassStatusEventSelectType,
  DBTransaction,
} from "@/backend/types";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseClassExecutionState } from "@/shared/lib/enum";
import { type ErrorsLabels, getServerTranslations, type SessionLabels } from "@/shared/locale";

/**
 * Terminal on-demand execution states. A transition into one of these closes
 * the session without a live meeting; the payroll calculation for such rows
 * carries the on-demand flag so absence semantics resolve correctly.
 */
const ON_DEMAND_TERMINAL_EXECUTION_STATES = new Set<string>([
  ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
  ClassExecutionState.ON_DEMAND_CONFLICT_HELD,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
]);

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
      throw new UnauthorizedError(tErrors.unauthorizedAction);
    }
  }

  async function getOrThrow(classInstanceId: string, tErrors: ErrorsLabels) {
    const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
    if (!instance) {
      throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
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

    const studentId = await StudentRepository.getStudentIdByUserId(userId);
    if (studentId && studentId === instance.studentId) {
      return;
    }

    throw new UnauthorizedError(tErrors.unauthorizedAction);
  }

  type ClassInstanceForViewAccess = NonNullable<Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceById>>>;

  /**
   * Detail reads: staff/parents use `session.view_details` + relationship check;
   * students use `student.view_own_dashboard` for their own enrolled instances only.
   */
  async function assertClassInstanceDetailViewAuth(
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

  async function handleUpdate<T>(promise: Promise<T | null>, tErrors: ErrorsLabels): Promise<T> {
    const result = await promise;
    if (!result) {
      throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
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

  async function refundCreditIfDeducted(
    instance: { id: string; studentId: string; quotaDeducted: boolean | null },
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx: DBTransaction
  ): Promise<boolean> {
    if (!instance.quotaDeducted) return false;
    const idempotencyKey = `credit-refund:${instance.id}`;
    await CreditService.refundOnCancel(instance.studentId, instance.id, actorUserId, idempotencyKey, tx, tErrors);
    return true;
  }

  /**
   * Release quota for a quota-deducted class instance. The quotaId is resolved
   * from the class instance's parent recurring schedule.
   *
   * @returns `quotaReleased` is `true` only when the quota pool was
   *   successfully released. Returns `false` when the instance is not
   *   quota-deducted, when `recurringScheduleId` is missing (the holder
   *   can't be resolved and the instance should NOT fall through to a
   *   spurious credit refund), or when the release itself failed.
   *   `quotaId` carries the resolved quota when a release actually
   *   happened, so callers that need to re-deduct against the same quota
   *   (e.g. `reschedule`) can do so.
   *   `isQuotaBacked` is `true` when the schedule had a real `quotaId`
   *   and an actual release was attempted. Callers that handle the
   *   credit-backed fallback should gate on `!isQuotaBacked` so a genuine
   *   quota-release failure (where `quotaReleased: false` AND
   *   `isQuotaBacked: true`) does NOT trigger a phantom credit refund.
   */
  async function releaseQuotaIfDeducted(
    instance: Pick<ClassInstanceSelectType, "id" | "studentId" | "quotaDeducted" | "recurringScheduleId">,
    actorUserId: string,
    tx: DBTransaction,
    locale = "en"
  ): Promise<{ quotaReleased: boolean; quotaId: string | null; isQuotaBacked: boolean; warning: string | null }> {
    if (!instance.quotaDeducted) return { quotaReleased: false, quotaId: null, isQuotaBacked: false, warning: null };
    if (!instance.recurringScheduleId) {
      const warning = "quota_release_skipped_no_schedule";
      logger.logDomainError(warning, {
        classInstanceId: instance.id,
        studentId: instance.studentId,
      });
      return { quotaReleased: false, quotaId: null, isQuotaBacked: false, warning };
    }

    // Resolve quotaId from the parent recurring schedule via repository
    const scheduleRow = await RecurringScheduleRepository.findById(instance.recurringScheduleId, tx);
    const quotaId = scheduleRow?.schedule.quotaId ?? null;

    if (!quotaId) return { quotaReleased: false, quotaId: null, isQuotaBacked: false, warning: null };

    const result = await QuotaService.tryReleaseForInstance(
      instance.studentId,
      instance.id,
      quotaId,
      actorUserId,
      tx,
      locale
    );
    return { quotaReleased: result.ok, quotaId: result.ok ? quotaId : null, isQuotaBacked: true, warning: null };
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
      throw new ValidationError(tErrors.sessionNotActivated);
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
    const instance = await getOrThrow(classInstanceId, tErrors);
    await assertClassInstanceDetailViewAuth(userId, instance, tErrors);
    const perf = await ClassPerformanceService.getPerformanceForClass(classInstanceId);
    return buildClassInstanceDetail(instance, perf, tSession, tErrors);
  }

  export async function getClassStatusEvents(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassStatusEventReturnType[]> {
    const instance = await getOrThrow(classInstanceId, tErrors);
    await assertClassInstanceDetailViewAuth(userId, instance, tErrors);
    return SchedulingRepository.getClassStatusEvents(classInstanceId);
  }

  async function handleOndemandSessionStartCreditDeduction(
    instance: ClassInstanceSelectType,
    userId: string,
    tErrors: ErrorsLabels,
    tx: DBTransaction,
    locale = "en"
  ): Promise<void> {
    if (instance.ondemandStatus === "PENDING_CREDIT") {
      const openQuota = await QuotaService.selectQuotaForBooking(instance.studentId, tx, userId, locale);
      if (openQuota) {
        await QuotaService.redeemForInstance(instance.studentId, instance.id, openQuota.id, userId, tx, locale);
      } else {
        const idempotencyKey = `credit-deduction-ondemand:${instance.id}`;
        await CreditService.deductForBooking(instance.studentId, instance.id, userId, idempotencyKey, tx, tErrors);
      }
    }
  }

  /**
   * Batch-update on-demand class instances from PENDING_CREDIT to a new
   * status. The atomic `ondemand_status = PENDING_CREDIT` WHERE guard
   * provides idempotency: concurrent runs cannot double-process because
   * only rows still in PENDING_CREDIT are affected.
   *
   * When the target execution state is a terminal on-demand state, the
   * payroll calculation runs for every flipped instance inside the same
   * transaction. Does NOT dispatch notifications — callers handle that.
   *
   * @param options.actorUserId  Authenticated user to attribute the payroll
   *                             calculation to. System flows without a user
   *                             session omit it and the calculation is
   *                             deferred to an operator reconciliation.
   * @returns Count of rows actually updated.
   */
  export async function markNoCreditsBatch(
    tx: DBTransaction,
    instanceIds: string[],
    newStatus: OnDemandStatus,
    executionState: string,
    options?: { actorUserId?: string | null }
  ): Promise<number> {
    if (instanceIds.length === 0) return 0;
    const now = new Date();
    const updatedCount = await SchedulingRepository.updateOndemandStatusBatch(
      instanceIds,
      {
        executionState,
        ondemandStatus: newStatus,
        updatedAt: now,
      },
      OnDemandStatus.PENDING_CREDIT,
      tx
    );
    if (updatedCount > 0 && ON_DEMAND_TERMINAL_EXECUTION_STATES.has(executionState)) {
      await triggerPayrollForOndemandResolution(tx, instanceIds, executionState, options?.actorUserId ?? null);
    }
    return updatedCount;
  }

  /**
   * Runs the automatic payroll calculation for an instance that just reached
   * a terminal execution state, inside the same transaction as the state
   * change so the payroll snapshot and the transition commit or roll back
   * together. Callers invoke it only after a terminal transition; the
   * calculator itself additionally rejects rows whose execution state is not
   * terminal.
   *
   * The calculation is best-effort by design: when the calculator rejects
   * (a permission guard, a settled row, a non-terminal re-read) the error is
   * logged and swallowed so the session state change itself is never rolled
   * back — the snapshot stays NOT_CALCULATED and an operator reconciles it
   * later.
   */
  async function triggerTerminalPayrollCalculation(
    instance: ClassInstanceSelectType,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx: DBTransaction
  ): Promise<void> {
    try {
      await PayrollCalculationService.calculateForInstance(
        {
          instanceId: instance.id,
          actorUserId,
          isOnDemand: ON_DEMAND_TERMINAL_EXECUTION_STATES.has(parseClassExecutionState(instance.executionState)),
        },
        tErrors,
        tx
      );
    } catch (error) {
      logger.error("Automatic payroll calculation failed; session state change preserved", {
        classInstanceId: instance.id,
        actorUserId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Runs the payroll calculation for every instance the no-credits batch
   * update actually moved into the given terminal on-demand state. Rows a
   * concurrent transaction already claimed (still in their previous state)
   * are skipped so an unresolved pending-credit session is never calculated
   * early. System flows without an authenticated actor defer the calculation
   * to an operator reconciliation — there is no user to attribute the payroll
   * write to.
   */
  async function triggerPayrollForOndemandResolution(
    tx: DBTransaction,
    instanceIds: readonly string[],
    executionState: string,
    actorUserId: string | null
  ): Promise<void> {
    if (!actorUserId) {
      logger.warn("On-demand terminal resolution without an actor; payroll calculation deferred", {
        executionState,
        instanceIds,
      });
      return;
    }
    const tErrors = getServerTranslations("en").errorsTranslations;
    await Promise.all(
      instanceIds.map(async instanceId => {
        const instance = await SchedulingRepository.getById(instanceId, tx);
        if (instance?.executionState !== executionState) return;
        await triggerTerminalPayrollCalculation(instance, actorUserId, tErrors, tx);
      })
    );
  }

  async function activateClassInstanceTx(
    instance: Awaited<ReturnType<typeof getOrThrow>>,
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels,
    force: boolean,
    locale: string,
    tx: DBTransaction
  ) {
    await handleOndemandSessionStartCreditDeduction(instance, userId, tErrors, tx, locale);
    return SchedulingRepository.activateClassInstance(classInstanceId, userId, { force }, tx, tErrors, {
      onAuth: checkStateChangeAuth,
      onValidate: validateStateTransition,
    });
  }

  export async function activate(userId: string, classInstanceId: string, tErrors: ErrorsLabels, locale = "en") {
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_CLASS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    await SystemRulesService.assertActivationTimeWindow(instance);
    const result = await db.transaction(async tx =>
      activateClassInstanceTx(instance, userId, classInstanceId, tErrors, false, locale, tx)
    );
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_ACTIVATED);
    return result;
  }

  export async function activateOverride(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels,
    locale = "en"
  ) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    await assertPermission(userId, AppPermission.SESSION_ACTIVATE_OVERRIDE, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);
    const result = await db.transaction(async tx =>
      activateClassInstanceTx(instance, userId, classInstanceId, tErrors, true, locale, tx)
    );
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_ACTIVATED, {
      override: "true",
    });
    return result;
  }

  export async function stop(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    const result = await db.transaction(async tx => {
      const updated = await SchedulingRepository.stopClassInstance(classInstanceId, userId, tx, tErrors, {
        onAuth: checkStateChangeAuth,
        onValidate: validateStateTransition,
      });
      if (updated) {
        await triggerTerminalPayrollCalculation(updated, userId, tErrors, tx);
      }
      return updated;
    });
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_COMPLETED);
    return result;
  }

  export async function deleteInstance(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<{ success: boolean; warnings: string[] }> {
    await assertPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);

    // Resolve affected users BEFORE the soft-delete commits — the helper
    // filters on `classInstances.deletedAt IS NULL`, so a post-delete
    // resolve would yield `null`.
    const affected = await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId);

    const warnings: string[] = [];

    const result = await db.transaction(async tx => {
      const deleted = await SchedulingRepository.softDeleteClassInstance(classInstanceId, userId, tx);
      if (!deleted) return false;

      const wasDeducted = instance.quotaDeducted && instance.deletedAt === null;
      if (wasDeducted) {
        const { quotaReleased, warning } = await releaseQuotaIfDeducted(instance, userId, tx);
        if (warning) warnings.push(warning);
        if (!quotaReleased) {
          await refundCreditIfDeducted(instance, userId, tErrors, tx);
        }
      }
      return true;
    });

    if (result) {
      // Pass the pre-resolved triplet so the helper skips its own fetch (which
      // would fail post-soft-delete on the `deletedAt IS NULL` filter).
      await notifyClassLifecycle(classInstanceId, NotificationEventType.CLASS_CANCELLED, affected);

      // Best-effort remote meeting cleanup — never fails the delete.
      try {
        await MeetingConfigSnapshotService.cancelMeetingForClassInstance(classInstanceId);
      } catch (error) {
        logger.error("Best-effort meeting cancel failed for class instance", {
          classInstanceId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return { success: result, warnings };
  }

  async function runActivatedClassActionWithNotify<T>(
    userId: string,
    classInstanceId: string,
    permission: AppPermission,
    action: (instance: Awaited<ReturnType<typeof getOrThrow>>) => Promise<T | null>,
    tErrors: ErrorsLabels,
    eventType: NotificationEventType
  ): Promise<T> {
    const result = await runActivatedClassAction(userId, classInstanceId, permission, action, tErrors);
    await notifyAffectedForInstance(result, classInstanceId, eventType);
    return result;
  }

  export const updateStatusStart: ClassActionFn<ClassInstanceSelectType> = async (userId, classInstanceId, tErrors) =>
    runActivatedClassActionWithNotify(
      userId,
      classInstanceId,
      AppPermission.SESSION_UPDATE_STATUS_START,
      () =>
        SchedulingRepository.startClassInstance(classInstanceId, userId, undefined, tErrors, {
          onAuth: checkStateChangeAuth,
          onValidate: validateStateTransition,
        }),
      tErrors,
      NotificationEventType.CLASS_STARTED
    );

  export const updateStatusAbsent: ClassActionFn<ClassInstanceSelectType> = async (userId, classInstanceId, tErrors) =>
    runActivatedClassActionWithNotify(
      userId,
      classInstanceId,
      AppPermission.SESSION_UPDATE_STATUS_ABSENT,
      async instance => {
        await SystemRulesService.assertAbsentWaitingPeriod(instance);
        return db.transaction(async tx => {
          const updated = await SchedulingRepository.markClassAbsent(classInstanceId, userId, tx, tErrors, {
            onAuth: checkStateChangeAuth,
            onValidate: validateStateTransition,
          });
          if (updated) {
            await triggerTerminalPayrollCalculation(updated, userId, tErrors, tx);
          }
          return updated;
        });
      },
      tErrors,
      NotificationEventType.CLASS_MARKED_ABSENT
    );

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
      const meeting = await EffectiveMeetingService.resolveForNewBooking(instance.teacherId, { tErrors, tx });
      const processed = await SchedulingRepository.processClassLeave(
        classInstanceId,
        reason ?? null,
        userId,
        tx,
        tErrors,
        { onAuth: checkStateChangeAuth, onValidate: validateStateTransition },
        meeting.joinUrl
      );
      if (instance.quotaDeducted) {
        const { quotaReleased } = await releaseQuotaIfDeducted(instance, userId, tx);
        if (!quotaReleased) {
          await refundCreditIfDeducted(instance, userId, tErrors, tx);
        }
      }
      const completedOriginal = await SchedulingRepository.getById(processed.originalId, tx);
      if (completedOriginal) {
        await triggerTerminalPayrollCalculation(completedOriginal, userId, tErrors, tx);
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
    tErrors: ErrorsLabels,
    locale: string
  ) {
    await assertPermission(userId, AppPermission.SESSION_RESCHEDULE, tErrors);
    const existing = await getOrThrow(classInstanceId, tErrors);

    const quotaNote = await computeLeaveQuotaNote(existing.teacherId, tSession);
    const finalRemarks = buildRescheduleRemarks(existing.remarks, quotaNote);

    const created = await db.transaction(async tx => {
      const insertPayload = buildRescheduleInsert(classInstanceId, existing, input, finalRemarks);
      const newInstance = await SchedulingRepository.rescheduleClassInstance(
        classInstanceId,
        insertPayload,
        tx,
        tErrors,
        {
          validateRescheduleState,
        }
      );

      // Re-deduct the quota/credit against the successor that was refunded from
      // the original instance. Without this step the reschedule leaks a free
      // class: the original is refunded, but the successor is inserted with
      // `quotaDeducted: false` and never charged again.
      if (existing.quotaDeducted && existing.deletedAt === null) {
        const { quotaId, isQuotaBacked } = await releaseQuotaIfDeducted(existing, userId, tx, locale);
        // Only refund credit when the instance is NOT quota-backed (credit-backed
        // fallback). When quota release genuinely failed on a quota-backed
        // instance, do NOT also refund credit — a phantom credit refund masks a
        // quota leak (RBL2-5).
        const creditRefunded =
          !isQuotaBacked &&
          (await refundCreditIfDeducted(existing, userId, getServerTranslations(locale).errorsTranslations, tx));

        // Mirror the deduction against the newly created successor instance.
        if (quotaId) {
          await QuotaService.redeemForInstance(newInstance.studentId, newInstance.id, quotaId, userId, tx, locale);
          await SchedulingRepository.updateClassInstance(newInstance.id, { quotaDeducted: true }, tx);
        } else if (creditRefunded) {
          const deductIdempotencyKey = `credit-deduction:${newInstance.id}`;
          await CreditService.deductForBooking(
            newInstance.studentId,
            newInstance.id,
            userId,
            deductIdempotencyKey,
            tx,
            tErrors
          );
          await SchedulingRepository.updateClassInstance(newInstance.id, { quotaDeducted: true }, tx);
        }
      }

      return newInstance;
    });

    // Best-effort meeting URL generation for the new (successor) instance.
    try {
      await MeetingConfigSnapshotService.generateAndAttachForClassInstance(created.id);
    } catch (error) {
      logger.error("Booking-time meeting URL generation failed for rescheduled class instance", {
        classInstanceId: created.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
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
    } catch (error) {
      logger.error("Failed to dispatch reschedule notification", {
        userId,
        classInstanceId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return created;
  }

  export async function reset(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertPermission(userId, AppPermission.SESSION_RESET, tErrors);
    const instance = await getOrThrow(classInstanceId, tErrors);

    const resetInstance = await db.transaction(async tx => {
      const resetResult = await SchedulingRepository.resetClassInstance(classInstanceId, userId, tx, tErrors, {
        onAuth: checkStateChangeAuth,
        onValidate: validateStateTransition,
      });
      if (!resetResult) {
        throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
      }
      if (instance.quotaDeducted) {
        const { quotaReleased } = await releaseQuotaIfDeducted(instance, userId, tx);
        if (!quotaReleased) {
          await refundCreditIfDeducted(instance, userId, tErrors, tx);
        }
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
  ): Promise<Map<string, ClassInstanceSelectType>> {
    return SchedulingRepository.listByIdempotencyKeys(keys, tx);
  }

  export async function upsertManyClassInstances(
    instances: ClassInstanceInsertType[],
    options?: { chunkSize?: number; updatedAt?: Date; tx?: DBTransaction }
  ): Promise<ClassInstanceSelectType[]> {
    return SchedulingRepository.upsertMany(instances, options);
  }

  export async function upsertManyClassInstancesForSeed(
    instances: ClassInstanceInsertType[],
    options?: { chunkSize?: number; updatedAt?: Date; tx?: DBTransaction }
  ): Promise<ClassInstanceSelectType[]> {
    return SchedulingRepository.upsertManyForSeed(instances, options);
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

  /**
   * Admin manual override of a single class instance's hourly rate. Sets
   * `is_rate_overridden = true` and stores the override amount + currency +
   * `rate_source = OVERRIDE`. The override takes top precedence in the
   * rate-resolver cascade. Send `rateAmount = null` to clear the override
   * (revert to the recurring/subject/teacher cascade).
   */
  export async function overrideRate(
    userId: string,
    classInstanceId: string,
    rateAmount: string | null,
    rateCurrency: CurrencyCode | null,
    tErrors: ErrorsLabels
  ): Promise<void> {
    await assertPermission(userId, AppPermission.SESSION_RESET, tErrors);
    await getOrThrow(classInstanceId, tErrors);

    await db.transaction(async tx => {
      const result = await SchedulingRepository.overrideClassInstanceRate(
        classInstanceId,
        rateAmount,
        rateCurrency,
        tx
      );
      if (!result) {
        throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
      }
    });
  }

  export async function resolveStudentTimezone(studentId: string): Promise<string | null> {
    return SchedulingRepository.resolveStudentTimezone(studentId);
  }
}

export type ClassActionFn<R> = (
  userId: string,
  classInstanceId: string,
  tErrors: ErrorsLabels,
  locale?: string
) => Promise<R>;
