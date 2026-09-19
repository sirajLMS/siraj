import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ProfitLossDashboard } from "@/frontend/common/views/dashboard/accounting/profit-loss/ProfitLossDashboard";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.accountingProfitLoss;
  return { title: t.title };
}

export default withPageAuth([AppPermission.ACCOUNTING_PROFITS_VIEW], async () => {
  return <ProfitLossDashboard />;
});
