"use client";

import { useQuery } from "@apollo/client/react";
import {
  AccessTimeOutlined,
  AccountBalanceOutlined,
  AccountBalanceWalletOutlined,
  CancelOutlined,
  CheckCircleOutlined,
  CreditScoreOutlined,
  PaymentsOutlined,
  PersonOffOutlined,
  PersonOutlined,
  ScheduleOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { useEffect, useMemo } from "react";
import {
  studentMonthlyReportQueryDocument,
  teacherMonthlyReportQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useSupervisorMonthlyReportsStore } from "@/frontend/common/stores/supervisorMonthlyReportsStore";
import type {
  MonthlyReportMetric,
  MonthlyReportsViewModel,
  StudentMonthlyReportData,
  TeacherMonthlyReportData,
  UseMonthlyReportsViewModelProps,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { MonthlyReportsViewModel, UseMonthlyReportsViewModelProps };

export function useMonthlyReportsViewModel(
  _props: Readonly<UseMonthlyReportsViewModelProps> = {}
): MonthlyReportsViewModel {
  const t = useAppTranslation(Translation.Dashboard.SupervisorPortalMonthlyReports);

  const reportType = useSupervisorMonthlyReportsStore(s => s.reportType);
  const year = useSupervisorMonthlyReportsStore(s => s.year);
  const month = useSupervisorMonthlyReportsStore(s => s.month);
  const selectedTeacher = useSupervisorMonthlyReportsStore(s => s.selectedTeacher);
  const studentSelection = useSupervisorMonthlyReportsStore(s => s.studentSelection);
  const setReportType = useSupervisorMonthlyReportsStore(s => s.setReportType);
  const setYear = useSupervisorMonthlyReportsStore(s => s.setYear);
  const setMonth = useSupervisorMonthlyReportsStore(s => s.setMonth);
  const setSelectedTeacher = useSupervisorMonthlyReportsStore(s => s.setSelectedTeacher);
  const setStudentSelection = useSupervisorMonthlyReportsStore(s => s.setStudentSelection);
  const ensureYearMonth = useSupervisorMonthlyReportsStore(s => s.ensureYearMonth);

  useEffect(() => {
    ensureYearMonth();
  }, [ensureYearMonth]);

  const teacherId = selectedTeacher?.id ?? "";
  const studentId = studentSelection?.id ?? "";
  const skipTeacher = reportType !== "teacher" || teacherId.trim().length === 0;
  const skipStudent = reportType !== "student" || studentId.trim().length === 0;

  const {
    data: teacherData,
    loading: teacherLoading,
    refetch: refetchTeacher,
  } = useQuery(teacherMonthlyReportQueryDocument, {
    variables: { teacherId: teacherId || "0", year, month },
    fetchPolicy: "cache-and-network",
    skip: skipTeacher,
  });

  const {
    data: studentData,
    loading: studentLoading,
    refetch: refetchStudent,
  } = useQuery(studentMonthlyReportQueryDocument, {
    variables: { studentId: studentId || "0", year, month },
    fetchPolicy: "cache-and-network",
    skip: skipStudent,
  });

  const teacherReport: TeacherMonthlyReportData | null = useMemo(() => {
    if (reportType !== "teacher") return null;
    const r = teacherData?.teacherMonthlyReport;
    if (!r) return null;
    return {
      teacherId: r.teacherId ?? "",
      teacherName: r.teacherName ?? "",
      year: r.year ?? year,
      month: r.month ?? month,
      lessonsTaught: r.lessonsTaught ?? 0,
      approvedCount: r.approvedCount ?? 0,
      cancelledCount: r.cancelledCount ?? 0,
      totalAccruedHours: String(r.totalAccruedHours ?? "0"),
      totalDueAmount: String(r.totalDueAmount ?? "0"),
      totalPaidAmount: String(r.totalPaidAmount ?? "0"),
      currency: r.currency ?? "USD",
    };
  }, [reportType, teacherData, year, month]);

  const studentReport: StudentMonthlyReportData | null = useMemo(() => {
    if (reportType !== "student") return null;
    const r = studentData?.studentMonthlyReport;
    if (!r) return null;
    return {
      id: r.id ?? "",
      studentId: r.studentId ?? "",
      studentName: r.studentName ?? "",
      year: r.year ?? year,
      month: r.month ?? month,
      totalLessons: r.totalLessons ?? 0,
      completedLessons: r.completedLessons ?? 0,
      cancelledLessons: r.cancelledLessons ?? 0,
      presentCount: r.presentCount ?? 0,
      absentCount: r.absentCount ?? 0,
      lateCount: r.lateCount ?? 0,
      totalHours: String(r.totalHours ?? "0"),
      creditsPurchased: String(r.creditsPurchased ?? "0"),
      creditsDeducted: String(r.creditsDeducted ?? "0"),
      creditsRefunded: String(r.creditsRefunded ?? "0"),
      creditsBalance: String(r.creditsBalance ?? "0"),
    };
  }, [reportType, studentData, year, month]);

  const metrics: MonthlyReportMetric[] = useMemo(() => {
    if (reportType === "teacher" && teacherReport) {
      return [
        { label: t.lessonsTaught, value: teacherReport.lessonsTaught, icon: SchoolOutlined },
        { label: t.approvedCount, value: teacherReport.approvedCount, icon: CheckCircleOutlined },
        { label: t.cancelledCount, value: teacherReport.cancelledCount, icon: CancelOutlined },
        { label: t.totalAccruedHours, value: teacherReport.totalAccruedHours, icon: ScheduleOutlined },
        {
          label: t.totalDueAmount,
          value: `${teacherReport.currency} ${teacherReport.totalDueAmount}`,
          icon: PaymentsOutlined,
        },
        {
          label: t.totalPaidAmount,
          value: `${teacherReport.currency} ${teacherReport.totalPaidAmount}`,
          icon: AccountBalanceWalletOutlined,
        },
      ];
    }
    if (reportType === "student" && studentReport) {
      return [
        { label: t.totalLessons, value: studentReport.totalLessons, icon: SchoolOutlined },
        { label: t.completedLessons, value: studentReport.completedLessons, icon: CheckCircleOutlined },
        { label: t.cancelledLessons, value: studentReport.cancelledLessons, icon: CancelOutlined },
        { label: t.presentCount, value: studentReport.presentCount, icon: PersonOutlined },
        { label: t.absentCount, value: studentReport.absentCount, icon: PersonOffOutlined },
        { label: t.lateCount, value: studentReport.lateCount, icon: AccessTimeOutlined },
        { label: t.totalHours, value: studentReport.totalHours, icon: ScheduleOutlined },
        { label: t.creditsPurchased, value: studentReport.creditsPurchased, icon: CreditScoreOutlined },
        { label: t.creditsDeducted, value: studentReport.creditsDeducted, icon: AccountBalanceOutlined },
        { label: t.creditsRefunded, value: studentReport.creditsRefunded, icon: AccountBalanceWalletOutlined },
        { label: t.creditsBalance, value: studentReport.creditsBalance, icon: PaymentsOutlined },
      ];
    }
    return [];
  }, [reportType, teacherReport, studentReport, t]);

  const loading = reportType === "teacher" ? teacherLoading : studentLoading;

  const handleGenerate = () => {
    if (reportType === "teacher" && !skipTeacher) {
      void refetchTeacher();
      return;
    }
    if (reportType === "student" && !skipStudent) {
      void refetchStudent();
    }
  };

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
    onGenerate: handleGenerate,
  };
}
