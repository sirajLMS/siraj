import type { AuthLabels } from "../../types/auth";
import { authGroupSimulationAr } from "./groupSimulation";
import { authImpersonationAr } from "./impersonation";
import { authLoginAr } from "./login";

export const authAr: AuthLabels = {
  login: authLoginAr,
  impersonation: authImpersonationAr,
  groupSimulation: authGroupSimulationAr,
};
