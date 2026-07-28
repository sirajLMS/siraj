import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CountrySelectLabels } from "@/shared/locale/types/ui";

export const UiCountrySelect = defineNamespace<CountrySelectLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/country-select").then(module => module.uiCountrySelectEn),
    ar: () => import("@/shared/locale/ar/ui/country-select").then(module => module.uiCountrySelectAr),
  },
});
