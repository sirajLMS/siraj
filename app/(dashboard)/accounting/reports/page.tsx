import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PermissionsService } from "@/backend/services";
import { SessionAuditAccessDenied } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditAccessDenied";
import { SessionAuditReportsContainer } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditReportsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

const REPORTS_PERMISSION = AppPermission.ACCOUNTING_REPORTS_VIEW;
const REPORTS_PERMISSION_NAME = "ACCOUNTING_REPORTS_VIEW";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.sessionAudit;
  return { title: t.title };
}

export default withPageAuth(null, async ({ userId, context, locale }) => {
  const permissionContext = context ?? (await PermissionsService.getUserContext(userId));
  const hasAccess = permissionContext.isSuperAdmin || permissionContext.permissions.includes(REPORTS_PERMISSION);

  if (!hasAccess) {
    const labels = getTranslations(locale).dashboardTranslations.sessionAudit.accessDenied;
    return <SessionAuditAccessDenied labels={labels} permissionName={REPORTS_PERMISSION_NAME} />;
  }

  return <SessionAuditReportsContainer />;
});
