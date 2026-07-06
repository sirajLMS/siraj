import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { redirect } from "@/shared/i18n/routing";

export async function requireTeacherIdForPage(
  userId: string,
  locale: string,
  permissionContext?: UserPermissionContext | null
): Promise<string> {
  const profile = await getCurrentUser(userId, permissionContext);

  if (!profile.teacherId) {
    redirect({ href: "/dashboard", locale });
    return "";
  }

  return profile.teacherId;
}
