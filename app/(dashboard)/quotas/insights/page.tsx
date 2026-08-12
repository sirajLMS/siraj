import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { QuotaInsightsContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billingQuota;
  return { title: t.insights };
}

export default withPageAuth([AppPermission.QUOTAS_VIEW], async () => {
  return <QuotaInsightsContainer />;
});
