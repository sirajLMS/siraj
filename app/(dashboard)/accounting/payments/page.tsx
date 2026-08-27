import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PaymentsContainer } from "@/frontend/common/views/dashboard/accounting/PaymentsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.accountingPayments;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.ACCOUNTING_PAYMENTS_VIEW], async () => {
  return <PaymentsContainer />;
});
