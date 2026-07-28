import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PhoneInputLabels } from "@/shared/locale/types/ui";

export const UiPhoneInput = defineNamespace<PhoneInputLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/phone-input").then(module => module.uiPhoneInputEn),
    ar: () => import("@/shared/locale/ar/ui/phone-input").then(module => module.uiPhoneInputAr),
  },
});
