import { db } from "@/backend/db/drizzleDb";
import { SchedulingRepository } from "@/backend/db/repo";
import { type ClassInstanceAffectedUsers, classLifecycleAffectedUserIds } from "@/backend/db/repo/scheduling";
import { AppPermission, NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import type { ErrorsLabels } from "@/shared/locale";

export namespace ScheduleDeletionService {
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

    let quotaReleaseFailed = false;
    const result = await db.transaction(async tx => {
      const deleted = await SchedulingRepository.deleteRecurringClass(classInstanceId, tx);
      if (!deleted?.deleted || !deleted.quotaDeducted) {
        return deleted !== null;
      }

      // Release quota if this class was deducted from a quota
      if (deleted.quotaId) {
        const releaseResult = await QuotaService.tryReleaseForInstance(
          deleted.studentId,
          deleted.id,
          deleted.quotaId,
          actorUserId,
          tx,
          "en"
        );
        if (!releaseResult.ok) {
          quotaReleaseFailed = true;
        }
      } else {
        // Credit-backed instance — refund credits
        const idempotencyKey = `credit-refund:${deleted.id}`;
        await CreditService.refundOnCancel(deleted.studentId, deleted.id, actorUserId, idempotencyKey, tx, tErrors);
      }
      return true;
    });

    if (result) {
      await notifyClassCancelled(classInstanceId, affected);
    }
    // Return false when quota release failed so the caller knows the deletion
    // succeeded but the quota balance is still over-decremented and needs a
    // manual retry. The class soft-delete itself committed successfully.
    return result && !quotaReleaseFailed;
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
      throw new Error(tErrors.insufficientPermissions);
    }

    // Snapshot affected users for every about-to-be-deleted instance BEFORE
    // the soft-delete commits. `clearWeeklySchedule` returns the refunded
    // subset only; we need EVERY cleared instance (refunded or not) for
    // dispatch. Resolve them ahead of time via a fresh read of the teacher's
    // future live instances.
    const preAffected = await SchedulingRepository.getClassInstanceAffectedUsersForTeacher(teacherId);

    let quotaReleaseFailed = false;
    const result = await db.transaction(async tx => {
      const cleared = await SchedulingRepository.clearWeeklySchedule(teacherId, tx);
      if (!cleared) return false;

      for (const instance of cleared.refundedInstances) {
        const idempotencyKey = `credit-refund:${instance.id}`;
        await CreditService.refundOnCancel(instance.studentId, instance.id, actorUserId, idempotencyKey, tx, tErrors);
      }

      // Release quota reservations for cleared schedules
      for (const schedule of cleared.quotaSchedules) {
        try {
          await QuotaService.releaseForRecurringSchedule(
            schedule.studentId,
            schedule.id,
            schedule.quotaId,
            schedule.earmarkedClasses,
            actorUserId,
            tx
          );
        } catch (error) {
          quotaReleaseFailed = true;
          logger.warn("Quota release failed on weekly schedule clear — manual retry required", {
            recurringScheduleId: schedule.id,
            quotaId: schedule.quotaId,
            studentId: schedule.studentId,
            actorUserId,
            error: error instanceof Error ? error.message : String(error),
            action: "manual_retry_needed",
          });
        }
      }

      return true;
    });

    if (result) {
      for (const entry of preAffected) {
        try {
          await notifyClassCancelled(entry.classInstanceId, entry.affected);
        } catch (error) {
          logger.error("Class cancelled (weekly clear) notification dispatch failed", {
            classInstanceId: entry.classInstanceId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Return false when at least one quota release failed so the caller knows
    // the clear succeeded but some quota balances are still over-decremented
    // and need a manual retry.
    return result && !quotaReleaseFailed;
  }
}
