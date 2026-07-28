import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TagInputLabels } from "@/shared/locale/types/ui";

export const UiTagInput = defineNamespace<TagInputLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/tag-input").then(module => module.uiTagInputEn),
    ar: () => import("@/shared/locale/ar/ui/tag-input").then(module => module.uiTagInputAr),
  },
});
