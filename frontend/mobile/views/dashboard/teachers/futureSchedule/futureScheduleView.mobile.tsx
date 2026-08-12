"use client";

import {
  ClassListWrapperPassthrough,
  FutureScheduleViewShared,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/__shared__/futureScheduleViewShared";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { FutureClassCardMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/futureClassCard.mobile";
import { ImportantNotesMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/importantNotes.mobile";
import { JumpToDateHeaderMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.mobile";
import { MiniCalendarMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/miniCalendar.mobile";
import { SupportContactMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/supportContact.mobile";

export function FutureScheduleViewMobile(props: Readonly<FutureScheduleViewModel>) {
  return (
    <FutureScheduleViewShared
      {...props}
      slots={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        JumpToDateHeader: JumpToDateHeaderMobile,
        FutureClassCard: FutureClassCardMobile,
        ClassListWrapper: ClassListWrapperPassthrough,
        MiniCalendar: MiniCalendarMobile,
        ImportantNotes: ImportantNotesMobile,
        SupportContact: SupportContactMobile,
      }}
      options={{
        mainGridSize: { xs: 12 },
        sidebarGridSize: { xs: 12 },
        legendSecondColorLabel: "reScheduled",
        sidebarStackSx: { mt: 2 },
      }}
    />
  );
}
