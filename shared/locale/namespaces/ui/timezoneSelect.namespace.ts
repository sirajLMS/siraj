import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TimezoneSelectLabels } from "@/shared/locale/types/ui";

export const UiTimezoneSelect = defineNamespace<TimezoneSelectLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/timezone-select").then(module => module.uiTimezoneSelectEn),
    ar: () => import("@/shared/locale/ar/ui/timezone-select").then(module => module.uiTimezoneSelectAr),
  },
});
