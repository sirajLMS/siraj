import { StudentRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { assertStudentFieldEdit, buildStudentFieldFilterContext } from "@/backend/services/student/student-field-acl";

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
    newClassesRemaining: number,
    expectedVersion?: number,
    locale?: string
  ): Promise<EditQuotaResult> {
    const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);
    try {
      assertStudentFieldEdit(fieldCtx, "student_quota_edit");
    } catch {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    if (!Number.isInteger(newClassesRemaining) || newClassesRemaining < 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("quotaMustBeNonNegative"));
    }

    // Fetch current student to validate newValue <= classesTotal
    const current = await StudentRepository.findById(studentId);
    if (!current) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    if (newClassesRemaining > current.classesTotal) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("quotaExceedsTotal", {
          requested: newClassesRemaining,
          total: current.classesTotal,
        })
      );
    }

    const updated = await StudentRepository.setClassesRemaining(
      studentId,
      newClassesRemaining,
      expectedVersion,
      undefined,
      locale
    );

    return {
      id: updated.id,
      classesRemaining: updated.classesRemaining,
      classesTotal: updated.classesTotal,
      version: updated.version,
    };
  }
}
