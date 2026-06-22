import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { logger } from "@/backend/lib/logger";
import { AppPermission } from "@/shared/lib/enum";

export namespace SuspendedLockService {
  export const PERMISSION = AppPermission.SYSTEM_ENFORCE_SUSPENDED_LOCK;

  export async function enforceSuspendedLock(studentId: string, actorUserId: string): Promise<{ frozenCount: number }> {
    const fromDate = new Date();
    const frozenCount = await SchedulingRepository.bulkFreezeStudentClasses(studentId, fromDate);

    logger.info("Suspended lock enforced: classes frozen", {
      studentId,
      actorUserId,
      frozenCount,
      fromDate: fromDate.toISOString(),
    });

    return { frozenCount };
  }

  export async function releaseSuspendedLock(
    studentId: string,
    actorUserId: string
  ): Promise<{ unfrozenCount: number }> {
    const fromDate = new Date();
    const unfrozenCount = await SchedulingRepository.bulkUnfreezeStudentClasses(studentId, fromDate);

    logger.info("Suspended lock released: classes unfrozen", {
      studentId,
      actorUserId,
      unfrozenCount,
      fromDate: fromDate.toISOString(),
    });

    return { unfrozenCount };
  }
}
