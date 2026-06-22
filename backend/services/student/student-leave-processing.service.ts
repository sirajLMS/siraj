import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { logger } from "@/backend/lib/logger";
import { AppPermission } from "@/shared/lib/enum";

export interface LeaveProcessingResult {
  readonly processedCount: number;
  readonly successorIds: string[];
}

export namespace StudentLeaveProcessingService {
  export const PERMISSION = AppPermission.SYSTEM_PROCESS_STUDENT_LEAVE;

  export async function processStudentLeave(
    studentId: string,
    actorUserId: string,
    _locale?: string
  ): Promise<LeaveProcessingResult> {
    const fromDate = new Date();

    const futureClasses = await SchedulingRepository.getStudentFutureClasses(studentId, fromDate);

    const notActivatedClasses = futureClasses.filter(c => c.executionState === "NOT_ACTIVATED");

    if (notActivatedClasses.length === 0) {
      logger.info("No future NOT_ACTIVATED classes to process for ON_LEAVE student", {
        studentId,
        actorUserId,
        totalFutureClasses: futureClasses.length,
      });
      return { processedCount: 0, successorIds: [] };
    }

    const successorIds: string[] = [];

    for (const cls of notActivatedClasses) {
      try {
        const result = await SchedulingRepository.processAutomatedClassLeave(
          cls.id,
          "Student marked as On Leave by administrator",
          actorUserId
        );
        if (result.successorId) {
          successorIds.push(result.successorId);
        }
      } catch (error) {
        logger.error("Failed to process leave for class instance", {
          classInstanceId: cls.id,
          studentId,
          actorUserId,
          error,
        });
      }
    }

    logger.info("Student leave processing completed", {
      studentId,
      actorUserId,
      processedCount: successorIds.length,
      totalFutureClasses: futureClasses.length,
      notActivatedCount: notActivatedClasses.length,
    });

    return { processedCount: successorIds.length, successorIds };
  }
}
