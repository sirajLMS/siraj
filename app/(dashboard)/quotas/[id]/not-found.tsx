import { DashboardNotFoundContent } from "@/frontend/common/views/dashboard/components/DashboardNotFoundContent";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function QuotaNotFound() {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billingQuota;

  return (
    <DashboardNotFoundContent
      title={t.notFoundTitle}
      description={t.notFoundMessage}
      backLabel={t.notFoundBackButton}
      backHref="/quotas"
    />
  );
}
