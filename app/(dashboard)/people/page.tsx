import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { isPeopleDirectoryEnabled } from "@/backend/lib/features/is-people-directory-enabled";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { PeopleDirectoryPageContainer } from "@/frontend/common/views/dashboard/people/PeopleDirectoryPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.peopleDirectoryParent;
  return { title: t.pageTitle };
}

export default async function PeopleDirectoryPage() {
  if (!(await isPeopleDirectoryEnabled())) {
    notFound();
  }

  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(
    userId,
    [AppPermission.STAFF_VIEW_DIRECTORY, AppPermission.PARENT_VIEW_DIRECTORY, AppPermission.STUDENTS_LIST],
    locale,
    context
  );
  return <PeopleDirectoryPageContainer />;
}
