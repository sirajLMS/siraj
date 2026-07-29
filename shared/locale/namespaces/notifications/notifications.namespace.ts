import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { NotificationsLabels } from "@/shared/locale/types/notifications";

export const Notifications = defineNamespace<NotificationsLabels>({
  load: {
    en: () => import("@/shared/locale/en/notifications").then(module => module.notificationsEn),
    ar: () => import("@/shared/locale/ar/notifications").then(module => module.notificationsAr),
  },
});
