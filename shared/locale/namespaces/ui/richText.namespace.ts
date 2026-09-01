import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { RichTextLabels } from "@/shared/locale/types/ui";

export const UiRichText = defineNamespace<RichTextLabels>("ui.richText", {
  load: {
    en: () => import("@/shared/locale/en/ui/rich-text").then(module => module.uiRichTextEn),
    ar: () => import("@/shared/locale/ar/ui/rich-text").then(module => module.uiRichTextAr),
  },
});
