import { authImpersonationAr } from "@/shared/locale/ar/auth/impersonation";
import { authLoginAr } from "@/shared/locale/ar/auth/login";
import type { AuthLabels } from "@/shared/locale/types/auth";

export const authAr: AuthLabels = {
  login: authLoginAr,
  impersonation: authImpersonationAr,
  groupSimulation: {
    switchRoleTo: "التبديل إلى دور…",
    returnToNormalRole: "العودة إلى دوري العادي",
    bannerSimulatingAs: name => `أنت تعاين الموقع بدور ${name}.`,
  },
};
