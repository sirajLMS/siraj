import type { Metadata } from "next";
import { requireTeacherIdForPage } from "@/backend/lib/auth/require-teacher-id";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { FutureScheduleContainer } from "@/frontend/common/views/dashboard/teachers/futureSchedule/FutureScheduleContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teacherFutureSchedule;
  return { title: t.pageTitle };
}

export default withPageAuth(null, async ({ userId, context, locale }) => {
  const teacherId = await requireTeacherIdForPage(userId, locale, context);
  return <FutureScheduleContainer teacherId={teacherId} />;
});
