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
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

export type ReportFiltersFormDesktopLabels = ReportFiltersFormLabels;

export function ReportFiltersFormDesktop({
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

      <TeacherAutocompleteDesktop
        value={teacherValue}
        onChange={(next: PersonOption | null) => {
          setSelectedTeacher(next);
          onTeacherChange(next?.id ?? "");
        }}
        label={labels.teacher}
        placeholder={labels.allTeachers}
      />

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
