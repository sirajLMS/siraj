import { forbidden } from "next/navigation";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { isPrefetchRequest } from "@/backend/lib/auth/is-prefetch";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { redirect } from "@/shared/i18n/routing";

export async function requireTeacherIdForPage(
  userId: string,
  locale: string,
  permissionContext?: UserPermissionContext | null
): Promise<string> {
  const profile = await getCurrentUser(userId, permissionContext);

  if (!profile.teacherId) {
    // Same prefetch-defense as requirePermissionForPage: returning a 307 to a
    // prefetch causes an infinite /dashboard → /forbidden → /dashboard loop
    // on the App Router (it honours redirects on prefetches). For prefetches
    // throw the Next.js 403 instead so the prefetch short-circuits cleanly.
    if (await isPrefetchRequest()) {
      forbidden();
      return "";
    }
    redirect({ href: "/dashboard", locale });
    return "";
  }

  return profile.teacherId;
}
