import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

export const AuthLogin = defineNamespace<AuthLoginLabels>("auth.login", {
  load: {
    en: () => import("@/shared/locale/en/auth/login").then(module => module.authLoginEn),
    ar: () => import("@/shared/locale/ar/auth/login").then(module => module.authLoginAr),
  },
});
