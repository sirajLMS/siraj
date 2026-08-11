// cspell:disable
"use client";

import type { WeeklyAvailabilityGridSharedOptions } from "@/frontend/common/views/dashboard/teachers/availability/components/types/weeklyAvailabilityGridShared.types";
import { WeeklyAvailabilityGridShared } from "@/frontend/common/views/dashboard/teachers/availability/components/weeklyAvailabilityGridShared";
import type { WeeklyAvailabilityGridProps } from "@/frontend/common/views/dashboard/teachers/availability/types";

const DESKTOP_OPTIONS: WeeklyAvailabilityGridSharedOptions = {
  gridTemplateColumns: "100px repeat(7, 1fr)",
  headerPadding: 2,
  headerLabelVariant: "labelUppercase",
  blockPadding: 1,
  rowMinHeight: 80,
  cellPadding: 0.5,
  gridMinWidth: 1000,
  momentumScroll: false,
};

export function WeeklyAvailabilityGridDesktop({
  availability,
  labels,
  onBlockClick,
}: Readonly<WeeklyAvailabilityGridProps>) {
  return (
    <WeeklyAvailabilityGridShared
      availability={availability}
      labels={labels}
      onBlockClick={onBlockClick}
      options={DESKTOP_OPTIONS}
    />
  );
}
