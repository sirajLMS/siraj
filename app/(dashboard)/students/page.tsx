import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { StudentsContainer } from "@/frontend/common/views/dashboard/admin/parents/students/StudentsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.studentDirectory;
  return { title: t.pageTitle };
}

export default async function StudentsPage() {
  if (await isUsersDirectoryEnabled()) {
    redirect("/users?tab=students");
  }

  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.STUDENTS_LIST], locale, context);

  return <StudentsContainer />;
}
