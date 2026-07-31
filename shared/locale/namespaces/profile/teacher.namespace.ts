import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ProfileTeacherLabels } from "@/shared/locale/types/profile";

export const ProfileTeacher = defineNamespace<ProfileTeacherLabels>("profile.teacher", {
  load: {
    en: () => import("@/shared/locale/en/profile/teacher").then(module => module.profileTeacherEn),
    ar: () => import("@/shared/locale/ar/profile/teacher").then(module => module.profileTeacherAr),
  },
});
