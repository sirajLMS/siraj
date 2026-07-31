import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ProfileStaffLabels } from "@/shared/locale/types/profile";

export const ProfileStaff = defineNamespace<ProfileStaffLabels>("profile.staff", {
  load: {
    en: () => import("@/shared/locale/en/profile/staff").then(module => module.profileStaffEn),
    ar: () => import("@/shared/locale/ar/profile/staff").then(module => module.profileStaffAr),
  },
});
