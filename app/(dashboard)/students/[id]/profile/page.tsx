import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { getStudentPageTitle } from "@/backend/lib/titles/cached-page-title";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { StudentProfilePageClient } from "@/frontend/common/views/dashboard/students/profile/StudentProfilePageClient";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.studentProfile;
  const studentName = await getStudentPageTitle(id);
  if (studentName) {
    return { title: studentName };
  }
  return { title: t.title };
}

export default async function StudentProfilePage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(
    userId,
    [AppPermission.STUDENTS_LIST, AppPermission.STUDENT_VIEW_ASSOCIATED],
    locale,
    context
  );
  return <StudentProfilePageClient />;
}
