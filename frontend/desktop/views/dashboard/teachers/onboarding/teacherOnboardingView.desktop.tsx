"use client";

import { TeacherOnboardingShared } from "@/frontend/common/views/dashboard/teachers/onboarding/__shared__/teacherOnboardingShared";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import {
  DesktopFormErrorSnackbar,
  DesktopFormSuccessSnackbar,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { Translation, useAppTranslation } from "@/shared/locale";

export function TeacherOnboardingDesktopView({ ...vm }: Readonly<TeacherOnboardingViewModel>) {
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);
  return (
    <TeacherOnboardingShared
      vm={vm}
      options={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        SectionPanel: DesktopSectionPanel,
        PrimaryPageAction: DesktopPrimaryPageAction,
        FormSuccessSnackbar: DesktopFormSuccessSnackbar,
        FormErrorSnackbar: DesktopFormErrorSnackbar,
        userEntityLabels,
        formActionsFlexWrap: "nowrap",
      }}
    />
  );
}
