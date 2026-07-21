"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useMemo } from "react";
import type {
  MonthlyReportsViewModel,
  PeriodFieldsProps,
  ReportStatusProps,
  ReportTypeToggleProps,
  ScopeSelectProps,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
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

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

function buildActiveToggleSx(isActive: boolean): SxProps<Theme> {
  if (!isActive) {
    return {};
  }
  return theme => ({
    backgroundColor: theme.palette.primaryContainer,
    color: theme.palette.onPrimaryContainer,
  });
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
    <Grid container spacing={1}>
      <Grid size={6}>
        <TextField
          select
          fullWidth
          label={labels.selectYear}
          value={year}
          onChange={e => onYearChange(Number(e.target.value))}
        >
          {YEARS.map(y => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={6}>
        <TextField
          select
          fullWidth
          label={labels.selectMonth}
          value={month}
          onChange={e => onMonthChange(Number(e.target.value))}
        >
          {labels.monthNames.map((name, index) => (
            <MenuItem key={name} value={index + 1}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
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
