import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PaymentCatalogsPageContainer } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.paymentCatalogsParent;
  return { title: t.pageTitle };
}

export default withPageAuth(
  [AppPermission.PAYMENT_METHODS_MANAGE_CATALOGS, AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG],
  async () => {
    return <PaymentCatalogsPageContainer />;
  }
);
