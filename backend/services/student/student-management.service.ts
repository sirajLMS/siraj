import { ParentRepository, StudentRepository } from "@/backend/db/repo";
import { NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import { buildStudentLifecyclePayloads } from "@/backend/services/notification/notification-payloads.builders";
import { assertStudentFieldEdit, buildStudentFieldFilterContext } from "@/backend/services/student/student-field-acl";
import type { EditQuotaResult } from "@/backend/types/students/student.types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentManagementService {
  /**
   * Directly overrides a student's classesRemaining quota.
   * Requires: student.edit_quota permission.
   *
   * Business Rules:
   * - newClassesRemaining must be >= 0 (also enforced by DB CHECK constraint)
   * - newClassesRemaining must be <= student.classesTotal (enforced here in service)
   * - Uses optimistic locking via version field
   */
  export async function editQuota(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels,
    newClassesRemaining: number,
    expectedVersion?: number,
    locale?: string
  ): Promise<EditQuotaResult> {
    const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);
    try {
      assertStudentFieldEdit(fieldCtx, "student_quota_edit");
    } catch {
      throw new Error(tErrors.insufficientPermissions);
    }

    if (!Number.isInteger(newClassesRemaining) || newClassesRemaining < 0) {
      throw new Error(tErrors.invalidInput);
    }

    // Fetch current student to validate newValue <= classesTotal
    const current = await StudentRepository.findById(studentId);
    if (!current) {
      throw new Error(tErrors.studentNotFound(studentId));
    }

    if (newClassesRemaining > current.classesTotal) {
      throw new Error(tErrors.quotaExceedsTotal({ requested: newClassesRemaining, total: current.classesTotal }));
    }

    const updated = await StudentRepository.setClassesRemaining(
      studentId,
      newClassesRemaining,
      tErrors,
      expectedVersion
    );

    await dispatchStudentQuotaOverriddenNotifications(studentId, updated.name, newClassesRemaining, locale).catch(
      error => {
        logger.error("Student quota override notification dispatch failed", {
          actorUserId,
          studentId,
          newClassesRemaining,
          error,
        });
      }
    );

    return {
      id: updated.id,
      classesRemaining: updated.classesRemaining,
      classesTotal: updated.classesTotal,
      version: updated.version,
    };
  }
}

async function dispatchStudentQuotaOverriddenNotifications(
  studentId: string,
  studentName: string,
  newClassesRemaining: number,
  locale?: string
): Promise<void> {
  const student = await StudentRepository.findById(studentId);
  if (!student) return;

  const parentUserId = student.parentId ? await ParentRepository.findUserIdByParentId(student.parentId) : null;
  if (!parentUserId) return;

  const targetUserIds = [parentUserId];
  const payloads = buildStudentLifecyclePayloads(
    studentId,
    NotificationEventType.STUDENT_QUOTA_OVERRIDDEN,
    targetUserIds,
    locale,
    {
      studentName,
      newClassesRemaining: String(newClassesRemaining),
    }
  );

  await dispatchWithPreferences(payloads, targetUserIds, locale);
}
