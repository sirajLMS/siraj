import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { EmailsLabels } from "@/shared/locale/types/emails";

export const Emails = defineNamespace<EmailsLabels>("emails.emails", {
  load: {
    en: () => import("@/shared/locale/en/emails").then(module => module.emailsEn),
    ar: () => import("@/shared/locale/ar/emails").then(module => module.emailsAr),
  },
});
