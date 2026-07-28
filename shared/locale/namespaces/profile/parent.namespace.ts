import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ProfileParentLabels } from "@/shared/locale/types/profile";

export const ProfileParent = defineNamespace<ProfileParentLabels>({
  load: {
    en: () => import("@/shared/locale/en/profile/parent").then(module => module.profileParentEn),
    ar: () => import("@/shared/locale/ar/profile/parent").then(module => module.profileParentAr),
  },
});
