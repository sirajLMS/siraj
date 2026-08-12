import type { Metadata } from "next";
import { requireTeacherIdForPage } from "@/backend/lib/auth/require-teacher-id";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { TeacherClassListContainer } from "@/frontend/common/views/dashboard/teachers/classes/TeacherClassListContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teacherClassList;
  return { title: t.pageTitle };
}

export default withPageAuth(null, async ({ userId, context, locale }) => {
  await requireTeacherIdForPage(userId, locale, context);
  return <TeacherClassListContainer />;
});
