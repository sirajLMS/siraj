import { ParentRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type {
  PaginationArgs,
  ParentDashboardMetricsReturnType,
  ParentDashboardSchedulePaginatedResult,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace ParentDashboardService {
  export async function getSchedule(
    actorUserId: string,
    date: string | null,
    search: string | null,
    pagination: PaginationArgs | null,
    locale?: string
  ): Promise<ParentDashboardSchedulePaginatedResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SCHEDULE_VIEW_FAMILY);
    if (!hasPermission) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.parentNotFound);
    }

    const result = await ParentRepository.getParentDashboardSchedule(parent.id, {
      date: date ? new Date(date) : null,
      search,
      pagination,
      locale,
    });

    const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;

    const enrichedRows = await Promise.all(
      result.rows.map(async row => {
        const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(row.id, tFunc);
        return {
          ...row,
          meetingJoinUrl: effectiveMeeting.joinUrl,
          effectiveMeeting,
        };
      })
    );

    return {
      ...result,
      rows: enrichedRows,
    };
  }

  export async function getDashboardMetrics(
    actorUserId: string,
    locale?: string
  ): Promise<ParentDashboardMetricsReturnType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SCHEDULE_VIEW_FAMILY);
    if (!hasPermission) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.parentNotFound);
    }

    const [metrics, studentProgress, workshopPromo] = await Promise.all([
      ParentRepository.getParentDashboardMetrics(parent.id),
      ParentRepository.getParentStudentProgress(parent.id),
      ParentRepository.getParentWorkshopPromo(parent.id),
    ]);

    return {
      id: `parent-dashboard-metrics-${parent.id}`,
      metrics,
      studentProgress,
      workshopPromo,
    };
  }
}
