import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

export const WhatsappConversations = defineNamespace<WhatsappConversationsLabels>(
  "whatsappConversations.whatsappConversations",
  {
    load: {
      en: () => import("@/shared/locale/en/whatsappConversations").then(module => module.whatsappConversationsEn),
      ar: () => import("@/shared/locale/ar/whatsappConversations").then(module => module.whatsappConversationsAr),
    },
  }
);
