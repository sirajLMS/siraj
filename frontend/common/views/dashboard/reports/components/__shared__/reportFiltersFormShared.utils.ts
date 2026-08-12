import type { SelectChangeEvent } from "@mui/material";
import { useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
import type { ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import type { ReportFiltersFormProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import {
  formatReportFilterDate,
  parseReportFilterDate,
} from "@/frontend/common/views/dashboard/reports/utils/reportFiltersDate.utils";

const REPORT_TYPE_VALUES = new Set<string>(["by_teacher", "by_student", "by_date"]);

function isReportType(value: string): value is ReportType {
  return REPORT_TYPE_VALUES.has(value);
}

function createReportTypeHandler(
  onReportTypeChange: (reportType: ReportType) => void
): (event: SelectChangeEvent) => void {
  return (event: SelectChangeEvent) => {
    const value = event.target.value;
    if (isReportType(value)) {
      onReportTypeChange(value);
    }
  };
}

function getReportFilterDateParsers(fromDate: string, toDate: string) {
  return {
    selectedFromDate: parseReportFilterDate(fromDate),
    selectedToDate: parseReportFilterDate(toDate),
  };
}

function getTeacherValue(teacherId: string, selectedTeacher: PersonOption | null): PersonOption | null {
  return selectedTeacher ?? resolvePersonOption(teacherId, [], selectedTeacher);
}

export function useReportFilterFormState(props: Readonly<ReportFiltersFormProps>): {
  selectedFromDate: Date | null;
  selectedToDate: Date | null;
  teacherValue: PersonOption | null;
  setSelectedTeacher: (value: PersonOption | null) => void;
  handleReportTypeSelect: (event: SelectChangeEvent) => void;
} {
  const { fromDate, toDate, teacherId, onReportTypeChange } = props;
  const { selectedFromDate, selectedToDate } = getReportFilterDateParsers(fromDate, toDate);
  const [selectedTeacher, setSelectedTeacher] = useState<PersonOption | null>(null);
  const teacherValue = getTeacherValue(teacherId, selectedTeacher);
  const handleReportTypeSelect = createReportTypeHandler(onReportTypeChange);
  return { selectedFromDate, selectedToDate, teacherValue, setSelectedTeacher, handleReportTypeSelect };
}

export function formatDateChange(date: Date | null): string {
  return formatReportFilterDate(date);
}
