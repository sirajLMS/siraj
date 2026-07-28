import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { AuthGroupSimulationLabels } from "@/shared/locale/types/auth";

export const AuthGroupSimulation = defineNamespace<AuthGroupSimulationLabels>({
  load: {
    en: () => import("@/shared/locale/en/auth/groupSimulation").then(module => module.authGroupSimulationEn),
    ar: () => import("@/shared/locale/ar/auth/groupSimulation").then(module => module.authGroupSimulationAr),
  },
});
