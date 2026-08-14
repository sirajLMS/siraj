"use client";

import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import {
  GeneralUserCreateShared,
  type GeneralUserCreateSharedOptions,
} from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared";
import { useGeneralUserCreateViewModel } from "@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel";
import { MobileFormErrorSnackbar, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";

const mobileOptions: GeneralUserCreateSharedOptions = {
  SectionPanel: MobileSectionPanel,
  PrimaryPageAction: MobilePrimaryPageAction,
  FormSuccessSnackbar,
  FormErrorSnackbar: MobileFormErrorSnackbar,
  footerPadding: 2,
  buttonFullWidth: true,
  buttonSx: { py: 1.5 },
  formGap: 2,
};

export function GeneralUserCreateMobile() {
  const vm = useGeneralUserCreateViewModel();

  return (
    <MobilePageContainer>
      <MobilePageHeader title={vm.labels.pageTitle} edgeToEdge={false} />
      <GeneralUserCreateShared {...vm} options={mobileOptions} />
    </MobilePageContainer>
  );
}
