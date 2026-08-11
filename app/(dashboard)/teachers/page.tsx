import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import { TeachersContainer } from "@/frontend/common/views/dashboard/teachers/home/TeachersContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teachersDirectory;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.STAFF_VIEW_DIRECTORY, AppPermission.TEACHERS_LIST], async () => {
  if (await isUsersDirectoryEnabled()) {
    redirect("/users?tab=teachers");
  }
  return <TeachersContainer />;
});
