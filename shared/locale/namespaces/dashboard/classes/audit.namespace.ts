import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ClassAuditLabels } from "@/shared/locale/types/dashboard/classes/audit";

export const DashboardClassAudit = defineNamespace<ClassAuditLabels>("dashboard.classes.audit", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/classes/audit").then(module => module.dashboardClassAuditEn),
    ar: () => import("@/shared/locale/ar/dashboard/classes/audit").then(module => module.dashboardClassAuditAr),
  },
});
