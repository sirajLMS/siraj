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
import type {
  StudentMonthlyReportQuery,
  TeacherMonthlyReportQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  MonthlyReportMetric,
  StudentMonthlyReportData,
  TeacherMonthlyReportData,
} from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import type { SupervisorMonthlyReportsLabels } from "@/shared/locale";

interface ReportPeriod {
  readonly year: number;
  readonly month: number;
}

export function mapTeacherMonthlyReport(
  data: TeacherMonthlyReportQuery | undefined,
  { year, month }: ReportPeriod
): TeacherMonthlyReportData | null {
  const r = data?.teacherMonthlyReport;
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
}

export function mapStudentMonthlyReport(
  data: StudentMonthlyReportQuery | undefined,
  { year, month }: ReportPeriod
): StudentMonthlyReportData | null {
  const r = data?.studentMonthlyReport;
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
}

export function buildTeacherReportMetrics(
  report: TeacherMonthlyReportData,
  labels: SupervisorMonthlyReportsLabels
): MonthlyReportMetric[] {
  return [
    { label: labels.lessonsTaught, value: report.lessonsTaught, icon: SchoolOutlined },
    { label: labels.approvedCount, value: report.approvedCount, icon: CheckCircleOutlined },
    { label: labels.cancelledCount, value: report.cancelledCount, icon: CancelOutlined },
    { label: labels.totalAccruedHours, value: report.totalAccruedHours, icon: ScheduleOutlined },
    {
      label: labels.totalDueAmount,
      value: `${report.currency} ${report.totalDueAmount}`,
      icon: PaymentsOutlined,
    },
    {
      label: labels.totalPaidAmount,
      value: `${report.currency} ${report.totalPaidAmount}`,
      icon: AccountBalanceWalletOutlined,
    },
  ];
}

export function buildStudentReportMetrics(
  report: StudentMonthlyReportData,
  labels: SupervisorMonthlyReportsLabels
): MonthlyReportMetric[] {
  return [
    { label: labels.totalLessons, value: report.totalLessons, icon: SchoolOutlined },
    { label: labels.completedLessons, value: report.completedLessons, icon: CheckCircleOutlined },
    { label: labels.cancelledLessons, value: report.cancelledLessons, icon: CancelOutlined },
    { label: labels.presentCount, value: report.presentCount, icon: PersonOutlined },
    { label: labels.absentCount, value: report.absentCount, icon: PersonOffOutlined },
    { label: labels.lateCount, value: report.lateCount, icon: AccessTimeOutlined },
    { label: labels.totalHours, value: report.totalHours, icon: ScheduleOutlined },
    { label: labels.creditsPurchased, value: report.creditsPurchased, icon: CreditScoreOutlined },
    { label: labels.creditsDeducted, value: report.creditsDeducted, icon: AccountBalanceOutlined },
    { label: labels.creditsRefunded, value: report.creditsRefunded, icon: AccountBalanceWalletOutlined },
    { label: labels.creditsBalance, value: report.creditsBalance, icon: PaymentsOutlined },
  ];
}
