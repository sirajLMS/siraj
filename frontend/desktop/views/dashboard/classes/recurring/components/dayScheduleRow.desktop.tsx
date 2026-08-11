"use client";

import { DayScheduleRowShared } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared";
import { DESKTOP_ROW_OPTIONS } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.options";
import type { DayScheduleRowProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export function DayScheduleRowDesktop(props: DayScheduleRowProps) {
  return <DayScheduleRowShared {...props} options={DESKTOP_ROW_OPTIONS} />;
}
