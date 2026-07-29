import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export const Errors = defineNamespace<ErrorsLabels>({
  load: {
    en: () => import("@/shared/locale/en/errors").then(module => module.errorsEn),
    ar: () => import("@/shared/locale/ar/errors").then(module => module.errorsAr),
  },
});
