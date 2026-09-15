"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import {
  MeetingProviderFormShared,
  type MeetingProviderFormSharedProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared";
import type { MeetingProviderFormViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import { MobilePageContainer, MobilePageHeader, MobileSectionPanel } from "@/frontend/mobile/components/ui";

const mobileSlots: MeetingProviderFormSharedProps["slots"] = {
  PageContainer: MobilePageContainer,
  PageHeader: MobilePageHeader,
  SectionPanel: MobileSectionPanel,
};

const mobileStyles: MeetingProviderFormSharedProps["styles"] = {
  sectionStackSpacing: 2.5,
  capabilitiesStackSpacing: 1,
  fieldsStackSpacing: 2,
  actionsFullWidth: true,
  actionsStackSpacing: 1.5,
  actionsJustifyEnd: false,
  formSx: { px: 2, pb: 4 },
  loadingFirstHeight: 100,
  LoadingWrapper: function MobileLoadingWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <Box sx={{ p: 2 }}>{children}</Box>;
  },
};

export function MeetingProviderFormMobileView(props: Readonly<MeetingProviderFormViewProps>) {
  return <MeetingProviderFormShared {...props} slots={mobileSlots} styles={mobileStyles} />;
}
