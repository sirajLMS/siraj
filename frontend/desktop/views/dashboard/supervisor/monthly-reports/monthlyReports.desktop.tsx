"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Autocomplete, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type {
  DirectoryPersonOption,
  MonthlyReportsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export function MonthlyReportsDesktopView(props: Readonly<MonthlyReportsViewModel>) {
  const {
    reportType,
    year,
    month,
    teacherId,
    studentId,
    teacherOptions,
    studentOptions,
    metrics,
    loading,
    labels,
    onReportTypeChange,
    onYearChange,
    onMonthChange,
    onTeacherIdChange,
    onStudentIdChange,
    onGenerate,
  } = props;

  const selectedTeacher = teacherOptions.find(o => o.id === teacherId) ?? null;
  const selectedStudent = studentOptions.find(o => o.id === studentId) ?? null;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} />

      <DesktopSectionPanel title={labels.reportTypeToggle}>
        <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
          <DesktopFilterButton
            onClick={() => onReportTypeChange("teacher")}
            sx={theme =>
              reportType === "teacher"
                ? { backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer }
                : {}
            }
          >
            {labels.teacherReport}
          </DesktopFilterButton>
          <DesktopFilterButton
            onClick={() => onReportTypeChange("student")}
            sx={theme =>
              reportType === "student"
                ? { backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer }
                : {}
            }
          >
            {labels.studentReport}
          </DesktopFilterButton>
        </Stack>

        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 6 }}>
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
          <Grid size={{ xs: 12, sm: 6 }}>
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

          {reportType === "teacher" ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete<DirectoryPersonOption>
                options={[...teacherOptions]}
                value={selectedTeacher}
                onChange={(_, option) => onTeacherIdChange(option?.id ?? "")}
                getOptionLabel={option => option.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={params => (
                  <TextField {...params} label={labels.selectTeacher} placeholder={labels.teacherSearchPlaceholder} />
                )}
              />
            </Grid>
          ) : (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete<DirectoryPersonOption>
                options={[...studentOptions]}
                value={selectedStudent}
                onChange={(_, option) => onStudentIdChange(option?.id ?? "")}
                getOptionLabel={option => option.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={params => (
                  <TextField {...params} label={labels.selectStudent} placeholder={labels.studentSearchPlaceholder} />
                )}
              />
            </Grid>
          )}

          <Grid size={12}>
            <DesktopPrimaryPageAction onClick={onGenerate} startIcon={<CalendarMonthOutlined />} sx={{ px: 6, py: 2 }}>
              {labels.generateReport}
            </DesktopPrimaryPageAction>
          </Grid>
        </Grid>
      </DesktopSectionPanel>

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
            <Grid key={metric.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <DesktopMetricCard icon={metric.icon} label={metric.label} value={metric.value} />
            </Grid>
          ))}
        </Grid>
      ) : null}
    </DesktopPageContainer>
  );
}
