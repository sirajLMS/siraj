import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PendingReviewsLabels } from "@/shared/locale/types/dashboard/supervisorPortal/pendingReviews";

export const DashboardSupervisorPortalPendingReviews = defineNamespace<PendingReviewsLabels>(
  "dashboard.supervisorPortal.pendingReviews",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/supervisorPortal/pendingReviews").then(
          module => module.dashboardSupervisorPortalPendingReviewsEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/supervisorPortal/pendingReviews").then(
          module => module.dashboardSupervisorPortalPendingReviewsAr
        ),
    },
  }
);
