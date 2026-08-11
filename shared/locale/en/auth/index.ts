import type { AuthLabels } from "@/shared/locale/types/auth";
import { authLoginEn } from "@/shared/locale/en/auth/login";
import { authImpersonationEn } from "@/shared/locale/en/auth/impersonation";

export const authEn: AuthLabels = {
  login: authLoginEn,
  impersonation: authImpersonationEn,
  groupSimulation: {
    switchRoleTo: "Switch role to…",
    returnToNormalRole: "Return to my normal role",
    bannerSimulatingAs: name => `You are previewing the site as ${name} role.`,
  },
};
