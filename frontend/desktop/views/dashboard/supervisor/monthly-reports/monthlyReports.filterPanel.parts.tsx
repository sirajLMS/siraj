"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Grid, Stack } from "@mui/material";
import { PeriodFieldsShared } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/__shared__/periodFieldsShared";
import type {
  FilterPanelProps,
  GenerateActionProps,
  ReportTypeFilterProps,
  TargetSelectSectionProps,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import {
  StudentAutocompleteDesktop,
  TeacherAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";

function ReportTypeFilter({ reportType, teacherReport, studentReport, onReportTypeChange }: ReportTypeFilterProps) {
  return (
    <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
      <DesktopFilterButton
        onClick={() => onReportTypeChange("teacher")}
        sx={theme =>
          reportType === "teacher"
            ? { backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer }
            : {}
        }
      >
        {teacherReport}
      </DesktopFilterButton>
      <DesktopFilterButton
        onClick={() => onReportTypeChange("student")}
        sx={theme =>
          reportType === "student"
            ? { backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer }
            : {}
        }
      >
        {studentReport}
      </DesktopFilterButton>
    </Stack>
  );
}

function TargetSelectSection({
  reportType,
  selectedTeacher,
  studentSelection,
  labels,
  onSelectedTeacherChange,
  onStudentSelectionChange,
}: TargetSelectSectionProps) {
  if (reportType === "teacher") {
    return (
      <Grid size={{ xs: 12, sm: 6 }}>
        <TeacherAutocompleteDesktop
          value={selectedTeacher}
          onChange={onSelectedTeacherChange}
          label={labels.selectTeacher}
          placeholder={labels.teacherSearchPlaceholder}
        />
      </Grid>
    );
  }
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <StudentAutocompleteDesktop
        value={studentSelection}
        onChange={onStudentSelectionChange}
        label={labels.selectStudent}
        placeholder={labels.studentSearchPlaceholder}
      />
    </Grid>
  );
}

function GenerateAction({ generateReport, onGenerate }: GenerateActionProps) {
  return (
    <Grid size={12}>
      <DesktopPrimaryPageAction onClick={onGenerate} startIcon={<CalendarMonthOutlined />} sx={{ px: 6, py: 2 }}>
        {generateReport}
      </DesktopPrimaryPageAction>
    </Grid>
  );
}

export function FilterPanel({
  reportType,
  year,
  month,
  selectedTeacher,
  studentSelection,
  labels,
  onReportTypeChange,
  onYearChange,
  onMonthChange,
  onSelectedTeacherChange,
  onStudentSelectionChange,
  onGenerate,
}: FilterPanelProps) {
  return (
    <DesktopSectionPanel title={labels.reportTypeToggle}>
      <ReportTypeFilter
        reportType={reportType}
        teacherReport={labels.teacherReport}
        studentReport={labels.studentReport}
        onReportTypeChange={onReportTypeChange}
      />
      <Grid container spacing={2} sx={{ alignItems: "center" }}>
        <PeriodFieldsShared
          year={year}
          month={month}
          labels={labels}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
          gridSize={{ xs: 12, sm: 6 }}
          wrapInContainer={false}
        />
        <TargetSelectSection
          reportType={reportType}
          selectedTeacher={selectedTeacher}
          studentSelection={studentSelection}
          labels={labels}
          onSelectedTeacherChange={onSelectedTeacherChange}
          onStudentSelectionChange={onStudentSelectionChange}
        />
        <GenerateAction generateReport={labels.generateReport} onGenerate={onGenerate} />
      </Grid>
    </DesktopSectionPanel>
  );
}
