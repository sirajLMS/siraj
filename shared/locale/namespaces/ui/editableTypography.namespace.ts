import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { EditableTypographyLabels } from "@/shared/locale/types/ui";

export const UiEditableTypography = defineNamespace<EditableTypographyLabels>("ui.editableTypography", {
  load: {
    en: () => import("@/shared/locale/en/ui/editableTypography").then(module => module.uiEditableTypographyEn),
    ar: () => import("@/shared/locale/ar/ui/editableTypography").then(module => module.uiEditableTypographyAr),
  },
});
