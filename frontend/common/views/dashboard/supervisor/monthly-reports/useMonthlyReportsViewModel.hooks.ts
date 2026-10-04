import { useQuery } from "@apollo/client/react";
import {
  studentMonthlyReportQueryDocument,
  teacherMonthlyReportQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useSupervisorMonthlyReportsStore } from "@/frontend/common/stores/supervisorMonthlyReportsStore";
import type { MonthlyReportsViewModel } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";

export function useSupervisorMonthlyReportsStoreState() {
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

  return {
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
  };
}

interface UseMonthlyReportQueriesParams {
  readonly reportType: MonthlyReportsViewModel["reportType"];
  readonly teacherId: string;
  readonly studentId: string;
  readonly year: number;
  readonly month: number;
}

export function useMonthlyReportQueries({
  reportType,
  teacherId,
  studentId,
  year,
  month,
}: UseMonthlyReportQueriesParams) {
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

  return {
    teacherData,
    studentData,
    teacherLoading,
    studentLoading,
    onGenerate: () => {
      if (reportType === "teacher" && !skipTeacher) {
        void refetchTeacher();
        return;
      }
      if (reportType === "student" && !skipStudent) {
        void refetchStudent();
      }
    },
  };
}
