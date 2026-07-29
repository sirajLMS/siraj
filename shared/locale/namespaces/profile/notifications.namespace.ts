import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export const ProfileNotifications = defineNamespace<ProfileNotificationsLabels>({
  load: {
    en: () => import("@/shared/locale/en/profile/notifications").then(module => module.profileNotificationsEn),
    ar: () => import("@/shared/locale/ar/profile/notifications").then(module => module.profileNotificationsAr),
  },
});
