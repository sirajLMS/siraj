import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { SessionAuditReportsContainer } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditReportsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.sessionAudit;
  return { title: t.title };
}

export default withPageAuth([AppPermission.ACCOUNTING_REPORTS_VIEW], async () => {
  return <SessionAuditReportsContainer />;
});
