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

    // The cached value must NOT contain permissions: they change via permission
    // management and migrations, and a cached snapshot would keep serving the old
    // list after a grant. Cache only the profile fields; merge the fresh
    // per-request permission context after the cached read.
    const profile = await cachedRead(cacheKey, 300, () => SessionService.getCurrentUserProfile(userId, locale), [
      `user:${userId}`,
    ]);

    if (!permissionContext) {
      return profile;
    }

    return {
      ...profile,
      permissions: permissionContext.permissions,
      role: permissionContext.role,
    };
  }
);
