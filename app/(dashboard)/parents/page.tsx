import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import { ParentsContainer } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.parentsDirectory;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.PARENT_VIEW_DIRECTORY, AppPermission.PARENTS_LIST], async () => {
  if (await isUsersDirectoryEnabled()) {
    redirect("/users?tab=parents");
  }
  return <ParentsContainer />;
});
