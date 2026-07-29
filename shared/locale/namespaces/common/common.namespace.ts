import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CommonLabels } from "@/shared/locale/types/common";

export const Common = defineNamespace<CommonLabels>({
  load: {
    en: () => import("@/shared/locale/en/common").then(module => module.commonEn),
    ar: () => import("@/shared/locale/ar/common").then(module => module.commonAr),
  },
});
