"use client";

import { useEffect, useMemo } from "react";
import type {
  MonthlyReportsViewModel,
  TeacherMonthlyReportData,
  UseMonthlyReportsViewModelProps,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import {
  buildStudentReportMetrics,
  buildTeacherReportMetrics,
  mapStudentMonthlyReport,
  mapTeacherMonthlyReport,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/useMonthlyReportsViewModel.helpers";
import {
  useMonthlyReportQueries,
  useSupervisorMonthlyReportsStoreState,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/useMonthlyReportsViewModel.hooks";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { MonthlyReportsViewModel, UseMonthlyReportsViewModelProps };

export function useMonthlyReportsViewModel(
  _props: Readonly<UseMonthlyReportsViewModelProps> = {}
): MonthlyReportsViewModel {
  const t = useAppTranslation(Translation.Dashboard.SupervisorPortalMonthlyReports);

  const {
    reportType,
    year,
    month,
    selectedTeacher,
    studentSelection,
    setReportType,
    setYear,
    setMonth,
    setSelectedTeacher,
    setStudentSelection,
    ensureYearMonth,
  } = useSupervisorMonthlyReportsStoreState();

  useEffect(() => {
    ensureYearMonth();
  }, [ensureYearMonth]);

  const teacherId = selectedTeacher?.id ?? "";
  const studentId = studentSelection?.id ?? "";

  const { teacherData, studentData, teacherLoading, studentLoading, onGenerate } = useMonthlyReportQueries({
    reportType,
    teacherId,
    studentId,
    year,
    month,
  });

  const teacherReport = useMemo<TeacherMonthlyReportData | null>(
    () => (reportType === "teacher" ? mapTeacherMonthlyReport(teacherData, { year, month }) : null),
    [reportType, teacherData, year, month]
  );

  const studentReport = useMemo(
    () => (reportType === "student" ? mapStudentMonthlyReport(studentData, { year, month }) : null),
    [reportType, studentData, year, month]
  );

  const metrics = useMemo(() => {
    if (reportType === "teacher" && teacherReport) {
      return buildTeacherReportMetrics(teacherReport, t);
    }
    if (reportType === "student" && studentReport) {
      return buildStudentReportMetrics(studentReport, t);
    }
    return [];
  }, [reportType, teacherReport, studentReport, t]);

  const loading = reportType === "teacher" ? teacherLoading : studentLoading;

  return {
    reportType,
    year,
    month,
    selectedTeacher,
    studentSelection,
    teacherReport,
    studentReport,
    metrics,
    loading,
    labels: t,
    onReportTypeChange: setReportType,
    onYearChange: setYear,
    onMonthChange: setMonth,
    onSelectedTeacherChange: setSelectedTeacher,
    onStudentSelectionChange: setStudentSelection,
    onGenerate,
  };
}
