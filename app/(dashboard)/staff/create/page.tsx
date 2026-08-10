import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ManagerOnboardingContainer } from "@/frontend/common/views/dashboard/staff/onboarding/ManagerOnboardingContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.staffOnboarding;
  return { title: t.pageTitle };
}

export default async function StaffOnboardingPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return undefined;
  }
  await requirePermissionForPage(userId, [AppPermission.STAFF_CREATE], locale, context);

  return <ManagerOnboardingContainer />;
}
