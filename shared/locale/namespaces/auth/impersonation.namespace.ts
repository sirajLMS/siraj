import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { AuthImpersonationLabels } from "@/shared/locale/types/auth";

export const AuthImpersonation = defineNamespace<AuthImpersonationLabels>({
  load: {
    en: () => import("@/shared/locale/en/auth/impersonation").then(module => module.authImpersonationEn),
    ar: () => import("@/shared/locale/ar/auth/impersonation").then(module => module.authImpersonationAr),
  },
});
