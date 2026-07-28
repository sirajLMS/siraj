import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CurrencySelectLabels } from "@/shared/locale/types/ui";

export const UiCurrencySelect = defineNamespace<CurrencySelectLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/currency-select").then(module => module.uiCurrencySelectEn),
    ar: () => import("@/shared/locale/ar/ui/currency-select").then(module => module.uiCurrencySelectAr),
  },
});
