"use client";

import { Stack } from "@mui/material";
import { TeacherClassListViewShared } from "@/frontend/common/views/dashboard/teachers/classes/__shared__/teacherClassListViewShared";
import type { TeacherClassListViewModel } from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";
import { MobileCardListItem, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { ClassSessionActionButtonMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/components/classSessionActionButton.mobile";

function MobileListContainer({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Stack spacing={1}>{children}</Stack>;
}

export function TeacherClassListMobileView(props: Readonly<TeacherClassListViewModel>) {
  return (
    <TeacherClassListViewShared
      {...props}
      slots={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        RowWrapper: MobileCardListItem,
        ListContainer: MobileListContainer,
        MeetingJoinAction: MobileMeetingJoinAction,
        ClassSessionActionButton: ClassSessionActionButtonMobile,
      }}
      options={{
        actionButtonMarginTop: 1.5,
      }}
    />
  );
}
