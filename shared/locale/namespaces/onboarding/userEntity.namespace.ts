import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

export const OnboardingUserEntity = defineNamespace<UserEntityOnboardingLabels>({
  load: {
    en: () => import("@/shared/locale/en/onboarding/userEntity").then(module => module.onboardingUserEntityEn),
    ar: () => import("@/shared/locale/ar/onboarding/userEntity").then(module => module.onboardingUserEntityAr),
  },
});
