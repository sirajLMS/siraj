import { SchedulingRepository, StudentRepository } from "@/backend/db/repo";
import { ClassOutcome, StudentStatus } from "@/backend/enum";
import { parseClassExecutionState, parseClassOutcome, parseStudentStatus } from "@/backend/lib/enum";
import { logger } from "@/backend/lib/logger";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { assertStudentFieldView, buildStudentFieldFilterContext } from "@/backend/services/student/student-field-acl";
import type { StudentUpcomingClassesResult } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentStatusService {
  export async function getUpcomingClasses(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels
  ): Promise<StudentUpcomingClassesResult> {
    const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);
    try {
      assertStudentFieldView(fieldCtx, "student_schedule");
    } catch {
      throw new Error(tErrors.insufficientPermissions);
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new Error(tErrors.studentNotFound(studentId));
    }

    const classes = await SchedulingRepository.getUpcomingClassesForStudent(studentId);

    const enrichedClasses = await Promise.all(
      classes.map(async c => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(c.id, tErrors);
        return Object.assign(c, {
	executionState: parseClassExecutionState(c.executionState),
	outcome: parseClassOutcome(c.outcome) ?? ClassOutcome.PENDING,
	meetingJoinUrl: effectiveMeeting.joinUrl,
	effectiveMeeting
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
