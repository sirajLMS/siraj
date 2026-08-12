"use client";

import { Box, Stack } from "@mui/material";
import { TeacherClassListViewShared } from "@/frontend/common/views/dashboard/teachers/classes/__shared__/teacherClassListViewShared";
import type { TeacherClassListViewModel } from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { ClassSessionActionButtonDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/classSessionActionButton.desktop";

function DesktopRowWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 1,
        border: `1px solid ${theme.palette.border.light}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      })}
    >
      {children}
    </Box>
  );
}

function DesktopListContainer({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Stack spacing={1}>{children}</Stack>;
}

export function TeacherClassListDesktopView(props: Readonly<TeacherClassListViewModel>) {
  return (
    <TeacherClassListViewShared
      {...props}
      slots={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        RowWrapper: DesktopRowWrapper,
        ListContainer: DesktopListContainer,
        MeetingJoinAction: DesktopMeetingJoinAction,
        ClassSessionActionButton: ClassSessionActionButtonDesktop,
      }}
      options={{
        actionButtonMarginTop: 0,
      }}
    />
  );
}
