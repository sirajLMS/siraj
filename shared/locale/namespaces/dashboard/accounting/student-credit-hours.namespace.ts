import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentCreditHoursLabels } from "@/shared/locale/types/dashboard/accounting/student-credit-hours";

export const DashboardAccountingStudentCreditHours = defineNamespace<StudentCreditHoursLabels>(
  "dashboard.accounting.student-credit-hours",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/accounting/student-credit-hours").then(
          module => module.dashboardAccountingStudentCreditHoursEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/accounting/student-credit-hours").then(
          module => module.dashboardAccountingStudentCreditHoursAr
        ),
    },
  }
);
