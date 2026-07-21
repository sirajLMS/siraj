import type { Metadata } from "next";
import { requireTeacherIdForPage } from "@/backend/lib/auth/require-teacher-id";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { FutureScheduleContainer } from "@/frontend/common/views/dashboard/teachers/futureSchedule/FutureScheduleContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teacherFutureSchedule;
  return { title: t.pageTitle };
}

export default async function TeacherMeFutureSchedulePage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  const teacherId = await requireTeacherIdForPage(userId, locale, context);
  return <FutureScheduleContainer teacherId={teacherId} />;
}
