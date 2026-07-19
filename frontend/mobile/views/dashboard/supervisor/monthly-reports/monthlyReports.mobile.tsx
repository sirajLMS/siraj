"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import type { MonthlyReportsViewModel } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
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

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} />

        <MobileSectionPanel title={labels.reportTypeToggle}>
          <Stack sx={{ gap: 1.5 }}>
            <Stack sx={{ flexDirection: "row", gap: 1 }}>
              <MobileFilterButton
                onClick={() => onReportTypeChange("teacher")}
                sx={theme =>
                  reportType === "teacher"
                    ? { backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer }
                    : {}
                }
              >
                {labels.teacherReport}
              </MobileFilterButton>
              <MobileFilterButton
                onClick={() => onReportTypeChange("student")}
                sx={theme =>
                  reportType === "student"
                    ? { backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer }
                    : {}
                }
              >
                {labels.studentReport}
              </MobileFilterButton>
            </Stack>

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

            {reportType === "teacher" ? (
              <TeacherAutocompleteMobile
                value={selectedTeacher}
                onChange={onSelectedTeacherChange}
                label={labels.selectTeacher}
                placeholder={labels.teacherSearchPlaceholder}
              />
            ) : (
              <StudentAutocompleteMobile
                value={studentSelection}
                onChange={onStudentSelectionChange}
                label={labels.selectStudent}
                placeholder={labels.studentSearchPlaceholder}
              />
            )}

            <MobilePrimaryPageAction onClick={onGenerate} startIcon={<CalendarMonthOutlined />}>
              {labels.generateReport}
            </MobilePrimaryPageAction>
          </Stack>
        </MobileSectionPanel>

        {loading ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.loadingMessage}
          </Typography>
        ) : null}

        {!loading && metrics.length === 0 ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.noDataAvailable}
          </Typography>
        ) : null}

        {metrics.length > 0 ? <MobileMetricCardGrid metrics={metricItems} /> : null}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
