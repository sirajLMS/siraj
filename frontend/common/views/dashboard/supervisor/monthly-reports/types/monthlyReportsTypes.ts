import type { SupervisorMonthlyReportsLabels } from "@/shared/messages/types/dashboard/supervisorPortal/monthlyReports";

export interface TeacherMonthlyReportData {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly year: number;
  readonly month: number;
  readonly lessonsTaught: number;
  readonly approvedCount: number;
  readonly cancelledCount: number;
  readonly totalAccruedHours: string;
  readonly totalDueAmount: string;
  readonly totalPaidAmount: string;
  readonly currency: string;
}

export interface StudentMonthlyReportData {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly year: number;
  readonly month: number;
  readonly totalLessons: number;
  readonly completedLessons: number;
  readonly cancelledLessons: number;
  readonly presentCount: number;
  readonly absentCount: number;
  readonly lateCount: number;
  readonly totalHours: string;
  readonly creditsPurchased: string;
  readonly creditsDeducted: string;
  readonly creditsRefunded: string;
  readonly creditsBalance: string;
}

export interface MonthlyReportMetric {
  readonly label: string;
  readonly value: string | number;
}

export interface MonthlyReportsViewModel {
  readonly reportType: "teacher" | "student";
  readonly year: number;
  readonly month: number;
  readonly teacherId: string;
  readonly studentId: string;
  readonly teacherReport: TeacherMonthlyReportData | null;
  readonly studentReport: StudentMonthlyReportData | null;
  readonly metrics: MonthlyReportMetric[];
  readonly loading: boolean;
  readonly labels: SupervisorMonthlyReportsLabels;
  readonly onReportTypeChange: (type: "teacher" | "student") => void;
  readonly onYearChange: (year: number) => void;
  readonly onMonthChange: (month: number) => void;
  readonly onTeacherIdChange: (id: string) => void;
  readonly onStudentIdChange: (id: string) => void;
  readonly onGenerate: () => void;
}

export type UseMonthlyReportsViewModelProps = MonthlyReportsViewModel;
