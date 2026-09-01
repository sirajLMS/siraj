import { cache } from "react";
import { getCurrentUser } from "@/backend/lib";
import { ProfileService } from "@/backend/services";
import type { ProfileMode, ProfilePageResolution, UserPermissionContext } from "@/backend/types";

export const resolveProfilePageContext = cache(
  async (
    actorUserId: string,
    permissionContext: UserPermissionContext | null,
    options: { readonly targetUserId?: string; readonly mode: ProfileMode }
  ): Promise<ProfilePageResolution> => {
    await getCurrentUser(actorUserId, permissionContext);
    return ProfileService.resolvePageContext(actorUserId, {
      ...options,
      permissionContext: permissionContext
        ? { permissions: permissionContext.permissions, isSuperAdmin: permissionContext.isSuperAdmin }
        : undefined,
    });
  }
);
