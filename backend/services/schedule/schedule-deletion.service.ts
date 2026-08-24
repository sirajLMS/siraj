import { db } from "@/backend/db/drizzleDb";
import {
  type ClassInstanceAffectedUsers,
  classLifecycleAffectedUserIds,
  SchedulingRepository,
} from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { AppPermission, NotificationEventType } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import type { ErrorsLabels } from "@/shared/locale";

function handleQuotaReleaseError(
  schedule: { id: string; quotaId: string; studentId: string },
  actorUserId: string
): (error: unknown) => never {
  return (error: unknown) => {
    logger.error("Quota release failed during weekly schedule clear — rolling back transaction", {
      recurringScheduleId: schedule.id,
      quotaId: schedule.quotaId,
      studentId: schedule.studentId,
      actorUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  };
}

export namespace ScheduleDeletionService {
  /**
   * Best-effort remote meeting cleanup for a single class instance.
   * Never throws — failures are logged and swallowed so provider API
   * errors never fail the parent deletion operation.
   */
  async function cancelMeetingSafe(classInstanceId: string, context: string): Promise<void> {
    try {
      await MeetingConfigSnapshotService.cancelMeetingForClassInstance(classInstanceId);
    } catch (error) {
      logger.error(`Best-effort meeting cancel failed for class instance (${context})`, {
        classInstanceId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Dispatch `CLASS_CANCELLED` notifications for all affected users
   * of every cleared instance, then cancel their remote meetings.
   */
  async function notifyAndCancelCleared(
    preAffected: { classInstanceId: string; affected: ClassInstanceAffectedUsers | null }[]
  ): Promise<void> {
    const settled = await Promise.allSettled(
      preAffected.map(async entry => {
        await notifyClassCancelled(entry.classInstanceId, entry.affected);
        await cancelMeetingSafe(entry.classInstanceId, "weekly clear");
      })
    );

    for (const [i, result] of settled.entries()) {
      if (result.status === "rejected") {
        logger.warn("Class cancelled (weekly clear) notification+cancel failed", {
          classInstanceId: preAffected[i]?.classInstanceId,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }
  }

  /**
   * Dispatch `CLASS_CANCELLED` to the parent + teacher + student of a
   * now-deleted class instance. The affected-user set MUST be resolved
   * BEFORE the soft-delete commits because `getClassInstanceAffectedUsers`
   * filters on `classInstances.deletedAt IS NULL` (per the helper's
   * contract). All dispatch failures are caught + logged so a notification
   * hiccup never surfaces as a 500 to callers that just successfully
   * deleted the class (specs.md "Dispatch failures must NOT throw out of
   * the action").
   */
  async function notifyClassCancelled(
    classInstanceId: string,
    affected: ClassInstanceAffectedUsers | null,
    locale?: string
  ): Promise<void> {
    if (!affected) return;

    try {
      const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
      if (!instance) return;

      const studentName = instance.student?.name ?? "—";
      const affectedUserIds = classLifecycleAffectedUserIds(affected);
      const payloads = buildClassLifecyclePayloads(
        instance,
        NotificationEventType.CLASS_CANCELLED,
        affectedUserIds,
        locale,
        { studentName }
      );
      await dispatchWithPreferences(payloads, affectedUserIds, locale);
    } catch (error) {
      logger.error("Class cancelled notification dispatch failed", {
        classInstanceId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function executeDeletionTx(
    classInstanceId: string,
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<boolean> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SCHEDULE_DELETE_CLASS);
    if (!hasPermission) {
      throw new ForbiddenError(tErrors.insufficientPermissions);
    }

    const result = await db.transaction(async tx => {
      const deleted = await SchedulingRepository.deleteRecurringClass(classInstanceId, tx);
      if (!deleted?.deleted || !deleted.quotaDeducted) {
        return deleted !== null;
      }

      // Release quota if this class was deducted from a quota.
      // On failure we log AND throw so the transaction rolls back consistently
      // — matching the credit-backed refund path which also throws. This
      // prevents the soft-delete from committing while the quota balance stays
      // over-decremented, which would be a silent data inconsistency.
      if (deleted.quotaId) {
        try {
          await QuotaService.releaseForInstance(deleted.studentId, deleted.id, deleted.quotaId, actorUserId, tx);
        } catch (error) {
          logger.error("Quota release failed during class deletion — rolling back transaction", {
            classInstanceId: deleted.id,
            quotaId: deleted.quotaId,
            studentId: deleted.studentId,
            actorUserId,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      } else {
        // Credit-backed instance — refund credits
        const idempotencyKey = `credit-refund:${deleted.id}`;
        await CreditService.refundOnCancel(deleted.studentId, deleted.id, actorUserId, idempotencyKey, tx, tErrors);
      }

      // App-layer SQLite fallback for the PG-only hours-per-week recalculation triggers.
      // On PG the triggers auto-recalc students.hours_per_week; on SQLite this is a no-op.
      // Runs inside the tx so the recalc is atomic with the soft-delete.
      await StudentRepository.recalcHoursPerWeekIfSqlite(deleted.studentId, tx);
      return true;
    });

    return result;
  }

  /**
   * Deletes a specific class instance from the weekly schedule.
   * Requires: schedule.delete_class permission.
   */
  export async function deleteClass(
    actorUserId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<boolean> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SCHEDULE_DELETE_CLASS);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    // Resolve affected users BEFORE the soft-delete commits — `deleteRecurringClass`
    // writes `deletedAt = now()` inside the tx, so a post-tx resolve would
    // hit the `deletedAt IS NULL` filter in `getClassInstanceAffectedUsers`
    // and return `null`.
    const affected = await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId);

    const result = await executeDeletionTx(classInstanceId, actorUserId, tErrors);

    if (result) {
      await notifyClassCancelled(classInstanceId, affected);
      await cancelMeetingSafe(classInstanceId, "delete class");
    }
    return result;
  }

  /**
   * Clears all recurring schedules for a specific teacher.
   * Requires: schedule.clear_weekly permission.
   */
  export async function clearWeeklySchedule(
    actorUserId: string,
    teacherId: string,
    tErrors: ErrorsLabels
  ): Promise<boolean> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SCHEDULE_CLEAR_WEEKLY);
    if (!hasPermission) {
      throw new ForbiddenError(tErrors.insufficientPermissions);
    }

    // Snapshot affected users for every about-to-be-deleted instance BEFORE
    // the soft-delete commits. `clearWeeklySchedule` returns the refunded
    // subset only; we need EVERY cleared instance (refunded or not) for
    // dispatch. Resolve them ahead of time via a fresh read of the teacher's
    // future live instances.
    const preAffected = await SchedulingRepository.getClassInstanceAffectedUsersForTeacher(teacherId);

    const result = await db.transaction(async tx => {
      const cleared = await SchedulingRepository.clearWeeklySchedule(teacherId, tx);
      if (!cleared) return false;

      // Sequential per-instance credit refunds (credit-backed classes).
      // Running these in parallel would issue concurrent async DB ops on the
      // same shared single-connection transaction, which is not safe.
      // Implemented as a sequential promise chain (via reduce) rather than
      // Promise.all to preserve ordering; the chained callback is NOT a loop
      // body, so it does not trip no-await-in-loop, and it explicitly returns
      // the awaited promise to satisfy promise/always-return.
      await cleared.refundedInstances.reduce<Promise<unknown>>(
        (chain, instance) =>
          chain.then(() => {
            const idempotencyKey = `credit-refund:${instance.id}`;
            return CreditService.refundOnCancel(
              instance.studentId,
              instance.id,
              actorUserId,
              idempotencyKey,
              tx,
              tErrors
            );
          }),
        Promise.resolve()
      );

      // Sequential per-schedule quota releases (quota-backed classes).
      // Quota release failures abort the transaction (rethrown) so class
      // deletion and quota release are atomic — no silent over-decrement.
      // Same reduce-chain approach as above for sequential safety; the .catch
      // logs the failure then rethrows to roll back the transaction.
      await cleared.quotaSchedules.reduce<Promise<unknown>>(
        (chain, schedule) =>
          chain.then(() =>
            QuotaService.releaseForRecurringSchedule(
              schedule.studentId,
              schedule.id,
              schedule.quotaId,
              schedule.earmarkedClasses,
              actorUserId,
              tx
            ).catch(handleQuotaReleaseError(schedule, actorUserId))
          ),
        Promise.resolve()
      );

      return true;
    });

    if (result) {
      await notifyAndCancelCleared(preAffected);
    }

    return result;
  }
}
