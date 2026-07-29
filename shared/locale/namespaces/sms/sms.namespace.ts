import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SmsLabels } from "@/shared/locale/types/sms";

export const Sms = defineNamespace<SmsLabels>({
  load: {
    en: () => import("@/shared/locale/en/sms").then(module => module.smsEn),
    ar: () => import("@/shared/locale/ar/sms").then(module => module.smsAr),
  },
});
