"use client";

import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { TeacherOnboardingShared } from "@/frontend/common/views/dashboard/teachers/onboarding/__shared__/teacherOnboardingShared";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
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
        FormSuccessSnackbar: FormSuccessSnackbar,
        userEntityLabels,
        formActionsFlexWrap: "wrap",
      }}
    />
  );
}
