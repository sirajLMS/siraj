"use client";

import { QueryStatsOutlined } from "@mui/icons-material";
import type { SelectChangeEvent } from "@mui/material";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
import type { ReportFiltersFormLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import type { ReportFiltersFormProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import {
  formatReportFilterDate,
  parseReportFilterDate,
} from "@/frontend/common/views/dashboard/reports/utils/reportFiltersDate.utils";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

export type ReportFiltersFormMobileLabels = ReportFiltersFormLabels;

export function ReportFiltersFormMobile({
  fromDate,
  toDate,
  teacherId,
  reportType,
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
  const [selectedTeacher, setSelectedTeacher] = useState<PersonOption | null>(null);
  const teacherValue =
    selectedTeacher ?? resolvePersonOption(teacherId, [], selectedTeacher);

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

      <TeacherAutocompleteMobile
        value={teacherValue}
        onChange={(next: PersonOption | null) => {
          setSelectedTeacher(next);
          onTeacherChange(next?.id ?? "");
        }}
        label={labels.teacher}
        placeholder={labels.allTeachers}
      />

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
