import { ParentRepository } from "@/backend/db/repo";
import type { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getServerTranslations } from "@/shared/locale";

export namespace ParentServiceBase {
  export async function assertPermission(userId: string, permission: AppPermission, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, permission);
    if (!isAuthorized) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.unauthorizedAction);
    }
  }

  export async function resolveParentForUser(userId: string, locale?: string) {
    const parent = await ParentRepository.findByUserId(userId);
    if (!parent) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.notFound);
    }
    return parent;
  }
}
