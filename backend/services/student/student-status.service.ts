import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students";
import { StudentStatus } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { canViewStudentFieldGroup } from "@/backend/services/profile/profile-field-filter";
import { assertStudentReadAccess, resolveIsAssociatedViewer } from "@/backend/services/student/student-access.helpers";
import { buildStudentFieldFilterContext } from "@/backend/services/student/student-field-acl";
import type { StudentUpcomingClassesResult } from "@/backend/types";
import { ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { parseClassExecutionState, parseClassOutcome, parseStudentStatus } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentStatusService {
  export async function getUpcomingClasses(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels,
    range?: { from?: Date | null; to?: Date | null } | null
  ): Promise<StudentUpcomingClassesResult> {
    await assertStudentReadAccess(actorUserId, studentId, tErrors);

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new Error(tErrors.studentNotFound(studentId));
    }

    const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);
    const isAssociatedViewer = await resolveIsAssociatedViewer(actorUserId, studentId);
    if (!isAssociatedViewer && !canViewStudentFieldGroup(fieldCtx, "student_schedule")) {
      logger.logDomainError("getUpcomingClasses: schedule view denied for non-associated viewer", {
        actorUserId,
        studentId,
      });
      throw new ForbiddenError(tErrors.insufficientPermissions);
    }

    const normalizedRange = range
      ? {
          from: range.from ?? undefined,
          to: range.to ?? undefined,
        }
      : null;

    const classes = await SchedulingRepository.getUpcomingClassesForStudent(studentId, normalizedRange);

    const enrichedClasses = await Promise.all(
      classes.map(async c => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(c.id, tErrors);
        return Object.assign(c, {
          executionState: parseClassExecutionState(c.executionState),
          outcome: parseClassOutcome(c.outcome) ?? ClassOutcome.PENDING,
          meetingJoinUrl: effectiveMeeting.joinUrl,
          effectiveMeeting,
        });
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
