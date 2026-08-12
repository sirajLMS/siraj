import { cache } from "react";
import { getCurrentUser } from "@/backend/lib";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { ProfileService, isRedirect } from "@/backend/services/profile/profile.service";
import type { ProfileMode, ProfilePageContext, ProfilePageResolution } from "@/backend/types";

export { isRedirect };

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

export type ResolvedProfilePage = ProfilePageContext | { readonly redirect: string };

export function toProfileRedirect(result: ProfilePageResolution): string | null {
  if (isRedirect(result)) {
    return result.redirect;
  }
  return null;
}
