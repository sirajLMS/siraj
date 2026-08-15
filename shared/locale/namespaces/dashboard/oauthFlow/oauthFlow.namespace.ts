import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { OAuthFlowLabels } from "@/shared/locale/types/dashboard/oauth-flow";

export const DashboardOAuthFlow = defineNamespace<OAuthFlowLabels>("dashboard.oauthFlow", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/oauthFlow/oauthFlow").then(module => module.dashboardOAuthFlowEn),
    ar: () => import("@/shared/locale/ar/dashboard/oauthFlow/oauthFlow").then(module => module.dashboardOAuthFlowAr),
  },
});
