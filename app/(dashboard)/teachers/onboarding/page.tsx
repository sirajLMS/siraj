import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { TeacherOnboardingContainer } from "@/frontend/common/views/dashboard/teachers/onboarding/TeacherOnboardingContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.teacherOnboarding;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.TEACHERS_CREATE], async () => {
  return <TeacherOnboardingContainer />;
});
