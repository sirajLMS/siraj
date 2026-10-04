import { db } from "@/backend/db/drizzleDb";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { ClassStatusEventsRepository } from "@/backend/db/repo/scheduling/class-status-events.repository";
import { AppPermission, NotificationEventType, OnDemandStatus } from "@/backend/enum";
import { buildClassInstanceDetail } from "@/backend/graphql/utils/class-session.utils";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import { ClassPerformanceService } from "@/backend/services/performance/class-performance.service";
import {
  checkStateChangeAuth,
  validateRescheduleState,
  validateStateTransition,
} from "@/backend/services/scheduling/state-change-validation.service";
import {
  assertClassInstanceDetailViewAuth,
  assertClassSessionPermission,
  assertSessionActivated,
  getClassInstanceOrThrow,
  notifyAffectedForInstance,
  notifyClassLifecycle,
  runActivatedClassActionWithNotify,
  withoutPayrollSnapshot,
} from "@/backend/services/session/class-session.helpers";
import {
  activateClassInstanceTx,
  attachMeetingForRescheduledInstance,
  deleteInstanceTx,
  dispatchRescheduleLifecycle,
  markAbsentTx,
  overrideRateTx,
  processLeaveTx,
  resetClassInstanceTx,
  stopClassInstanceTx,
} from "@/backend/services/session/class-session-actions.helpers";
import {
  applyRescheduleSettlement,
  buildRescheduleInsert,
  buildRescheduleRemarks,
  computeLeaveQuotaNote,
} from "@/backend/services/session/class-session-billing.helpers";
import {
  isTerminalOnDemandExecutionState,
  triggerPayrollForOndemandResolution,
} from "@/backend/services/session/class-session-payroll.helpers";
import { SystemRulesService } from "@/backend/services/system/system-rules.service";
import type {
  ClassInstanceDetailReturnType,
  ClassInstanceInsertType,
  ClassInstanceSelectType,
  ClassStatusEventReturnType,
  ClassStatusEventSelectType,
  DBTransaction,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels, SessionLabels } from "@/shared/locale";

/**
 * ClassSessionService
 *
 * This service implements domain-specific business logic for class session management.
 * It is protected by a multi-layered security setup to prevent IDOR and unauthorized state transitions:
 */
export namespace ClassSessionService {
  export async function getClassInstanceDetail(
    userId: string,
    classInstanceId: string,
    tSession: SessionLabels,
    tErrors: ErrorsLabels
  ): Promise<ClassInstanceDetailReturnType> {
    const instance = await getClassInstanceOrThrow(classInstanceId, tErrors);
    await assertClassInstanceDetailViewAuth(userId, instance, tErrors);
    const perf = await ClassPerformanceService.getPerformanceForClass(classInstanceId);
    const detail = await buildClassInstanceDetail(instance, perf, tSession, tErrors);
    const canSeePayroll = await PermissionsService.hasPermission(userId, AppPermission.ACCOUNTING_PAYROLL_VIEW);
    return canSeePayroll ? detail : withoutPayrollSnapshot(detail);
  }

