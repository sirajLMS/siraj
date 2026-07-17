"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FilterButton, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { MonthlyReportsViewModel } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/useMonthlyReportsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export function MonthlyReportsDesktopView({
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
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} />

      <SectionPanel title={labels.reportTypeToggle}>
        <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
          <FilterButton
            onClick={() => onReportTypeChange("teacher")}
            sx={theme =>
              reportType === "teacher"
                ? { backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer }
                : {}
            }
          >
            {labels.teacherReport}
          </FilterButton>
          <FilterButton
            onClick={() => onReportTypeChange("student")}
            sx={theme =>
              reportType === "student"
                ? { backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer }
                : {}
            }
          >
            {labels.studentReport}
          </FilterButton>
        </Stack>

        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 3 }}>
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
          <Grid size={{ xs: 12, md: 3 }}>
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
          <Grid size={{ xs: 12, md: 3 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <PrimaryPageAction onClick={onGenerate} startIcon={<CalendarMonthOutlined />}>
              {labels.generateReport}
            </PrimaryPageAction>
          </Grid>
        </Grid>
      </SectionPanel>

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
        <Grid container spacing={3}>
          {metrics.map(metric => (
            <Grid key={metric.label} size={{ xs: 12, md: 4, lg: 3 }}>
              <MetricCard icon={CalendarMonthOutlined} label={metric.label} value={metric.value} />
            </Grid>
          ))}
        </Grid>
      ) : null}
    </DesktopPageContainer>
  );
}
