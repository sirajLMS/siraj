import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { TeacherRulesContainer } from "@/frontend/common/views/dashboard/teachers/rules/TeacherRulesContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teacherDashboard;
  return { title: t.rules.pageTitle };
}

export default withPageAuth([AppPermission.TEACHER_VIEW_DASHBOARD], async () => {
  return <TeacherRulesContainer />;
});
