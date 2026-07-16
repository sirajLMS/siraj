import { StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { AppPermission, StudentStatus } from "@/backend/enum";
import { parseStudentStatus } from "@/backend/lib/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { assertStudentFieldEdit, buildStudentFieldFilterContext } from "@/backend/services/student/student-field-acl";
import type { ChangeStudentStatusResult, ReassignStudentTeacherResult } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentLifecycleService {
  export async function reassignTeacher(
    actorUserId: string,
    studentId: string,
    newTeacherId: string,
    tErrors: ErrorsLabels,
    expectedVersion?: number
  ): Promise<ReassignStudentTeacherResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_REASSIGN_TEACHER);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    const teacher = await TeacherRepository.findById(newTeacherId);
    if (!teacher) {
      throw new Error(tErrors.teacherNotFound(newTeacherId));
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new Error(tErrors.studentNotFound(studentId));
    }

    try {
      const updated = await StudentRepository.reassignTeacher(studentId, newTeacherId, tErrors, expectedVersion);

      logger.info("Student teacher reassigned", {
        actorUserId,
        studentId,
        previousTeacherId: student.primaryTeacherId,
        newTeacherId,
      });

      return {
        id: updated.id,
        primaryTeacherId: updated.primaryTeacherId ?? null,
        version: updated.version,
      };
    } catch (error) {
      logger.error("Failed to reassign student teacher", {
        actorUserId,
        studentId,
        newTeacherId,
        error,
      });
      throw error;
    }
  }

  export async function changeStudentStatus(
    actorUserId: string,
    studentId: string,
    newStatus: StudentStatus,
    tErrors: ErrorsLabels,
    expectedVersion?: number
  ): Promise<ChangeStudentStatusResult> {
    const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);
    try {
      assertStudentFieldEdit(fieldCtx, "student_academic");
    } catch {
      throw new Error(tErrors.insufficientPermissions);
    }

    try {
      const updated = await StudentRepository.changeStatus(studentId, newStatus, tErrors, expectedVersion);

      logger.info("Student status changed", {
        actorUserId,
        studentId,
        previousStatus: "unknown",
        newStatus: updated.status,
      });

      return {
        id: updated.id,
        status: parseStudentStatus(updated.status) ?? StudentStatus.REGULAR,
        version: updated.version,
      };
    } catch (error) {
      logger.error("Failed to change student status", {
        actorUserId,
        studentId,
        newStatus,
        error,
      });
      throw error;
    }
  }
}
