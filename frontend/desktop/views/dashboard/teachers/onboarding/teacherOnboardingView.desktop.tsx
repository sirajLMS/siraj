"use client";

import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { TeacherOnboardingShared } from "@/frontend/common/views/dashboard/teachers/onboarding/__shared__/teacherOnboardingShared";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import {
  DesktopFormErrorSnackbar,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { CountrySelectDesktop } from "@/frontend/desktop/components/ui/input/countrySelect";
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
        FormSuccessSnackbar: FormSuccessSnackbar,
        FormErrorSnackbar: DesktopFormErrorSnackbar,
        CountrySelectComponent: CountrySelectDesktop,
        userEntityLabels,
        formActionsFlexWrap: "nowrap",
      }}
    />
  );
}
