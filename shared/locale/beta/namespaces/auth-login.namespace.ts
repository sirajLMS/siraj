import { defineBetaNamespace } from "@/shared/locale/beta/define-beta-namespace";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

export const AuthLoginBeta = defineBetaNamespace<AuthLoginLabels>({
  load: {
    en: () => import("@/shared/locale/beta/en/auth-login").then(module => module.authLoginBetaEn),
    ar: () => import("@/shared/locale/beta/ar/auth-login").then(module => module.authLoginBetaAr),
  },
});
