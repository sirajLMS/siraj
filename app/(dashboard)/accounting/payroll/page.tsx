import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PayrollReportsContainer } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billingPayroll;
  return { title: t.title };
}

export default withPageAuth([AppPermission.ACCOUNTING_PAYROLL_VIEW], async () => {
  return <PayrollReportsContainer />;
});
