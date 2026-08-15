import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import { UsersDirectoryPageContainer } from "@/frontend/common/views/dashboard/users/directory/UsersDirectoryPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.usersDirectoryParent;
  return { title: t.pageTitle };
}

export default withPageAuth(
  [AppPermission.TEACHERS_LIST, AppPermission.PARENT_VIEW_DIRECTORY, AppPermission.STUDENTS_LIST],
  async () => {
    if (!(await isUsersDirectoryEnabled())) {
      notFound();
    }
    return <UsersDirectoryPageContainer />;
  }
);
