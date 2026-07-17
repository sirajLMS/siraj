"use client";

import { Box } from "@mui/material";
import type { ReportTeacherOption, ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import {
  ReportFiltersFormDesktop,
  type ReportFiltersFormDesktopLabels,
} from "@/frontend/desktop/views/dashboard/reports/components/reportFiltersForm.desktop";

interface ReportFiltersFormPanelDesktopProps {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly teachers: readonly ReportTeacherOption[];
  readonly labels: ReportFiltersFormDesktopLabels;
  readonly canGenerate: boolean;
  readonly onFromDateChange: (date: string) => void;
  readonly onToDateChange: (date: string) => void;
  readonly onTeacherChange: (teacherId: string) => void;
  readonly onReportTypeChange: (reportType: ReportType) => void;
  readonly onSubmit: () => void;
}

/**
 * Desktop reports filters panel. Desktop's reports view renders the form
 * permanently inside a BaseCard (no collapsible wrapper), so this is a thin
 * wrapper around {@link ReportFiltersFormDesktop}.
 */
export function ReportFiltersCollapsibleDesktop({
  fromDate,
  toDate,
  teacherId,
  reportType,
  teachers,
  labels,
  canGenerate,
  onFromDateChange,
  onToDateChange,
  onTeacherChange,
  onReportTypeChange,
  onSubmit,
}: Readonly<ReportFiltersFormPanelDesktopProps>) {
  return (
    <Box sx={{ px: 2, py: 2 }}>
      <ReportFiltersFormDesktop
        fromDate={fromDate}
        toDate={toDate}
        teacherId={teacherId}
        reportType={reportType}
        teachers={teachers}
        labels={labels}
        canGenerate={canGenerate}
        onFromDateChange={onFromDateChange}
        onToDateChange={onToDateChange}
        onTeacherChange={onTeacherChange}
        onReportTypeChange={onReportTypeChange}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
