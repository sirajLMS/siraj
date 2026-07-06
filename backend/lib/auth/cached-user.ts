import { cache } from "react";
import { SessionService } from "@/backend/services/auth/session.service";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import type { CurrentUserProfile } from "@/backend/types";

export const getCurrentUser = cache(
  async (userId: string, permissionContext?: UserPermissionContext | null): Promise<CurrentUserProfile> => {
    const profile = await SessionService.getCurrentUserProfile(userId);

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
