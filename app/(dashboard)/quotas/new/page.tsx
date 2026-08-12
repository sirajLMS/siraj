import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { QuotaFormContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaFormContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billingQuota;
  return { title: t.newQuota };
}

export default withPageAuth([AppPermission.QUOTAS_MANAGE], async () => {
  return <QuotaFormContainer />;
});
