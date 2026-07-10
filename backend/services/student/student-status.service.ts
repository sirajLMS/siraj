import { SchedulingRepository, StudentRepository } from "@/backend/db/repo";
import { AppPermission, StudentStatus } from "@/backend/enum";
import { parseClassExecutionState, parseStudentStatus } from "@/backend/lib/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
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

    const enrichedClasses = await Promise.all(
      classes.map(async c => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(c.id);
        return {
          ...c,
          executionState: parseClassExecutionState(c.executionState),
          meetingJoinUrl: effectiveMeeting.joinUrl,
          effectiveMeeting,
        };
      })
    );

    logger.info("Fetched upcoming classes for student", {
      actorUserId,
      studentId,
      classCount: enrichedClasses.length,
    });

    return {
      id: `upcoming-${studentId}`,
      studentId,
      studentName: student.name,
      status: parseStudentStatus(student.status) ?? StudentStatus.REGULAR,
      classes: enrichedClasses,
    };
  }
}
