import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SuggestionsLabels } from "@/shared/locale/types/dashboard/suggestions";

export const DashboardSuggestions = defineNamespace<SuggestionsLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/suggestions/main").then(module => module.dashboardSuggestionsEn),
    ar: () => import("@/shared/locale/ar/dashboard/suggestions/main").then(module => module.dashboardSuggestionsAr),
  },
});
