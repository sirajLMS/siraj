"use client";

import { DaysScheduleSectionShared } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/daysScheduleSectionShared";
import type { DaysScheduleSectionProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { DayScheduleRowDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/dayScheduleRow.desktop";

export function DaysScheduleSectionDesktop(props: DaysScheduleSectionProps) {
  return <DaysScheduleSectionShared {...props} DayScheduleRow={DayScheduleRowDesktop} />;
}
