import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { BillingPageContainer } from "@/frontend/common/views/dashboard/billing/BillingPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billing;
  return { title: t.adminPageTitle };
}

export default async function BillingPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return undefined;
  }
  await requirePermissionForPage(
    userId,
    [
      AppPermission.BILLING_VIEW_HISTORY,
      AppPermission.BILLING_VIEW_EXCHANGE_RATES,
      AppPermission.BILLING_MANAGE_CURRENCY_HEDGES,
      AppPermission.BILLING_CREATE_INVOICE,
    ],
    locale,
    context
  );
  return <BillingPageContainer />;
}
