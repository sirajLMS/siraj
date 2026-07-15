import { StudentRepository } from "@/backend/db/repo";
import { assertStudentFieldEdit, buildStudentFieldFilterContext } from "@/backend/services/student/student-field-acl";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export interface EditQuotaResult {
  readonly id: string;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly version: number;
}

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
    expectedVersion?: number
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

    return {
      id: updated.id,
      classesRemaining: updated.classesRemaining,
      classesTotal: updated.classesTotal,
      version: updated.version,
    };
  }
}
