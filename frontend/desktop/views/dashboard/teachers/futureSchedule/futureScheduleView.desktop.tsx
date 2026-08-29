"use client";

import { Fragment } from "react";
import {
  type FutureClassListWrapperProps,
  FutureScheduleViewShared,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/__shared__/futureScheduleViewShared";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { FutureClassCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/futureClassCard.desktop";
import { ImportantNotesDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/importantNotes.desktop";
import { JumpToDateHeaderDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.desktop";
import { MiniCalendarDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/miniCalendar.desktop";
import { SupportContactDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/supportContact.desktop";

// Desktop intentionally keeps the plain card stack — no list primitive or
// pager — so the wrapper just materializes each row through renderItem.
function FutureClassListDesktop({ rows, getKey, renderItem }: FutureClassListWrapperProps) {
  return (
    <>
      {rows.map(item => (
        <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
      ))}
    </>
  );
}

export function FutureScheduleViewDesktop(props: Readonly<FutureScheduleViewModel>) {
  return (
    <FutureScheduleViewShared
      {...props}
      slots={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        JumpToDateHeader: JumpToDateHeaderDesktop,
        FutureClassCard: FutureClassCardDesktop,
        ClassListWrapper: FutureClassListDesktop,
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
