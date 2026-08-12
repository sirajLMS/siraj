"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { PeriodFieldsShared } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/__shared__/periodFieldsShared";
import type {
  MonthlyReportsViewModel,
  PeriodFieldsProps,
  ReportStatusProps,
  ReportTypeToggleProps,
  ScopeSelectProps,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import {
  MobileContentStack,
  MobileFilterButton,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
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

function ReportTypeToggle({ reportType, labels, onReportTypeChange }: ReportTypeToggleProps) {
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

function PeriodFields({ year, month, labels, onYearChange, onMonthChange }: PeriodFieldsProps) {
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

function ScopeSelect({
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

function ReportStatusMessage({ loading, hasMetrics, labels }: ReportStatusProps) {
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

export function MonthlyReportsMobileView(props: Readonly<MonthlyReportsViewModel>) {
  const {
    reportType,
    year,
    month,
    selectedTeacher,
    studentSelection,
    metrics,
    loading,
    labels,
    onReportTypeChange,
    onYearChange,
    onMonthChange,
    onSelectedTeacherChange,
    onStudentSelectionChange,
    onGenerate,
  } = props;

  const metricItems: readonly MetricItem[] = useMemo(
    () =>
      metrics.map(metric => ({
        key: metric.label,
        label: metric.label,
        count: metric.value,
        icon: metric.icon,
        labelKey: metric.label,
      })),
    [metrics]
  );

  const hasMetrics = metrics.length > 0;

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} />

        <MobileSectionPanel title={labels.reportTypeToggle}>
          <Stack sx={{ gap: 1.5 }}>
            <ReportTypeToggle reportType={reportType} labels={labels} onReportTypeChange={onReportTypeChange} />

            <PeriodFields
              year={year}
              month={month}
              labels={labels}
              onYearChange={onYearChange}
              onMonthChange={onMonthChange}
            />

            <ScopeSelect
              reportType={reportType}
              selectedTeacher={selectedTeacher}
              studentSelection={studentSelection}
              labels={labels}
              onSelectedTeacherChange={onSelectedTeacherChange}
              onStudentSelectionChange={onStudentSelectionChange}
            />

            <MobilePrimaryPageAction onClick={onGenerate} startIcon={<CalendarMonthOutlined />}>
              {labels.generateReport}
            </MobilePrimaryPageAction>
          </Stack>
        </MobileSectionPanel>

        <ReportStatusMessage loading={loading} hasMetrics={hasMetrics} labels={labels} />

        {hasMetrics ? <MobileMetricCardGrid metrics={metricItems} /> : null}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
