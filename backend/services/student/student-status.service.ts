import { SchedulingRepository, StudentRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { StudentUpcomingClassesResult } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

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
      status: student.status,
      classes,
    };
  }
}
