import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ParentOnboardingContainer } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentOnboardingContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.parentOnboarding;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.PARENTS_CREATE], async () => {
  return <ParentOnboardingContainer />;
});
