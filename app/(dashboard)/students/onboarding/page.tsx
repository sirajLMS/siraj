import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { StudentOnboardingView } from "@/frontend/common/views/dashboard/students/onboarding/StudentOnboardingContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.studentOnboarding;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.STUDENTS_CREATE], async () => {
  return <StudentOnboardingView />;
});
