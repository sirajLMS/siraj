"use client";

import { DaysScheduleSectionShared } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/daysScheduleSectionShared";
import type { DaysScheduleSectionProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { DayScheduleRowMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/dayScheduleRow.mobile";

export function DaysScheduleSectionMobile(props: DaysScheduleSectionProps) {
  return <DaysScheduleSectionShared {...props} DayScheduleRow={DayScheduleRowMobile} />;
}
