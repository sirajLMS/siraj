import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { LocalizedStringLabels } from "@/shared/locale/types/ui";

export const UiLocalizedString = defineNamespace<LocalizedStringLabels>("ui.localizedString", {
  load: {
    en: () => import("@/shared/locale/en/ui/localized-string").then(module => module.uiLocalizedStringEn),
    ar: () => import("@/shared/locale/ar/ui/localized-string").then(module => module.uiLocalizedStringAr),
  },
});
