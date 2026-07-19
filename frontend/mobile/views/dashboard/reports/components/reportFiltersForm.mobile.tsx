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
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";

export type ReportFiltersFormMobileLabels = ReportFiltersFormLabels;

export function ReportFiltersFormMobile({
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
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <MobileAppDatePicker
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

      <MobileAppDatePicker
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
        <InputLabel id="reports-mobile-teacher-label" shrink>
          {labels.teacher}
        </InputLabel>
        <Select
          labelId="reports-mobile-teacher-label"
          value={teacherId}
          label={labels.teacher}
          onChange={handleTeacherSelect}
        >
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
        <InputLabel id="reports-mobile-type-label" shrink>
          {labels.reportType}
        </InputLabel>
        <Select
          labelId="reports-mobile-type-label"
          value={reportType}
          label={labels.reportType}
          onChange={handleReportTypeSelect}
        >
          <MenuItem value="by_teacher">{labels.reportTypes.byTeacher}</MenuItem>
          <MenuItem value="by_student">{labels.reportTypes.byStudent}</MenuItem>
          <MenuItem value="by_date">{labels.reportTypes.byDate}</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ pt: 1 }}>
        <MobilePrimaryPageAction
          startIcon={<QueryStatsOutlined />}
          disabled={!canGenerate}
          onClick={onSubmit}
          sx={{ px: 4 }}
        >
          {labels.submit}
        </MobilePrimaryPageAction>
      </Box>
    </Box>
  );
}
