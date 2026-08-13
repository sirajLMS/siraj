import { cache } from "react";
import { cachedRead, SessionService, type UserPermissionContext } from "@/backend/services";
import type { CurrentUserProfile } from "@/backend/types";

export const getCurrentUser = cache(
  async (userId: string, permissionContext?: UserPermissionContext | null): Promise<CurrentUserProfile> => {
    const roleId = permissionContext?.role ?? "anonymous";
    const cacheKey = `ec:user:${userId}:${roleId}`;

    return cachedRead(
      cacheKey,
      300,
      async () => {
        const profile = await SessionService.getCurrentUserProfile(userId);

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
