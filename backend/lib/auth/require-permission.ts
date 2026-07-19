import type { AppPermission } from "@/backend/enum";
import { PermissionsService, type UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { redirect } from "@/shared/i18n/routing";

/**
 * Server-side page guard: redirects to /dashboard when the user lacks any of the
 * required permissions (OR semantics, matching client RequirePermission).
 * Prefer passing permissionContext from getServerUserContext() so impersonation
 * and group simulation stay correct.
 */
export async function requirePermissionForPage(
  userId: string,
  permissions: readonly AppPermission[],
  locale: string,
  permissionContext?: UserPermissionContext | null
): Promise<void> {
  const context = permissionContext ?? (await PermissionsService.getUserContext(userId));
  const hasAccess = context.isSuperAdmin || permissions.some(permission => context.permissions.includes(permission));

  if (!hasAccess) {
    redirect({ href: "/dashboard", locale });
  }
}
