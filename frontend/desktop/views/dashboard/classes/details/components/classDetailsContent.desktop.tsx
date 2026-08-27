"use client";

import { ClassDetailsContentShared } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContentShared";
import type {
  ClassDetailsContentProps,
  ClassDetailsMetricGridSlotProps,
} from "@/frontend/common/views/dashboard/classes/details/types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { ClassDetailsHeaderDesktop } from "@/frontend/desktop/views/dashboard/classes/details/components/classDetailsHeader.desktop";

// Three performance stats stay three-across inside the half-width card column.
const TeacherPerformanceMetricGrid = ({ metrics }: ClassDetailsMetricGridSlotProps) => (
  <DesktopMetricCardGrid metrics={metrics} size={{ xs: 4 }} />
);

// Live performance renders as a horizontal scroll row, matching its previous layout.
const LivePerformanceMetricGrid = ({ metrics }: ClassDetailsMetricGridSlotProps) => (
  <DesktopMetricCardGrid metrics={metrics} layout="scroll" />
);

export function ClassDetailsContentDesktop(props: Readonly<ClassDetailsContentProps>) {
  return (
    <ClassDetailsContentShared
      props={props}
      slots={{ Header: ClassDetailsHeaderDesktop, TeacherPerformanceMetricGrid, LivePerformanceMetricGrid }}
    />
  );
}
