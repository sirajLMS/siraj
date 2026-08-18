import { forbidden } from "next/navigation";
import type { AppPermission } from "@/backend/enum";
import { isPrefetchRequest } from "@/backend/lib/auth/is-prefetch";
import { PermissionsService } from "@/backend/services";
import type { UserPermissionContext } from "@/backend/types";
import { redirect } from "@/shared/i18n/routing";

/**
 * Server-side page guard.
 *
 * Redirects to `/dashboard` when the user lacks any of the required permissions
 * (OR semantics, matching client `RequirePermission`). Prefer passing
 * `permissionContext` from `getServerUserContext()` so impersonation and group
 * simulation stay correct.
 *
 * When the current request is a Next.js App Router background prefetch
 * (annotated with `Sec-Purpose: prefetch`), a redirect (307) is honoured by
 * the App Router and re-navigates the client. On dashboard pages that
 * re-navigation triggers another full nav-tree prefetch and re-enters this
 * guard — producing the `/dashboard → /forbidden → /dashboard` infinite loop
 * reproduced via `vercel logs --follow`. For prefetches we call `forbidden()`
 * instead, which throws the Next.js 403 error and short-circuits the prefetch
 * without a client-side navigation.
 */
export async function requirePermissionForPage(
  userId: string,
  permissions: readonly AppPermission[],
  locale: string,
  permissionContext?: UserPermissionContext | null
): Promise<void> {
  const context = permissionContext ?? (await PermissionsService.getUserContext(userId));
  const hasAccess = context.isSuperAdmin || permissions.some(permission => context.permissions.includes(permission));

  if (hasAccess) {
    return;
  }
  if (await isPrefetchRequest()) {
    // Don't redirect prefetches — it creates a redirect loop on the client.
    forbidden();
    return;
  }
  redirect({ href: "/dashboard", locale });
}
