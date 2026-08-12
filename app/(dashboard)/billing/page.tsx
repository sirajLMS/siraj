import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { BillingPageContainer } from "@/frontend/common/views/dashboard/billing/BillingPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billing;
  return { title: t.adminPageTitle };
}

export default withPageAuth(
  [
    AppPermission.BILLING_VIEW_HISTORY,
    AppPermission.BILLING_VIEW_EXCHANGE_RATES,
    AppPermission.BILLING_MANAGE_CURRENCY_HEDGES,
    AppPermission.BILLING_CREATE_INVOICE,
  ],
  async () => {
    return <BillingPageContainer />;
  }
);
