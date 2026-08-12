import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import { ManagersContainer } from "@/frontend/common/views/dashboard/staff/home/ManagersContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.staffDirectory;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.STAFF_VIEW_DIRECTORY], async () => {
  if (await isUsersDirectoryEnabled()) {
    redirect("/users?tab=staff");
  }
  return <ManagersContainer />;
});
