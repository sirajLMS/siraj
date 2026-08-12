"use client";

import { DayScheduleRowShared } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared";
import { MOBILE_ROW_OPTIONS } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.options";
import type { DayScheduleRowProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export function DayScheduleRowMobile(props: DayScheduleRowProps) {
  return <DayScheduleRowShared {...props} options={MOBILE_ROW_OPTIONS} />;
}
