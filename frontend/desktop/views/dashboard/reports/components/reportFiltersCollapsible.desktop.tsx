"use client";

import { Box } from "@mui/material";
import type { ReportFiltersFormProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { ReportFiltersFormDesktop } from "@/frontend/desktop/views/dashboard/reports/components/reportFiltersForm.desktop";

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
  labels,
  canGenerate,
  onFromDateChange,
  onToDateChange,
  onTeacherChange,
  onReportTypeChange,
  onSubmit,
}: Readonly<ReportFiltersFormProps>) {
  return (
    <Box sx={{ px: 2, py: 2 }}>
      <ReportFiltersFormDesktop
        fromDate={fromDate}
        toDate={toDate}
        teacherId={teacherId}
        reportType={reportType}
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
