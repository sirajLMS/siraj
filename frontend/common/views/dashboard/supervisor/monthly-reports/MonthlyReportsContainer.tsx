"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import {
  studentMonthlyReportQueryDocument,
  teacherMonthlyReportQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useSupervisorMonthlyReportsStore } from "@/frontend/common/stores/supervisorMonthlyReportsStore";
import { MonthlyReportsView } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/monthlyReportsView";
import type {
  MonthlyReportMetric,
  StudentMonthlyReportData,
  TeacherMonthlyReportData,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import { useAppTranslation } from "@/shared/locale/client";
import type { SupervisorMonthlyReportsLabels } from "@/shared/locale/types/dashboard/supervisorPortal/monthlyReports";

function useLabels(t: SupervisorMonthlyReportsLabels) {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      reportTypeToggle: t.reportTypeToggle,
      teacherReport: t.teacherReport,
      studentReport: t.studentReport,
      selectYear: t.selectYear,
      selectMonth: t.selectMonth,
      selectTeacher: t.selectTeacher,
      selectStudent: t.selectStudent,
      generateReport: t.generateReport,
      lessonsTaught: t.lessonsTaught,
      approvedCount: t.approvedCount,
      cancelledCount: t.cancelledCount,
      totalAccruedHours: t.totalAccruedHours,
      totalDueAmount: t.totalDueAmount,
      totalPaidAmount: t.totalPaidAmount,
      totalLessons: t.totalLessons,
      completedLessons: t.completedLessons,
      cancelledLessons: t.cancelledLessons,
      presentCount: t.presentCount,
      absentCount: t.absentCount,
      lateCount: t.lateCount,
      totalHours: t.totalHours,
      creditsPurchased: t.creditsPurchased,
      creditsDeducted: t.creditsDeducted,
      creditsRefunded: t.creditsRefunded,
      creditsBalance: t.creditsBalance,
      noDataAvailable: t.noDataAvailable,
      loadingMessage: t.loadingMessage,
    }),
    [t]
  );
}

export function MonthlyReportsContainer() {
  const t = useAppTranslation().dashboardTranslations.supervisorPortalMonthlyReports;

  const reportType = useSupervisorMonthlyReportsStore(s => s.reportType);
  const year = useSupervisorMonthlyReportsStore(s => s.year);
  const month = useSupervisorMonthlyReportsStore(s => s.month);
  const teacherId = useSupervisorMonthlyReportsStore(s => s.teacherId);
  const studentId = useSupervisorMonthlyReportsStore(s => s.studentId);
  const setReportType = useSupervisorMonthlyReportsStore(s => s.setReportType);
  const setYear = useSupervisorMonthlyReportsStore(s => s.setYear);
  const setMonth = useSupervisorMonthlyReportsStore(s => s.setMonth);
  const setTeacherId = useSupervisorMonthlyReportsStore(s => s.setTeacherId);
  const setStudentId = useSupervisorMonthlyReportsStore(s => s.setStudentId);

  const skipTeacher = reportType !== "teacher" || teacherId.trim().length === 0;
  const skipStudent = reportType !== "student" || studentId.trim().length === 0;

  const { data: teacherData, loading: teacherLoading } = useQuery(teacherMonthlyReportQueryDocument, {
    variables: { teacherId: teacherId || "0", year, month },
    fetchPolicy: "cache-and-network",
    skip: skipTeacher,
  });

  const { data: studentData, loading: studentLoading } = useQuery(studentMonthlyReportQueryDocument, {
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
        { label: t.lessonsTaught, value: teacherReport.lessonsTaught },
        { label: t.approvedCount, value: teacherReport.approvedCount },
        { label: t.cancelledCount, value: teacherReport.cancelledCount },
        { label: t.totalAccruedHours, value: teacherReport.totalAccruedHours },
        { label: t.totalDueAmount, value: `${teacherReport.currency} ${teacherReport.totalDueAmount}` },
        { label: t.totalPaidAmount, value: `${teacherReport.currency} ${teacherReport.totalPaidAmount}` },
      ];
    }
    if (reportType === "student" && studentReport) {
      return [
        { label: t.totalLessons, value: studentReport.totalLessons },
        { label: t.completedLessons, value: studentReport.completedLessons },
        { label: t.cancelledLessons, value: studentReport.cancelledLessons },
        { label: t.presentCount, value: studentReport.presentCount },
        { label: t.absentCount, value: studentReport.absentCount },
        { label: t.lateCount, value: studentReport.lateCount },
        { label: t.totalHours, value: studentReport.totalHours },
        { label: t.creditsBalance, value: studentReport.creditsBalance },
      ];
    }
    return [];
  }, [reportType, teacherReport, studentReport, t]);

  const loading = reportType === "teacher" ? teacherLoading : studentLoading;
  const labels = useLabels(t);

  const handleGenerate = () => {
    // No explicit refetch needed; Apollo refetches on variable change.
    // This handler exists for the manual Generate button click in the UI.
  };

  return (
    <MonthlyReportsView
      reportType={reportType}
      year={year}
      month={month}
      teacherId={teacherId}
      studentId={studentId}
      teacherReport={teacherReport}
      studentReport={studentReport}
      metrics={metrics}
      loading={loading}
      labels={labels}
      onReportTypeChange={setReportType}
      onYearChange={setYear}
      onMonthChange={setMonth}
      onTeacherIdChange={setTeacherId}
      onStudentIdChange={setStudentId}
      onGenerate={handleGenerate}
    />
  );
}
