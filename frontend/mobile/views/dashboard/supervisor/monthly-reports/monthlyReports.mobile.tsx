"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Autocomplete, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type {
  DirectoryPersonOption,
  MonthlyReportsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import {
  MobileContentStack,
  MobileFilterButton,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card";

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export function MonthlyReportsMobileView(props: Readonly<MonthlyReportsViewModel>) {
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
            ) : (
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
                <MobileMetricCard icon={metric.icon} label={metric.label} value={metric.value} />
              </Grid>
            ))}
          </Grid>
        ) : null}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
