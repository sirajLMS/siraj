import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requireTeacherIdForPage } from "@/backend/lib/auth/require-teacher-id";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { TeacherLessonReportsContainer } from "@/frontend/common/views/dashboard/teachers/lesson-reports/TeacherLessonReportsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.lmsLessonReports;
  return { title: t.title };
}

export default withPageAuth([AppPermission.TEACHER_VIEW_DASHBOARD], async ({ userId, context, locale }) => {
  const teacherId = await requireTeacherIdForPage(userId, locale, context);
  return <TeacherLessonReportsContainer teacherId={teacherId} />;
});
