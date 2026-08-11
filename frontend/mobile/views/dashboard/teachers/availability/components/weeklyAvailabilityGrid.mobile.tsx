// cspell:disable
"use client";

import type { WeeklyAvailabilityGridSharedOptions } from "@/frontend/common/views/dashboard/teachers/availability/components/types/weeklyAvailabilityGridShared.types";
import { WeeklyAvailabilityGridShared } from "@/frontend/common/views/dashboard/teachers/availability/components/weeklyAvailabilityGridShared";
import type { WeeklyAvailabilityGridProps } from "@/frontend/common/views/dashboard/teachers/availability/types";

const MOBILE_OPTIONS: WeeklyAvailabilityGridSharedOptions = {
  gridTemplateColumns: "70px repeat(7, minmax(64px, 1fr))",
  headerPadding: 1,
  headerLabelVariant: "labelSm",
  blockPadding: 0.5,
  rowMinHeight: 60,
  cellPadding: 0.25,
  gridMinWidth: 600,
  momentumScroll: true,
};

export function WeeklyAvailabilityGridMobile({
  availability,
  labels,
  onBlockClick,
}: Readonly<WeeklyAvailabilityGridProps>) {
  return (
    <WeeklyAvailabilityGridShared
      availability={availability}
      labels={labels}
      onBlockClick={onBlockClick}
      options={MOBILE_OPTIONS}
    />
  );
}
