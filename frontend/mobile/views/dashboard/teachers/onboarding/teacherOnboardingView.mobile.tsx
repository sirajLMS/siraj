"use client";

import { TeacherOnboardingShared } from "@/frontend/common/views/dashboard/teachers/onboarding/__shared__/teacherOnboardingShared";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar";
import { Translation, useAppTranslation } from "@/shared/locale";

export function TeacherOnboardingMobileView({ ...vm }: Readonly<TeacherOnboardingViewModel>) {
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);
  return (
    <TeacherOnboardingShared
      vm={vm}
      options={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        SectionPanel: MobileSectionPanel,
        PrimaryPageAction: MobilePrimaryPageAction,
        FormSuccessSnackbar: MobileFormSuccessSnackbar,
        userEntityLabels,
        formActionsFlexWrap: "wrap",
      }}
    />
  );
}
