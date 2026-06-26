import { ParentRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { PaginationArgs, ParentDashboardSchedulePaginatedResult } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

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
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { id: actorUserId }));
    }

    const result = await ParentRepository.getParentDashboardSchedule(parent.id, {
      date: date ? new Date(date) : null,
      search,
      pagination,
    });

    return result;
  }
}
