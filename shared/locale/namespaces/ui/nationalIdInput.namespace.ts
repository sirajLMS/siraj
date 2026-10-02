import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { NationalIdInputLabels } from "@/shared/locale/types/ui";

export const UiNationalIdInput = defineNamespace<NationalIdInputLabels>("ui.nationalIdInput", {
  load: {
    en: () => import("@/shared/locale/en/ui/national-id-input").then(module => module.uiNationalIdInputEn),
    ar: () => import("@/shared/locale/ar/ui/national-id-input").then(module => module.uiNationalIdInputAr),
  },
});
