"use client";

import { MiniCalendarShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/miniCalendarShared";
import type { MiniCalendarProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

export function MiniCalendarMobile({ selectedDate, onSelectDate, classDates, labels }: Readonly<MiniCalendarProps>) {
  return (
    <MiniCalendarShared
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      classDates={classDates}
      labels={labels}
      CardComponent={MobileBaseCard}
    />
  );
}
