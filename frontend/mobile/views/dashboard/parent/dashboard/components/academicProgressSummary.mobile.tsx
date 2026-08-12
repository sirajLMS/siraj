"use client";

import type { ReactNode } from "react";
import { AcademicProgressSummaryShared } from "@/frontend/common/views/dashboard/parent/dashboard/components/__shared__/academicProgressSummaryShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/parent/dashboard/components/__shared__/academicProgressSummaryShared.options";
import type { AcademicProgressSummaryProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";

export function AcademicProgressSummaryMobile({
  studentProgress,
  labels,
  onDownloadReport,
}: Readonly<AcademicProgressSummaryProps>): ReactNode {
  return (
    <AcademicProgressSummaryShared
      studentProgress={studentProgress}
      labels={labels}
      onDownloadReport={onDownloadReport}
      options={MOBILE_OPTIONS}
    />
  );
}
