import type { AuthLabels } from "../../types/auth";
import { authGroupSimulationEn } from "./groupSimulation";
import { authImpersonationEn } from "./impersonation";
import { authLoginEn } from "./login";

export const authEn: AuthLabels = {
  login: authLoginEn,
  impersonation: authImpersonationEn,
  groupSimulation: authGroupSimulationEn,
};
