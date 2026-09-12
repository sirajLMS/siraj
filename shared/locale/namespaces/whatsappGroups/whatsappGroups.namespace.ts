import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

export const WhatsappGroups = defineNamespace<WhatsappGroupsLabels>("whatsappGroups.whatsappGroups", {
  load: {
    en: () => import("@/shared/locale/en/whatsappGroups").then(module => module.whatsappGroupsEn),
    ar: () => import("@/shared/locale/ar/whatsappGroups").then(module => module.whatsappGroupsAr),
  },
});
