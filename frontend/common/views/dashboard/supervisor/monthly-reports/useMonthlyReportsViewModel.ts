"use client";

import type { MonthlyReportsViewModel } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";

export type { MonthlyReportsViewModel };

export type UseMonthlyReportsViewModelProps = MonthlyReportsViewModel;

export function useMonthlyReportsViewModel(props: Readonly<UseMonthlyReportsViewModelProps>): MonthlyReportsViewModel {
  return {
    reportType: props.reportType,
    year: props.year,
    month: props.month,
    teacherId: props.teacherId,
    studentId: props.studentId,
    teacherReport: props.teacherReport,
    studentReport: props.studentReport,
    metrics: props.metrics,
    loading: props.loading,
    labels: props.labels,
    onReportTypeChange: props.onReportTypeChange,
    onYearChange: props.onYearChange,
    onMonthChange: props.onMonthChange,
    onTeacherIdChange: props.onTeacherIdChange,
    onStudentIdChange: props.onStudentIdChange,
    onGenerate: props.onGenerate,
  };
}