  export async function getClassStatusEvents(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassStatusEventReturnType[]> {
    const instance = await getClassInstanceOrThrow(classInstanceId, tErrors);
    await assertClassInstanceDetailViewAuth(userId, instance, tErrors);
    const events = await SchedulingRepository.getClassStatusEvents(classInstanceId);
    // PAYROLL_* audit payloads carry amounts in their fromState/toState JSON, so
    // they are payroll-view data: filtered for actors without
    // ACCOUNTING_PAYROLL_VIEW, mirroring the getClassInstanceDetail strip.
    const canSeePayroll = await PermissionsService.hasPermission(userId, AppPermission.ACCOUNTING_PAYROLL_VIEW);
    return canSeePayroll ? events : events.filter(event => !event.eventType.startsWith("PAYROLL_"));
  }

  /**
   * Batch-update on-demand class instances from PENDING_CREDIT to a new status.
   * The atomic `ondemand_status = PENDING_CREDIT` WHERE guard provides
   * idempotency: concurrent runs cannot double-process because only rows still
   * in PENDING_CREDIT are affected. When the target execution state is terminal
   * the payroll calculation runs for every flipped instance in the same
   * transaction. Does NOT dispatch notifications — callers handle that.
   *
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
    if (updatedCount > 0 && isTerminalOnDemandExecutionState(executionState)) {
      await triggerPayrollForOndemandResolution(tx, instanceIds, executionState, options?.actorUserId ?? null);
    }
    return updatedCount;
  }

  export async function activate(userId: string, classInstanceId: string, tErrors: ErrorsLabels, locale = "en") {
    await assertClassSessionPermission(userId, AppPermission.SESSION_ACTIVATE_CLASS, tErrors);
    const instance = await getClassInstanceOrThrow(classInstanceId, tErrors);
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
    await assertClassSessionPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    await assertClassSessionPermission(userId, AppPermission.SESSION_ACTIVATE_OVERRIDE, tErrors);
    const instance = await getClassInstanceOrThrow(classInstanceId, tErrors);
    const result = await db.transaction(async tx =>
      activateClassInstanceTx(instance, userId, classInstanceId, tErrors, true, locale, tx)
    );
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_ACTIVATED, {
      override: "true",
    });
    return result;
  }

  export async function stop(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertClassSessionPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    const result = await db.transaction(async tx => stopClassInstanceTx(classInstanceId, userId, tErrors, tx));
    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_COMPLETED);
    return result;
  }

  export async function deleteInstance(
    userId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<{ success: boolean; warnings: string[] }> {
    await assertClassSessionPermission(userId, AppPermission.SESSION_OVERRIDE_ACTIONS, tErrors);
    const instance = await getClassInstanceOrThrow(classInstanceId, tErrors);

    // Resolve affected users BEFORE the soft-delete commits — the helper
    // filters on `classInstances.deletedAt IS NULL`, so a post-delete resolve
    // would yield `null`.
    const affected = await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId);

    const warnings: string[] = [];
    const result = await db.transaction(async tx =>
      deleteInstanceTx(instance, classInstanceId, userId, tErrors, warnings, tx)
    );

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
        return db.transaction(async tx => markAbsentTx(classInstanceId, userId, tErrors, tx));
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
    await assertClassSessionPermission(userId, AppPermission.SESSION_UPDATE_STATUS_LEAVE, tErrors);
    const instance = await getClassInstanceOrThrow(classInstanceId, tErrors);
    await assertSessionActivated(instance, tErrors);
    await SystemRulesService.assertLeaveQuotaAvailable(instance.teacherId);

    const result = await db.transaction(async tx =>
      processLeaveTx(instance, classInstanceId, reason ?? null, userId, tErrors, tx)
    );

    await notifyAffectedForInstance(result, classInstanceId, NotificationEventType.CLASS_LEAVE_REQUESTED);
    return result;
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
    await assertClassSessionPermission(userId, AppPermission.SESSION_RESCHEDULE, tErrors);
    const existing = await getClassInstanceOrThrow(classInstanceId, tErrors);

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
      await applyRescheduleSettlement(existing, newInstance, userId, tErrors, tx, locale);
      return newInstance;
    });

    await attachMeetingForRescheduledInstance(created.id);
    await dispatchRescheduleLifecycle(created.id, classInstanceId, input.scheduledStartAt, userId);

    return created;
  }

  export async function reset(userId: string, classInstanceId: string, tErrors: ErrorsLabels) {
    await assertClassSessionPermission(userId, AppPermission.SESSION_RESET, tErrors);
    const instance = await getClassInstanceOrThrow(classInstanceId, tErrors);

    const resetInstance = await db.transaction(async tx =>
      resetClassInstanceTx(instance, classInstanceId, userId, tErrors, tx)
    );

    // Reset keeps the row live (deletedAt stays null); resolve post-commit.
    await notifyClassLifecycle(
      classInstanceId,
      NotificationEventType.CLASS_RESET,
      await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId)
    );
    return resetInstance;
  }

  export async function upsertManyClassInstancesForSeed(
    instances: ClassInstanceInsertType[],
    options?: { chunkSize?: number; updatedAt?: Date; tx?: DBTransaction }
  ): Promise<ClassInstanceSelectType[]> {
    return SchedulingRepository.upsertManyForSeed(instances, options);
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
    await assertClassSessionPermission(userId, AppPermission.SESSION_RESET, tErrors);
    await getClassInstanceOrThrow(classInstanceId, tErrors);
    await db.transaction(async tx => overrideRateTx(classInstanceId, rateAmount, rateCurrency, tErrors, tx));
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
