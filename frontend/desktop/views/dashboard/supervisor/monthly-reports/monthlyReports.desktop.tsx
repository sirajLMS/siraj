"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { MonthlyReportsViewModel } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import {
  StudentAutocompleteDesktop,
  TeacherAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export function MonthlyReportsDesktopView(props: Readonly<MonthlyReportsViewModel>) {
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
              <TeacherAutocompleteDesktop
                value={selectedTeacher}
                onChange={onSelectedTeacherChange}
                label={labels.selectTeacher}
                placeholder={labels.teacherSearchPlaceholder}
              />
            </Grid>
          ) : (
            <Grid size={{ xs: 12, sm: 6 }}>
              <StudentAutocompleteDesktop
                value={studentSelection}
                onChange={onStudentSelectionChange}
                label={labels.selectStudent}
                placeholder={labels.studentSearchPlaceholder}
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
        <DesktopMetricCardGrid
          metrics={
            metrics.map((metric, index) => ({
              key: `${metric.label}-${index}`,
              count: metric.value,
              labelKey: metric.label,
              label: metric.label,
              icon: metric.icon,
            })) satisfies MetricItem[]
          }
          size={{ xs: 12, sm: 6, md: 3 }}
        />
      ) : null}
    </DesktopPageContainer>
  );
}
