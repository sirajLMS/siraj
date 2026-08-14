"use client";

import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import {
  GeneralUserCreateShared,
  type GeneralUserCreateSharedOptions,
} from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared";
import { useGeneralUserCreateViewModel } from "@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel";
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

const desktopOptions: GeneralUserCreateSharedOptions = {
  SectionPanel: DesktopSectionPanel,
  PrimaryPageAction: DesktopPrimaryPageAction,
  FormSuccessSnackbar,
  FormErrorSnackbar: DesktopFormErrorSnackbar,
  footerPadding: 2,
  buttonSx: { maxWidth: 200 },
  formGap: 3,
};

export function GeneralUserCreateDesktop() {
  const vm = useGeneralUserCreateViewModel();

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={vm.labels.pageTitle} />
      <GeneralUserCreateShared {...vm} options={desktopOptions} />
    </DesktopPageContainer>
  );
}
