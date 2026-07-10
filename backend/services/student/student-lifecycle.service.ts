import { StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { AppPermission, StudentStatus } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { parseStudentStatus } from "@/backend/lib/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ChangeStudentStatusResult, ReassignStudentTeacherResult } from "@/backend/types";

export namespace StudentLifecycleService {
  export async function reassignTeacher(
    actorUserId: string,
    studentId: string,
    newTeacherId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<ReassignStudentTeacherResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_REASSIGN_TEACHER);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const teacher = await TeacherRepository.findById(newTeacherId);
    if (!teacher) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("teacherNotFound", { id: newTeacherId }));
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    try {
      const updated = await StudentRepository.reassignTeacher(
        studentId,
        newTeacherId,
        expectedVersion,
        undefined,
        locale
      );

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
    expectedVersion?: number,
    locale?: string
  ): Promise<ChangeStudentStatusResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_MANAGE_STATUS);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const updated = await StudentRepository.changeStatus(studentId, newStatus, expectedVersion, undefined, locale);

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
