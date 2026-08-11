import type { Metadata } from "next";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { requireTeacherIdForPage } from "@/backend/lib/auth/require-teacher-id";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { TeacherWeeklyScheduleContainer } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const translations = getTranslations(locale).dashboardTranslations;
  const t = translations.teacherWeeklySchedule;
  const nav = translations.coreNav;

  const { userId, context } = await getServerUserContext();
  if (userId) {
    const profile = await getCurrentUser(userId, context);
    if (profile.teacherId) {
      const teacherName = await getTeacherPageTitle(profile.teacherId);
      if (teacherName) {
        return { title: t.pageTitle(teacherName) };
      }
    }
  }

  return { title: nav.regularSchedule };
}

export default withPageAuth(null, async ({ userId, context, locale }) => {
  const teacherId = await requireTeacherIdForPage(userId, locale, context);
  return <TeacherWeeklyScheduleContainer teacherId={teacherId} />;
});
