import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

export const WhatsappInbox = defineNamespace<WhatsappInboxLabels>("whatsappInbox.whatsappInbox", {
  load: {
    en: () => import("@/shared/locale/en/whatsappInbox").then(module => module.whatsappInboxEn),
    ar: () => import("@/shared/locale/ar/whatsappInbox").then(module => module.whatsappInboxAr),
  },
});
