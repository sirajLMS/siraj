import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherWeeklyScheduleContainer } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ readonly id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teacherWeeklySchedule;
  const teacherName = await getTeacherPageTitle(id);
  if (teacherName) {
    return { title: t.pageTitle(teacherName) };
  }
  return { title: t.pageTitle("") };
}

export default async function TeacherWeeklySchedulePage({ params }: PageProps) {
  const { id } = await params;

  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin();
    return undefined;
  }

  await requirePermissionForPage(userId, [AppPermission.SCHEDULE_VIEW_WEEKLY], locale, context);

  return <TeacherWeeklyScheduleContainer teacherId={id} />;
}
