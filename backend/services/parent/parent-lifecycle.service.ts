import { ParentRepository } from "@/backend/db";
import { AppPermission, type ParentStatus } from "@/backend/enum";
import { getBackendTranslations, logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import type { ChangeParentLifecycleResult } from "@/backend/types";

export namespace ParentLifecycleService {
  export async function changeLifecycleStatus(
    actorUserId: string,
    parentId: string,
    newStatus: ParentStatus,
    locale?: string
  ): Promise<ChangeParentLifecycleResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_MANAGE_STATUS);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const updated = await ParentRepository.changeLifecycleStatus(parentId, newStatus, undefined, locale);

      logger.info("Parent lifecycle status changed", {
        actorUserId,
        parentId,
        newStatus: updated.lifecycleStatus,
      });

      return updated;
    } catch (error) {
      logger.error("Failed to change parent lifecycle status", {
        actorUserId,
        parentId,
        newStatus,
        error,
      });
      throw error;
    }
  }
}
