import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherReassignmentContainer } from "@/frontend/common/views/dashboard/teachers/reassignment/TeacherReassignmentContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string; readonly id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.teacherReassignment;
  return { title: t.pageTitle };
}

export default async function TeacherReassignmentPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin();
    return;
  }

  await requirePermissionForPage(
    userId,
    [AppPermission.STUDENT_REASSIGN_TEACHER, AppPermission.STUDENT_MANAGE_STATUS],
    locale,
    context
  );

  return <TeacherReassignmentContainer />;
}
