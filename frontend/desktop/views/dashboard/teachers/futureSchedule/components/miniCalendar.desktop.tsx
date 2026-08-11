"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import { MiniCalendarShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/miniCalendarShared";
import type { MiniCalendarProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";

export function MiniCalendarDesktop({ selectedDate, onSelectDate, classDates, labels }: Readonly<MiniCalendarProps>) {
  return (
    <MiniCalendarShared
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      classDates={classDates}
      labels={labels}
      CardComponent={BaseCard}
    />
  );
}
