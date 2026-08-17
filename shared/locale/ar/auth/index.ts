import type { AuthLabels } from "../../types/auth";
import { authImpersonationAr } from "./impersonation";
import { authLoginAr } from "./login";

export const authAr: AuthLabels = {
  login: authLoginAr,
  impersonation: authImpersonationAr,
  groupSimulation: {
    switchRoleTo: "التبديل إلى دور…",
    returnToNormalRole: "العودة إلى دوري العادي",
    bannerSimulatingAs: name => `أنت تعاين الموقع بدور ${name}.`,
  },
};
