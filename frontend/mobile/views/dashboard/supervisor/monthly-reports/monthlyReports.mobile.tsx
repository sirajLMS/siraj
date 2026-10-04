"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Stack } from "@mui/material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { MonthlyReportsViewModel } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import {
  MobileContentStack,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import {
  PeriodFields,
  ReportStatusMessage,
  ReportTypeToggle,
  ScopeSelect,
} from "@/frontend/mobile/views/dashboard/supervisor/monthly-reports/monthlyReports.parts";

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
