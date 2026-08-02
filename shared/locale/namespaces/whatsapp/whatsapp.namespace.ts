import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export const Whatsapp = defineNamespace<WhatsappLabels>("whatsapp.whatsapp", {
  load: {
    en: () => import("@/shared/locale/en/whatsapp").then(module => module.whatsappEn),
    ar: () => import("@/shared/locale/ar/whatsapp").then(module => module.whatsappAr),
  },
});
