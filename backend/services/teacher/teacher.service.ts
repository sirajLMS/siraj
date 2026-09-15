import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import type { UserPermissionContext } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace TeacherService {
  export async function searchTeachers(
    userId: string | undefined,
    search: string,
    limit: number,
    locale: string | undefined,
    permissionContext: Pick<UserPermissionContext, "permissions" | "isSuperAdmin">
  ) {
    try {
      if (!userId) {
        logger.warn("Unauthorized access to searchTeachers - user not logged in");
        const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
        throw new Error(tFunc.unauthorized);
      }

      const hasAccess =
        permissionContext.isSuperAdmin ||
        [AppPermission.TEACHERS_LIST, AppPermission.STAFF_VIEW_DIRECTORY].some(permission =>
          permissionContext.permissions.includes(permission)
        );
      if (!hasAccess) {
        throw new ForbiddenError(getServerTranslations(locale ?? "en").errorsTranslations.insufficientPermissions);
      }

      const teachers = await TeacherRepository.searchTeachers(search, limit);
      return teachers;
    } catch (error) {
      logger.error("Error searching teachers", { userId, search, limit, error });
      throw error;
    }
  }
}
