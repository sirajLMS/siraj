import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ParentsContainer } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.parentsDirectory;
  return { title: t.pageTitle };
}

export default async function ParentsPage() {
  if (await isUsersDirectoryEnabled()) {
    redirect("/users?tab=parents");
  }

  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return undefined;
  }
  await requirePermissionForPage(
    userId,
    [AppPermission.PARENT_VIEW_DIRECTORY, AppPermission.PARENTS_LIST],
    locale,
    context
  );

  return <ParentsContainer />;
}
