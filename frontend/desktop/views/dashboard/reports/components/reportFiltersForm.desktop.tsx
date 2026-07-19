"use client";

import { QueryStatsOutlined } from "@mui/icons-material";
import type { SelectChangeEvent } from "@mui/material";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { ReportFiltersFormLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import type { ReportFiltersFormProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import {
  formatReportFilterDate,
  parseReportFilterDate,
} from "@/frontend/common/views/dashboard/reports/utils/reportFiltersDate.utils";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";

export type ReportFiltersFormDesktopLabels = ReportFiltersFormLabels;

export function ReportFiltersFormDesktop({
  fromDate,
  toDate,
  teacherId,
  reportType,
  teachers,
  labels,
  canGenerate,
  onFromDateChange,
  onToDateChange,
  onTeacherChange,
  onReportTypeChange,
  onSubmit,
}: Readonly<ReportFiltersFormProps>) {
  const selectedFromDate = parseReportFilterDate(fromDate);
  const selectedToDate = parseReportFilterDate(toDate);

  const handleTeacherSelect = (event: SelectChangeEvent) => {
    onTeacherChange(event.target.value);
  };

  const handleReportTypeSelect = (event: SelectChangeEvent) => {
    onReportTypeChange(event.target.value as ReportType);
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
        gap: 2,
        alignItems: "end",
      }}
    >
      <DesktopAppDatePicker
        label={labels.fromDate}
        value={selectedFromDate}
        onChange={(date: Date | null) => {
          onFromDateChange(formatReportFilterDate(date));
        }}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            slotProps: { htmlInput: { autoComplete: "off" } },
          },
        }}
      />

      <DesktopAppDatePicker
        label={labels.toDate}
        value={selectedToDate}
        onChange={(date: Date | null) => {
          onToDateChange(formatReportFilterDate(date));
        }}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            slotProps: { htmlInput: { autoComplete: "off" } },
          },
        }}
      />

      <FormControl size="small" fullWidth>
        <InputLabel id="reports-teacher-label" shrink>
          {labels.teacher}
        </InputLabel>
        <Select labelId="reports-teacher-label" value={teacherId} label={labels.teacher} onChange={handleTeacherSelect}>
          <MenuItem value="">
            <em>{labels.allTeachers}</em>
          </MenuItem>
          {teachers.map(teacher => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel id="reports-type-label" shrink>
          {labels.reportType}
        </InputLabel>
        <Select
          labelId="reports-type-label"
          value={reportType}
          label={labels.reportType}
          onChange={handleReportTypeSelect}
        >
          <MenuItem value="by_teacher">{labels.reportTypes.byTeacher}</MenuItem>
          <MenuItem value="by_student">{labels.reportTypes.byStudent}</MenuItem>
          <MenuItem value="by_date">{labels.reportTypes.byDate}</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" }, pt: 1 }}>
        <DesktopPrimaryPageAction
          startIcon={<QueryStatsOutlined />}
          disabled={!canGenerate}
          onClick={onSubmit}
          sx={{ px: 4 }}
        >
          {labels.submit}
        </DesktopPrimaryPageAction>
      </Box>
    </Box>
  );
}
