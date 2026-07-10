import { SchedulingRepository, StudentRepository } from "@/backend/db/repo";
import { AppPermission, ClassExecutionState, StudentStatus } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { parseClassExecutionState, parseStudentStatus } from "@/backend/lib/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { StudentUpcomingClassesResult } from "@/backend/types";

export namespace StudentStatusService {
  export async function getUpcomingClasses(
    actorUserId: string,
    studentId: string,
    locale?: string
  ): Promise<StudentUpcomingClassesResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_VIEW_ASSOCIATED);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    const classes = await SchedulingRepository.getUpcomingClassesForStudent(studentId);

    logger.info("Fetched upcoming classes for student", {
      actorUserId,
      studentId,
      classCount: classes.length,
    });

    return {
      id: `upcoming-${studentId}`,
      studentId,
      studentName: student.name,
      status: parseStudentStatus(student.status) ?? StudentStatus.REGULAR,
      classes: classes.map(c => ({ ...c, executionState: parseClassExecutionState(c.executionState) })),
    };
  }
}
