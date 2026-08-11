"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import { Button, Paper } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  MeetingProviderFormShared,
  type MeetingProviderFormSharedProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared";
import type { MeetingProviderFormViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

const desktopSlots: MeetingProviderFormSharedProps["slots"] = {
  PageContainer: DesktopPageContainer,
  PageHeader: DesktopPageHeader,
};

const desktopStyles: MeetingProviderFormSharedProps["styles"] = {
  sectionPaperPadding: 3,
  sectionTitleVariant: "h6",
  sectionTitleMb: 2,
  sectionStackSpacing: 3,
  capabilitiesStackSpacing: 1.5,
  fieldsStackSpacing: 2,
  actionsFullWidth: false,
  actionsStackSpacing: 2,
  actionsJustifyEnd: true,
  loadingFirstHeight: 120,
  LoadingWrapper: function DesktopLoadingWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <Paper sx={theme => ({ p: 3, borderRadius: theme.layout.radius.card })}>{children}</Paper>;
  },
};

export function MeetingProviderFormDesktopView(props: Readonly<MeetingProviderFormViewProps>) {
  return (
    <MeetingProviderFormShared
      {...props}
      slots={desktopSlots}
      styles={desktopStyles}
      BackAction={
        <Button
          component={Link}
          href="/meeting-providers"
          variant="outlined"
          startIcon={<ArrowBackOutlined />}
          size="small"
        >
          {props.t.backToProviders}
        </Button>
      }
    />
  );
}
