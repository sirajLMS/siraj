import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports/sessionAudit";

export const DashboardReportsSessionAudit = defineNamespace<SessionAuditLabels>("dashboard.reports.sessionAudit", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/reports/sessionAudit").then(module => module.dashboardReportsSessionAuditEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/reports/sessionAudit").then(module => module.dashboardReportsSessionAuditAr),
  },
});
