import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ProfileLabels } from "@/shared/locale/types/profile";

export const ProfileBase = defineNamespace<ProfileLabels>("profile.base", {
  load: {
    en: () => import("@/shared/locale/en/profile/base").then(module => module.profileBaseEn),
    ar: () => import("@/shared/locale/ar/profile/base").then(module => module.profileBaseAr),
  },
});
