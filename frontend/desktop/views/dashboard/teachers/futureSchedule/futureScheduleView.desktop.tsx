"use client";

import {
  ClassListWrapperPassthrough,
  FutureScheduleViewShared,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/__shared__/futureScheduleViewShared";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { FutureClassCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/futureClassCard.desktop";
import { ImportantNotesDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/importantNotes.desktop";
import { JumpToDateHeaderDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.desktop";
import { MiniCalendarDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/miniCalendar.desktop";
import { SupportContactDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/supportContact.desktop";

export function FutureScheduleViewDesktop(props: Readonly<FutureScheduleViewModel>) {
  return (
    <FutureScheduleViewShared
      {...props}
      slots={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        JumpToDateHeader: JumpToDateHeaderDesktop,
        FutureClassCard: FutureClassCardDesktop,
        ClassListWrapper: ClassListWrapperPassthrough,
        MiniCalendar: MiniCalendarDesktop,
        ImportantNotes: ImportantNotesDesktop,
        SupportContact: SupportContactDesktop,
      }}
      options={{
        mainGridSize: { xs: 12, lg: 8 },
        sidebarGridSize: { xs: 12, lg: 4 },
        legendSecondColorLabel: "regular",
      }}
    />
  );
}
