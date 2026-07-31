import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { FeedbackManageParentLabels } from "@/shared/locale/types/dashboard/feedback/main";

export const DashboardFeedbackManageParent = defineNamespace<FeedbackManageParentLabels>("dashboard.feedback.main", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/feedback/main").then(module => module.dashboardFeedbackManageParentEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/feedback/main").then(module => module.dashboardFeedbackManageParentAr),
  },
});
