import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { GenderSelectorLabels } from "@/shared/locale/types/ui";

export const UiGenderSelector = defineNamespace<GenderSelectorLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/gender-selector").then(module => module.uiGenderSelectorEn),
    ar: () => import("@/shared/locale/ar/ui/gender-selector").then(module => module.uiGenderSelectorAr),
  },
});
