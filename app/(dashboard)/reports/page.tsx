import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ReportsContainer } from "@/frontend/common/views/dashboard/reports/ReportsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.reports;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.REPORT_GENERATE_CUSTOM], async () => {
  return <ReportsContainer />;
});
