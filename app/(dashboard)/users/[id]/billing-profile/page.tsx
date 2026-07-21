import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { getUserPageTitle } from "@/backend/lib/titles/cached-page-title";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { UserBillingProfileContainer } from "@/frontend/common/views/dashboard/users/billing-profile/UserBillingProfileContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

interface BillingProfilePageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BillingProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billing;
  const userName = await getUserPageTitle(id);
  if (userName) {
    return { title: `${userName} — ${t.billingProfileTitle}` };
  }
  return { title: t.billingProfileTitle };
}

export default async function BillingProfilePage({ params }: Readonly<BillingProfilePageProps>) {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.BILLING_VIEW_HISTORY], locale, context);
  const { id } = await params;
  return <UserBillingProfileContainer userId={id} />;
}
