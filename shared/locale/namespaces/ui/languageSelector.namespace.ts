import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { LanguageSelectorLabels } from "@/shared/locale/types/ui";

export const UiLanguageSelector = defineNamespace<LanguageSelectorLabels>("ui.languageSelector", {
  load: {
    en: () => import("@/shared/locale/en/ui/language-selector").then(module => module.uiLanguageSelectorEn),
    ar: () => import("@/shared/locale/ar/ui/language-selector").then(module => module.uiLanguageSelectorAr),
  },
});
