import { SchedulingRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";

export namespace ScheduleDeletionService {
  /**
   * Deletes a specific class instance from the weekly schedule.
   * Requires: schedule.delete_class permission.
   */
  export async function deleteClass(actorUserId: string, classInstanceId: string, locale?: string): Promise<boolean> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SCHEDULE_DELETE_CLASS);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return SchedulingRepository.deleteRecurringClass(classInstanceId);
  }

  /**
   * Clears all recurring schedules for a specific teacher.
   * Requires: schedule.clear_weekly permission.
   */
  export async function clearWeeklySchedule(actorUserId: string, teacherId: string, locale?: string): Promise<boolean> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SCHEDULE_CLEAR_WEEKLY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return SchedulingRepository.clearWeeklySchedule(teacherId);
  }
}
