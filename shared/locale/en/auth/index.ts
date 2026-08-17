import type { AuthLabels } from "../../types/auth";
import { authImpersonationEn } from "./impersonation";
import { authLoginEn } from "./login";

export const authEn: AuthLabels = {
  login: authLoginEn,
  impersonation: authImpersonationEn,
  groupSimulation: {
    switchRoleTo: "Switch role to…",
    returnToNormalRole: "Return to my normal role",
    bannerSimulatingAs: name => `You are previewing the site as ${name} role.`,
  },
};
