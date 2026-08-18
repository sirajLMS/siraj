import { cache } from "react";
import { cachedRead, SessionService } from "@/backend/services";
import type { CurrentUserProfile, UserPermissionContext } from "@/backend/types";

export const getCurrentUser = cache(
  async (
    userId: string,
    permissionContext?: UserPermissionContext | null,
    locale?: string
  ): Promise<CurrentUserProfile> => {
    const roleId = permissionContext?.role ?? "anonymous";
    const cacheKey = `ec:user:${userId}:${roleId}`;

    return cachedRead(
      cacheKey,
      300,
      async () => {
        const profile = await SessionService.getCurrentUserProfile(userId, locale);

        if (!permissionContext) {
          return profile;
        }

        return {
          ...profile,
          permissions: permissionContext.permissions,
          role: permissionContext.role,
        };
      },
      [`user:${userId}`]
    );
  }
);
