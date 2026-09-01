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
import type { ReportFiltersFormProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

export function ReportFiltersFormMobile(props: Readonly<ReportFiltersFormProps>) {
  const { selectedFromDate, selectedToDate, teacherValue, setSelectedTeacher, handleReportTypeSelect } =
    useReportFilterFormState(props);
  const { reportType, labels, canGenerate, onFromDateChange, onToDateChange, onTeacherChange, onSubmit } = props;

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

      <MobileAppDatePicker
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

      <TeacherAutocompleteMobile
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
        labelId="reports-mobile-type-label"
        onChange={handleReportTypeSelect}
      />

      <SubmitButtonWrapper layout="flex">
        <MobilePrimaryPageAction
          startIcon={<QueryStatsOutlined />}
          disabled={!canGenerate}
          onClick={onSubmit}
          sx={{ px: 4 }}
        >
          {labels.submit}
        </MobilePrimaryPageAction>
      </SubmitButtonWrapper>
    </Box>
  );
}
