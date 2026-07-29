import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SessionLabels } from "@/shared/locale/types/session";

export const Session = defineNamespace<SessionLabels>({
  load: {
    en: () => import("@/shared/locale/en/session").then(module => module.sessionEn),
    ar: () => import("@/shared/locale/ar/session").then(module => module.sessionAr),
  },
});
