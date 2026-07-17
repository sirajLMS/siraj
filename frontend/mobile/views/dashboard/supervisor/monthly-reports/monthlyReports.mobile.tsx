"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { MonthlyReportsViewModel } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/useMonthlyReportsViewModel";
import {
  MobileContentStack,
  MobileFilterButton,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export function MonthlyReportsMobileView({
  reportType,
  year,
  month,
  teacherId,
  studentId,
  metrics,
  loading,
  labels,
  onReportTypeChange,
  onYearChange,
  onMonthChange,
  onTeacherIdChange,
  onStudentIdChange,
  onGenerate,
}: Readonly<MonthlyReportsViewModel>) {
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
                  {MONTHS.map(m => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {reportType === "teacher" ? (
              <TextField
                fullWidth
                label={labels.selectTeacher}
                value={teacherId}
                onChange={e => onTeacherIdChange(e.target.value)}
              />
            ) : (
              <TextField
                fullWidth
                label={labels.selectStudent}
                value={studentId}
                onChange={e => onStudentIdChange(e.target.value)}
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

        {metrics.length > 0 ? (
          <Grid container spacing={2}>
            {metrics.map(metric => (
              <Grid key={metric.label} size={6}>
                <MobileMetricCard
                  icon={CalendarMonthOutlined}
                  label={metric.label}
                  value={metric.value}
                  variant="compact"
                />
              </Grid>
            ))}
          </Grid>
        ) : null}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
