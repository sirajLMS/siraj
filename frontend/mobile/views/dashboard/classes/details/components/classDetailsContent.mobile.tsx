"use client";

import { ClassDetailsContentShared } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContentShared";
import type {
  ClassDetailsContentProps,
  ClassDetailsMetricGridSlotProps,
} from "@/frontend/common/views/dashboard/classes/details/types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import { ClassDetailsHeaderMobile } from "@/frontend/mobile/views/dashboard/classes/details/components/classDetailsHeader.mobile";

// Mobile metric grids are always horizontal scroll rows.
const MobileDetailsMetricGrid = ({ metrics }: ClassDetailsMetricGridSlotProps) => (
  <MobileMetricCardGrid metrics={metrics} />
);

export function ClassDetailsContentMobile(props: Readonly<ClassDetailsContentProps>) {
  return (
    <ClassDetailsContentShared
      props={props}
      slots={{
        Header: ClassDetailsHeaderMobile,
        TeacherPerformanceMetricGrid: MobileDetailsMetricGrid,
        LivePerformanceMetricGrid: MobileDetailsMetricGrid,
      }}
    />
  );
}
