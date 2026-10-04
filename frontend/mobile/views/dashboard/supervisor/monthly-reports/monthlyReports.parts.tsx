"use client";

import { Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { PeriodFieldsShared } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/__shared__/periodFieldsShared";
import type {
  PeriodFieldsProps,
  ReportStatusProps,
  ReportTypeToggleProps,
  ScopeSelectProps,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import { MobileFilterButton } from "@/frontend/mobile/components/ui";
import { StudentAutocompleteMobile, TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

function buildActiveToggleSx(isActive: boolean): SxProps<Theme> {
  let sx: SxProps<Theme>;
  if (!isActive) {
    sx = {};
  } else {
    sx = theme => ({
      backgroundColor: theme.palette.primaryContainer,
      color: theme.palette.onPrimaryContainer,
    });
  }
  return sx;
}

export function ReportTypeToggle({ reportType, labels, onReportTypeChange }: ReportTypeToggleProps) {
  return (
    <Stack sx={{ flexDirection: "row", gap: 1 }}>
      <MobileFilterButton
        onClick={() => onReportTypeChange("teacher")}
        sx={buildActiveToggleSx(reportType === "teacher")}
      >
        {labels.teacherReport}
      </MobileFilterButton>
      <MobileFilterButton
        onClick={() => onReportTypeChange("student")}
        sx={buildActiveToggleSx(reportType === "student")}
      >
        {labels.studentReport}
      </MobileFilterButton>
    </Stack>
  );
}

export function PeriodFields({ year, month, labels, onYearChange, onMonthChange }: PeriodFieldsProps) {
  return (
    <PeriodFieldsShared
      year={year}
      month={month}
      labels={labels}
      onYearChange={onYearChange}
      onMonthChange={onMonthChange}
      gridSize={6}
      containerSpacing={1}
      wrapInContainer
    />
  );
}

export function ScopeSelect({
  reportType,
  selectedTeacher,
  studentSelection,
  labels,
  onSelectedTeacherChange,
  onStudentSelectionChange,
}: ScopeSelectProps) {
  if (reportType === "teacher") {
    return (
      <TeacherAutocompleteMobile
        value={selectedTeacher}
        onChange={onSelectedTeacherChange}
        label={labels.selectTeacher}
        placeholder={labels.teacherSearchPlaceholder}
      />
    );
  }
  return (
    <StudentAutocompleteMobile
      value={studentSelection}
      onChange={onStudentSelectionChange}
      label={labels.selectStudent}
      placeholder={labels.studentSearchPlaceholder}
    />
  );
}

export function ReportStatusMessage({ loading, hasMetrics, labels }: ReportStatusProps) {
  if (loading) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {labels.loadingMessage}
      </Typography>
    );
  }
  if (!hasMetrics) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {labels.noDataAvailable}
      </Typography>
    );
  }
  return null;
}
