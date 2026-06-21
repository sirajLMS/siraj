import { StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission, type StudentStatus } from "@/shared/lib/enum";

export interface ReassignTeacherResult {
  readonly id: string;
  readonly primaryTeacherId: string | null;
  readonly version: number;
}

export interface ChangeStudentStatusResult {
  readonly id: string;
  readonly status: string;
  readonly version: number;
}

const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  ON_TRIAL: ["REGULAR", "DEACTIVATED"],
  REGULAR: ["SUSPENDED", "ON_LEAVE", "DEACTIVATED", "GRADUATED"],
  SUSPENDED: ["REGULAR", "DEACTIVATED"],
  ON_LEAVE: ["REGULAR", "DEACTIVATED"],
  DEACTIVATED: ["REGULAR"],
  GRADUATED: [],
};

export namespace StudentLifecycleService {
  export async function reassignTeacher(
    actorUserId: string,
    studentId: string,
    newTeacherId: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<ReassignTeacherResult> {
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
    newStatus: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<ChangeStudentStatusResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_MANAGE_STATUS);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    const currentStatus = student.status;
    const allowedTargets = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTargets.includes(newStatus)) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("invalidStatusTransition", {
          currentStatus,
          newStatus,
        })
      );
    }

    try {
      const updated = await StudentRepository.changeStatus(
        studentId,
        newStatus as StudentStatus,
        expectedVersion,
        undefined,
        locale
      );

      logger.info("Student status changed", {
        actorUserId,
        studentId,
        previousStatus: currentStatus,
        newStatus: updated.status,
      });

      return {
        id: updated.id,
        status: updated.status,
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
