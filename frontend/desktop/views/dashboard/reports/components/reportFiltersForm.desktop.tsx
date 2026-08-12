"use client";

import { QueryStatsOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import {
  ReportTypeSelect,
  SubmitButtonWrapper,
} from "@/frontend/common/views/dashboard/reports/components/__shared__/ReportFiltersFormShared";
import {
  formatDateChange,
  useReportFilterFormState,
} from "@/frontend/common/views/dashboard/reports/components/__shared__/reportFiltersFormShared.utils";
import type { ReportFiltersFormLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { ReportFiltersFormProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

export type ReportFiltersFormDesktopLabels = ReportFiltersFormLabels;

export function ReportFiltersFormDesktop(props: Readonly<ReportFiltersFormProps>) {
  const { selectedFromDate, selectedToDate, teacherValue, setSelectedTeacher, handleReportTypeSelect } =
    useReportFilterFormState(props);
  const { reportType, labels, canGenerate, onFromDateChange, onToDateChange, onTeacherChange, onSubmit } = props;

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
          onFromDateChange(formatDateChange(date));
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
          onToDateChange(formatDateChange(date));
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

      <ReportTypeSelect
        reportType={reportType}
        labels={labels}
        labelId="reports-type-label"
        onChange={handleReportTypeSelect}
      />

      <SubmitButtonWrapper layout="grid">
        <DesktopPrimaryPageAction
          startIcon={<QueryStatsOutlined />}
          disabled={!canGenerate}
          onClick={onSubmit}
          sx={{ px: 4 }}
        >
          {labels.submit}
        </DesktopPrimaryPageAction>
      </SubmitButtonWrapper>
    </Box>
  );
}
