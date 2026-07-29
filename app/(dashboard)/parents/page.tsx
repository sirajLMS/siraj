import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { isPeopleDirectoryEnabled } from "@/backend/lib/features/is-people-directory-enabled";
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
  if (await isPeopleDirectoryEnabled()) {
    redirect("/people?tab=parents");
  }

  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.PARENT_VIEW_DIRECTORY], locale, context);

  return <ParentsContainer />;
}
